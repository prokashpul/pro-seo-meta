import { GoogleGenAI, Type, Schema, FunctionDeclaration } from "@google/genai";
import { StockMetadata, ModelMode, GenerationSettings } from "../types";

// Schema for structured JSON output
const metadataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A highly detailed, SEO-rich stock photography title. Must include Subject, Action, Context, and distinct visual details.",
    },
    description: {
      type: Type.STRING,
      description: "Elite SEO Description. STRICT FORMULA: [Main Subject] + [Action/State] + [Context/Background]. Natural sentence structure only. No 'Image of'.",
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of high-impact keywords. ORDER IS CRITICAL: Most relevant (Subject/Action) first, followed by Environment, then Concepts/Feelings.",
    },
    category: {
      type: Type.STRING,
      description: "The most fitting stock photography category (e.g., Business, Lifestyle, Nature, Technology).",
    },
  },
  required: ["title", "description", "keywords", "category"],
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function calculateBackoff(errorMsg: string, attempt: number): number {
  // Try to parse specific wait time from error message
  // Example: "Please retry in 58.753408782s."
  const match = errorMsg ? errorMsg.match(/retry in (\d+(\.\d+)?)s/) : null;
  
  // Add randomness (jitter) to prevent thundering herd problem
  const jitter = Math.random() * 2000; 

  if (match && match[1]) {
    // Add 2s buffer + jitter to the requested wait time
    const waitSeconds = parseFloat(match[1]);
    return Math.ceil(waitSeconds * 1000) + 2000 + jitter;
  }
  
  // Fallback to exponential backoff: 3s, 6s, 12s... + jitter
  return (Math.pow(2, attempt) * 3000) + jitter;
}

/**
 * Parses the raw API key string into an array of keys.
 * Handles newlines, commas, and whitespace.
 */
function parseKeys(apiKeyString: string | undefined): string[] {
    if (!apiKeyString) return [];
    return apiKeyString
        .split(/[\n,]+/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
}

/**
 * Helper to handle retries, model fallbacks, and KEY ROTATION for resilience.
 */
async function generateWithRetry(
  keys: string[], 
  params: any, 
  isProMode: boolean, 
  retries = 3,
  attempt = 1
): Promise<any> {
  // 1. Key Rotation: Pick a random key from the pool to distribute load
  const keyIndex = Math.floor(Math.random() * keys.length);
  const activeKey = keys[keyIndex];
  
  if (!activeKey) throw new Error("No valid API Key found.");

  const ai = new GoogleGenAI({ apiKey: activeKey });

  try {
    return await ai.models.generateContent(params);
  } catch (e: any) {
    const msg = e?.message || String(e);
    const status = e?.status;

    // 1. Check for Invalid API Key
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
        // If we have other keys, maybe this one is just bad?
        if (keys.length > 1) {
            console.warn(`Invalid API Key detected: ...${activeKey.slice(-4)}. Removing from pool for this request.`);
            const remainingKeys = keys.filter(k => k !== activeKey);
            return generateWithRetry(remainingKeys, params, isProMode, retries, attempt);
        }
        throw new Error("Invalid API Key. Please click the 'API Key' button to update it.");
    }

    // Check for 429 (Quota Exceeded) or 503 (Service Unavailable)
    const isQuota = status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
    const isServer = status >= 500 || msg.includes('503') || msg.includes('UNAVAILABLE');
    
    // Key rotation on quota
    if (isQuota && keys.length > 1) {
        console.warn(`Quota exceeded on key ...${activeKey.slice(-4)}. Rotating to next available key.`);
        // Remove the exhausted key from the pool for this specific request chain to avoid hitting it again immediately
        const remainingKeys = keys.filter(k => k !== activeKey);
        // Retry immediately (no backoff) with a new key
        return generateWithRetry(remainingKeys, params, isProMode, retries, attempt + 1);
    }

    if ((isQuota || isServer) && retries > 0) {
        // STRATEGY: If Pro model hits quota (and we are out of keys or only have one), 
        // fallback to Flash to avoid user wait time.
        // gemini-2.5-flash has higher limits than 3-pro-preview.
        if (isQuota && isProMode) {
            console.warn("Quota exceeded on Pro model. Falling back to Gemini 2.5 Flash for resilience.");
            
            const fallbackParams = {
                ...params,
                model: 'gemini-2.5-flash',
                // Remove thinking config for fallback
                config: {
                    ...params.config,
                    thinkingConfig: undefined 
                }
            };
            
            // Pass the original full key set (or current set) to the fallback
            return generateWithRetry(keys, fallbackParams, false, retries - 1, attempt + 1);
        }

        // For other errors or if already on fallback, use smart backoff
        const delayTime = calculateBackoff(msg, attempt);
        console.log(`API Error (${status}). Retrying in ${delayTime}ms...`);
        await wait(delayTime);
        
        // Retry with same pool (maybe logic resets choice)
        return generateWithRetry(keys, params, isProMode, retries - 1, attempt + 1);
    }
    
    // If we run out of retries and it was a quota error
    if (isQuota) {
        throw new Error("Quota exceeded. The API rate limit has been reached on all available keys. Please try again later.");
    }
    
    // If we run out of retries or it's a non-retriable error
    throw e;
  }
}

export const generateImageMetadata = async (
  base64Data: string,
  mimeType: string,
  mode: ModelMode,
  apiKey?: string,
  settings?: GenerationSettings
): Promise<StockMetadata> => {
  try {
    const keyStr = apiKey || process.env.API_KEY;
    const keys = parseKeys(keyStr);
    
    if (keys.length === 0) throw new Error("API Key is missing. Please add your Gemini API Key.");

    // Select model based on user preference
    const primaryModel = mode === ModelMode.QUALITY ? 'gemini-3-pro-preview' : 'gemini-flash-lite-latest';
    const isPro = mode === ModelMode.QUALITY;

    let dynamicInstructions = "";

    // Default PNG Check (can be overridden by settings)
    if (mimeType === 'image/png' && !settings?.transparentBackground && !settings?.whiteBackground) {
        dynamicInstructions += `
        CRITICAL INSTRUCTIONS FOR PNG IMAGES:
        1. VISUAL CHECK: Determine if the image has a transparent background (checkerboard or invisible) or is an isolated object.
        2. IF TRANSPARENT/ISOLATED:
           - Title MUST end with the exact phrase: "Isolated on Transparent Background".
           - Description MUST contain the phrase: "isolated on transparent background".
           - Keywords MUST include: "transparent", "background", "isolated", "cutout", "png".
           - NEGATIVE CONSTRAINT: DO NOT use the words "Black", "Dark", or "White" to describe the background. Treat the background as non-existent/transparent.
        `;
    }

    // Default counts if not provided (safe fallbacks)
    const titleMin = settings?.titleWordCountMin || 7;
    const titleMax = settings?.titleWordCountMax || 25;
    const descMin = settings?.descriptionWordCountMin || 12;
    const descMax = settings?.descriptionWordCountMax || 40;
    const kwMin = settings?.keywordCountMin || 35;
    const kwMax = settings?.keywordCountMax || 49;

    // Apply Settings
    if (settings) {
        if (settings.silhouette) {
            dynamicInstructions += `\n- VISUAL: Check for silhouette. If valid, title MUST contain "Silhouette" and keywords MUST include "silhouette", "shadow", "backlit".`;
        }
        
        if (settings.whiteBackground) {
            dynamicInstructions += `\n- BACKGROUND: Force check for White Background. If confirmed, Title MUST end with "Isolated on White Background". Description MUST say "isolated on white background".`;
        }
        
        if (settings.transparentBackground) {
            dynamicInstructions += `\n- BACKGROUND: TREAT AS TRANSPARENT. Title MUST end with "Isolated on Transparent Background". Description MUST say "isolated on transparent background". Keywords MUST include "transparent", "background", "isolated".`;
        }
        
        if (settings.singleWordKeywords) {
            dynamicInstructions += `\n- KEYWORDS: STRICTLY SINGLE WORDS ONLY. No multi-word phrases allowed (e.g., use "blue", "sky" instead of "blue sky").`;
        }
        
        if (settings.prohibitedWordsEnabled && settings.prohibitedWordsText) {
            dynamicInstructions += `\n- NEGATIVE CONSTRAINTS: DO NOT use the following words in Title, Description, or Keywords: ${settings.prohibitedWordsText}.`;
        }
        
        if (settings.customPromptEnabled && settings.customPromptText) {
            dynamicInstructions += `\n- ADDITIONAL USER INSTRUCTION: ${settings.customPromptText}`;
        }
    }

    const prompt = `
      Act as an ELITE Stock Photography Metadata Expert for Adobe Stock, Shutterstock, and Getty Images.
      Your goal is MAXIMAL SEO DISCOVERABILITY and HIGH SALES CONVERSION.

      Analyze the image visually and generate metadata following these STRICT professional standards:

      1. TITLE (Detailed & SEO-Rich):
         - Structure: [Precise Subject] + [Action] + [Context] + [Distinctive Details].
         - Example: "Happy young female entrepreneur working on laptop in modern bright office with glass walls."
         - Avoid generic titles like "Business woman". Be specific.
         - Length Constraint: MUST be between ${titleMin} and ${titleMax} WORDS.
      
      2. DESCRIPTION (The "Adobe Rule"):
         - Structure: [Main Subject] + [Action/State] + [Context/Environment].
         - Example: "A confident business woman analyzing charts on a tablet in a modern glass office."
         - Must be a complete, natural sentence.
         - NEVER start with "Image of", "Photo of", "A shot of".
         - Length Constraint: MUST be between ${descMin} and ${descMax} WORDS.

      3. KEYWORDS (Relevance Sorted):
         - Quantity Constraint: Generate between ${kwMin} and ${kwMax} keywords.
         - ORDER MATTERS: The first 10 keywords MUST be the most obvious visual elements (Subject, Action, Objects).
         - Next keywords: Context, Environment, Lighting, Style (e.g., "sunny", "modern", "bokeh", "studio shot").
         - Final keywords: Concepts, Emotions, Metaphors (e.g., "success", "freedom", "innovation", "teamwork").
         - NO trademarked names/brands.

      ${dynamicInstructions}
      
      Output strict JSON.
    `;

    // Use the retry wrapper with key pool
    const response = await generateWithRetry(keys, {
      model: primaryModel,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: metadataSchema,
        thinkingConfig: isPro ? { thinkingBudget: 2048 } : undefined,
      }
    }, isPro);

    if (!response.text) {
      throw new Error("No response text generated");
    }

    const json = JSON.parse(response.text);
    return json as StockMetadata;

  } catch (error) {
    console.error("Error generating metadata:", error);
    throw error;
  }
};

export const getTrendingKeywords = async (baseKeywords: string[], apiKey?: string): Promise<string[]> => {
  try {
    const keyStr = apiKey || process.env.API_KEY;
    const keys = parseKeys(keyStr);
    if (keys.length === 0) throw new Error("API Key is missing");

    // Random load balancing for trends
    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const ai = new GoogleGenAI({ apiKey: activeKey });
    
    // Use flash + search for trending data
    const modelName = 'gemini-2.5-flash';
    const query = `
      Find current trending search terms related to these stock photography keywords: ${baseKeywords.slice(0, 5).join(", ")}.
      Return a simple list of 5-10 separate trending related keywords or phrases that people are searching for right now.
      Do not explain, just list them.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const lines = text.split('\n')
      .map(line => line.replace(/^[\d-]*\.\s*/, '').trim()) // remove numbering
      .filter(line => line.length > 0 && !line.startsWith("Source") && !line.startsWith("http"));
    
    return lines.slice(0, 10);

  } catch (error) {
    console.error("Error fetching trends:", error);
    return [];
  }
};

/**
 * Generates a short, realistic image generation prompt from an image.
 */
export const generateImagePrompt = async (
  base64Data: string,
  mimeType: string,
  apiKey?: string,
  style: string = "Photography"
): Promise<string> => {
  try {
    const keyStr = apiKey || process.env.API_KEY;
    const keys = parseKeys(keyStr);
    if (keys.length === 0) throw new Error("API Key is missing.");

    // Start with Pro model for best visual understanding
    const primaryModel = 'gemini-3-pro-preview';
    const isPro = true;

    const prompt = `
      Analyze this image and write a detailed, high-quality text prompt that could be used to generate this exact image using an AI image generator (like Midjourney v6 or Stable Diffusion XL).
      
      TARGET STYLE: ${style}
      
      Focus on:
      1. Main subject and action (be specific)
      2. Lighting and atmosphere
      3. Artistic style, medium, and composition details relevant to "${style}"
      4. Camera settings or rendering details (e.g., 8k, octane render, macro lens) if applicable to the style.
      
      Keep it under 100 words. Be direct and descriptive. Do not include intro text like "Here is a prompt".
    `;

    // Use retry logic with fallback to Flash if Pro hits quota
    const response = await generateWithRetry(keys, {
      model: primaryModel,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      }
    }, isPro);

    return response.text || "Failed to generate prompt.";

  } catch (error) {
    console.error("Error generating prompt:", error);
    const msg = (error as Error).message || '';
    if (msg.includes("Invalid API Key")) throw new Error("Invalid API Key. Please update it.");
    throw error;
  }
};

/**
 * Expands a short text concept into multiple detailed image generation prompts.
 */
export const expandTextToPrompts = async (
  shortText: string,
  count: number,
  apiKey?: string,
  imageType: string = "Photography"
): Promise<string[]> => {
  try {
    const keyStr = apiKey || process.env.API_KEY;
    const keys = parseKeys(keyStr);
    if (keys.length === 0) throw new Error("API Key is missing.");

    const model = 'gemini-2.5-flash';

    const prompt = `
      Act as an expert prompt engineer for Midjourney v6 and Stable Diffusion.
      Create ${count} distinct, highly detailed, and creative image generation prompts based on the following concept:
      "${shortText}"

      Target Style: ${imageType}

      Each prompt should be high quality, specifying style details, lighting, camera settings, and atmosphere appropriate for ${imageType}.
      
      Output strictly a JSON array of strings. Example: ["Prompt 1...", "Prompt 2..."]
    `;

    // Updated to use generateWithRetry with key pool
    const response = await generateWithRetry(keys, {
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    }, false); // false = not pro mode

    if (!response.text) return [];
    return JSON.parse(response.text) as string[];

  } catch (error) {
    console.error("Error expanding prompts:", error);
    const msg = (error as Error).message || '';
    if (msg.includes("Invalid API Key")) throw new Error("Invalid API Key. Please update it.");
    throw error;
  }
};

/**
 * Generates an image using the Gemini 2.5 Flash Image model.
 * Supports Text-to-Image and Image-to-Image (Editing).
 */
export const generateImageFromText = async (
  prompt: string,
  aspectRatio: string,
  modelId: string,
  apiKey: string,
  sourceImage?: { base64: string; mimeType: string },
  advancedSettings?: { negativePrompt?: string; guidanceScale?: number; seed?: number }
): Promise<string> => {
  try {
    const keys = parseKeys(apiKey || process.env.API_KEY);
    if (keys.length === 0) throw new Error("API Key is missing.");

    // Simple Load Balancing for Image Gen
    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const ai = new GoogleGenAI({ apiKey: activeKey });
    
    const parts: any[] = [];
    
    // 1. Add Source Image (if Edit Mode)
    if (sourceImage) {
        parts.push({
            inlineData: {
                mimeType: sourceImage.mimeType,
                data: sourceImage.base64
            }
        });
    }

    // 2. Add Prompt
    let finalPrompt = prompt;
    if (advancedSettings?.negativePrompt) {
        finalPrompt += ` --no ${advancedSettings.negativePrompt}`;
    }
    
    parts.push({ text: finalPrompt });

    const config: any = {
        imageConfig: {
            aspectRatio: aspectRatio 
        }
    };

    if (advancedSettings?.seed !== undefined) {
        config.seed = advancedSettings.seed;
    }

    const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts },
        config: config
    });

    // 3. Extract Generated Image
    if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${part.inlineData.data}`;
            }
        }
    }

    throw new Error("No image generated by the model.");

  } catch (error: any) {
    console.error("Image generation error:", error);
    throw new Error(error.message || "Failed to generate image");
  }
};
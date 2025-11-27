import { GoogleGenAI, Type, Schema, FunctionDeclaration } from "@google/genai";
import { StockMetadata, ModelMode } from "../types";

// Schema for structured JSON output
const metadataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A descriptive, SEO-friendly title for the stock image (55-150 characters).",
    },
    description: {
      type: Type.STRING,
      description: "SEO-optimized description for Adobe Stock & Shutterstock. Natural language summary of subject, action, and context. Length: 70-200 characters.",
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 35-49 relevant keywords/tags ordered by relevance.",
    },
    category: {
      type: Type.STRING,
      description: "The most fitting stock photography category (e.g., Business, Lifestyle, Nature, Technology).",
    },
  },
  required: ["title", "description", "keywords", "category"],
};

/**
 * Helper to handle retries and model fallbacks for resilience.
 */
async function generateWithRetry(
  ai: GoogleGenAI, 
  params: any, 
  isProMode: boolean, 
  retries = 3
): Promise<any> {
  try {
    return await ai.models.generateContent(params);
  } catch (e: any) {
    const msg = e.message || '';
    const status = e.status;

    // 1. Check for Invalid API Key
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
        throw new Error("Invalid API Key. Please click the 'API Key' button to update it.");
    }

    // Check for 429 (Quota Exceeded) or 503 (Service Unavailable)
    const isQuota = status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
    const isServer = status >= 500;
    
    if ((isQuota || isServer) && retries > 0) {
        // STRATEGY: If Pro model hits quota, immediately fallback to Flash to avoid user wait time.
        // gemini-2.5-flash has higher limits than 3-pro-preview.
        if (isQuota && isProMode) {
            console.warn("Quota exceeded on Pro model. Falling back to Gemini 2.5 Flash for resilience.");
            
            const fallbackParams = {
                ...params,
                model: 'gemini-2.5-flash',
                // Remove thinking config for fallback to ensure speed/compatibility and save tokens
                config: {
                    ...params.config,
                    thinkingConfig: undefined 
                }
            };
            
            // Recursive call with fallback params, setting isProMode to false so we don't fallback again unnecessarily
            return generateWithRetry(ai, fallbackParams, false, retries - 1);
        }

        // For other errors or if already on fallback, use exponential backoff
        const delay = Math.pow(2, 4 - retries) * 1000; // 2s, 4s, 8s
        console.log(`API Error (${status}). Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        return generateWithRetry(ai, params, isProMode, retries - 1);
    }
    
    // If we run out of retries and it was a quota error
    if (isQuota) {
        throw new Error("Quota exceeded. The API rate limit has been reached. Please try again later.");
    }
    
    // If we run out of retries or it's a non-retriable error
    throw e;
  }
}

export const generateImageMetadata = async (
  base64Data: string,
  mimeType: string,
  mode: ModelMode,
  apiKey?: string
): Promise<StockMetadata> => {
  try {
    const key = apiKey || process.env.API_KEY;
    if (!key) throw new Error("API Key is missing. Please add your Gemini API Key.");

    const ai = new GoogleGenAI({ apiKey: key });
    
    // Select model based on user preference
    // Quality: gemini-3-pro-preview (Best for vision)
    // Fast: gemini-flash-lite-latest (Fastest)
    const primaryModel = mode === ModelMode.QUALITY ? 'gemini-3-pro-preview' : 'gemini-flash-lite-latest';
    const isPro = mode === ModelMode.QUALITY;

    const prompt = `
      You are an expert stock photography contributor for Adobe Stock and Shutterstock.
      Analyze the uploaded image visually.
      
      Generate metadata that maximizes SEO potential following strict agency guidelines:
      1. Title: Catchy, descriptive, and relevant. MUST be between 55 and 150 characters.
      2. Description: Optimized for Adobe Stock & Shutterstock. Write a concise, natural sentence describing the subject, action, and key details. STRICTLY between 70 and 200 characters.
      3. Keywords: Provide 35-49 keywords. Include conceptual tags (e.g., "success", "freedom") and literal tags (e.g., "blue sky", "laptop").
      4. Category: Choose the single best standard category.
      
      Ensure the output is strict JSON.
    `;

    // Use the retry wrapper
    const response = await generateWithRetry(ai, {
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
        // Only apply thinking budget if we are starting with the Quality model
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
    const key = apiKey || process.env.API_KEY;
    if (!key) throw new Error("API Key is missing");

    const ai = new GoogleGenAI({ apiKey: key });
    
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
  apiKey?: string
): Promise<string> => {
  try {
    const key = apiKey || process.env.API_KEY;
    if (!key) throw new Error("API Key is missing.");

    const ai = new GoogleGenAI({ apiKey: key });
    // Start with Pro model for best visual understanding
    const primaryModel = 'gemini-3-pro-preview';
    const isPro = true;

    const prompt = `
      Analyze this image and write a short, realistic text prompt that could be used to generate this exact image using an AI image generator (like Midjourney or Stable Diffusion).
      
      Focus on:
      1. Main subject and action
      2. Lighting and atmosphere
      3. Artistic style and composition
      
      Keep it under 75 words. Be direct and descriptive. Do not include intro text.
    `;

    // Use retry logic with fallback to Flash if Pro hits quota
    const response = await generateWithRetry(ai, {
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
    // Rethrow logic handled by generateWithRetry or bubble up standard errors
    const msg = (error as Error).message || '';
    if (msg.includes("Invalid API Key")) throw new Error("Invalid API Key. Please update it.");
    throw error;
  }
};
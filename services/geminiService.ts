import { GoogleGenAI, Schema, Type } from "@google/genai";
import { StockMetadata, ModelMode, GenerationSettings } from "../types";

// --- GEMINI CONFIG ---
// User requested: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-robotics-er-1.5-preview
const GEMINI_MODEL_FAST = "gemini-2.5-flash-lite"; 
const GEMINI_MODEL_QUALITY = "gemini-2.5-flash";
const GEMINI_MODEL_ROBOTICS = "gemini-robotics-er-1.5-preview"; // High-spatial reasoning

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function parseKeys(apiKeyString: string | undefined): string[] {
    if (!apiKeyString) return [];
    return apiKeyString
        .split(/[\n,]+/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
}

// --- HELPER: CONSTRUCT PROMPT ---
function buildSystemPrompt(settings?: GenerationSettings, mimeType?: string): string {
  const titleMin = settings?.titleWordCountMin || 7;
  const titleMax = settings?.titleWordCountMax || 25;
  const descMin = settings?.descriptionWordCountMin || 12;
  const descMax = settings?.descriptionWordCountMax || 40;
  const kwMin = settings?.keywordCountMin || 25;
  const kwMax = settings?.keywordCountMax || 49;

  let detectionRules = "";
  
  // 1. Transparency Logic
  // Updated to strictly check for transparency regardless of input mime type (as optimizeImage normalizes to webp)
  // Instructions expanded to include Vector formats (EPS, AI) as per user request.
  if (settings?.transparentBackground) {
      detectionRules += `- CHECK ALPHA CHANNEL: If the image appears to be a PNG, WebP, EPS, or AI file and has an alpha channel (transparent background), the Title MUST end with "Isolated on Transparent Background". Keywords MUST include "transparent", "background", "isolated".\n`;
  }

  // 2. White Background Logic
  if (settings?.whiteBackground) {
      detectionRules += `- VISUAL CHECK: If background is white, Title MUST end with "Isolated on White Background". Keywords must include "isolated", "white background".\n`;
  }

  // 3. Silhouette Logic
  if (settings?.silhouette) {
      detectionRules += `- VISUAL CHECK: If subject is a silhouette, Title MUST include "Silhouette". Keywords must include "silhouette", "shadow", "backlit".\n`;
  }

  // 4. Single Word Constraint
  if (settings?.singleWordKeywords) {
      detectionRules += `- KEYWORDS FORMAT: STRICTLY SINGLE WORDS ONLY. No phrases.\n`;
  }

  // 5. Custom & Prohibited
  if (settings?.prohibitedWordsEnabled && settings?.prohibitedWordsText) {
      detectionRules += `- FORBIDDEN WORDS: Do NOT use: ${settings.prohibitedWordsText}\n`;
  }
  if (settings?.customPromptEnabled && settings?.customPromptText) {
      detectionRules += `- USER INSTRUCTION: ${settings.customPromptText}\n`;
  }

  return `
    You are an elite Stock Photography Metadata Expert for Adobe Stock, Shutterstock, and Getty Images.
    
    YOUR GOAL: Maximize SEO discoverability and sales conversion.
    
    STRICT JSON OUTPUT FORMAT REQUIRED:
    {
      "title": "string",
      "description": "string", 
      "keywords": ["string", "string"],
      "category": "string"
    }

    === 1. TITLE GUIDELINES (Adobe Rule) ===
    - Length: ${titleMin}-${titleMax} words.
    - Structure: [Subject] + [Action/State] + [Context/Environment] + [Distinct Detail].
    - Style: Factual, descriptive, natural sentence. NO "Image of", "Photo of".
    
    === 2. KEYWORD GUIDELINES (Relevance Sorting) ===
    - Quantity: ${kwMin}-${kwMax} keywords.
    - **CRITICAL: ORDER MATTERS**.
    - First 10: Visual Literals (What you see: Dog, Running, Grass, Blue).
    - Next 10: Context & Environment (Park, Sunny, Summer, Outdoors).
    - Last: Concepts & Emotions (Happiness, Freedom, Speed).
    
    === 3. DESCRIPTION ===
    - Length: ${descMin}-${descMax} words.
    - A natural sentence expanding on the title with more visual details.

    === DETECTION RULES ===
    ${detectionRules}
  `;
}

// --- MISTRAL IMPLEMENTATION ---
async function callMistral(
    keys: string[],
    systemPrompt: string,
    mimeType: string,
    base64Data: string
): Promise<any> {
    const key = keys[0];
    if (!key) throw new Error("Mistral API Key missing");

    const url = "https://api.mistral.ai/v1/chat/completions";

    const payload = {
        model: "pixtral-12b-2409",
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Analyze this image and generate the metadata JSON."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${mimeType};base64,${base64Data}`
                        }
                    }
                ]
            }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Mistral API Error: ${err}`);
    }

    const data = await response.json();
    return { text: data.choices[0].message.content };
}

// --- GEMINI IMPLEMENTATION ---
async function callGemini(
    keys: string[],
    modelId: string,
    prompt: string,
    mimeType: string,
    base64Data: string,
    responseSchema?: any,
    retries = 3
): Promise<any> {
    const keyIndex = Math.floor(Math.random() * keys.length);
    const activeKey = keys[keyIndex];
    if (!activeKey) throw new Error("No valid Gemini API Key found.");

    const ai = new GoogleGenAI({ apiKey: activeKey });

    try {
        const config: any = {
            temperature: 0.3,
        };
        
        if (responseSchema) {
            config.responseMimeType = "application/json";
            config.responseSchema = responseSchema;
        }

        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt }
                ]
            },
            config: config
        });

        return response;

    } catch (e: any) {
        const msg = e.message || String(e);
        if ((msg.includes('429') || msg.includes('quota')) && retries > 0) {
             if (keys.length > 1) {
                 const remaining = keys.filter(k => k !== activeKey);
                 return callGemini(remaining, modelId, prompt, mimeType, base64Data, responseSchema, retries);
             }
             await wait(3000);
             return callGemini(keys, modelId, prompt, mimeType, base64Data, responseSchema, retries - 1);
        }
        throw e;
    }
}

// --- MAIN EXPORT: GENERATE METADATA ---
export const generateImageMetadata = async (
  base64Data: string,
  mimeType: string,
  mode: ModelMode,
  apiKey: string,
  settings: GenerationSettings
): Promise<StockMetadata> => {
  const keys = parseKeys(apiKey);
  if (keys.length === 0) throw new Error(`API Key is missing.`);

  const systemPrompt = buildSystemPrompt(settings, mimeType);
  
  // Mistral Logic
  if (mode === ModelMode.MISTRAL_PIXTRAL) {
      const response = await callMistral(keys, systemPrompt, mimeType, base64Data);
      try {
          return JSON.parse(response.text) as StockMetadata;
      } catch (e) {
          throw new Error("Mistral returned invalid JSON. Please try again.");
      }
  }

  // Gemini Logic
  let modelId = GEMINI_MODEL_FAST;
  if (mode === ModelMode.QUALITY) {
      modelId = GEMINI_MODEL_QUALITY;
  } else if (mode === ModelMode.ROBOTICS) {
      modelId = GEMINI_MODEL_ROBOTICS;
  }
  
  const metadataSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        category: { type: Type.STRING },
    },
    required: ["title", "description", "keywords", "category"],
  };

  const response = await callGemini(keys, modelId, systemPrompt, mimeType, base64Data, metadataSchema);
  
  if (!response.text) throw new Error("Gemini returned empty response");
  return JSON.parse(response.text) as StockMetadata;
};

// --- TRENDING KEYWORDS ---
export const getTrendingKeywords = async (baseKeywords: string[], apiKey: string): Promise<string[]> => {
    const keys = parseKeys(apiKey);
    if (keys.length === 0) throw new Error("API Key missing");
    
    const prompt = `
        SEO Expert Task: Analyze these keywords: ${baseKeywords.slice(0, 5).join(", ")}.
        Identify 5-10 "Trending" or "High Volume" related search terms for stock photography.
    `;

    const ai = new GoogleGenAI({ apiKey: keys[0] });
    // Use Flash for Search Grounding (Tools support)
    const response = await ai.models.generateContent({
            model: GEMINI_MODEL_QUALITY, // Using 2.5 Flash for better grounding capability
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
    });
    const text = response.text || "";
    // Clean up text response
    return text.split('\n').map(l => l.replace(/^[-\d.]+\s*/, '').trim()).filter(l => l.length > 2).slice(0, 10);
};

// --- GENERATE IMAGE PROMPT (Reverse Engineering) ---
export const generateImagePrompt = async (
  base64Data: string,
  mimeType: string,
  apiKey: string,
  imageType: string
): Promise<string> => {
  const keys = parseKeys(apiKey);
  if (keys.length === 0) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: keys[0] });
  // Using 2.5 Flash for advanced vision capabilities
  const model = GEMINI_MODEL_QUALITY;

  const prompt = `
    Analyze this image and write a detailed, high-quality text prompt that could be used to recreate this exact image using an AI generator like Midjourney or Stable Diffusion.
    
    Context:
    - Image Style: ${imageType}
    - Include details about subject, lighting, composition, camera angle, color palette, and mood.
    - If it's a vector/illustration, describe the art style.
    
    Output ONLY the prompt text. Do not add conversational filler.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt }
      ]
    }
  });

  return response.text || "";
};

// --- EXPAND TEXT TO PROMPTS ---
export const expandTextToPrompts = async (
  text: string,
  count: number,
  apiKey: string,
  style: string
): Promise<string[]> => {
  const keys = parseKeys(apiKey);
  if (keys.length === 0) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: keys[0] });
  // Using Flash Lite for fast text expansion
  const model = GEMINI_MODEL_FAST;

  const prompt = `
    Act as a Professional AI Prompt Engineer.
    
    INPUT CONCEPT: "${text}"
    TARGET STYLE: "${style}"
    
    TASK: Generate ${count} distinct, highly detailed AI image generation prompts based on the Input Concept.
    Each prompt should explore a slightly different angle or composition while maintaining the Target Style.
    Include artistic terms, lighting descriptions, and rendering engines (e.g. Unreal Engine 5, Octane Render) where appropriate.

    FORMAT: Return a JSON array of strings. 
    Example: ["Prompt 1...", "Prompt 2..."]
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    }
  });

  if (response.text) {
      try {
          return JSON.parse(response.text);
      } catch (e) {
          console.error("Failed to parse JSON response", e);
          return [];
      }
  }
  return [];
};

// --- GENERATE IMAGE FROM TEXT (and optional Source Image) ---
export const generateImageFromText = async (
    prompt: string,
    aspectRatio: string, // "1:1", "3:4", "4:3", "9:16", "16:9"
    modelId: string, 
    apiKey: string,
    sourceImage?: { base64: string, mimeType: string, previewUrl?: string },
    advancedSettings?: { negativePrompt?: string, seed?: number, guidanceScale?: number }
): Promise<string> => {
    const keys = parseKeys(apiKey);
    if (keys.length === 0) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey: keys[0] });
    
    const parts: any[] = [];
    
    // 1. Add Source Image if available (Edit Mode)
    if (sourceImage) {
        parts.push({
            inlineData: {
                mimeType: sourceImage.mimeType,
                data: sourceImage.base64
            }
        });
    }

    // 2. Construct Prompt with Negative Prompt if present
    let finalPrompt = prompt;
    if (advancedSettings?.negativePrompt) {
        // Appending negative prompt as text, as simple config might not be standard across all models/interfaces
        finalPrompt += ` (Exclude: ${advancedSettings.negativePrompt})`;
    }
    
    parts.push({ text: finalPrompt });

    const config: any = {
        imageConfig: {
            aspectRatio: aspectRatio || "1:1"
        }
    };
    
    if (advancedSettings?.seed !== undefined && advancedSettings.seed !== null) {
        config.seed = Number(advancedSettings.seed);
    }

    // Call generateContent for nano banana series models
    const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts },
        config: config
    });

    // Extract image from parts
    if (response.candidates && response.candidates.length > 0) {
        const content = response.candidates[0].content;
        if (content && content.parts) {
            for (const part of content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
    }
    
    // Check if there is text explanation for failure (e.g., safety block)
    if (response.text) {
        throw new Error(`Model returned text instead of image: ${response.text.substring(0, 100)}...`);
    }
    
    throw new Error("No image generated. The prompt might have triggered safety filters.");
};
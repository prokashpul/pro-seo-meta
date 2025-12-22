import { GoogleGenAI, Schema, Type } from "@google/genai";
import { StockMetadata, ModelMode, GenerationSettings } from "../types";

// --- GEMINI CONFIG ---
const GEMINI_MODEL_FAST = "gemini-2.5-flash-lite"; 
const GEMINI_MODEL_QUALITY = "gemini-2.5-flash";
const GEMINI_MODEL_ROBOTICS = "gemini-robotics-er-1.5-preview"; 

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
  
  if (settings?.transparentBackground) {
      detectionRules += `- CHECK ALPHA CHANNEL: If the image appears to be a PNG, WebP, EPS, or AI file and has an alpha channel (transparent background), the Title MUST end with "Isolated on Transparent Background". Keywords MUST include "transparent", "background", "isolated".\n`;
  }

  if (settings?.whiteBackground) {
      detectionRules += `- VISUAL CHECK: If background is white, Title MUST end with "Isolated on White Background". Keywords must include "isolated", "white background".\n`;
  }

  if (settings?.silhouette) {
      detectionRules += `- VISUAL CHECK: If subject is a silhouette, Title MUST include "Silhouette". Keywords must include "silhouette", "shadow", "backlit".\n`;
  }

  if (settings?.singleWordKeywords) {
      detectionRules += `- KEYWORDS FORMAT: STRICTLY SINGLE WORDS ONLY. No phrases.\n`;
  }

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
    - Style: Factual, descriptive, natural sentence. NO "Image of", "Photo of".
    
    === 2. KEYWORD GUIDELINES ===
    - Quantity: ${kwMin}-${kwMax} keywords.
    - **CRITICAL: ORDER MATTERS**. Relevancy descending.
    
    === 3. DESCRIPTION ===
    - Length: ${descMin}-${descMax} words.

    === DETECTION RULES ===
    ${detectionRules}
  `;
}

// --- MISTRAL IMPLEMENTATION ---
async function callMistralChat(
    key: string,
    systemPrompt: string,
    userContent: any[],
    model: string = "pixtral-12b-2409",
    responseFormat: any = { type: "json_object" }
): Promise<any> {
    const url = "https://api.mistral.ai/v1/chat/completions";

    const payload = {
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent }
        ],
        temperature: 0.3,
        response_format: responseFormat
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
        const config: any = { temperature: 0.3 };
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
  
  if (mode === ModelMode.MISTRAL_PIXTRAL) {
      const response = await callMistralChat(keys[0], systemPrompt, [
          { type: "text", text: "Analyze this image and generate metadata." },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
      ]);
      return JSON.parse(response.text) as StockMetadata;
  }

  let modelId = GEMINI_MODEL_FAST;
  if (mode === ModelMode.QUALITY) modelId = GEMINI_MODEL_QUALITY;
  else if (mode === ModelMode.ROBOTICS) modelId = GEMINI_MODEL_ROBOTICS;
  
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
    
    const prompt = `SEO Expert Task: Analyze these keywords: ${baseKeywords.slice(0, 5).join(", ")}. Identify 5-10 "Trending" or "High Volume" related search terms for stock photography.`;
    const ai = new GoogleGenAI({ apiKey: keys[0] });
    const response = await ai.models.generateContent({
            model: GEMINI_MODEL_QUALITY,
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
    });
    const text = response.text || "";
    return text.split('\n').map(l => l.replace(/^[-\d.]+\s*/, '').trim()).filter(l => l.length > 2).slice(0, 10);
};

// --- GENERATE IMAGE PROMPT (Reverse Engineering) ---
export const generateImagePrompt = async (
  base64Data: string,
  mimeType: string,
  apiKey: string,
  imageType: string,
  useMistral: boolean = false
): Promise<string> => {
  const keys = parseKeys(apiKey);
  if (keys.length === 0) throw new Error("API Key missing");

  const prompt = `
    Analyze this image and write a detailed, high-quality text prompt that could be used to recreate this exact image using an AI generator like Midjourney or Stable Diffusion.
    Context:
    - Image Style: ${imageType}
    - Include details about subject, lighting, composition, camera angle, color palette, and mood.
    - If it's a vector/illustration, describe the art style.
    Output ONLY the prompt text. Do not add conversational filler.
  `;

  if (useMistral) {
      const response = await callMistralChat(
          keys[0], 
          "You are a Professional AI Prompt Engineer.", 
          [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
          ],
          "pixtral-12b-2409",
          { type: "text" }
      );
      return response.text || "";
  }

  const ai = new GoogleGenAI({ apiKey: keys[0] });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_QUALITY,
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
  style: string,
  useMistral: boolean = false
): Promise<string[]> => {
  const keys = parseKeys(apiKey);
  if (keys.length === 0) throw new Error("API Key missing");

  const prompt = `
    Act as a Professional AI Prompt Engineer.
    INPUT CONCEPT: "${text}"
    TARGET STYLE: "${style}"
    TASK: Generate ${count} distinct, highly detailed AI image generation prompts based on the Input Concept.
    Each prompt should explore a slightly different angle or composition while maintaining the Target Style.
    Include artistic terms, lighting descriptions, and rendering engines.
    FORMAT: Return a JSON array of strings. 
    Example: ["Prompt 1...", "Prompt 2..."]
  `;

  if (useMistral) {
      const response = await callMistralChat(
          keys[0], 
          "You are a Professional AI Prompt Engineer.", 
          [{ type: "text", text: prompt }],
          "mistral-large-latest",
          { type: "json_object" }
      );
      return JSON.parse(response.text);
  }

  const ai = new GoogleGenAI({ apiKey: keys[0] });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_FAST,
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    }
  });

  return response.text ? JSON.parse(response.text) : [];
};

// --- GENERATE IMAGE FROM TEXT ---
export const generateImageFromText = async (
    prompt: string,
    aspectRatio: string, 
    modelId: string, 
    apiKey: string,
    sourceImage?: { base64: string, mimeType: string, previewUrl?: string },
    advancedSettings?: { negativePrompt?: string, seed?: number, guidanceScale?: number }
): Promise<string> => {
    const keys = parseKeys(apiKey);
    if (keys.length === 0) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey: keys[0] });
    const parts: any[] = [];
    
    if (sourceImage) {
        parts.push({ inlineData: { mimeType: sourceImage.mimeType, data: sourceImage.base64 } });
    }

    let finalPrompt = prompt;
    if (advancedSettings?.negativePrompt) {
        finalPrompt += ` (Exclude: ${advancedSettings.negativePrompt})`;
    }
    
    parts.push({ text: finalPrompt });

    const config: any = {
        imageConfig: { aspectRatio: aspectRatio || "1:1" }
    };
    
    if (advancedSettings?.seed !== undefined && advancedSettings.seed !== null) {
        config.seed = Number(advancedSettings.seed);
    }

    const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts },
        config: config
    });

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
    
    if (response.text) {
        throw new Error(`Model returned text instead of image: ${response.text.substring(0, 100)}...`);
    }
    
    throw new Error("No image generated.");
};
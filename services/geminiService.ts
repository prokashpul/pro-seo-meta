import { GoogleGenAI, Type } from "@google/genai";
import { StockMetadata, ModelMode, GenerationSettings } from "../types";

// --- CONFIG ---
const GEMINI_MODEL_FAST = "gemini-3-flash-preview"; 
const GEMINI_MODEL_QUALITY = "gemini-3-flash-preview";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const MISTRAL_MODEL = "pixtral-12b-2409";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPER: SYSTEM PROMPTS ---
const METADATA_SYSTEM_INSTRUCTION = (settings?: GenerationSettings) => {
  const kwMin = settings?.keywordCountMin || 15;
  const kwMax = settings?.keywordCountMax || 35;
  const descMin = settings?.descriptionWordCountMin || 15;
  const descMax = settings?.descriptionWordCountMax || 45;

  let rules = `You are an elite Stock Photography Metadata Expert. 
    Strictly output JSON: { "title": "...", "description": "...", "keywords": [], "category": "..." }.
    Title: Factual, < 70 chars. 
    Keywords: ${kwMin}-${kwMax} relevant terms, main subject first.
    Description: ${descMin}-${descMax} words.`;

  if (settings?.transparentBackground) rules += `\n- Detect transparency: If found, title MUST end with "Isolated on Transparent Background".`;
  if (settings?.whiteBackground) rules += `\n- Detect white background: If found, title MUST end with "Isolated on White Background".`;
  if (settings?.singleWordKeywords) rules += `\n- Keywords MUST be single words only.`;
  if (settings?.prohibitedWordsEnabled) rules += `\n- DO NOT use: ${settings.prohibitedWordsText}`;
  if (settings?.customPromptEnabled) rules += `\n- User custom rule: ${settings.customPromptText}`;

  return rules;
};

const PROMPT_ENGINEER_INSTRUCTION = (style: string) => `
    You are a Professional AI Prompt Engineer. 
    Your task is to analyze an image or concept and write a detailed, high-quality text prompt for AI generators like Midjourney or Stable Diffusion.
    Target Style: ${style}. 
    Focus on lighting, composition, mood, and technical camera details. 
    Output ONLY the raw prompt text. No conversational filler.
`;

// --- EXTERNAL PROVIDERS (VISION) ---
async function callExternalVisionRaw(
    url: string,
    key: string,
    model: string,
    systemPrompt: string,
    mimeType: string,
    base64Data: string,
    userText: string = "Analyze this image."
): Promise<string> {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { 
                    role: "user", 
                    content: [
                        { type: "text", text: userText },
                        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                    ] 
                }
            ],
            temperature: 0.2
        })
    });

    if (!response.ok) throw new Error(`${model} API Error: ${response.statusText}`);
    const result = await response.json();
    return result.choices[0].message.content;
}

// --- EXTERNAL PROVIDERS (TEXT) ---
async function callExternalText(
    url: string,
    key: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    isJson: boolean = false
): Promise<string> {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            ...(isJson ? { response_format: { type: "json_object" } } : {})
        })
    });

    if (!response.ok) throw new Error(`${model} API Error: ${response.statusText}`);
    const result = await response.json();
    return result.choices[0].message.content;
}

// --- MAIN EXPORT: GENERATE METADATA ---
export const generateImageMetadata = async (
  base64Data: string,
  mimeType: string,
  mode: ModelMode,
  apiKey: string,
  settings: GenerationSettings
): Promise<StockMetadata> => {
  const systemInstruction = METADATA_SYSTEM_INSTRUCTION(settings);

  if (mode === ModelMode.GROQ_VISION) {
    const raw = await callExternalVisionRaw("https://api.groq.com/openai/v1/chat/completions", apiKey, GROQ_MODEL, systemInstruction, mimeType, base64Data);
    return JSON.parse(raw) as StockMetadata;
  }

  if (mode === ModelMode.MISTRAL_PIXTRAL) {
    const raw = await callExternalVisionRaw("https://api.mistral.ai/v1/chat/completions", apiKey, MISTRAL_MODEL, systemInstruction, mimeType, base64Data);
    return JSON.parse(raw) as StockMetadata;
  }

  // GEMINI PATH
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = mode === ModelMode.QUALITY ? GEMINI_MODEL_QUALITY : GEMINI_MODEL_FAST;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
        parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Provide metadata." }]
    },
    config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                category: { type: Type.STRING },
            },
            required: ["title", "description", "keywords", "category"],
        }
    }
  });

  if (!response.text) throw new Error("Gemini returned empty response");
  return JSON.parse(response.text) as StockMetadata;
};

// --- GENERATE IMAGE PROMPT ---
export const generateImagePrompt = async (
  base64Data: string,
  mimeType: string,
  imageType: string,
  provider: 'GEMINI' | 'GROQ' | 'MISTRAL' = 'GEMINI',
  apiKey?: string
): Promise<string> => {
  const systemInstruction = PROMPT_ENGINEER_INSTRUCTION(imageType);

  if (provider === 'GROQ' && apiKey) {
    return await callExternalVisionRaw("https://api.groq.com/openai/v1/chat/completions", apiKey, GROQ_MODEL, systemInstruction, mimeType, base64Data, "Write the AI generation prompt.");
  }

  if (provider === 'MISTRAL' && apiKey) {
    return await callExternalVisionRaw("https://api.mistral.ai/v1/chat/completions", apiKey, MISTRAL_MODEL, systemInstruction, mimeType, base64Data, "Write the AI generation prompt.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_QUALITY,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: "Write the AI generation prompt." }
      ]
    },
    config: {
        systemInstruction
    }
  });

  return response.text || "";
};

// --- EXPAND TEXT TO PROMPTS ---
export const expandTextToPrompts = async (
  text: string,
  count: number,
  style: string,
  provider: 'GEMINI' | 'GROQ' | 'MISTRAL' = 'GEMINI',
  apiKey?: string
): Promise<string[]> => {
  const systemInstruction = `You are an AI Prompt Expansion expert. Style: ${style}. Output ONLY a JSON array of ${count} highly detailed prompts. Key: "prompts"`;
  const userPrompt = `Expand this concept into ${count} unique variations: "${text}"`;

  if (provider === 'GROQ' && apiKey) {
    const raw = await callExternalText("https://api.groq.com/openai/v1/chat/completions", apiKey, GROQ_MODEL, systemInstruction, userPrompt, true);
    return JSON.parse(raw).prompts || [];
  }

  if (provider === 'MISTRAL' && apiKey) {
    const raw = await callExternalText("https://api.mistral.ai/v1/chat/completions", apiKey, "mistral-large-latest", systemInstruction, userPrompt, true);
    return JSON.parse(raw).prompts || [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_FAST,
    contents: userPrompt,
    config: {
        systemInstruction: `You are an AI Prompt Expansion expert. Style: ${style}. Output ONLY a JSON array of ${count} highly detailed prompts.`,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    }
  });

  return response.text ? JSON.parse(response.text) : [];
};

export const getTrendingKeywords = async (baseKeywords: string[]): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze: ${baseKeywords.slice(0, 5).join(", ")}. Identify 5-10 high-volume search terms.`;
    const response = await ai.models.generateContent({
            model: GEMINI_MODEL_QUALITY,
            contents: prompt,
            config: { 
                systemInstruction: "You are an SEO expert. Return keywords as a simple newline-separated list.",
                tools: [{ googleSearch: {} }] 
            }
    });
    return (response.text || "").split('\n').map(l => l.trim()).filter(l => l.length > 2);
};

// --- GENERATE IMAGE ---
export const generateImageFromText = async (
  prompt: string,
  aspectRatio: string,
  model: string,
  _apiKey: string,
  sourceImage?: {
    base64: string;
    mimeType: string;
  },
  advancedSettings?: {
    seed?: number;
  }
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  if (sourceImage) {
    parts.push({
      inlineData: {
        data: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      },
    });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: model || 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      },
      seed: advancedSettings?.seed,
    },
  });

  if (response.candidates && response.candidates[0] && response.candidates[0].content) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }
  
  throw new Error("No image was generated by the model. Try refining your prompt.");
};
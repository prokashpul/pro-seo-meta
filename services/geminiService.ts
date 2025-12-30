
import { GoogleGenAI, Type } from "@google/genai";
import { StockMetadata, ModelMode, GenerationSettings } from "../types";

// --- CONFIG ---
const GEMINI_MODEL_FAST = "gemini-3-flash-preview"; 
const GEMINI_MODEL_QUALITY = "gemini-3-pro-preview";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const MISTRAL_MODEL = "pixtral-12b-2409";

const getGeminiKey = () => {
  return localStorage.getItem('gemini_api_key') || process.env.API_KEY || '';
};

const getAI = () => {
  return new GoogleGenAI({ apiKey: getGeminiKey() });
};

// --- MAIN EXPORT: GENERATE METADATA ---
export const generateImageMetadata = async (
  base64Data: string,
  mimeType: string,
  mode: ModelMode,
  apiKey: string,
  settings: GenerationSettings
): Promise<StockMetadata> => {
  const kwMin = settings?.keywordCountMin || 15;
  const kwMax = settings?.keywordCountMax || 35;
  const descMin = settings?.descriptionWordCountMin || 15;
  const descMax = settings?.descriptionWordCountMax || 45;

  let systemInstruction = `You are an elite Stock Photography Metadata Expert. 
    Strictly output JSON: { "title": "...", "description": "...", "keywords": [], "category": "..." }.
    Title: Factual, < 70 chars. 
    Keywords: ${kwMin}-${kwMax} relevant terms, main subject first.
    Description: ${descMin}-${descMax} words.`;

  if (settings?.transparentBackground) systemInstruction += `\n- Detect transparency: If found, title MUST end with "Isolated on Transparent Background".`;
  if (settings?.whiteBackground) systemInstruction += `\n- Detect white background: If found, title MUST end with "Isolated on White Background".`;
  if (settings?.singleWordKeywords) systemInstruction += `\n- Keywords MUST be single words only.`;
  if (settings?.prohibitedWordsEnabled) systemInstruction += `\n- DO NOT use: ${settings.prohibitedWordsText}`;
  if (settings?.customPromptEnabled) systemInstruction += `\n- User custom rule: ${settings.customPromptText}`;

  if (mode === ModelMode.GROQ_VISION) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: systemInstruction }, { role: "user", content: [{ type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }] }],
        response_format: { type: "json_object" }
      })
    });
    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }

  const ai = getAI();
  const modelId = mode === ModelMode.QUALITY ? GEMINI_MODEL_QUALITY : GEMINI_MODEL_FAST;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Analyze this image and provide metadata." }] },
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

  const responseText = response.text;
  if (!responseText) throw new Error("Gemini returned empty response");
  return JSON.parse(responseText) as StockMetadata;
};

export const generateImagePrompt = async (
  base64Data: string,
  mimeType: string,
  imageType: string,
  provider: 'GEMINI' | 'GROQ' | 'MISTRAL' = 'GEMINI',
  apiKey?: string
): Promise<string> => {
  const prompt = "Write a high-quality, detailed text-to-image prompt (for Midjourney/Dall-E) that would recreate this image. Focus on lighting, composition, style, and subject.";
  const systemInstruction = `You are a Professional AI Prompt Engineer. Style: ${imageType}. Output ONLY the raw prompt text. No conversational filler.`;
  
  if (provider === 'GEMINI') {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_QUALITY,
      contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] },
      config: { systemInstruction }
    });
    return response.text || "";
  } 

  if (provider === 'GROQ' || provider === 'MISTRAL') {
    const url = provider === 'GROQ' 
      ? "https://api.groq.com/openai/v1/chat/completions" 
      : "https://api.mistral.ai/v1/chat/completions";
    const model = provider === 'GROQ' ? GROQ_MODEL : MISTRAL_MODEL;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
          ]}
        ]
      })
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    return result.choices[0].message.content;
  }

  return ""; 
};

export const expandTextToPrompts = async (
  text: string, 
  count: number, 
  style: string, 
  provider: 'GEMINI' | 'GROQ' | 'MISTRAL' = 'GEMINI', 
  apiKey?: string
): Promise<string[]> => {
  const userPrompt = `Expand this concept into ${count} unique, highly-detailed text-to-image prompt variations: "${text}"`;
  const systemInstruction = `You are an AI Prompt Expansion expert. Style: ${style}. Output ONLY a valid JSON array of strings containing ${count} detailed prompts. Example: ["Prompt 1...", "Prompt 2..."]`;

  if (provider === 'GEMINI') {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FAST,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return response.text ? JSON.parse(response.text) : [];
  }

  if (provider === 'GROQ' || provider === 'MISTRAL') {
    const url = provider === 'GROQ' 
      ? "https://api.groq.com/openai/v1/chat/completions" 
      : "https://api.mistral.ai/v1/chat/completions";
    const model = provider === 'GROQ' ? "llama-3.3-70b-versatile" : "mistral-large-latest"; // Using larger text models for expansion

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      })
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    
    const content = result.choices[0].message.content;
    const parsed = JSON.parse(content);
    // Handle cases where the model might wrap the array in an object key like "prompts"
    return Array.isArray(parsed) ? parsed : (parsed.prompts || Object.values(parsed)[0]);
  }

  return [];
};

export const getTrendingKeywords = async (baseKeywords: string[]): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_QUALITY,
    contents: `Analyze: ${baseKeywords.slice(0, 5).join(", ")}. Identify 10 high-volume search terms related to current trends.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return (response.text || "").split('\n').map(l => l.trim()).filter(l => l.length > 2);
};

export const generateImageFromText = async (
  prompt: string, 
  aspectRatio: string, 
  model: string, 
  _apiKey: string, 
  sourceImage?: { base64: string; mimeType: string },
  advancedSettings?: { negativePrompt?: string; guidanceScale?: number; seed?: number }
): Promise<string> => {
  const ai = getAI();
  
  let finalPrompt = prompt;
  if (advancedSettings?.negativePrompt) {
    finalPrompt += `\n[Negative Prompt: ${advancedSettings.negativePrompt}]`;
  }

  const parts: any[] = sourceImage ? [{ inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } }, { text: finalPrompt }] : [{ text: finalPrompt }];
  
  const config: any = { 
    imageConfig: { 
      aspectRatio: aspectRatio as any 
    } 
  };

  if (advancedSettings?.seed !== undefined) {
    config.seed = advancedSettings.seed;
  }

  const response = await ai.models.generateContent({
    model: model || 'gemini-2.5-flash-image',
    contents: { parts },
    config: config,
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image was returned by the generative engine.");
};

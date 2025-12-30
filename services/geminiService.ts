
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

  let baseInstruction = `You are a world-class Stock Photography Metadata & SEO Specialist.
    Your task is to analyze the provided image and generate highly commercial, SEO-optimized metadata for agencies like Adobe Stock and Shutterstock.
    
    Strictly output ONLY valid JSON in this format: 
    { "title": "...", "description": "...", "keywords": [], "category": "..." }

    RULES:
    1. Title: Factual, concise, and keyword-rich. Max 70 characters. No fluff like "A photo of...".
    2. Description: Detailed, factual description of the scene, subjects, colors, and mood. ${descMin}-${descMax} words.
    3. Keywords: ${kwMin}-${kwMax} high-volume search terms. Sort by relevance: main subject first, then environment, then technical specs (lighting, angle).
    4. Category: Select most appropriate industry category (e.g., Business, Technology, Nature, People, Lifestyle, Abstract, Food & Drink).
    5. No subjective words: Avoid "beautiful", "amazing", "stunning". Use descriptive terms instead.
    6. Technical terms: Include camera angle (e.g., close-up, low angle) if obvious.`;

  if (settings?.transparentBackground) baseInstruction += `\n- Detect transparency: If found, the title MUST include the phrase "Isolated on Transparent Background".`;
  if (settings?.whiteBackground) baseInstruction += `\n- Detect white background: If found, the title MUST include the phrase "Isolated on White Background".`;
  if (settings?.singleWordKeywords) baseInstruction += `\n- Keywords MUST be single words only. No multi-word phrases.`;
  if (settings?.prohibitedWordsEnabled) baseInstruction += `\n- STRICTLY AVOID these prohibited words: ${settings.prohibitedWordsText}`;
  if (settings?.customPromptEnabled) baseInstruction += `\n- ADHERE to this custom user rule: ${settings.customPromptText}`;

  // Handle Groq Llama Vision
  if (mode === ModelMode.GROQ_VISION) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: baseInstruction }, 
          { 
            role: "user", 
            content: [
              { type: "text", text: "Generate professional SEO metadata for this stock asset." },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } } 
            ] 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    const content = result.choices[0].message.content;
    return typeof content === 'string' ? JSON.parse(content) : content;
  }

  // Handle Mistral Pixtral Vision
  if (mode === ModelMode.MISTRAL_PIXTRAL) {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          { role: "system", content: baseInstruction },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Analyze this image for commercial stock metadata and return JSON." },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    const content = result.choices[0].message.content;
    return typeof content === 'string' ? JSON.parse(content) : content;
  }

  // Fallback to Gemini (Flash or Pro)
  const ai = getAI();
  const modelId = mode === ModelMode.QUALITY ? GEMINI_MODEL_QUALITY : GEMINI_MODEL_FAST;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { 
      parts: [
        { inlineData: { mimeType, data: base64Data } }, 
        { text: "Analyze this image for commercial stock photography metadata and generate an SEO optimized JSON response." }
      ] 
    },
    config: {
      systemInstruction: baseInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "SEO optimized title, max 70 chars" },
          description: { type: Type.STRING, description: "Detailed factual description" },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of relevant keywords" },
          category: { type: Type.STRING, description: "Appropriate stock category" },
        },
        required: ["title", "description", "keywords", "category"],
      },
      temperature: 0.2
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
  const systemInstruction = `You are a Professional AI Prompt Engineer. Style: ${imageType}. Output ONLY the raw prompt text. No conversational filler. Focus on technical artistic terms (volumetric lighting, photorealistic, 8k, bokeh, etc.).`;
  
  if (provider === 'GEMINI') {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_QUALITY,
      contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] },
      config: { systemInstruction, temperature: 0.7 }
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
        ],
        temperature: 0.7
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
  const systemInstruction = `You are an AI Prompt Expansion expert. Style: ${style}. Output ONLY a valid JSON array of strings containing ${count} detailed prompts. Use varied lighting, camera angles, and textures for each variation.`;

  if (provider === 'GEMINI') {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FAST,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
        temperature: 0.8
      }
    });
    return response.text ? JSON.parse(response.text) : [];
  }

  if (provider === 'GROQ' || provider === 'MISTRAL') {
    const url = provider === 'GROQ' 
      ? "https://api.groq.com/openai/v1/chat/completions" 
      : "https://api.mistral.ai/v1/chat/completions";
    const model = provider === 'GROQ' ? "llama-3.3-70b-versatile" : "mistral-large-latest"; 

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      })
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    
    const content = result.choices[0].message.content;
    const parsed = JSON.parse(content);
    // Handle wrapping
    return Array.isArray(parsed) ? parsed : (parsed.prompts || Object.values(parsed)[0]);
  }

  return [];
};

export const getTrendingKeywords = async (baseKeywords: string[]): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_QUALITY,
    contents: `Analyze: ${baseKeywords.slice(0, 5).join(", ")}. Identify 10 high-volume search terms related to current trends in stock photography and commercial design.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return (response.text || "").split('\n').map(l => l.trim().replace(/^\d+\.\s*/, '')).filter(l => l.length > 2);
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

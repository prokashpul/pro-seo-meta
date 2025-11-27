import { GoogleGenAI, Type, Schema, FunctionDeclaration } from "@google/genai";
import { StockMetadata, ModelMode } from "../types";

// Schema for structured JSON output
const metadataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A concise, SEO-friendly title for the stock image (max 70 chars).",
    },
    description: {
      type: Type.STRING,
      description: "A detailed description of the image content, mood, and technical aspects (max 200 chars).",
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 40-50 relevant keywords/tags ordered by relevance.",
    },
    category: {
      type: Type.STRING,
      description: "The most fitting stock photography category (e.g., Business, Lifestyle, Nature, Technology).",
    },
  },
  required: ["title", "description", "keywords", "category"],
};

export const generateImageMetadata = async (
  base64Data: string,
  mimeType: string,
  mode: ModelMode
): Promise<StockMetadata> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Select model based on user preference
    // Quality: gemini-3-pro-preview (Best for vision)
    // Fast: gemini-flash-lite-latest (Fastest)
    const modelName = mode === ModelMode.QUALITY ? 'gemini-3-pro-preview' : 'gemini-flash-lite-latest';

    const prompt = `
      You are an expert stock photography contributor for Adobe Stock and Shutterstock.
      Analyze the uploaded image visually.
      
      Generate metadata that maximizes SEO potential.
      1. Title: Catchy, relevant, under 70 characters.
      2. Description: Detailed, natural language, under 200 characters. Includes subject, action, and setting.
      3. Keywords: Provide 40-50 keywords. Include conceptual tags (e.g., "success", "freedom") and literal tags (e.g., "blue sky", "laptop").
      4. Category: Choose the single best standard category.
      
      Ensure the output is strict JSON.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
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
        // If using pro model, we can give it more thinking budget for better keywords
        thinkingConfig: mode === ModelMode.QUALITY ? { thinkingBudget: 2048 } : undefined,
      }
    });

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

export const getTrendingKeywords = async (baseKeywords: string[]): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    // Clean up response to extract just the words if possible, or parse standard text
    // Since we can't force JSON with search tools easily without Schema, we'll ask for a list and parse roughly.
    // Or we can just return the raw text if it's clean enough. 
    // Let's try to extract lines.
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
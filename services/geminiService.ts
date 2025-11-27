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
      description: "A detailed description of the image content, mood, and technical aspects (strictly between 100 and 199 characters).",
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
    // Check for 429 (Quota Exceeded) or 503 (Service Unavailable)
    const isQuota = e.status === 429 || (e.message && (e.message.includes('429') || e.message.includes('quota') || e.message.includes('RESOURCE_EXHAUSTED')));
    const isServer = e.status >= 500;
    
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
        console.log(`API Error (${e.status}). Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        return generateWithRetry(ai, params, isProMode, retries - 1);
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
      
      Generate metadata that maximizes SEO potential.
      1. Title: Catchy, descriptive, and relevant. MUST be between 55 and 150 characters in length.
      2. Description: Detailed, natural language. STRICTLY between 100 and 199 characters in length. Do not generate less than 100 or more than 199 characters.
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
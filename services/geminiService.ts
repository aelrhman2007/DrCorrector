
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { OcrResult } from '../types';

// Ensure API key is available from environment variables
if (!process.env.API_KEY) {
  console.error("API_KEY environment variable not set. Please refer to the documentation to set it up.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Converts a File object to a Base64 encoded string.
 * @param file The file to convert.
 * @returns A promise that resolves with the Base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Performs OCR on an image using the Gemini API and expects a structured JSON output.
 * @param imageFile The image file to analyze.
 * @returns A promise that resolves with the parsed OcrResult.
 */
export const performOcr = async (imageFile: File): Promise<OcrResult> => {
  try {
    const base64Image = await fileToBase64(imageFile);

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { 
            parts: [
                {
                    text: `Analyze this image of a multiple-choice answer sheet. Extract the question number and the corresponding answer for each entry. Provide the output as a JSON object with this exact structure: {"questions": [{"q": number, "answer": "string", "confidence": number between 0 and 1}], "raw_text": "string"}. The 'answer' should be a single character (A, B, C, D) or a simple identifier. The 'confidence' should be your estimated accuracy for that specific entry. Normalize answers like '1-A' or '1 A' to just 'A'. If you cannot determine an answer, you can omit it. Sort the results by question number 'q'.`,
                },
                {
                    inlineData: {
                        mimeType: imageFile.type,
                        data: base64Image,
                    },
                },
            ] 
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                q: { type: Type.INTEGER, description: "Question number" },
                                answer: { type: Type.STRING, description: "Selected answer (e.g., A, B, C, D)" },
                                confidence: { type: Type.NUMBER, description: "Confidence score from 0.0 to 1.0" },
                            },
                             required: ["q", "answer", "confidence"],
                        }
                    },
                    raw_text: {
                        type: Type.STRING,
                        description: "The full raw text extracted from the image."
                    }
                },
                required: ["questions", "raw_text"],
            }
        }
    });

    const text = response.text.trim();
    // Gemini with JSON schema often returns a clean JSON string.
    const parsedResult: OcrResult = JSON.parse(text);
    return parsedResult;
  } catch (error) {
    console.error("Error during OCR with Gemini:", error);
    throw new Error("فشل تحليل الصورة. الرجاء المحاولة مرة أخرى أو استخدام صورة أوضح.");
  }
};

/**
 * Generates speech from text using the Gemini TTS API.
 * @param text The text to synthesize.
 * @param voice The voice to use for synthesis.
 * @returns A promise that resolves with the audio data as a Base64 string.
 */
export const generateTts = async (text: string, voice: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error during TTS generation with Gemini:", error);
    throw new Error("فشل إنشاء المقطع الصوتي.");
  }
};

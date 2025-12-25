
import { GoogleGenAI, Type } from "@google/genai";
import { QuizConfig, Question } from "./types";

// Note: Always use process.env.API_KEY directly when initializing the GoogleGenAI client instance.

export const generateQuizQuestions = async (config: QuizConfig): Promise<Question[]> => {
  // Fix: Using process.env.API_KEY directly in constructor
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Dostonbek Academy ta'lim platformasi uchun professional test savollarini yarating.
  
  DIQQAT: SAVOLLAR FAQAT QUYIDAGI ANIQ MAVZUGA OID BO'LISHI SHART!
  
  Fan: ${config.category}
  Yo'nalish: ${config.topic}
  ANIQ MAVZU: ${config.subTopic}
  Qiyinchilik darajasi: ${config.difficulty}
  Savollar soni: ${config.questionCount}
  Til: O'zbek tili
  Format: JSON array
  
  Xususiyatlar:
  1. Har bir savol 4 ta variantdan iborat bo'lsin.
  2. Faqat bitta to'g'ri javob indeksi (0-3) bo'lsin.
  3. Izoh (explanation) qismi ilmiy va tushunarli bo'lsin.
  4. Savollar mazmunan "${config.subTopic}" mavzusini to'liq qamrab olsin.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            text: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              minItems: 4,
              maxItems: 4
            },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["id", "text", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text);
  } catch (error) {
    throw new Error("Savollarni yaratishda xatolik. Qaytadan urinib ko'ring.");
  }
};

export const analyzePerformance = async (results: any): Promise<string> => {
  // Fix: Using process.env.API_KEY directly in constructor
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Talabaning test natijalari tahlili:
  Fan: ${results.category}
  Mavzu: ${results.subTopic}
  Natija: ${results.score}/${results.answeredCount} (Tanlangan savollardan).
  Jami berilgan savollar: ${results.totalQuestions}.
  
  O'zbek tilida qisqa, professional va motivatsion tahlil bering. Natija foizini hisobga oling.
  Test oxirida not'g'ri javob berilgan savollarni to'g'ri javobini ham ko'rsating savoli bilan`;
  
  const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
  return response.text || "Natijalar muvaffaqiyatli tahlil qilindi.";
};

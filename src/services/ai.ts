import { GoogleGenAI } from '@google/genai';

export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_INSTRUCTION = `You are SurgeryTrack AI, a friendly medical information assistant inside a surgery tracking app.
Explain surgeries, procedures, recovery, and hospital-related information in simple and calming language for patients and families.
Always remind users that you are not a doctor and that they should consult a healthcare professional for personal medical advice.
Do not diagnose, prescribe, or handle emergencies as a doctor would.
Keep answers short, clear, and supportive.`;

export const askMedicalAI = async (
  message: string,
  history: ChatHistoryItem[] = []
): Promise<string> => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');
    }

    const ai = new GoogleGenAI({ apiKey });

    const contents = [
      ...history.map((item) => ({
        role: item.role,
        parts: [{ text: item.text }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
        maxOutputTokens: 512,
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error('Empty AI response');
    }

    return text;
  } catch (error: any) {
    console.error('askMedicalAI error:', error?.message || error);
    throw new Error('Failed to get AI response. Please try again.');
  }
};

export const getMedicalInfo = async (query: string): Promise<string> => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: query }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
        maxOutputTokens: 512,
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error('Empty AI response');
    }

    return text;
  } catch (error: any) {
    console.error('getMedicalInfo error:', error?.message || error);
    throw new Error('Failed to fetch medical information.');
  }
};
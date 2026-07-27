import { GoogleGenerativeAI } from '@google/generative-ai';

// Use your Gemini API key
const API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with actual key
const genAI = new GoogleGenerativeAI(API_KEY);

export const getChatResponse = async (message: string, history: { role: string; text: string }[]): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      })),
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw new Error('Failed to get AI response. Please try again.');
  }
};

// Simple medical info query
export const getMedicalInfo = async (query: string): Promise<string> => {
  const prompt = `You are a helpful medical assistant. Provide accurate, general medical information. Always advise consulting a healthcare professional for specific concerns.\n\nUser query: ${query}`;
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Medical Info Error:', error);
    throw new Error('Failed to fetch medical information.');
  }
};
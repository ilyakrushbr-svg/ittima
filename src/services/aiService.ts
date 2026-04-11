import { GoogleGenAI, Type } from "@google/genai";
import { Scenario } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateScenario = async (sphere: string, difficulty: string, language: 'be' | 'ru' = 'be'): Promise<Scenario | null> => {
  try {
    const model = ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Generate a cybersecurity training scenario for a mobile app.
      Theme: ${sphere}
      Difficulty: ${difficulty}
      Language: ${language === 'be' ? 'Belarusian' : 'Russian'}
      
      The scenario must follow this exact JSON structure:
      {
        "id": number (random),
        "sphere": "${sphere}",
        "type": "safari" | "telegram" | "phone" | "whatsapp" | "discord" | "instagram",
        "title": "Short catchy title",
        "points": number (5-10),
        "difficulty": "${difficulty}",
        "tags": ["tag1", "tag2"],
        "ui_type": "same as type",
        "content": { ... UI specific content ... },
        "options": [
          { "text": "Option 1", "points": number, "feedback": "Why this is good/bad" },
          { "text": "Option 2", "points": number, "feedback": "..." },
          { "text": "Option 3", "points": number, "feedback": "..." }
        ]
      }

      UI Content structures:
      - safari: { url, page_title, warning, description, input_label, page_cta }
      - telegram: { bot_name, bot_verified, online, messages: string[], buttons: string[] }
      - whatsapp: { sender, number, online, messages: { direction: 'in'|'out', from, text }[] }
      - phone: { caller, number, duration: 'incoming', script }
      - discord: { server, channel, messages: { from, role, text }[] }
      - instagram: { post_author, verified, location, caption, link }

      Make it realistic, educational, and specific to the ${language === 'be' ? 'Belarusian' : 'Russian'} context (e.g., mention local banks like MTBank, Priorbank, or services like Belpost, Erip).`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = await model;
    const text = result.text;
    if (!text) return null;

    return JSON.parse(text) as Scenario;
  } catch (error) {
    console.error("Error generating scenario:", error);
    return null;
  }
};

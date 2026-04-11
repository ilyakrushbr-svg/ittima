
import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';
import scenarios from './src/data/scenarios.ts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const spheres = [
  'phishing', 'social_engineering', 'online_games', 'finance', 'privacy',
  'malware', 'child_safety', 'passwords', 'work_safety', 'deepfakes', 'cyber_fraud'
];
const difficulties = ['easy', 'medium', 'hard'];

async function generateBatch(sphere, difficulty, count) {
  console.log(`Generating ${count} questions for ${sphere} (${difficulty})...`);
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Generate ${count} NEW and UNIQUE cybersecurity educational scenarios for a Duolingo-style game.
    The scenarios MUST be bilingual, providing text in both Belarusian (be) and Russian (ru).
    
    Topic: ${sphere}
    Difficulty: ${difficulty}
    
    The scenarios must follow this JSON structure (an array of objects):
    [
      {
        "id": number (unique, starting from 100),
        "sphere": "${sphere}",
        "type": "safari" | "telegram" | "phone" | "whatsapp" | "discord" | "instagram",
        "title": { "be": "...", "ru": "..." },
        "points": number (5-10),
        "difficulty": "${difficulty}",
        "tags": ["tag1", "tag2"],
        "ui_type": same as "type",
        "content": {
          // For each string field in content, use { "be": "...", "ru": "..." }
          // if type === "safari": { "url": string, "page_title": {be, ru}, "warning": {be, ru}, "description": {be, ru}, "input_label": {be, ru} }
          // if type === "telegram": { "bot_name": string, "messages": [{be, ru}], "buttons": [{be, ru}] }
          // if type === "phone": { "caller": {be, ru}, "script": {be, ru} }
          // if type === "whatsapp": { "sender": string, "messages": [{ "text": {be, ru} }] }
          // if type === "discord": { "server": string, "messages": [{ "from": string, "text": {be, ru} }] }
          // if type === "instagram": { "post_author": string, "caption": {be, ru} }
        },
        "options": [
          { "text": { "be": "...", "ru": "..." }, "points": number, "feedback": { "be": "...", "ru": "..." } },
          { "text": { "be": "...", "ru": "..." }, "points": number, "feedback": { "be": "...", "ru": "..." } }
        ]
      }
    ]
    
    Make the scenarios realistic, diverse, and educational about digital security in 2026.
    Return ONLY the JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error generating for ${sphere} ${difficulty}:`, error);
    return [];
  }
}

async function main() {
  const allNewScenarios = [];
  let currentId = 100;

  // We'll do a few spheres first to avoid hitting limits or taking too long
  const targetSpheres = ['phishing', 'social_engineering', 'online_games']; 
  
  for (const sphere of targetSpheres) {
    for (const difficulty of difficulties) {
      const existingCount = scenarios.filter(q => q.sphere === sphere && q.difficulty === difficulty).length;
      const needed = 10 - existingCount;
      if (needed > 0) {
        const batch = await generateBatch(sphere, difficulty, needed);
        batch.forEach(s => {
          s.id = currentId++;
          allNewScenarios.push(s);
        });
      }
    }
  }

  fs.writeFileSync('new_scenarios.json', JSON.stringify(allNewScenarios, null, 2));
  console.log(`Generated ${allNewScenarios.length} new scenarios.`);
}

main();

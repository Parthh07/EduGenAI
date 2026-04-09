require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    console.log('Testing simple text prompt...');
    const r1 = await geminiClient.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Say hello in one word.'
    });
    console.log('✅ Simple text works:', r1.text);

    console.log('\nTesting multimodal format...');
    const r2 = await geminiClient.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Say hello in one word.' }] }]
    });
    console.log('✅ Multimodal format works:', r2.text);

  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error('Stack:', e.stack);
  }
}
test();

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const models = [
    'gemini-2.5-flash-preview-04-17',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
  ];
  for (const m of models) {
    try {
      const r = await ai.models.generateContent({ model: m, contents: 'Say hi in one word' });
      console.log(m + ': OK - ' + r.text);
      return;
    } catch (e) {
      const short = e.message.substring(0, 120);
      console.log(m + ': FAIL - ' + short);
    }
  }
  console.log('\nAll models failed. Your API key may need a new Google Cloud project with billing linked.');
}

test();

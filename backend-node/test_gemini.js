require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    fs.writeFileSync('test.txt', 'Hello this is a test file.');
    const uploadResult = await ai.files.upload({
      file: 'test.txt',
      mimeType: 'text/plain'
    });
    console.log('Upload URI:', uploadResult.uri);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [
           { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } },
           { text: "What did the file say?" }
        ]
      }]
    });
    console.log('Response:', response.text);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();

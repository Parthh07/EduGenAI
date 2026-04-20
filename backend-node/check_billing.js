require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testDirect() {
  // Test v1 endpoint (paid tier)
  console.log('Testing v1 (paid tier) endpoint...');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hi' }] }] })
      }
    );
    const data = await res.json();
    if (data.candidates) {
      console.log('v1 OK:', data.candidates[0].content.parts[0].text);
    } else {
      console.log('v1 FAIL:', JSON.stringify(data.error).substring(0, 200));
    }
  } catch (e) {
    console.log('v1 ERROR:', e.message);
  }

  // Test v1beta endpoint (free tier)
  console.log('\nTesting v1beta (free tier) endpoint...');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hi' }] }] })
      }
    );
    const data = await res.json();
    if (data.candidates) {
      console.log('v1beta OK:', data.candidates[0].content.parts[0].text);
    } else {
      console.log('v1beta FAIL:', JSON.stringify(data.error).substring(0, 200));
    }
  } catch (e) {
    console.log('v1beta ERROR:', e.message);
  }
}

testDirect();

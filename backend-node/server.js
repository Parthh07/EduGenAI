require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');
const { sequelize, User, Exam, ChatSession } = require('./models');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// ── JWT Middleware ─────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET_KEY);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── AI Clients ─────────────────────────────────────────────────────────────────
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

// ── PDF Helper ─────────────────────────────────────────────────────────────────
async function extractTextFromFiles(files) {
  let text = '';
  for (const file of files) {
    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      throw new Error(`'${file.originalname}' is not a valid PDF.`);
    }
    const data = await pdfParse(file.buffer);
    text += `\n--- ${file.originalname} ---\n${data.text}`;
  }
  if (!text.trim()) throw new Error('No readable text found in the uploaded PDFs.');
  return text;
}

// ── AUTH ROUTES ────────────────────────────────────────────────────────────────
app.post('/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing required fields' });

    // Check both email AND username uniqueness
    if (await User.findOne({ where: { email } })) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    if (await User.findOne({ where: { username } })) {
      return res.status(400).json({ error: 'This username is already taken. Please choose another.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await User.create({ username, email, password_hash });
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (e) {
    // Catch database-level unique constraint violations as a safety net
    if (e.name === 'SequelizeUniqueConstraintError') {
      const field = e.errors[0]?.path;
      return res.status(400).json({ error: `This ${field} is already in use. Please use a different one.` });
    }
    res.status(500).json({ error: e.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const access_token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: '30d' });
    res.json({ access_token, username: user.username, email: user.email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── STUDY MODE: /generate ──────────────────────────────────────────────────────
app.post('/generate', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const marks = req.body.marks || '2';
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const text = await extractTextFromFiles(req.files);
    const prompt = `Context: ${text}\n\nTask: Based on the text, generate a ${marks}-mark question, a detailed corresponding answer, and the exact sources (e.g., 'Page 3', 'Section 2.1'). Return STRICTLY a valid JSON object with keys: 'question' (string), 'answer' (string), and 'sources' (string). Do not wrap the JSON in markdown blocks.`;

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    let respText = response.text.trim();
    if (respText.startsWith('```json')) respText = respText.slice(7);
    if (respText.startsWith('```')) respText = respText.slice(3);
    if (respText.endsWith('```')) respText = respText.slice(0, -3);

    res.json(JSON.parse(respText.trim()));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── EXAM MODE: /generate-exam ──────────────────────────────────────────────────
app.post('/generate-exam', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const examType = req.body.examType || 'MCQ';
    const qCount = req.body.questionCount || '5';
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const text = await extractTextFromFiles(req.files);

    let prompt;
    if (examType.toUpperCase() === 'MCQ') {
      prompt = `Context:\n${text}\n\nTask: Generate exactly ${qCount} multiple choice questions from this text. Return ONLY a valid JSON array where each object has: 'question' (string), 'options' (array of 4 strings), 'answer' (string, must exactly match one option), 'explanation' (string). Do not use markdown.`;
    } else {
      prompt = `Context:\n${text}\n\nTask: Generate exactly ${qCount} short answer questions from this text. Return ONLY a valid JSON array where each object has: 'question' (string), 'answer' (string), 'explanation' (string). Do not use markdown.`;
    }

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    let respText = response.text.trim();
    if (respText.startsWith('```json')) respText = respText.slice(7);
    if (respText.startsWith('```')) respText = respText.slice(3);
    if (respText.endsWith('```')) respText = respText.slice(0, -3);

    res.json(JSON.parse(respText.trim()));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CHAT MODE: /chat ───────────────────────────────────────────────────────────
app.post('/chat', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const { message, history, modelChoice } = req.body;
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const text = await extractTextFromFiles(req.files);
    const parsedHistory = JSON.parse(history || '[]');

    const historyText = parsedHistory
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const fullPrompt = `You are an intelligent AI tutor. Use the document context below to answer the user's question accurately.\n\nDocument Context:\n${text}\n\nConversation History:\n${historyText}\n\nUser: ${message}\n\nAssistant:`;

    let reply;
    if (modelChoice === 'NVIDIA') {
      const completion = await nvidiaClient.chat.completions.create({
        model: 'meta/llama-3.1-405b-instruct',
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 2048
      });
      reply = completion.choices[0].message.content;
    } else {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: fullPrompt
      });
      reply = response.text;
    }

    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ANALYTICS: Save & Fetch Exam Scores ───────────────────────────────────────
app.post('/api/exams/save', requireAuth, async (req, res) => {
  try {
    const { score, total_questions } = req.body;
    await Exam.create({ user_id: req.user.id, score, total_questions });
    res.json({ message: 'Exam saved successfully!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/me/exams', requireAuth, async (req, res) => {
  try {
    const exams = await Exam.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(exams);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── HEALTH CHECK ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'EduGen AI Node.js Backend Running ✅' }));

// ── BOOT ───────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ PostgreSQL connected & tables synced');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(e => {
  console.error('❌ Database connection failed:', e.message);
  process.exit(1);
});

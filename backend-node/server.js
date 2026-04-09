require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { sequelize, User, Exam, ChatSession, Flashcard } = require('./models');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const ext = file.originalname.toLowerCase();
    if (allowed.includes(file.mimetype) || ext.endsWith('.pdf') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.webp')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPG, PNG, WEBP) are supported.'));
    }
  }
});

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

// ── Gemini AI Client (single unified model) ────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function geminiGenerate(parts) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts }]
  });
  return response.text;
}

// ── File Helper ────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function buildFileParts(files) {
  if (!files || files.length === 0) throw new Error('No files uploaded.');
  return files.map(file => {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`"${file.originalname}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum 20 MB per file.`);
    }
    const ext = file.originalname.toLowerCase();
    let mimeType = file.mimetype;
    if (ext.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (ext.endsWith('.png')) mimeType = 'image/png';
    else if (ext.endsWith('.webp')) mimeType = 'image/webp';
    return { inlineData: { mimeType, data: file.buffer.toString('base64') } };
  });
}

function classifyError(err) {
  const msg = err.message || '';
  if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
    return 'The AI service is temporarily rate-limited. Please wait 60 seconds and try again.';
  }
  if (msg.includes('too large') || msg.includes('20 MB')) return msg;
  if (msg.toLowerCase().includes('safety') || msg.toLowerCase().includes('blocked') || msg.toLowerCase().includes('harm')) {
    return 'The AI flagged this content as potentially unsafe. Please try with different content.';
  }
  if (msg.toLowerCase().includes('context') || msg.toLowerCase().includes('token') || msg.toLowerCase().includes('too long')) {
    return 'The document(s) are too large for a single session. Please split into smaller files.';
  }
  if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('enotfound') || msg.toLowerCase().includes('econnrefused')) {
    return 'Could not connect to the AI service. Please check your internet connection.';
  }
  return `AI Error: ${msg}`;
}

function cleanJson(text) {
  let t = text.trim();
  if (t.startsWith('```json')) t = t.slice(7);
  if (t.startsWith('```')) t = t.slice(3);
  if (t.endsWith('```')) t = t.slice(0, -3);
  return t.trim();
}

// ── FILES ──────────────────────────────────────────────────────────────────────
app.post('/api/files/upload', requireAuth, upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files provided' });
    
    const uploadedUris = [];
    for (const file of req.files) {
      if (file.size > MAX_FILE_BYTES) throw new Error(`"${file.originalname}" is too large.`);
      
      const tempPath = path.join(os.tmpdir(), `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`);
      fs.writeFileSync(tempPath, file.buffer);
      
      let mimeType = file.mimetype;
      if (file.originalname.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
      
      const uploadResult = await ai.files.upload({
        file: tempPath,
        mimeType: mimeType
      });
      
      fs.unlinkSync(tempPath);
      uploadedUris.push({ uri: uploadResult.uri, mimeType: mimeType, name: file.originalname });
    }
    res.json({ uris: uploadedUris });
  } catch (e) {
    res.status(500).json({ error: classifyError(e) });
  }
});

// ── AUTH ───────────────────────────────────────────────────────────────────────
app.post('/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
    if (await User.findOne({ where: { email } })) return res.status(400).json({ error: 'An account with this email already exists.' });
    if (await User.findOne({ where: { username } })) return res.status(400).json({ error: 'This username is already taken.' });
    const password_hash = await bcrypt.hash(password, 10);
    await User.create({ username, email, password_hash });
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      const field = e.errors[0]?.path;
      return res.status(400).json({ error: `This ${field} is already in use.` });
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

// ── PROFILE ────────────────────────────────────────────────────────────────────
app.get('/api/me/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'username', 'email', 'createdAt'] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/me/profile', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const existing = await User.findOne({ where: { email } });
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ error: 'This email is already in use by another account.' });
    }
    await User.update({ email }, { where: { id: req.user.id } });
    res.json({ message: 'Profile updated successfully', email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── STUDY MODE ─────────────────────────────────────────────────────────────────
app.post('/generate', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const marks = req.body.marks || '2';
    const difficulty = req.body.difficulty || 'medium';
    let fileParts = [];
    if (req.files && req.files.length > 0) fileParts = buildFileParts(req.files);
    if (req.body.fileContextUris) {
      const uris = JSON.parse(req.body.fileContextUris);
      uris.forEach(u => fileParts.push({ fileData: { fileUri: u.uri, mimeType: u.mimeType } }));
    }

    const diffMap = {
      easy: 'Generate a basic, factual question suitable for a beginner.',
      medium: 'Generate a standard intermediate-level question.',
      hard: 'Generate a challenging, in-depth question that requires deep conceptual understanding and analysis.'
    };
    const diffText = diffMap[difficulty] || diffMap.medium;

    let scopeInstruction = '';
    if (marks === '10' || marks === '6') {
      scopeInstruction = `CRITICAL INSTRUCTION FOR ${marks}-MARK QUESTION: You MUST perform an integrative synthesis. Read all pages sequentially before generating. Do not isolate your focus to a single section. Your question MUST require connecting at least 3 distinct concepts drawn from the beginning, middle, and end of the document. The 'sources' string MUST explicitly cite multiple disparate page numbers spanning the length of the document to prove you have analyzed the entire context.`;
    }

    const response = await geminiGenerate([
      ...fileParts,
      { text: `You are analyzing the above document(s), which may include handwritten notes, scanned pages, or typed text. Use OCR if needed. ${scopeInstruction} ${diffText} Generate a ${marks}-mark question, a detailed answer, and the source location (e.g. "Pages 2, 12, 23"). Return STRICTLY a valid JSON object with keys: "question" (string), "answer" (string), "sources" (string). No markdown wrapping.` }
    ]);

    res.json(JSON.parse(cleanJson(response)));
  } catch (e) {
    res.status(500).json({ error: classifyError(e) });
  }
});

// ── EXAM MODE ──────────────────────────────────────────────────────────────────
app.post('/generate-exam', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const examType = req.body.examType || 'MCQ';
    const qCount = parseInt(req.body.questionCount) || 5;
    const difficulty = req.body.difficulty || 'medium';
    let fileParts = [];
    if (req.files && req.files.length > 0) fileParts = buildFileParts(req.files);
    if (req.body.fileContextUris) {
      const uris = JSON.parse(req.body.fileContextUris);
      uris.forEach(u => fileParts.push({ fileData: { fileUri: u.uri, mimeType: u.mimeType } }));
    }

    const diffMap = {
      easy: 'simple, factual questions suitable for a beginner',
      medium: 'intermediate questions requiring solid understanding',
      hard: 'challenging, advanced questions requiring deep analytical thinking'
    };
    const diffText = diffMap[difficulty] || diffMap.medium;

    const taskText = examType.toUpperCase() === 'MCQ'
      ? `Read all content carefully (use OCR on handwritten/scanned text). Generate exactly ${qCount} multiple choice questions at ${diffText} level. Return ONLY a valid JSON array — no wrapper object — where each element has: "question" (string), "options" (array of exactly 4 strings), "answer" (string that exactly matches one option), "explanation" (string explaining why the answer is correct; DO NOT state the difficulty level). No markdown.`
      : `Read all content carefully (use OCR on handwritten/scanned text). Generate exactly ${qCount} short answer questions at ${diffText} level. Return ONLY a valid JSON array — no wrapper object — where each element has: "question" (string), "answer" (string), "explanation" (string explaining the concept; DO NOT state the difficulty level). No markdown.`;

    const responseText = await geminiGenerate([...fileParts, { text: taskText }]);
    const parsed = JSON.parse(cleanJson(responseText));
    // Normalise: Gemini sometimes wraps in { questions: [...] }
    const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed);
    res.json({ questions });
  } catch (e) {
    res.status(500).json({ error: classifyError(e) });
  }
});

// ── THEORY GRADING ─────────────────────────────────────────────────────────────
app.post('/api/exams/grade-theory', requireAuth, async (req, res) => {
  try {
    const { questions, userAnswers } = req.body;
    if (!questions || !userAnswers || questions.length === 0) {
      return res.status(400).json({ error: 'Questions and answers required' });
    }

    const gradingPromises = questions.map(async (q, idx) => {
      const userAnswer = userAnswers[idx] || '';
      const prompt = `You are an expert teacher grading a student exam answer.

Question: ${q.question}
Model Answer: ${q.answer}
Student's Answer: ${userAnswer || '(no answer provided)'}

Grade the student's answer on a scale of 0–10 based on accuracy, completeness, and understanding. Return STRICTLY a valid JSON object with these keys:
- "score": integer 0–10
- "feedback": string (2-3 sentences of constructive, specific feedback)
- "modelAnswer": string (the ideal concise answer)
No markdown wrapping.`;

      try {
        const result = await geminiGenerate([{ text: prompt }]);
        return JSON.parse(cleanJson(result));
      } catch {
        return { score: 0, feedback: 'Could not auto-grade this answer. Please review manually.', modelAnswer: q.answer };
      }
    });

    const grades = await Promise.all(gradingPromises);
    const totalScore = grades.reduce((sum, g) => sum + (g.score || 0), 0);
    const maxScore = questions.length * 10;
    const percentage = Math.round((totalScore / maxScore) * 100);

    res.json({ grades, totalScore, maxScore, percentage });
  } catch (e) {
    res.status(500).json({ error: classifyError(e) });
  }
});

// ── CHAT MODE ──────────────────────────────────────────────────────────────────
app.post('/chat', requireAuth, upload.array('files'), async (req, res) => {
  try {
    const { message, history, fileContextUris } = req.body;
    let fileParts = [];
    
    // Support legacy files if sent
    if (req.files && req.files.length > 0) {
      fileParts = buildFileParts(req.files);
    }
    
    // Support File API URIs
    if (fileContextUris) {
      const uris = JSON.parse(fileContextUris);
      uris.forEach(u => {
        fileParts.push({ fileData: { fileUri: u.uri, mimeType: u.mimeType } });
      });
    }

    const parsedHistory = JSON.parse(history || '[]');

    const historyText = parsedHistory
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const systemText = `You are an intelligent AI tutor. The user has uploaded document(s) which may include handwritten notes, scanned pages, or typed text — use your vision and OCR capabilities to read all content carefully. Answer the user's question based strictly on the document content.\n\nConversation History:\n${historyText}\n\nUser Question: ${message}\n\nProvide a clear, detailed answer:`;

    const reply = await geminiGenerate([...fileParts, { text: systemText }]);
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: classifyError(e) });
  }
});

// ── CHAT SESSIONS ──────────────────────────────────────────────────────────────
app.get('/api/chat/sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await ChatSession.findAll({
      where: { user_id: req.user.id },
      order: [['updatedAt', 'DESC']]
    });
    res.json(sessions.map(s => ({
      id: s.id,
      title: s.title,
      messages: JSON.parse(s.history_json),
      date: s.updatedAt
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/chat/sessions', requireAuth, async (req, res) => {
  try {
    const { id, title, messages } = req.body;
    if (!id || !title || !messages) return res.status(400).json({ error: 'Missing session data' });
    await ChatSession.upsert({
      id,
      user_id: req.user.id,
      title: title.substring(0, 255),
      history_json: JSON.stringify(messages)
    });
    res.json({ message: 'Session saved' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/chat/sessions/clear', requireAuth, async (req, res) => {
  try {
    await ChatSession.destroy({ where: { user_id: req.user.id } });
    res.json({ message: 'All sessions cleared' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/chat/sessions/:id', requireAuth, async (req, res) => {
  try {
    await ChatSession.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ message: 'Session deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── EXAM ANALYTICS ─────────────────────────────────────────────────────────────
app.post('/api/exams/save', requireAuth, async (req, res) => {
  try {
    const { score, total_questions, exam_type, difficulty } = req.body;
    await Exam.create({
      user_id: req.user.id,
      score,
      total_questions,
      exam_type: exam_type || 'MCQ',
      difficulty: difficulty || 'medium'
    });
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

app.delete('/api/me/exams', requireAuth, async (req, res) => {
  try {
    await Exam.destroy({ where: { user_id: req.user.id } });
    res.json({ message: 'Exam history cleared' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── FLASHCARDS ─────────────────────────────────────────────────────────────────
app.get('/api/flashcards', requireAuth, async (req, res) => {
  try {
    const cards = await Flashcard.findAll({
      where: { user_id: req.user.id },
      order: [['next_review', 'ASC']]
    });
    res.json(cards);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/flashcards', requireAuth, async (req, res) => {
  try {
    const { question, answer, source } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Question and answer are required' });
    const card = await Flashcard.create({
      user_id: req.user.id,
      question,
      answer,
      source: source || '',
      ease_factor: 2.5,
      interval: 0,
      next_review: new Date(),
      review_count: 0
    });
    res.status(201).json(card);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/flashcards/:id', requireAuth, async (req, res) => {
  try {
    const { rating } = req.body; // 'again' | 'good' | 'easy'
    const card = await Flashcard.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!card) return res.status(404).json({ error: 'Card not found' });

    let { ease_factor, interval } = card;

    if (rating === 'again') {
      interval = 1;
      ease_factor = Math.max(ease_factor - 0.2, 1.3);
    } else if (rating === 'good') {
      interval = interval <= 1 ? 3 : Math.round(interval * ease_factor);
    } else if (rating === 'easy') {
      interval = interval <= 1 ? 7 : Math.round(interval * ease_factor * 1.3);
      ease_factor = Math.min(ease_factor + 0.15, 3.0);
    }

    const next_review = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
    await card.update({ ease_factor, interval, next_review, review_count: card.review_count + 1 });
    res.json({ message: 'Updated', next_review, interval });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/flashcards/:id', requireAuth, async (req, res) => {
  try {
    await Flashcard.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ message: 'Card deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── HEALTH ─────────────────────────────────────────────────────────────────────
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

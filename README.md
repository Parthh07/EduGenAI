# 🎓 EduGen AI - The Intelligent Learning Workspace

**EduGen AI** is a state-of-the-art, multi-modal SaaS platform designed to solve information overload for students and researchers. By leveraging advanced Retrieval-Augmented Generation (RAG) and Multi-Model LLM routing, EduGen transforms static PDFs into interactive, personalized learning experiences.

## 🌟 Core Features

- **📚 Multi-Document 1M Token Context**: Upload multiple massive textbooks. Utilizing the **Gemini File API**, documents are processed via "upload-once" caching for blazing-fast inference and reduced network payloads.
- **🚀 High-Performance LLM Architecture**: Powered by the **Google Gemini API** (`@google/genai`) for instant synthesis and robust OCR processing (including handwritten notes).
- **⏱️ Interactive Exam Engine**: Auto-generate custom sized MCQ or Theory exams with varying difficulty directly from your syllabus. Features real-time AI grading for theory answers and logical explanations for multiple choice.
- **🧠 Spaced Repetition (SRS) Flashcards**: Auto-generate flashcards from your documents, securely stored in the database with an intelligent spacing algorithm.
- **📊 Mermaid.js Flowchart Generator**: Instantly turn walls of academic text into interactive, downloadable SVG flowcharts to visualize complex workflows.
- **📈 Cloud-Synced Dashboard**: A secure analytics dashboard that securely persists all your chat sessions, flashcards, and historical exam summaries in a PostgreSQL database for full cross-device accessibility.

## 🛠️ Technology Stack

**Frontend**
- Next.js 16 & React 19 (App Router)
- Tailwind CSS v4, Framer Motion & Shadcn UI
- Lucide React & Base UI
- React-Markdown & Remark-GFM
- Mermaid.js (Client-side Visual Graphing)

**Backend**
- Node.js & Express (REST API)
- Neon Serverless Postgres & Sequelize (Database & ORM)
- Google Gemini API (via `@google/genai` & Gemini File API)
- JWT & bcryptjs (Authentication)
- Multer (File Upload Memory Handling)

## 🚀 How to Run Locally

### 1. Backend Setup (Node.js Express Server)
Navigate to the backend directory and install the Node.js dependencies:
```bash
cd backend-node
npm install
```

Create a `.env` file in the `backend-node` directory with your database URI and API keys:
```env
GEMINI_API_KEY=your_google_ai_key_here
DATABASE_URL=your_neon_postgres_uri_here
JWT_SECRET=your_jwt_secret
```

Start the Node.js API server:
```bash
npm start
```
*(Or use `npm run dev` to start with nodemon)*

### 2. Frontend Setup (Next.js Application)
Open a new terminal window, navigate to the frontend directory, and install the Node dependencies:
```bash
cd frontend
npm install
```

Start the Next.js development server:
```bash
npm run dev
```

Finally, open your browser to `http://localhost:3000` to access the EduGen workspace.

### 3. 🐳 Docker Deployment (Production)
If you prefer to run the entire stack via containerization, EduGen AI is fully Docker-ready.

Build and spin up the frontend and backend containers simultaneously using Docker Compose (if configured):
```bash
docker-compose up --build -d
```
The architecture will map the Next.js UI to `localhost:3000` and the Node.js API to `localhost:5000` (or configured port) in isolated environments.

---
*Designed & Developed by Parth*

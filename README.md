# 🎓 EduGen AI - The Intelligent Learning Workspace

**EduGen AI** is a state-of-the-art, multi-modal SaaS platform designed to solve information overload for students and researchers. By leveraging advanced Retrieval-Augmented Generation (RAG) and Multi-Model LLM routing, EduGen transforms static PDFs into interactive, personalized learning experiences.

## 🌟 Core Features

- **📚 Multi-Document 1M Token Context**: Upload multiple massive textbooks simultaneously. The backend synthesizes information across all documents with perfect recall.
- **🚀 Multi-Model LLM Architecture**: Seamlessly route complex queries between **Google Gemini 2.5 Flash** (for blazing speed) and **NVIDIA Meta Llama 3.1 405B** (for heavy analytical reasoning) using a dynamic frontend toggle.
- **⏱️ Interactive Exam Engine**: Auto-generate custom timed MCQ or Theory exams directly from your syllabus. Features real-time grading and logical AI explanations for every correct answer.
- **📊 Mermaid.js Flowchart Generator**: Instantly turn walls of academic text into interactive, downloadable SVG flowcharts to visualize complex workflows.
- **🎙️ Text-to-Speech Audio Overviews**: Convert your dense generated study guides into listenable "podcasts" for auditory learning and accessibility.
- **📈 Local Analytics Dashboard**: A privacy-first, secure dashboard that magically persists your chat sessions and historical exam scores directly in your browser.

## 🛠️ Technology Stack

**Frontend**
- Next.js (React App Router)
- Tailwind CSS v4 (with Typography plugin)
- React-Markdown & Remark-GFM
- Mermaid.js (Client-side Visual Graphing)
- Canvas Confetti 

**Backend**
- Python 3 & Flask (REST API)
- PyPDF2 (with highly-strict PDF Validation parsing)
- Google Generative AI API (Gemini 2.5 Flash)
- NVIDIA NIM API Serverless Inference (Llama 405B)

## 🚀 How to Run Locally

### 1. Backend Setup (Flask AI Server)
Navigate to the backend directory and install the Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory with your API keys:
```env
GEMINI_API_KEY=your_google_ai_key_here
NVIDIA_API_KEY=your_nvidia_nim_key_here
```

Start the Python AI server:
```bash
python app.py
```

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

---
*Designed & Developed by Parth*

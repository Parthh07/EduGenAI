import os
import PyPDF2
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import timedelta

from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from models import db, User, Exam, ChatSession

load_dotenv()
app = Flask(__name__)
CORS(app)

# SQLite Architecture Setup
# SQLite Architecture Setup (Persistent Disk Integration for Production)
disk_dir = os.getenv('RENDER_DISK_MOUNT_PATH')
if disk_dir:
    # Production: Store DB on Render's NVMe SSD Persistent Disk
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(disk_dir, "edugen.db")}'
else:
    # Local Development
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///edugen.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-edugen-ai-3000')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

db.init_app(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

with app.app_context():
    db.create_all()

# Authentication Architecture
@app.route('/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
        
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], email=data['email'], password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully!"}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing credentials"}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
        return jsonify({"error": "Invalid email or password"}), 401
        
    # Generate stateless JWT security token
    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token, "username": user.username, "email": user.email}), 200

# AI Configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

@app.route('/generate', methods=['POST'])
@jwt_required()
def generate():
    try:
        files = request.files.getlist('files')
        marks = request.form.get('marks', '2')
        
        if not files or len(files) == 0:
            return jsonify({"error": "No files uploaded"}), 400

        text = ""
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                return jsonify({"error": f"'{file.filename}' is not a valid PDF. Please upload only PDF files."}), 400
            try:
                reader = PyPDF2.PdfReader(file)
            except Exception:
                return jsonify({"error": f"Failed to read '{file.filename}'. It may be corrupted or password-protected."}), 400
                
            for i, page in enumerate(reader.pages):
                text += f"\n--- {file.filename} Page {i+1} ---\n"
                try:
                    text += page.extract_text() or ""
                except:
                    pass

        if not text.strip():
            return jsonify({"error": "No readable text found in the uploaded PDFs. Please ensure they are not image-only PDFs."}), 400

        prompt = f"Context: {text}\n\nTask: Based on the text, generate a {marks}-mark question, a detailed corresponding answer, and the exact sources (e.g., 'Page 3', 'Section 2.1'). Return STRICTLY a valid JSON object with keys: 'question' (string), 'answer' (string), and 'sources' (string). Do not wrap the JSON in markdown blocks."
        response = model.generate_content(prompt)
        
        import json
        resp_text = response.text.strip()
        if resp_text.startswith("```json"): resp_text = resp_text[7:]
        if resp_text.startswith("```"): resp_text = resp_text[3:]
        if resp_text.endswith("```"): resp_text = resp_text[:-3]
        
        # Parse AI JSON and return
        data = json.loads(resp_text)
        return jsonify(data)
    except Exception as e:
        import traceback
        with open("error.log", "w") as err_file:
            err_file.write(traceback.format_exc())
        print(f"Server Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate-exam', methods=['POST'])
@jwt_required()
def generate_exam():
    try:
        files = request.files.getlist('files')
        exam_type = request.form.get('examType', 'MCQ')
        q_count = request.form.get('questionCount', '5')
        
        if not files or len(files) == 0:
            return jsonify({"error": "No files uploaded"}), 400

        text = ""
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                return jsonify({"error": f"'{file.filename}' is not a valid PDF. Please upload only PDF files."}), 400
            try:
                reader = PyPDF2.PdfReader(file)
            except Exception:
                return jsonify({"error": f"Failed to read '{file.filename}'. It may be corrupted or password-protected."}), 400
                
            for i, page in enumerate(reader.pages):
                text += f"\n--- {file.filename} Page {i+1} ---\n"
                try:
                    text += page.extract_text() or ""
                except:
                    pass

        if not text.strip():
            return jsonify({"error": "No readable text found in the uploaded PDFs. Please ensure they are not image-only PDFs."}), 400

        if exam_type.upper() == 'MCQ':
            prompt = f"Context: {text}\n\nTask: Create a {q_count}-question Multiple Choice test. Return strictly a JSON array of objects with keys: 'question', 'options' (array of 4 strings), 'answer' (exact match to correct option string), and 'explanation' (a 1-sentence explanation of why the answer is correct based on the text). Do not include any Markdown formatting."
        else:
            prompt = f"Context: {text}\n\nTask: Create a {q_count}-question Theory test. Return strictly a JSON array of objects with key: 'question'. Do not include any Markdown formatting."
            
        response = model.generate_content(prompt)
        import json
        
        resp_text = response.text.strip()
        if resp_text.startswith("```json"):
            resp_text = resp_text[7:]
        if resp_text.startswith("```"):
            resp_text = resp_text[3:]
        if resp_text.endswith("```"):
            resp_text = resp_text[:-3]
            
        questions = json.loads(resp_text)
        return jsonify({"questions": questions})
    except Exception as e:
        import traceback
        with open("error.log", "w") as err_file:
            err_file.write(traceback.format_exc())
        print(f"Server Error in Exam: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/exams/save', methods=['POST'])
@jwt_required()
def save_exam():
    data = request.get_json()
    if not data or data.get('score') is None or data.get('total') is None:
        return jsonify({"error": "Missing exam data"}), 400
    try:
        new_exam = Exam(user_id=int(get_jwt_identity()), score=data['score'], total_questions=data['total'])
        db.session.add(new_exam)
        db.session.commit()
        return jsonify({"message": "Exam saved securely"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/me/exams', methods=['GET'])
@jwt_required()
def get_my_exams():
    exams = Exam.query.filter_by(user_id=int(get_jwt_identity())).order_by(Exam.created_at.desc()).all()
    return jsonify({"exams": [{"score": e.score, "total": e.total_questions, "date": e.created_at.isoformat()} for e in exams]}), 200

@app.route('/api/me/chats', methods=['GET'])
@jwt_required()
def get_my_chats():
    chats = ChatSession.query.filter_by(user_id=int(get_jwt_identity())).order_by(ChatSession.created_at.desc()).all()
    return jsonify({"chats": [{"id": c.id, "title": c.title, "date": c.created_at.isoformat()} for c in chats]}), 200

@app.route('/chat', methods=['POST'])
@jwt_required()
def chat_document():
    try:
        files = request.files.getlist('files')
        message = request.form.get('message', '')
        history_str = request.form.get('history', '[]')
        
        if not files or len(files) == 0:
            return jsonify({"error": "No files uploaded"}), 400
        if not message:
            return jsonify({"error": "Message is empty"}), 400

        text = ""
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                return jsonify({"error": f"'{file.filename}' is not a valid PDF. Please upload only PDF files."}), 400
            try:
                reader = PyPDF2.PdfReader(file)
            except Exception:
                return jsonify({"error": f"Failed to read '{file.filename}'. It may be corrupted or password-protected."}), 400
                
            for i, page in enumerate(reader.pages):
                text += f"\n--- {file.filename} Page {i+1} ---\n"
                try:
                    text += page.extract_text() or ""
                except:
                    pass

        if not text.strip():
            return jsonify({"error": "No readable text found in the uploaded PDFs. Please ensure they are not image-only PDFs."}), 400

        # We construct a stateless prompt for simplicity, mapping previous history into it
        import json
        try:
            history = json.loads(history_str)
        except:
            history = []
            
        history_context = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in history])
        
        system_instruction = "You are a highly-intelligent, conversational research assistant. Your goal is to answer the user's questions utilizing the entire Context Material provided. Cross-reference thoroughly. Keep answers direct and conversational. Use Markdown strictly. Do NOT output giant walls of text unless asked."
        
        full_prompt = f"Context Material:\n{text}\n\nPast Conversation:\n{history_context}\n\n{system_instruction}\n\nUser: {message}\nAI:"
        model_choice = request.form.get('modelChoice', 'GEMINI')
        reply = ""
        
        if model_choice == 'NVIDIA':
            nvidia_api_key = os.getenv('NVIDIA_API_KEY')
            if not nvidia_api_key:
                return jsonify({"error": "NVIDIA API Key is missing. Please add NVIDIA_API_KEY to your backend .env file to use the Llama 405B model."}), 400
            
            import requests
            headers = {
                "Authorization": f"Bearer {nvidia_api_key}",
                "Content-Type": "application/json"
            }
            # Limit context for Llama 3.1
            safe_text_for_nvidia = full_prompt[:300000]
            
            payload = {
                "model": "meta/llama-3.1-405b-instruct",
                "messages": [{"role": "user", "content": safe_text_for_nvidia}],
                "max_tokens": 1024,
                "temperature": 0.2
            }
            res = requests.post("https://integrate.api.nvidia.com/v1/chat/completions", headers=headers, json=payload)
            if res.status_code == 200:
                reply = res.json()['choices'][0]['message']['content']
            else:
                return jsonify({"error": f"NVIDIA API Error: {res.text}"}), 500
        else:
            # Default to Gemini 2.5 Flash
            response = model.generate_content(full_prompt)
            reply = response.text
            
        # Secure Database Persistence
        session_id = request.form.get('sessionId')
        if not session_id:
            import uuid
            session_id = str(uuid.uuid4())
            
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": reply})
        
        from models import ChatSession, db
        chat_record = ChatSession.query.filter_by(id=session_id).first()
        title = files[0].filename if files else "General Analytics"
        if not chat_record:
            chat_record = ChatSession(id=session_id, user_id=int(get_jwt_identity()), title=title[:250], history_json=json.dumps(history))
            db.session.add(chat_record)
        else:
            chat_record.history_json = json.dumps(history)
            
        db.session.commit()
            
        return jsonify({"reply": reply, "sessionId": session_id})
    except Exception as e:
        import traceback
        with open("error.log", "w") as err_file:
            err_file.write(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
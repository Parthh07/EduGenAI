import os
import PyPDF2
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

@app.route('/generate', methods=['POST'])
def generate():
    try:
        file = request.files.get('file')
        marks = request.form.get('marks', '2')
        
        # 1. Extract text from the PDF file
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()

        # 2. Create the prompt with context
        prompt = f"Context: {text[:3000]}\n\nTask: Generate one {marks}-mark academic question and a detailed answer based on the text."
        
        response = model.generate_content(prompt)
        
        # 3. Return keys that match the frontend result object
        return jsonify({
            "question": f"Generated {marks}-Mark Question",
            "answer": response.text
        })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
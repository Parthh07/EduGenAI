// --- UI LOGIC ---
function showSection(id, element) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    if(element) {
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
        element.classList.add('active');
    }
}

function updateQuizControls() {
    const type = document.getElementById('quizType').value;
    if(type === 'theory') {
        document.getElementById('theoryControls').style.display = 'block';
        document.getElementById('mcqControls').style.display = 'none';
    } else {
        document.getElementById('theoryControls').style.display = 'none';
        document.getElementById('mcqControls').style.display = 'block';
    }
}

function toggleAnswers() {
    const isChecked = document.getElementById('solvedToggle').checked;
    const answers = document.querySelectorAll('.answer-key');
    answers.forEach(el => {
        el.style.display = isChecked ? 'block' : 'none';
    });
}

function toggleUploadMode(mode) {
    const fileDiv = document.getElementById('file-mode');
    const textDiv = document.getElementById('text-mode');
    if(mode === 'file') {
        fileDiv.style.display = 'block'; textDiv.style.display = 'none';
        document.getElementById('btn-file').classList.add('active');
        document.getElementById('btn-text').classList.remove('active');
    } else {
        fileDiv.style.display = 'none'; textDiv.style.display = 'block';
        document.getElementById('btn-file').classList.remove('active');
        document.getElementById('btn-text').classList.add('active');
    }
}

function handleFileSelect(input) {
    if(input.files.length > 0) {
        document.getElementById('fileName').innerHTML = `<span class="badge bg-white text-dark px-3 py-2">${input.files[0].name}</span>`;
    }
}

const toggleLoader = (show) => {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}

async function copyToClipboard(id) {
    try { await navigator.clipboard.writeText(document.getElementById(id).innerText); alert("Copied!"); } 
    catch(e) { alert("Failed copy"); }
}

// --- API CALLS ---
async function uploadDoc() {
    const fileInput = document.getElementById('docFile');
    if(fileInput.files.length === 0) return alert("Select file.");
    const formData = new FormData(); formData.append('file', fileInput.files[0]);
    toggleLoader(true);
    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        toggleLoader(false);
        if(res.ok) {
            alert("File Ready! Redirecting to Notes...");
            showSection('notesSection', document.querySelectorAll('.nav-link')[1]); // Auto Redirect
        } else alert("Error");
    } catch(e) { toggleLoader(false); alert("Server Error"); }
}

async function uploadRawText() {
    const text = document.getElementById('rawText').value;
    toggleLoader(true);
    try {
        const res = await fetch('/upload_text', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text})});
        toggleLoader(false);
        if(res.ok) {
            alert("Text Ready! Redirecting to Notes...");
            showSection('notesSection', document.querySelectorAll('.nav-link')[1]); // Auto Redirect
        }
    } catch(e){ toggleLoader(false); }
}

async function generateNotes() {
    toggleLoader(true);
    const map = { "1": "Brief", "2": "Standard", "3": "Detailed" };
    const val = document.getElementById('detailSlider').value;
    
    try {
        const res = await fetch('/generate_notes', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({length:map[val]})});
        const data = await res.json();
        toggleLoader(false);
        document.getElementById('notesContent').innerHTML = `<div style="line-height:1.8">${data.content}</div>`;
        
        // Auto Scroll to Content
        document.getElementById('notesContent').scrollIntoView({behavior: "smooth"});
    } catch(e){ toggleLoader(false); }
}

async function generateQuiz() {
    toggleLoader(true);
    const type = document.getElementById('quizType').value;
    const diff = document.getElementById('difficultySelector').value;
    const marks = document.getElementById('marksCategory').value;
    
    try {
        const res = await fetch('/generate_quiz', { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body:JSON.stringify({type, difficulty:diff, marks})
        });
        const data = await res.json();
        toggleLoader(false);
        
        if(data.error) return alert(data.error);
        const questions = JSON.parse(data.content);
        let html = '';
        const showAnswerStyle = document.getElementById('solvedToggle').checked ? 'block' : 'none';

        if(type === 'mcq') {
            questions.forEach((q, i) => {
                html += `
                <div class="col-md-6 mb-4">
                    <div class="art-card p-4 h-100" style="background:rgba(255,255,255,0.02)">
                        <h5 class="fw-bold mb-3">Q${i+1}. ${q.question}</h5>
                        <ul class="list-unstyled mb-3 text-white-50">
                            ${q.options.map(o => `<li class="mb-2 p-2 border border-secondary rounded">${o}</li>`).join('')}
                        </ul>
                        <div class="answer-key text-end text-success fw-bold" style="display:${showAnswerStyle}">✅ Answer: ${q.answer}</div>
                    </div>
                </div>`;
            });
        } else {
            // THEORY RENDER
            questions.forEach((q, i) => {
                html += `
                <div class="col-12 mb-4">
                    <div class="art-card p-4" style="background:rgba(255,255,255,0.02)">
                        <div class="d-flex justify-content-between">
                            <h5 class="fw-bold mb-3">Q${i+1}. ${q.question}</h5>
                            <span class="badge bg-warning text-dark h-50">${marks} Marks</span>
                        </div>
                        <div class="answer-key mt-3 p-3 rounded bg-dark border border-success" style="display:${showAnswerStyle}">
                            <strong class="text-success">Model Answer:</strong><br>
                            <p class="text-white-50 m-0">${q.answer}</p>
                        </div>
                    </div>
                </div>`;
            });
        }
        document.getElementById('quizContent').innerHTML = html;
        document.getElementById('quizContent').scrollIntoView({behavior: "smooth"}); // Auto Scroll

    } catch(e){ toggleLoader(false); }
}
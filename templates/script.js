function showSection(id, element) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');
}

function handleFileSelect(input) {
    const fileName = document.getElementById('fileName');
    if(input.files.length > 0) {
        let icon = 'fa-file';
        const name = input.files[0].name.toLowerCase();
        if(name.endsWith('.pdf')) icon = 'fa-file-pdf';
        else if(name.endsWith('.docx')) icon = 'fa-file-word';
        else if(name.endsWith('.pptx')) icon = 'fa-file-powerpoint';
        else if(name.endsWith('.txt')) icon = 'fa-file-lines';

        fileName.innerHTML = `<span class="badge rounded-pill bg-white text-dark px-3 py-2">
        <i class="fa-solid ${icon}"></i> ${input.files[0].name}</span>`;
    }
}

const toggleLoader = (show) => {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}

async function uploadDoc() {
    const fileInput = document.getElementById('docFile');
    if(fileInput.files.length === 0) return alert("Select a document first.");

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    toggleLoader(true);
    
    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();
        toggleLoader(false);
        
        if(res.ok) {
            document.getElementById('uploadStatus').innerHTML = `<p class="text-success mt-3">Ready.</p>`;
            setTimeout(() => showSection('notesSection', document.querySelectorAll('.nav-link')[1]), 1000);
        } else {
            alert(data.error);
        }
    } catch(err) {
        toggleLoader(false);
        alert("Server Error.");
    }
}

async function generateNotes() {
    toggleLoader(true);
    const sliderVal = document.getElementById('detailSlider').value;
    const map = { "1": "Brief", "2": "Standard", "3": "Detailed" };
    
    try {
        const res = await fetch('/generate_notes', { 
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ length: map[sliderVal] }) 
        });
        
        const data = await res.json();
        toggleLoader(false);
        
        const content = document.getElementById('notesContent');
        if(data.error) content.innerHTML = `<p class="text-danger">${data.error}</p>`;
        else content.innerHTML = `<div style="line-height:1.8">${data.content}</div>`;
    } catch(err) { toggleLoader(false); }
}

async function generateQuiz() {
    toggleLoader(true);
    const difficultyVal = document.getElementById('difficultySelector').value;

    try {
        const res = await fetch('/generate_quiz', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ difficulty: difficultyVal }) 
        });
        
        const data = await res.json();
        toggleLoader(false);
        
        if(data.error) return alert(data.error);
        
        const questions = JSON.parse(data.content);
        let html = '';
        questions.forEach((q, i) => {
            html += `
            <div class="col-md-6 mb-4">
                <div class="art-card p-4 h-100" style="background:rgba(255,255,255,0.02)">
                    <div class="d-flex justify-content-between mb-3">
                        <h5 class="fw-bold">0${i+1}. ${q.question}</h5>
                        <span class="badge bg-secondary h-50">${difficultyVal}</span>
                    </div>
                    <ul class="list-unstyled mb-3 text-white-50">
                        ${q.options.map(o => `<li class="mb-2 p-2 border border-secondary rounded">${o}</li>`).join('')}
                    </ul>
                    <div class="text-end text-success"><small>Ans: ${q.answer}</small></div>
                </div>
            </div>`;
        });
        document.getElementById('quizContent').innerHTML = html;
    } catch(err) { toggleLoader(false); }
}
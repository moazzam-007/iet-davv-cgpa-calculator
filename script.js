// Grade Points mapping
const gradePoints = {
    'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'P': 4, 'F': 0, 'Ab': 0, 'N/A': 0
};

// Default Approximate Syllabus (Tentative Theory Only)
const defaultSyllabus = {
    1: [
        { name: "Applied Mathematics-I", credits: 4 },
        { name: "Applied Physics", credits: 4 },
        { name: "Communication Skills", credits: 3 },
        { name: "Basic Mechanical Engg", credits: 4 },
        { name: "Basic Civil Engg & Mech", credits: 4 },
        { name: "Subject 6", credits: 3 }
    ],
    2: [
        { name: "Applied Mathematics-II", credits: 4 },
        { name: "Applied Chemistry", credits: 4 },
        { name: "Computer Programming", credits: 3 },
        { name: "Basic Electrical Engg", credits: 4 },
        { name: "Engineering Graphics", credits: 3 },
        { name: "Subject 6", credits: 3 }
    ],
    3: [
        { name: "Applied Mathematics-III", credits: 3 },
        { name: "Digital Electronics", credits: 4 },
        { name: "Analog Electronics", credits: 4 },
        { name: "Data Structure", credits: 4 },
        { name: "Signal and System Analysis", credits: 3 },
        { name: "Intro to Indian Knowledge System", credits: 2 }
    ],
    4: [
        { name: "Computer Architecture & Digital Design", credits: 3 },
        { name: "EMF and Transmission Line", credits: 4 },
        { name: "Linear Devices and Applications", credits: 4 },
        { name: "Analog Communication", credits: 4 },
        { name: "Digital Signal Processing", credits: 3 },
        { name: "Engineering Economics", credits: 2 }
    ],
    5: [
        { name: "Object Oriented Programming", credits: 4 },
        { name: "Digital Communication", credits: 4 },
        { name: "Microcontrollers", credits: 4 },
        { name: "Programme Elective", credits: 4 },
        { name: "Computer Networks", credits: 4 },
        { name: "Principles of Management", credits: 2 }
    ],
    6: [
        { name: "Mobile and Wireless Communication", credits: 4 },
        { name: "Internet of Things", credits: 4 },
        { name: "SOC Design using HDL", credits: 4 },
        { name: "Programme Elective", credits: 4 },
        { name: "Control System", credits: 4 },
        { name: "Entrepreneurship and IPR Dev", credits: 2 }
    ],
    7: [
        { name: "Operating System", credits: 4 },
        { name: "RF and Microwave Engg.", credits: 4 },
        { name: "Antenna and Wave Propogation", credits: 4 },
        { name: "Programme Elective", credits: 4 },
        { name: "Subject 5", credits: 3 },
        { name: "Subject 6", credits: 3 }
    ],
    8: [
        { name: "Programme Elective", credits: 4 },
        { name: "Programme Elective", credits: 4 },
        { name: "Subject 3", credits: 4 },
        { name: "Subject 4", credits: 4 },
        { name: "Subject 5", credits: 3 },
        { name: "Subject 6", credits: 3 }
    ]
};

// DOM Elements
const modeSelect = document.getElementById('calc-mode');
const semesterSelectGroup = document.getElementById('semester-select-group');
const semesterSelect = document.getElementById('semester');
const themeToggleBtn = document.getElementById('theme-toggle');
const sgpaSection = document.getElementById('sgpa-section');
const cgpaSection = document.getElementById('cgpa-section');
const subjectsContainer = document.getElementById('subjects-container');
const cgpaInputsContainer = document.getElementById('cgpa-inputs-container');
const calculateBtn = document.getElementById('calculate-btn');
const resetBtn = document.getElementById('reset-btn');
const resultBox = document.getElementById('result-box');
const resultTitle = document.getElementById('result-title');
const resultValue = document.getElementById('result-value');
const resultPercent = document.getElementById('result-percent');
const saveCgpaBtn = document.getElementById('save-cgpa-btn');

let currentSGPA = 0;
let currentTotalCredits = 0;

// Initialize
function init() {
    loadState();
    handleModeChange();
    
    // Event Listeners
    modeSelect.addEventListener('change', () => {
        handleModeChange();
        saveState();
    });
    
    semesterSelect.addEventListener('change', (e) => {
        renderSubjects(e.target.value);
        saveState();
    });
    
    calculateBtn.addEventListener('click', calculateResult);
    themeToggleBtn.addEventListener('click', toggleTheme);
    resetBtn.addEventListener('click', resetAll);
    saveCgpaBtn.addEventListener('click', saveToCgpaTable);
}

// Persist Data (localStorage)
function saveState() {
    const data = {
        theme: document.body.classList.contains('light-theme'),
        mode: modeSelect.value,
        semester: semesterSelect.value,
        subjects: {},
        cgpaData: {}
    };
    
    // Save current subject inputs
    for (let i = 1; i <= 8; i++) {
        data.subjects[i] = [];
        const container = (i == semesterSelect.value && modeSelect.value === 'sgpa') 
            ? subjectsContainer 
            : null;
            
        const rows = container ? container.querySelectorAll('.subject-row') : [];
        if (rows.length > 0) {
            rows.forEach(row => {
                const inputs = row.querySelectorAll('input, select');
                data.subjects[i].push({
                    name: inputs[0].value,
                    credits: inputs[1].value,
                    grade: inputs[2].value
                });
            });
        }
    }

    // Save CGPA inputs
    for (let i = 1; i <= 8; i++) {
        const sgpaInput = document.getElementById(`sem${i}-sgpa`);
        const creditInput = document.getElementById(`sem${i}-credits`);
        if (sgpaInput && creditInput) {
            data.cgpaData[i] = {
                sgpa: sgpaInput.value,
                credits: creditInput.value
            };
        }
    }

    localStorage.setItem('cgpaCalcState', JSON.stringify(data));
}

function loadState() {
    const saved = JSON.parse(localStorage.getItem('cgpaCalcState') || '{}');
    
    if (saved.theme) document.body.classList.add('light-theme');
    if (saved.mode) modeSelect.value = saved.mode;
    if (saved.semester) semesterSelect.value = saved.semester;
    
    window.savedData = saved;
    renderCgpaInputs(); 
    renderSubjects(semesterSelect.value);
}

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    saveState();
}

// Reset All
function resetAll() {
    if(confirm("Reset all data and clear storage?")) {
        localStorage.removeItem('cgpaCalcState');
        window.savedData = {};
        document.body.classList.remove('light-theme');
        modeSelect.value = 'sgpa';
        semesterSelect.value = '1';
        
        resultBox.style.display = 'none';
        
        handleModeChange();
        renderSubjects('1');
        renderCgpaInputs();
    }
}

// Handle Mode Toggle
function handleModeChange() {
    const isSgpa = modeSelect.value === 'sgpa';
    sgpaSection.style.display = isSgpa ? 'block' : 'none';
    cgpaSection.style.display = isSgpa ? 'none' : 'block';
    semesterSelectGroup.style.display = isSgpa ? 'flex' : 'none';
    resultBox.style.display = 'none';
}

// Render Subjects for SGPA
function renderSubjects(semester) {
    subjectsContainer.innerHTML = '';
    
    let subjectsList = defaultSyllabus[semester];
    
    // Load from state if exists
    if (window.savedData && window.savedData.subjects && window.savedData.subjects[semester] && window.savedData.subjects[semester].length > 0) {
        subjectsList = window.savedData.subjects[semester];
    }

    subjectsList.forEach((subject, index) => {
        const row = document.createElement('div');
        row.className = 'subject-row';
        
        // Subject Name Input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = subject.name;
        nameInput.ariaLabel = `Subject ${index + 1} Name`;
        nameInput.addEventListener('input', saveState);

        // Credits Input
        const creditsInput = document.createElement('input');
        creditsInput.type = 'number';
        creditsInput.inputMode = 'numeric';
        creditsInput.value = subject.credits;
        creditsInput.min = '0';
        creditsInput.max = '20';
        creditsInput.ariaLabel = `Subject ${index + 1} Credits`;
        creditsInput.addEventListener('input', saveState);

        const creditsWrap = document.createElement('div');
        creditsWrap.className = 'mobile-input-wrap';
        const creditsLabel = document.createElement('label');
        creditsLabel.textContent = 'Credits';
        creditsWrap.appendChild(creditsLabel);
        creditsWrap.appendChild(creditsInput);

        // Grade Select
        const gradeSelect = document.createElement('select');
        gradeSelect.ariaLabel = `Subject ${index + 1} Grade`;
        Object.keys(gradePoints).forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            if (subject.grade && subject.grade === grade) {
                option.selected = true;
            } else if (!subject.grade && grade === 'N/A') {
                option.selected = true;
            }
            gradeSelect.appendChild(option);
        });
        gradeSelect.addEventListener('change', saveState);

        const gradeWrap = document.createElement('div');
        gradeWrap.className = 'mobile-input-wrap';
        const gradeLabel = document.createElement('label');
        gradeLabel.textContent = 'Grade';
        gradeWrap.appendChild(gradeLabel);
        gradeWrap.appendChild(gradeSelect);

        row.appendChild(nameInput);
        row.appendChild(creditsWrap);
        row.appendChild(gradeWrap);
        
        subjectsContainer.appendChild(row);
    });
}

// Render Inputs for CGPA
function renderCgpaInputs() {
    cgpaInputsContainer.innerHTML = '';
    
    for (let i = 1; i <= 8; i++) {
        const row = document.createElement('div');
        row.className = 'cgpa-row';
        
        const label = document.createElement('label');
        label.textContent = `Semester ${i}`;
        
        const inputsDiv = document.createElement('div');
        inputsDiv.className = 'cgpa-inputs';
        
        const sgpaInput = document.createElement('input');
        sgpaInput.type = 'number';
        sgpaInput.inputMode = 'decimal';
        sgpaInput.id = `sem${i}-sgpa`;
        sgpaInput.placeholder = 'SGPA (e.g. 8.5)';
        sgpaInput.step = '0.01';
        sgpaInput.min = '0';
        sgpaInput.max = '10';
        sgpaInput.ariaLabel = `Semester ${i} SGPA`;
        sgpaInput.addEventListener('input', saveState);
        
        const creditsInput = document.createElement('input');
        creditsInput.type = 'number';
        creditsInput.inputMode = 'numeric';
        creditsInput.id = `sem${i}-credits`;
        creditsInput.placeholder = 'Credits (e.g. 22)';
        creditsInput.min = '0';
        creditsInput.ariaLabel = `Semester ${i} Credits`;
        creditsInput.addEventListener('input', saveState);
        
        if (window.savedData && window.savedData.cgpaData && window.savedData.cgpaData[i]) {
            sgpaInput.value = window.savedData.cgpaData[i].sgpa || '';
            creditsInput.value = window.savedData.cgpaData[i].credits || '';
        }

        inputsDiv.appendChild(sgpaInput);
        inputsDiv.appendChild(creditsInput);
        
        row.appendChild(label);
        row.appendChild(inputsDiv);
        cgpaInputsContainer.appendChild(row);
    }
}

// Save SGPA to CGPA Table
function saveToCgpaTable() {
    const currentSem = semesterSelect.value;
    const sgpaInput = document.getElementById(`sem${currentSem}-sgpa`);
    const creditInput = document.getElementById(`sem${currentSem}-credits`);
    
    if (sgpaInput && creditInput) {
        sgpaInput.value = currentSGPA;
        creditInput.value = currentTotalCredits;
        saveState();
        
        // Show subtle feedback
        const originalText = saveCgpaBtn.textContent;
        saveCgpaBtn.textContent = 'Saved! ✓';
        setTimeout(() => { saveCgpaBtn.textContent = originalText; }, 2000);
    }
}

// Calculate Result
function calculateResult() {
    if (modeSelect.value === 'sgpa') {
        calculateSGPA();
    } else {
        calculateCGPA();
    }
}

function calculateSGPA() {
    const rows = subjectsContainer.querySelectorAll('.subject-row');
    let totalCredits = 0;
    let totalPoints = 0;
    let isValid = true;

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input, select');
        const credits = parseFloat(inputs[1].value) || 0;
        const grade = inputs[2].value;

        if (grade !== 'N/A') {
            if (credits === 0) {
                alert(`Error: Credit cannot be 0 if a grade is selected (Subject: ${inputs[0].value}).`);
                isValid = false;
                return;
            }
            totalCredits += credits;
            totalPoints += credits * gradePoints[grade];
        }
    });

    if (!isValid) return;

    if (totalCredits === 0) {
        alert("Please enter credits and grades for at least one subject.");
        return;
    }

    const sgpa = (totalPoints / totalCredits).toFixed(2);
    const percentage = ((sgpa - 0.5) * 10).toFixed(2);

    currentSGPA = sgpa;
    currentTotalCredits = totalCredits;

    showResult('SGPA', sgpa, percentage);
    saveCgpaBtn.style.display = 'inline-block'; // Show sync button
}

function calculateCGPA() {
    let totalCredits = 0;
    let totalPoints = 0;

    for (let i = 1; i <= 8; i++) {
        const sgpa = parseFloat(document.getElementById(`sem${i}-sgpa`).value);
        const credits = parseFloat(document.getElementById(`sem${i}-credits`).value);

        if (!isNaN(sgpa) && !isNaN(credits) && credits > 0) {
            totalCredits += credits;
            totalPoints += sgpa * credits;
        }
    }

    if (totalCredits === 0) {
        alert("Please enter SGPA and credits for at least one semester.");
        return;
    }

    const cgpa = (totalPoints / totalCredits).toFixed(2);
    const percentage = ((cgpa - 0.5) * 10).toFixed(2);

    showResult('CGPA', cgpa, percentage);
    saveCgpaBtn.style.display = 'none'; // Hide sync button in CGPA mode
}

function showResult(title, value, percentage) {
    resultTitle.textContent = title;
    resultValue.textContent = value;
    resultPercent.textContent = `${Math.max(0, percentage)}%`;
    resultBox.style.display = 'block';
    
    // Auto-scroll to result
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Run on load
document.addEventListener('DOMContentLoaded', init);

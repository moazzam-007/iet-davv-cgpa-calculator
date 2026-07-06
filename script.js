// Grade Points mapping
const gradePoints = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0, 'Ab': 0, 'N/A': 0
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
const guideBtn = document.getElementById('guide-btn');
const guideModal = document.getElementById('guide-modal');
const closeModal = document.getElementById('close-modal');
const addPracticalBtn = document.getElementById('add-practical-btn');
const addVivaBtn = document.getElementById('add-viva-btn');

let currentSGPA = 0;
let currentTotalCredits = 0;
let cgpaRowRefs = [];
let saveTimeout;

function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 300);
}

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
    
    const targetCgpaInput = document.getElementById('target-cgpa-input');
    const remCreditsInput = document.getElementById('remaining-credits-input');
    if (targetCgpaInput) targetCgpaInput.addEventListener('input', updateTargetPlannerOnly);
    if (remCreditsInput) remCreditsInput.addEventListener('input', updateTargetPlannerOnly);
    
    // Guide Modal
    guideBtn.addEventListener('click', () => { guideModal.style.display = 'block'; });
    closeModal.addEventListener('click', () => { guideModal.style.display = 'none'; });
    window.addEventListener('click', (e) => {
        if (e.target === guideModal) guideModal.style.display = 'none';
    });
    
    // Add Subjects
    addPracticalBtn.addEventListener('click', () => {
        addSubjectRow('Practical', 1);
    });
    addVivaBtn.addEventListener('click', () => {
        addSubjectRow('Comprehensive Viva', 4);
    });

    // Auto-show guide on first visit
    if (!localStorage.getItem('cgpaGuideSeen_v2')) {
        guideModal.style.display = 'block';
        localStorage.setItem('cgpaGuideSeen_v2', 'true');
    }
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
        if (cgpaRowRefs[i-1]) {
            data.cgpaData[i] = {
                sgpa: cgpaRowRefs[i-1].sgpa.value,
                credits: cgpaRowRefs[i-1].credits.value
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
        localStorage.removeItem('cgpaGuideSeen_v2');
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
    const fragment = document.createDocumentFragment();
    
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
        nameInput.addEventListener('input', debouncedSave);

        // Credits Input
        const creditsInput = document.createElement('input');
        creditsInput.type = 'number';
        creditsInput.inputMode = 'numeric';
        creditsInput.value = subject.credits;
        creditsInput.min = '0';
        creditsInput.max = '20';
        creditsInput.ariaLabel = `Subject ${index + 1} Credits`;
        creditsInput.addEventListener('input', debouncedSave);

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
        
        // Add delete button if this is an extra row added by user
        if (index >= defaultSyllabus[semester].length) {
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.innerHTML = '❌';
            delBtn.title = 'Remove Subject';
            delBtn.addEventListener('click', () => {
                row.remove();
                saveState();
            });
            row.appendChild(delBtn);
        }
        
        fragment.appendChild(row);
    });
    subjectsContainer.appendChild(fragment);
}

// Add Custom Subject Row
function addSubjectRow(defaultName, defaultCredits) {
    const semester = semesterSelect.value;
    
    // Create new subject object
    const newSubject = { name: defaultName, credits: defaultCredits, grade: 'N/A' };
    
    // We can piggyback off the render logic by just passing the object
    const row = document.createElement('div');
    row.className = 'subject-row';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = newSubject.name;
    nameInput.ariaLabel = `Extra Subject Name`;
    nameInput.addEventListener('input', debouncedSave);

    const creditsInput = document.createElement('input');
    creditsInput.type = 'number';
    creditsInput.inputMode = 'numeric';
    creditsInput.value = newSubject.credits;
    creditsInput.min = '0';
    creditsInput.max = '20';
    creditsInput.ariaLabel = `Extra Subject Credits`;
    creditsInput.addEventListener('input', debouncedSave);

    const creditsWrap = document.createElement('div');
    creditsWrap.className = 'mobile-input-wrap';
    const creditsLabel = document.createElement('label');
    creditsLabel.textContent = 'Credits';
    creditsWrap.appendChild(creditsLabel);
    creditsWrap.appendChild(creditsInput);

    const gradeSelect = document.createElement('select');
    gradeSelect.ariaLabel = `Extra Subject Grade`;
    Object.keys(gradePoints).forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = grade;
        if (grade === 'N/A') option.selected = true;
        gradeSelect.appendChild(option);
    });
    gradeSelect.addEventListener('change', saveState);

    const gradeWrap = document.createElement('div');
    gradeWrap.className = 'mobile-input-wrap';
    const gradeLabel = document.createElement('label');
    gradeLabel.textContent = 'Grade';
    gradeWrap.appendChild(gradeLabel);
    gradeWrap.appendChild(gradeSelect);
    
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '❌';
    delBtn.title = 'Remove Subject';
    delBtn.addEventListener('click', () => {
        row.remove();
        saveState();
    });

    row.appendChild(nameInput);
    row.appendChild(creditsWrap);
    row.appendChild(gradeWrap);
    row.appendChild(delBtn);
    
    subjectsContainer.appendChild(row);
    saveState();
}


// Render Inputs for CGPA
function renderCgpaInputs() {
    cgpaInputsContainer.innerHTML = '';
    cgpaRowRefs = [];
    const fragment = document.createDocumentFragment();
    
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
        sgpaInput.addEventListener('input', debouncedSave);
        
        const creditsInput = document.createElement('input');
        creditsInput.type = 'number';
        creditsInput.inputMode = 'numeric';
        creditsInput.id = `sem${i}-credits`;
        creditsInput.placeholder = 'Credits (e.g. 22)';
        creditsInput.min = '0';
        creditsInput.ariaLabel = `Semester ${i} Credits`;
        creditsInput.addEventListener('input', debouncedSave);
        
        if (window.savedData && window.savedData.cgpaData && window.savedData.cgpaData[i]) {
            sgpaInput.value = window.savedData.cgpaData[i].sgpa || '';
            creditsInput.value = window.savedData.cgpaData[i].credits || '';
        }

        cgpaRowRefs.push({ sgpa: sgpaInput, credits: creditsInput });

        inputsDiv.appendChild(sgpaInput);
        inputsDiv.appendChild(creditsInput);
        
        row.appendChild(label);
        row.appendChild(inputsDiv);
        fragment.appendChild(row);
    }
    cgpaInputsContainer.appendChild(fragment);
}

// Save SGPA to CGPA Table
function saveToCgpaTable() {
    const currentSem = parseInt(semesterSelect.value);
    const ref = cgpaRowRefs[currentSem - 1];
    
    if (ref && ref.sgpa && ref.credits) {
        ref.sgpa.value = currentSGPA;
        ref.credits.value = currentTotalCredits;
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
    const percentage = (sgpa * 10).toFixed(2);

    currentSGPA = sgpa;
    currentTotalCredits = totalCredits;

    showResult('SGPA', sgpa, percentage);
    saveCgpaBtn.style.display = 'inline-block'; // Show sync button
}

function getCompletedTotals() {
    let totalCredits = 0;
    let totalPoints = 0;

    for (let i = 1; i <= 8; i++) {
        const ref = cgpaRowRefs[i-1];
        if (!ref) continue;
        const sgpa = parseFloat(ref.sgpa.value);
        const credits = parseFloat(ref.credits.value);

        if (!isNaN(sgpa) && !isNaN(credits) && credits > 0) {
            totalCredits += credits;
            totalPoints += sgpa * credits;
        }
    }
    return { totalCredits, totalPoints };
}

function calculateCGPA() {
    const { totalCredits, totalPoints } = getCompletedTotals();

    if (totalCredits === 0) {
        alert("Please enter SGPA and credits for at least one semester.");
        return;
    }

    const cgpa = (totalPoints / totalCredits).toFixed(2);
    const percentage = (cgpa * 10).toFixed(2);

    showResult('CGPA', cgpa, percentage);
    saveCgpaBtn.style.display = 'none'; // Hide sync button in CGPA mode
    
    calculateTargetSGPA(totalPoints, totalCredits);
}

function updateTargetPlannerOnly() {
    const { totalCredits, totalPoints } = getCompletedTotals();
    if (totalCredits > 0) {
        calculateTargetSGPA(totalPoints, totalCredits);
    }
}

function calculateTargetSGPA(totalCompletedPoints, totalCompletedCredits) {
    const targetInput = document.getElementById('target-cgpa-input').value;
    const remainingCreditsInput = document.getElementById('remaining-credits-input').value;
    const targetResultEl = document.getElementById('target-sgpa-result');
    const plannerSection = document.getElementById('target-planner-section');
    
    if (plannerSection) plannerSection.style.display = 'block';
    
    if (targetInput && remainingCreditsInput && parseFloat(remainingCreditsInput) > 0) {
        const targetCGPA = parseFloat(targetInput);
        const remainingCredits = parseFloat(remainingCreditsInput);
        
        const requiredPoints = (targetCGPA * (totalCompletedCredits + remainingCredits)) - totalCompletedPoints;
        const requiredSGPA = (requiredPoints / remainingCredits).toFixed(2);
        
        targetResultEl.style.display = 'block';
        if (requiredSGPA > 10) {
            targetResultEl.textContent = `Target ${targetCGPA} CGPA is Not Achievable (Requires ${requiredSGPA} average SGPA).`;
            targetResultEl.style.color = '#ef4444'; // Red
        } else if (requiredSGPA <= 0) {
            targetResultEl.textContent = `Target ${targetCGPA} CGPA is already secured!`;
            targetResultEl.style.color = '#4ade80'; // Green
        } else {
            targetResultEl.textContent = `To reach ${targetCGPA} CGPA, you need an average SGPA of ${requiredSGPA} in remaining semesters.`;
            targetResultEl.style.color = 'var(--primary)';
        }
    } else {
        if (targetResultEl) targetResultEl.style.display = 'none';
    }
}

function getDivision(cgpaStr) {
    const cgpa = parseFloat(cgpaStr);
    if (cgpa >= 8.00) return "First Division with Distinction";
    if (cgpa >= 6.50) return "First Division";
    if (cgpa >= 5.00) return "Second Division";
    if (cgpa >= 4.00) return "Pass Division";
    return "Not Eligible";
}

function showResult(title, value, percentage) {
    resultTitle.textContent = title;
    resultValue.textContent = value;
    resultPercent.textContent = `${Math.max(0, percentage)}%`;
    resultBox.style.display = 'block';
    
    const divisionEl = document.getElementById('result-division');
    const plannerSection = document.getElementById('target-planner-section');
    if (title === 'CGPA') {
        const division = getDivision(value);
        divisionEl.textContent = division.includes('Distinction') 
            ? division + "* (*if in first attempt)" 
            : division;
        divisionEl.style.display = 'block';
        if (plannerSection) plannerSection.style.display = 'block';
    } else {
        divisionEl.style.display = 'none';
        if (plannerSection) plannerSection.style.display = 'none';
    }
    
    // Auto-scroll to result
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Run on load
document.addEventListener('DOMContentLoaded', init);

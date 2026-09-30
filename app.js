// === VARIABLES GLOBALES ===
let teacherTime = 0;
let studentsTime = 0;
let teacherTimerInterval = null;
let studentsTimerInterval = null;
let mediaRecorder;
let audioChunks = [];
let audioUrl;

// === FORMAT TEMPS ===
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// === TIMERS ===
function updateTimerDisplays() {
  const teacherDisplay = document.getElementById('teacher-timer');
  if (teacherDisplay) teacherDisplay.textContent = formatTime(teacherTime);

  const studentsDisplay = document.getElementById('students-timer');
  if (studentsDisplay) studentsDisplay.textContent = formatTime(studentsTime);
}

function startTeacherTimer() {
  if (!teacherTimerInterval) {
    teacherTimerInterval = setInterval(() => {
      teacherTime++;
      updateTimerDisplays();
    }, 1000);
  }
}

function pauseTeacherTimer() {
  clearInterval(teacherTimerInterval);
  teacherTimerInterval = null;
}

function startStudentsTimer() {
  if (!studentsTimerInterval) {
    studentsTimerInterval = setInterval(() => {
      studentsTime++;
      updateTimerDisplays();
    }, 1000);
  }
}

function pauseStudentsTimer() {
  clearInterval(studentsTimerInterval);
  studentsTimerInterval = null;
}

function attachTimerButtons() {
  document.getElementById('teacher-start')?.addEventListener('click', startTeacherTimer);
  document.getElementById('teacher-pause')?.addEventListener('click', pauseTeacherTimer);
  document.getElementById('students-start')?.addEventListener('click', startStudentsTimer);
  document.getElementById('students-pause')?.addEventListener('click', pauseStudentsTimer);
}

// === SAUVEGARDE & CHARGEMENT DES DONNÉES ===
function saveData(section) {
  if (!section) return;
  const inputs = document.querySelectorAll("#content input, #content textarea, #content select");
  const data = {};
  inputs.forEach(input => {

    if (input.type === "checkbox") {
      data[input.id] = input.checked;
    }
    else if (input.type === "radio") {
      if (input.checked) {
        data[input.name] = input.value;  // <--- clé = name, valeur = value
      }
    }
    else {
      data[input.id] = input.value;
    }

  });
  localStorage.setItem(`clilview-${section}`, JSON.stringify(data));
}


function loadData(section) {
  const dataStr = localStorage.getItem(`clilview-${section}`);
  if (!dataStr) return;
  const data = JSON.parse(dataStr);
  Object.entries(data).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox" || el.type === "radio") {
      el.checked = value;
    } else {
      el.value = value;
    }
  });
}

// === AFFICHAGE CONDITIONNEL TEXTAREA ===
function toggleTextarea(groupName, textareaId, expectedValue) {
  const radios = document.getElementsByName(groupName);
  const textareaContainer = document.getElementById(textareaId);
  if (!textareaContainer) return;
  let shouldShow = false;
  radios.forEach(radio => {
    if (radio.checked && radio.value === expectedValue) {
      shouldShow = true;
    }
  });
  textareaContainer.style.display = shouldShow ? "block" : "none";
}

// --- SAUVEGARDE des boutons radio ---
document.addEventListener('change', function (event) {
  if (event.target.type === 'radio') {
    localStorage.setItem(event.target.name, event.target.value);
  }
});



// === CHARGEMENT DES SECTIONS ===
function loadSection(newSection) {
  const activeBtn = document.querySelector('nav button.active');
  const currentSection = activeBtn?.dataset.section;
  if (currentSection && currentSection !== newSection) {
    saveData(currentSection);
  }

  fetch(`sections/${newSection}.html`)
    .then(res => res.text())
    .then(html => {
      const content = document.getElementById("content");
      content.innerHTML = html;
	  
		content.querySelectorAll('input[type="radio"]').forEach(radio => {
      const savedValue = localStorage.getItem(radio.name);
      if (savedValue === radio.value) radio.checked = true;
    });

      loadData(newSection);

      content.querySelectorAll("input, textarea, select").forEach(input => {
        input.addEventListener('change', () => saveData(newSection));
        input.addEventListener('input', () => saveData(newSection));
      });

      if (newSection === 'home') {
        const resetButton = content.querySelector("#reset-button");
        if (resetButton) resetButton.addEventListener("click", reset);
      }

      if (newSection === 'inclusion') {
        setTimeout(initInclusionPage, 50);
      }
	  
	  if (newSection === 'students') {
		setTimeout(initStudentsPage, 50);
	  }

      updateTimerDisplays();
    })
    .catch(err => {
      console.error("Erreur chargement section :", err);
    });
}

function initInclusionPage() {
  // Textareas au "No" pour les deux premières questions
  toggleTextarea('sameObjective', 'differentObjectives', 'No');
  toggleTextarea('sameActivities', 'differentActivities', 'No');
  // Textarea au "Yes" pour une autre question (ex: tools)
  toggleTextarea('tools', 'differentTools', 'Yes');

  // Écouteurs pour les radios
  document.querySelectorAll('input[name="sameObjective"]').forEach(r => {
    r.addEventListener('change', () => toggleTextarea('sameObjective', 'differentObjectives', 'No'));
  });
  document.querySelectorAll('input[name="sameActivities"]').forEach(r => {
    r.addEventListener('change', () => toggleTextarea('sameActivities', 'differentActivities', 'No'));
  });
  document.querySelectorAll('input[name="tools"]').forEach(r => {
    r.addEventListener('change', () => toggleTextarea('tools', 'differentTools', 'Yes'));
  });

  // --- Affichage des sections hidden (questions 3-4-5) ---
  function updateHiddenSections() {
    const q1 = document.querySelector('input[name="sameObjective"]:checked');
    const q2 = document.querySelector('input[name="sameActivities"]:checked');
    const showSections = (q1 && q1.value === "No") || (q2 && q2.value === "No");

    document.querySelectorAll('#inclusion-section section.hidden').forEach(sec => {
      if (showSections) {
        sec.classList.remove('hidden');
      } else {
        sec.classList.add('hidden');
      }
    });
  }

  // Lancer au chargement pour tenir compte des valeurs déjà sauvegardées
  updateHiddenSections();

  // Lancer à chaque changement des deux premières questions
  document.querySelectorAll('input[name="sameObjective"], input[name="sameActivities"]').forEach(r => {
    r.addEventListener('change', updateHiddenSections);
  });
}


function initStudentsPage() {
  toggleTextarea('written', 'written-desc', 'Yes');
  toggleTextarea('help', 'tools-list', 'Yes');

  document.querySelectorAll('input[name="written"]').forEach(r => {
    r.addEventListener('change', () => toggleTextarea('written', 'written-desc', 'Yes'));
  });
  document.querySelectorAll('input[name="help"]').forEach(r => {
    r.addEventListener('change', () => toggleTextarea('help', 'tools-list', 'Yes'));
  });
}

// === OUTILS (chronos + audio) ===
function loadTools() {
  fetch('tools.html')
    .then(res => res.text())
    .then(html => {
      const toolsContainer = document.getElementById('tools-container');
      toolsContainer.innerHTML = html;
      attachTimerButtons();

      const btnStart = toolsContainer.querySelector('#btnStartRecording');
      const btnStop = toolsContainer.querySelector('#btnStopRecording');

      if (btnStart && btnStop) {
		btnStart.addEventListener('click', () => {
		  btnStart.classList.add('blinking');
		  startRecording();
		});

		btnStop.addEventListener('click', () => {
		  btnStart.classList.remove('blinking');
		  stopRecording();
		});
	  }
      updateTimerDisplays();
    })
    .catch(err => console.error('Erreur loading tools:', err));
}

// === AUDIO ===
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => e.data.size > 0 && audioChunks.push(e.data);

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
      audioUrl = URL.createObjectURL(audioBlob);
      const audioPlayback = document.getElementById('audioPlayback');
      if (audioPlayback) {
        audioPlayback.src = audioUrl;
        audioPlayback.style.display = 'block';
      }

      const btnSave = document.getElementById('btnSaveRecording');
      if (btnSave) {
        btnSave.style.display = 'inline-block';
        btnSave.onclick = () => {
          const a = document.createElement('a');
          a.href = audioUrl;
          a.download = 'recording.mp3';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };
      }

      const btnReset = document.getElementById('btnResetRecording');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          if (audioPlayback) {
            audioPlayback.src = '';
            audioPlayback.load();
          }
        });
      }
    };

    mediaRecorder.start();
  } catch (error) {
    console.error('Erreur micro:', error);
    alert("Microphone access denied.");
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

window.exportToExcel = function () {
  const sections = ["presentation", "teacher", "students", "inclusion"];

  // Chaque section remplit son PROPRE objet, jamais un objet partagé :
  // comme ça, l'ordre final ne dépend plus de l'ordre d'arrivée des fetch.
  const promises = sections.map(section => {
    return fetch(`sections/${section}.html`)
      .then(res => res.text())
      .then(html => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const inputs = tempDiv.querySelectorAll("input, textarea, select");

        const saved = localStorage.getItem(`clilview-${section}`);
        const savedData = saved ? JSON.parse(saved) : {};

        const sectionData = {};

        inputs.forEach(input => {
          // Les boutons radio d'un même groupe partagent le même name : on ne
          // veut qu'une seule colonne par groupe, pas une par bouton radio.
          const fieldKey = input.type === "radio" ? input.name : (input.id || input.name);
          if (!fieldKey) return;
          const key = `${section}_${fieldKey}`;

          // Une seule colonne par champ, même si plusieurs inputs partagent
          // accidentellement le même id/name (cf. radios d'un même groupe).
          if (Object.prototype.hasOwnProperty.call(sectionData, key)) return;

          let val;

          if (input.type === "checkbox") {
            val = savedData[input.id] ? "YES" : "NO";
          }
          else if (input.type === "radio") {
            val = savedData[input.name] || "";
          }
          else {
            val = savedData[input.id] ?? "";
          }

          // Champ non renseigné (question conditionnelle jamais atteinte,
          // ou laissée vide) : on l'indique par "N/A" plutôt qu'une cellule
          // vide, pour garder un document standardisé et comparable en colonnes.
          if (val === "" || val === null || val === undefined) {
            val = "N/A";
          }

          sectionData[key] = val;
        });

        return sectionData;
      });
  });

  Promise.all(promises).then(sectionResults => {
    // On reconstruit l'objet final en respectant STRICTEMENT l'ordre du
    // tableau "sections" (presentation, teacher, students, inclusion),
    // quel que soit l'ordre dans lequel les fetch se sont terminés.
    const allData = {
      "teacherTime": formatTime(teacherTime),
      "studentsTime": formatTime(studentsTime)
    };

    sectionResults.forEach(sectionData => {
      Object.assign(allData, sectionData);
    });

    const row = [allData];
    const ws = XLSX.utils.json_to_sheet(row);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");

    // Nom de fichier avec date/heure : ExportCV_DD-MM-YYYY-HH-MM-SS.xlsx
    // (les caractères "/" ne sont pas autorisés dans un nom de fichier, remplacés par "-")
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const fileDate = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    XLSX.writeFile(wb, `ExportCV_${fileDate}.xlsx`);
  });
};

// === RESET ===
function reset() {
  if (confirm("Are you sure you want to reset all data?")) {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  }
}

// === RAPPORT PDF (impression) ===

// Intitulés lisibles des questions, validés avec l'utilisateur, dans l'ordre
// des sections presentation -> teacher -> students -> inclusion.
const REPORT_CONFIG = {
  presentation: [
    { type: "text", id: "session-title", label: "Session title" },
    { type: "text", id: "subject", label: "Subject" },
    { type: "text", id: "grade", label: "Grade" },
    { type: "checkbox-group", label: "Type of lesson", items: [
        { id: "Curricular", text: "Curricular (bilingual or plurilingual course)" },
        { id: "ExtraCurricul", text: "Extra-curricular activity" },
        { id: "Additional", text: "Additional course" }
      ] },
    { type: "text", id: "foreign-language", label: "Language taught" },
    { type: "text", id: "structure", label: "Structure of the lesson plan" }
  ],
  teacher: [
    { type: "checkbox-group", label: "Languages used", items: [
        { id: "langStudied", text: "Language studied" },
        { id: "langMother", text: "Mother tongue" },
        { id: "langOther", text: "Other languages" }
      ] },
    { type: "text", id: "langUse", label: "How is the language studied used?" },
    { type: "radio", name: "level", label: "Foreign language level (1 = beginner / 4 = expert)" },
    { type: "radio", name: "words", label: "How many new words had been taught?", valueMap: { "1": "0 to 5", "2": "6 to 10", "3": "11 to 15", "4": "More than 15" } },
    { type: "text", id: "Newwords", label: "New words / words taught (type of words)" },
    { type: "radio", name: "Instructions", label: "What are the instructions like? (1 = Short / 4 = Long)" },
    { type: "radio", name: "clear", label: "How clear are they? (1 = not clear / 4 = very clear)" },
    { type: "radio", name: "steps", label: "How many steps are there (1 = a few / 4 = many)" },
    { type: "text", id: "involve", label: "Pedagogical strategies to involve all the students" },
    { type: "text", id: "teachingTips", label: "Teaching tips" }
  ],
  students: [
    { type: "checkbox-group", label: "Languages used", items: [
        { id: "language_studied", text: "Language studied" },
        { id: "mother_tongue", text: "Mother tongue" },
        { id: "other_language", text: "Other languages" }
      ] },
    { type: "checkbox-group", label: "Form of students' work", items: [
        { id: "all_together", text: "All together" },
        { id: "small_group", text: "Small group" },
        { id: "pair_work", text: "Pair work" },
        { id: "individual", text: "Individual" }
      ] },
    { type: "text", id: "activities", label: "Type of activities" },
    { type: "yesno-group", label: "Is there any written activity?", radioName: "written", descId: "written-description" },
    { type: "yesno-group", label: "Are there any tools to help students?", radioName: "help", descId: "tools" },
    { type: "text", id: "FinalTask", label: "Final task or final project" }
  ],
  inclusion: [
    { type: "yesno-group", label: "Do all the students have the same objective?", radioName: "sameObjective", descId: "differentObjectives" },
    { type: "yesno-group", label: "Do all the students have to achieve the same activities?", radioName: "sameActivities", descId: "differentActivities" },
    { type: "text", id: "adaptContent", label: "Pedagogical strategies to adapt the content to help students" },
    { type: "yesno-group", label: "Are there special tools to help students?", radioName: "tools", descId: "differentTools" },
    { type: "text", id: "IncludeStudents", label: "Pedagogical strategies to include all the students" }
  ]
};

const SECTION_TITLES = { presentation: "Presentation", teacher: "Teacher", students: "Students", inclusion: "Inclusion" };

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function pdfFileName() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, "0");
  const fileDate = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `ExportCV_${fileDate}`;
}

window.generatePdfReport = function () {
  const fileName = pdfFileName();

  let bodyHtml = `<div class="pdf-report-title">CLILview</div>`;

  Object.keys(REPORT_CONFIG).forEach(section => {
    const saved = localStorage.getItem(`clilview-${section}`);
    const data = saved ? JSON.parse(saved) : {};

    bodyHtml += `<div class="pdf-section-title">${escapeHtml(SECTION_TITLES[section])}</div>`;

    REPORT_CONFIG[section].forEach(field => {
      let answer = "";

      if (field.type === "text") {
        answer = data[field.id] || "";
      }
      else if (field.type === "checkbox-group") {
        const checked = field.items.filter(item => data[item.id]).map(item => item.text);
        answer = checked.join(", ");
      }
      else if (field.type === "radio") {
        const raw = data[field.name];
        answer = raw ? (field.valueMap ? (field.valueMap[raw] || raw) : raw) : "";
      }
      else if (field.type === "yesno-group") {
        const yn = data[field.radioName];
        if (yn === "Yes") {
          const desc = data[field.descId];
          answer = `Yes — ${desc && desc.trim() ? desc : "N/A"}`;
        } else if (yn === "No") {
          answer = "No";
        }
      }

      if (!answer || !answer.toString().trim()) answer = "N/A";

      bodyHtml += `
        <div class="pdf-question-block">
          <div class="pdf-question-label">${escapeHtml(field.label)}</div>
          <div class="pdf-question-answer">${escapeHtml(answer.toString())}</div>
        </div>`;
    });
  });

  const headerHtml = `
    <div class="pdf-header-bar">
      <img src="IMG/Erasmuslogo.png" alt="Erasmus+" onerror="this.style.display='none'">
      <div class="pdf-header-text">CLILview is designed by the BETTER Team, which includes teachers and trainers from Croatia, France, Italy, Romania and Spain.</div>
      <img src="IMG/logo.png" alt="BETTER" onerror="this.style.display='none'">
    </div>`;

  const footerHtml = `<div class="pdf-footer-bar">${escapeHtml(fileName)}</div>`;

  const report = document.getElementById("pdf-report");
  report.innerHTML = `
    <thead><tr><td>${headerHtml}</td></tr></thead>
    <tfoot><tr><td>${footerHtml}</td></tr></tfoot>
    <tbody><tr><td>${bodyHtml}</td></tr></tbody>
  `;

  document.body.classList.add("printing-report");
  const previousTitle = document.title;
  document.title = fileName;

  const cleanup = () => {
    document.body.classList.remove("printing-report");
    document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  window.print();
};

// === INITIALISATION ===
document.addEventListener("DOMContentLoaded", () => {
  loadTools();
  loadSection("home");

  document.querySelectorAll('nav button[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadSection(btn.dataset.section);
    });
  });

  window.toggleTextarea = toggleTextarea;
});

// === HELP ===
document.addEventListener("click", function (e) {
  const help = e.target.closest(".help");

  // Ferme toutes les aides sauf celle cliquée
  document.querySelectorAll(".help").forEach(h => {
    if (h !== help) h.classList.remove("active");
  });

  // Toggle sur celle cliquée
  if (help) {
    help.classList.toggle("active");
    e.stopPropagation();
  }
});


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
    if (input.type === "checkbox" || input.type === "radio") {
      data[input.id] = input.checked;
    } else {
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

    document.querySelectorAll('#inclusion-section section[data-hidden]').forEach(sec => {
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
  const allData = {
    "teacherTime": formatTime(teacherTime),
    "studentsTime": formatTime(studentsTime)
  };

  const promises = sections.map(section => {
    return fetch(`sections/${section}.html`)
      .then(res => res.text())
      .then(html => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const inputs = tempDiv.querySelectorAll("input, textarea, select");

        const saved = localStorage.getItem(`clilview-${section}`);
        const savedData = saved ? JSON.parse(saved) : {};

        inputs.forEach(input => {
          let val;
          if (input.type === "checkbox" || input.type === "radio") {
            val = savedData[input.id] ? "YES" : "NO";
          } else {
            val = savedData[input.id] ?? "";
          }

          const key = `${section}_${input.id || "no-id"}`;
          allData[key] = val;
        });
      });
  });

  Promise.all(promises).then(() => {
    // Organiser les données comme une seule ligne dans une feuille
    const row = [allData]; // Tableau contenant une seule ligne d'objet
    const ws = XLSX.utils.json_to_sheet(row);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "clilview_data.xlsx");
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

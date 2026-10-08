import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBXWzVp34G2QbAWczcDN-Hw-AwcZDqnCas",
  authDomain: "retag-f5977.firebaseapp.com",
  databaseURL: "https://retag-f5977-default-rtdb.firebaseio.com",
  projectId: "retag-f5977",
  storageBucket: "retag-f5977.firebasestorage.app",
  messagingSenderId: "515743799841",
  appId: "1:515743799841:web:4b2b05a796f531f7e4e160",
  measurementId: "G-661C68PW3R"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const defaultSchedule = [
  { day: "السبت", dataDay: 6, class: "off", subject: "📖 إجازة / استذكار", time: "15:30", notes: "مراجعة أسبوعية" },
  { day: "الأحد", dataDay: 0, class: "bio", subject: "🧬 أحياء", time: "15:30", notes: "حل أسئلة الفصل" },
  { day: "الاثنين", dataDay: 1, class: "eng", subject: "🇬🇧 إنجليزي", time: "09:00", notes: "حفظ الكلمات" },
  { day: "الثلاثاء", dataDay: 2, class: "chem", subject: "🧪 كيمياء", time: "08:00", notes: "اختبار قصير" },
  { day: "الأربعاء", dataDay: 3, class: "arabic", subject: "📚 عربي", time: "08:00", notes: "قواعد ونصوص" },
  { day: "الخميس", dataDay: 4, class: "off", subject: "💻 إجازة", time: "-----", notes: "والعة معاك 🎉" },
  { day: "الجمعة", dataDay: 5, class: "off", subject: "☕ إجازة", time: "-----", notes: "الله يسهّلها 💕" }
];

let isEditing = false;
let currentScheduleData = [];

const scheduleRef = ref(db, 'schedule');
const goalsRef = ref(db, 'goals');

function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  
  const icon = document.getElementById("theme-icon");
  const text = document.getElementById("theme-text");
  
  if (savedTheme === 'dark') {
    if (icon) icon.innerText = "☀️";
    if (text) text.innerText = "فاتح";
  } else {
    if (icon) icon.innerText = "🌙";
    if (text) text.innerText = "داكن";
  }
}

applySavedTheme();

window.toggleTheme = function() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  body.setAttribute("data-theme", newTheme);
  localStorage.setItem('theme', newTheme);

  const icon = document.getElementById("theme-icon");
  const text = document.getElementById("theme-text");
  if (newTheme === "dark") {
    icon.innerText = "☀️";
    text.innerText = "فاتح";
  } else {
    icon.innerText = "🌙";
    text.innerText = "داكن";
  }
};

onValue(scheduleRef, (snapshot) => {
  const data = snapshot.val();
  currentScheduleData = data || defaultSchedule;
  renderTable(currentScheduleData);
  if (!data) set(scheduleRef, defaultSchedule);
  updateHighlightsAndHero();
});

onValue(goalsRef, (snapshot) => {
  const goals = snapshot.val();
  const input = document.getElementById('goals-input');
  if (goals !== null && document.activeElement !== input) {
    input.value = goals;
  }
});

document.getElementById('goals-input').addEventListener('input', (e) => {
  set(goalsRef, e.target.value);
});

function renderTable(data) {
  const tbody = document.getElementById('schedule-body');
  tbody.innerHTML = '';
  data.forEach((row) => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-day', row.dataDay);
    if (row.class) tr.className = row.class;

    tr.innerHTML = `
      <td>${row.day}</td>
      <td class="editable-cell" contenteditable="${isEditing}">${row.subject}</td>
      <td>
        <span class="time-text editable-cell" contenteditable="${isEditing}">${row.time}</span>
      </td>
      <td class="editable-cell" contenteditable="${isEditing}">${row.notes}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.toggleEditMode = function() {
  isEditing = !isEditing;
  const btn = document.getElementById('editBtn');
  const btnText = document.getElementById('edit-text');
  const status = document.getElementById('editStatus');
  const cells = document.querySelectorAll('.editable-cell');

  if (isEditing) {
    btnText.innerText = "حفظ";
    btn.classList.add('active');
    status.classList.add('show');
    cells.forEach(cell => cell.contentEditable = "true");
  } else {
    btnText.innerText = "تعديل";
    btn.classList.remove('active');
    status.classList.remove('show');
    cells.forEach(cell => cell.contentEditable = "false");

    const rows = document.querySelectorAll('#schedule-body tr');
    const updatedSchedule = [];
    rows.forEach((tr, index) => {
      const tds = tr.querySelectorAll('td');
      const originalRow = currentScheduleData[index] || {};
      const timeText = tr.querySelector('.time-text')?.innerText?.trim() || originalRow.time || "";
      updatedSchedule.push({
        day: tds[0]?.innerText?.trim() || originalRow.day || "",
        dataDay: originalRow.dataDay ?? 0,
        class: originalRow.class || "",
        subject: tds[1]?.innerText?.trim() || originalRow.subject || "",
        time: timeText,
        notes: tds[3]?.innerText?.trim() || originalRow.notes || ""
      });
    });
    set(scheduleRef, updatedSchedule);
  }
};

function updateHighlightsAndHero() {
  const now = new Date();
  const currentJSDay = now.getDay();

  document.querySelectorAll("tbody tr").forEach(row => {
    const rowDay = parseInt(row.getAttribute("data-day"), 10);
    if (rowDay === currentJSDay) {
      row.classList.add("today-highlight");
    } else {
      row.classList.remove("today-highlight");
    }
  });

  const todayData = currentScheduleData.find(item => item.dataDay === currentJSDay);
  const heroSubject = document.getElementById('hero-subject');
  const heroTimer = document.getElementById('hero-timer');
  const heroStatus = document.getElementById('hero-status');

  if (todayData && todayData.time && todayData.time.includes(":")) {
    heroSubject.innerText = todayData.subject;
    
    const [targetHours, targetMinutes] = todayData.time.split(":").map(Number);
    const targetTime = new Date();
    targetTime.setHours(targetHours, targetMinutes, 0, 0);

    const diff = targetTime - now;

    if (diff > 0) {
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      heroStatus.innerText = "متبقي على الدرس:";
      heroTimer.innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      heroStatus.innerText = "حالة اليوم:";
      heroTimer.innerText = "بدأ الدرس أو انتهى";
    }
  } else {
    heroSubject.innerText = "مفيش حصص النهارده 🎉";
    heroStatus.innerText = "حالة اليوم:";
    heroTimer.innerText = "-- : --";
  }
}

setInterval(updateHighlightsAndHero, 1000);

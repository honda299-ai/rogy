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
  { day: "السبت", dataDay: 6, class: "off", subject: "📖 إجازة / استذكار", time: "15:30", notes: "مراجعة أسبوعية", status: "none" },
  { day: "الأحد", dataDay: 0, class: "bio", subject: "🧬 أحياء", time: "15:30", notes: "حل أسئلة الفصل", status: "none" },
  { day: "الاثنين", dataDay: 1, class: "eng", subject: "🇬🇧 إنجليزي", time: "09:00", notes: "حفظ الكلمات", status: "none" },
  { day: "الثلاثاء", dataDay: 2, class: "chem", subject: "🧪 كيمياء", time: "08:00", notes: "اختبار قصير", status: "none" },
  { day: "الأربعاء", dataDay: 3, class: "arabic", subject: "📚 عربي", time: "08:00", notes: "قواعد ونصوص", status: "none" },
  { day: "الخميس", dataDay: 4, class: "off", subject: "💻 إجازة", time: "-----", notes: "والعة معاك 🎉", status: "none" },
  { day: "الجمعة", dataDay: 5, class: "off", subject: "☕ إجازة", time: "-----", notes: "الله يسهّلها 💕", status: "none" }
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
  updateTodayHighlight();
  updateRewards();
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
  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-day', row.dataDay);
    if (row.class) tr.className = row.class;

    let attendanceClass = "attendance-btn";
    let attendanceText = "تسجيل حضور";
    if (row.status === "attended") {
      attendanceClass += " attended";
      attendanceText = "✅ حضرت";
    } else if (row.status === "absent") {
      attendanceClass += " absent";
      attendanceText = "❌ غياب";
    }

    tr.innerHTML = `
      <td>${row.day}</td>
      <td class="editable-cell" contenteditable="${isEditing}">${row.subject}</td>
      <td>
        <span class="time-text editable-cell" contenteditable="${isEditing}">${row.time}</span>
      </td>
      <td class="editable-cell" contenteditable="${isEditing}">${row.notes}</td>
      <td>
        <button class="${attendanceClass}" onclick="toggleAttendance(${index})">${attendanceText}</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.toggleAttendance = function(index) {
  const statuses = ["none", "attended", "absent"];
  let currentStatus = currentScheduleData[index].status || "none";
  let nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
  currentScheduleData[index].status = statuses[nextIndex];

  set(scheduleRef, currentScheduleData);
  renderTable(currentScheduleData);
  updateRewards();
};

function updateRewards() {
  let attendedCount = 0;
  currentScheduleData.forEach(row => {
    if (row.status === "attended") {
      attendedCount++;
    }
  });

  const points = attendedCount * 10;
  const scoreEl = document.getElementById('rewards-score');
  if (scoreEl) {
    scoreEl.innerText = `نقاط الحضور: ${points} نقطة ⭐ (${attendedCount} حصص حضرتيها)`;
  }

  const badgesContainer = document.getElementById('badges-container');
  if (badgesContainer) {
    let badgesHTML = '';
    if (attendedCount >= 1) badgesHTML += `<span class="badge-item">🌟 بداية موفقة</span>`;
    if (attendedCount >= 3) badgesHTML += `<span class="badge-item">🏆 مجتهدة الأسبوع</span>`;
    if (attendedCount >= 5) badgesHTML += `<span class="badge-item">👑 بطلة الحضور</span>`;
    if (attendedCount === 0) badgesHTML += `<span class="badge-item">🔒 سجلي حضورك لفتح الأوسمة</span>`;
    badgesContainer.innerHTML = badgesHTML;
  }
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
        notes: tds[3]?.innerText?.trim() || originalRow.notes || "",
        status: originalRow.status || "none"
      });
    });
    set(scheduleRef, updatedSchedule);
  }
};

function updateTodayHighlight() {
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
}

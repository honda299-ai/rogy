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

// ===== البيانات الافتراضية =====
const defaultSchedule = [
  { day: "السبت", dataDay: 6, class: "off", subject: "📖 إجازة / استذكار", time: "3:30 - 5:30", notes: "مراجعة أسبوعية" },
  { day: "الأحد", dataDay: 0, class: "bio", subject: "🧬 أحياء", time: "3:30 - 5:30", notes: "حل أسئلة الفصل" },
  { day: "الاثنين", dataDay: 1, class: "eng", subject: "🇬🇧 إنجليزي", time: "9:00 - 11:00", notes: "حفظ الكلمات" },
  { day: "الثلاثاء", dataDay: 2, class: "chem", subject: "🧪 كيمياء", time: "8:00 - 10:00", notes: "اختبار قصير" },
  { day: "الأربعاء", dataDay: 3, class: "arabic", subject: "📚 عربي", time: "8:00 - 10:00", notes: "قواعد ونصوص" },
  { day: "الخميس", dataDay: 4, class: "off", subject: "💻 إجازة", time: "-----", notes: "والعة معاك 🎉" },
  { day: "الجمعة", dataDay: 5, class: "off", subject: "☕ إجازة", time: "-----", notes: "الله يسهّلها 💕" }
];

let isEditing = false;
let currentScheduleData = [];

const scheduleRef = ref(db, 'schedule');
const goalsRef = ref(db, 'goals');

// ===== مراقبة الجدول =====
onValue(scheduleRef, (snapshot) => {
  try {
    const data = snapshot.val();
    currentScheduleData = data || defaultSchedule;
    renderTable(currentScheduleData);
    if (!data) set(scheduleRef, defaultSchedule).catch(err => console.error("فشل حفظ الجدول الافتراضي:", err));
    updateHighlights();
    updateNextLesson();
  } catch (error) {
    console.error("خطأ في قراءة الجدول:", error);
  }
}, (error) => {
  console.error("فشل الاتصال بقاعدة البيانات:", error);
});

// ===== مراقبة الأهداف مع منع التعارض =====
let goalsTimestamp = 0;
const goalsInput = document.getElementById('goals-input');

onValue(goalsRef, (snapshot) => {
  const goals = snapshot.val();
  if (goals !== null && document.activeElement !== goalsInput) {
    goalsInput.value = goals;
  }
});

goalsInput.addEventListener('blur', (e) => {
  const value = e.target.value;
  set(goalsRef, value).catch(err => console.error("فشل حفظ الأهداف:", err));
  goalsTimestamp = Date.now();
});

// ===== عرض الجدول =====
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

// ===== تبديل وضع التعديل =====
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

    // جمع البيانات بالاعتماد على data-day بدلاً من الفهرس
    const rows = document.querySelectorAll('#schedule-body tr');
    const updatedSchedule = [];
    rows.forEach((tr) => {
      const tds = tr.querySelectorAll('td');
      const dataDay = parseInt(tr.getAttribute('data-day'), 10);
      const originalRow = currentScheduleData.find(r => r.dataDay === dataDay) || {};
      const timeText = tr.querySelector('.time-text')?.innerText?.trim() || originalRow.time || "";
      updatedSchedule.push({
        day: tds[0]?.innerText?.trim() || originalRow.day || "",
        dataDay: dataDay,
        class: originalRow.class || "",
        subject: tds[1]?.innerText?.trim() || originalRow.subject || "",
        time: timeText,
        notes: tds[3]?.innerText?.trim() || originalRow.notes || ""
      });
    });
    set(scheduleRef, updatedSchedule).catch(err => console.error("فشل حفظ الجدول:", err));
  }
};

// ===== تبديل الثيم =====
window.toggleTheme = function() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const icon = document.getElementById("theme-icon");
  const text = document.getElementById("theme-text");

  if (currentTheme === "dark") {
    body.setAttribute("data-theme", "light");
    icon.innerText = "🌙";
    text.innerText = "داكن";
  } else {
    body.setAttribute("data-theme", "dark");
    icon.innerText = "☀️";
    text.innerText = "فاتح";
  }
};

// ===== تمييز اليوم الحالي (يتم التحديث كل دقيقة) =====
function updateHighlights() {
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

// ===== حساب الحصة القادمة بدقة (بالثواني) =====
function updateNextLesson() {
  const now = new Date();
  const currentDay = now.getDay();
  const currentSeconds = Math.floor(now.getTime() / 1000);

  let upcomingLesson = null;
  let minDiffSeconds = Infinity;

  for (let offset = 0; offset <= 7; offset++) {
    const dayIndex = (currentDay + offset) % 7;
    const dayData = currentScheduleData.find(r => r.dataDay === dayIndex);
    if (!dayData) continue;

    const timeParts = dayData.time.split(' - ');
    if (timeParts.length !== 2) continue;
    const startTime = timeParts[0].trim();
    if (startTime === "-----") continue;

    const [startH, startM] = startTime.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM)) continue;

    const startDate = new Date(now);
    startDate.setDate(now.getDate() + offset);
    startDate.setHours(startH, startM, 0, 0);
    const startSeconds = Math.floor(startDate.getTime() / 1000);
    let diffSeconds = startSeconds - currentSeconds;

    if (diffSeconds < 0) diffSeconds += 86400;

    if (diffSeconds < minDiffSeconds) {
      minDiffSeconds = diffSeconds;
      const isToday = (offset === 0 && startSeconds > currentSeconds);
      upcomingLesson = {
        subject: dayData.subject,
        diffSeconds: diffSeconds,
        isToday: isToday
      };
    }
  }

  const heroSubject = document.getElementById('hero-subject');
  const heroStatus = document.getElementById('hero-status');
  const heroTimer = document.getElementById('hero-timer');

  if (upcomingLesson && upcomingLesson.diffSeconds > 0) {
    const diff = upcomingLesson.diffSeconds;
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = Math.floor(diff % 60);

    heroSubject.innerText = upcomingLesson.subject;
    heroStatus.innerText = upcomingLesson.isToday ? "⏳ متبقي على البداية:" : "📅 الدرس القادم (غداً أو بعده):";
    heroTimer.innerText = 
      `${String(hours).padStart(2,'0')}س : ${String(minutes).padStart(2,'0')}د : ${String(seconds).padStart(2,'0')}ث`;
  } else {
    heroSubject.innerText = "🎉 لا توجد حصص قادمة";
    heroStatus.innerText = "استمتع بوقتك!";
    heroTimer.innerText = "✨ 🌸 ✨";
  }
}

// ===== تحديثات دورية =====
setInterval(updateNextLesson, 1000);       // كل ثانية للعد التنازلي
setInterval(updateHighlights, 60000);      // كل دقيقة لتمييز اليوم

// ===== التهيئة الأولية =====
setTimeout(() => {
  updateNextLesson();
  updateHighlights();
}, 200);
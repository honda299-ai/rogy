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

onValue(scheduleRef, (snapshot) => {
  const data = snapshot.val();
  currentScheduleData = data || defaultSchedule;
  renderTable(currentScheduleData);
  if (!data) set(scheduleRef, defaultSchedule);
  updateCountdowns();
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
      <td data-label="اليوم">${row.day}</td>
      <td data-label="المادة" class="editable-cell" contenteditable="${isEditing}">${row.subject}</td>
      <td data-label="الوقت">
        <span class="time-text editable-cell" contenteditable="${isEditing}">${row.time}</span>
        <br><span class="countdown"></span>
      </td>
      <td data-label="ملاحظات" class="editable-cell" contenteditable="${isEditing}">${row.notes}</td>
    `;
    tbody.appendChild(tr);
  });
}

function parseTimeRange(timeStr) {
  if (!timeStr || timeStr.includes("---") || timeStr.trim() === "") return null;
  const parts = timeStr.split("-").map(s => s.trim());
  if (parts.length < 2) return null;
  function parseSingleTime(str) {
    if (!str) return null;
    const s = str.trim().toLowerCase();
    const isPM = s.includes("م") || s.includes("pm") || s.includes("مساء");
    const isAM = s.includes("ص") || s.includes("am") || s.includes("صباح");
    const match = s.match(/(\d{1,2})(?::(\d{1,2}))?/);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    let minutes = match[2] ? parseInt(match[2], 10) : 0;
    if (isNaN(hours)) return null;
    if (isNaN(minutes)) minutes = 0;
    if (isPM) { if (hours < 12) hours += 12; } 
    else if (isAM) { if (hours === 12) hours = 0; } 
    else { if (hours >= 1 && hours <= 6) hours += 12; }
    return { hours, minutes };
  }
  const start = parseSingleTime(parts[0]);
  const end = parseSingleTime(parts[1]);
  if (!start || !end) return null;
  return { start, end };
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

function updateCountdowns() {
  const now = new Date();
  const currentJSDay = now.getDay();
  document.querySelectorAll("tbody tr").forEach(row => {
    const rowDay = parseInt(row.getAttribute("data-day"), 10);
    if (rowDay === currentJSDay) row.classList.add("today-highlight");
    else row.classList.remove("today-highlight");
  });

  let nextLessonCandidate = null;
  let minDiffMs = Infinity;
  currentScheduleData.forEach(item => {
    const isOff = item.class === "off" || (item.subject && item.subject.includes("إجازة"));
    if (isOff) return;
    const timeRange = parseTimeRange(item.time);
    if (!timeRange) return;
    let dayDiff = item.dataDay - currentJSDay;
    let lessonStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayDiff,
      timeRange.start.hours, timeRange.start.minutes, 0);
    let lessonEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayDiff,
      timeRange.end.hours, timeRange.end.minutes, 0);
    let isOngoing = false;
    if (now >= lessonStart && now <= lessonEnd) isOngoing = true;
    else if (now > lessonEnd) { lessonStart.setDate(lessonStart.getDate() + 7); lessonEnd.setDate(lessonEnd.getDate() + 7); }
    let diffMs = lessonStart - now;
    if (isOngoing) diffMs = -1;
    if (diffMs < minDiffMs) { minDiffMs = diffMs; nextLessonCandidate = { subject: item.subject, dayName: item.day, isOngoing, diffMs }; }
  });

  const heroSubject = document.getElementById("hero-subject");
  const heroTimer = document.getElementById("hero-timer");
  const heroStatus = document.getElementById("hero-status");
  if (nextLessonCandidate) {
    heroSubject.innerText = `${nextLessonCandidate.subject} (${nextLessonCandidate.dayName})`;
    if (nextLessonCandidate.isOngoing) { heroStatus.innerText = "🔥 جاري الآن:"; heroTimer.innerText = "الحصة شغالة! 📚"; }
    else {
      heroStatus.innerText = "متبقي:";
      const totalSecs = Math.floor(nextLessonCandidate.diffMs / 1000);
      if (totalSecs < 0) heroTimer.innerText = "⏳ قريباً جداً!";
      else {
        const days = Math.floor(totalSecs / (3600 * 24));
        const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        if (days > 0) heroTimer.innerText = `${days} يوم و ${hours}س`;
        else if (hours > 0) heroTimer.innerText = `${hours}س : ${mins}د`;
        else heroTimer.innerText = `${mins} دقيقة`;
      }
    }
  } else { heroSubject.innerText = "🎉 مفيش دروس!"; heroStatus.innerText = "استمتعي!"; heroTimer.innerText = "😊"; }

  document.querySelectorAll("#schedule-body tr").forEach((tr, idx) => {
    const item = currentScheduleData[idx];
    const badge = tr.querySelector(".countdown");
    if (!badge || !item) return;
    const isOff = item.class === "off" || (item.subject && item.subject.includes("إجازة"));
    if (isOff) { badge.style.display = "none"; return; }
    const timeRange = parseTimeRange(item.time);
    if (!timeRange) { badge.style.display = "none"; return; }
    badge.style.display = "inline-block";
    let dayDiff = item.dataDay - currentJSDay;
    let lessonStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayDiff,
      timeRange.start.hours, timeRange.start.minutes, 0);
    let lessonEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayDiff,
      timeRange.end.hours, timeRange.end.minutes, 0);
    if (now >= lessonStart && now <= lessonEnd) {
      badge.className = "countdown countdown-badge active";
      badge.innerText = "🔔 شغالة!";
    } else if (now < lessonStart) {
      const diffMs = lessonStart - now;
      const totalSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSecs / (3600 * 24));
      const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      badge.className = "countdown countdown-badge";
      if (days === 0) {
        if (hours > 0) badge.innerText = `⏳ ${hours}س ${mins}د`;
        else badge.innerText = `⏳ ${mins}د`;
      } else if (days === 1) badge.innerText = `⏳ غداً`;
      else badge.innerText = `⏳ بعد ${days} أيام`;
    } else {
      badge.className = "countdown countdown-badge";
      const diffDays = Math.floor((now - lessonEnd) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) badge.innerText = `⌛ انتهت`;
      else if (diffDays === 1) badge.innerText = `⌛ أمس`;
      else badge.innerText = `⌛ منذ ${diffDays} أيام`;
    }
  });
}

setInterval(updateCountdowns, 1000);
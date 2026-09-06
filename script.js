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
let goalsTimestamp = 0; // لتجنب التعارض

const scheduleRef = ref(db, 'schedule');
const goalsRef = ref(db, 'goals');

// ===== مراقبة الجدول =====
onValue(scheduleRef, (snapshot) => {
  try {
    const data = snapshot.val();
    currentScheduleData = data || defaultSchedule;
    renderTable(currentScheduleData);
    if (!data) set(scheduleRef, defaultSchedule);
    updateHighlights();
    updateNextLesson(); // تحديث الحصة القادمة
  } catch (error) {
    console.error("خطأ في قراءة الجدول:", error);
  }
}, (error) => {
  console.error("فشل الاتصال بقاعدة البيانات:", error);
});

// ===== مراقبة الأهداف مع تجنب التعارض =====
onValue(goalsRef, (snapshot) => {
  const goals = snapshot.val();
  const input = document.getElementById('goals-input');
  // نمنع الكتابة فوق النص إذا كان المستخدم يحرر الحقل حالياً
  if (goals !== null && document.activeElement !== input) {
    input.value = goals;
  }
});

// عند فقدان التركيز (blur) نقوم بحفظ النص مع طابع زمني
document.getElementById('goals-input').addEventListener('blur', (e) => {
  const value = e.target.value;
  const now = Date.now();
  // نرسل قيمة مع طابع زمني (يمكن تخزينه في Firebase)
  set(goalsRef, value).catch(err => console.error("فشل حفظ الأهداف:", err));
  goalsTimestamp = now;
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

    // جمع البيانات مع الاعتماد على data-day
    const rows = document.querySelectorAll('#schedule-body tr');
    const updatedSchedule = [];
    rows.forEach((tr) => {
      const tds = tr.querySelectorAll('td');
      const dataDay = parseInt(tr.getAttribute('data-day'), 10);
      // نبحث عن الصف الأصلي بنفس dataDay للحفاظ على الخصائص الأخرى
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

// ===== تمييز اليوم الحالي (كل دقيقة) =====
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

// ===== حساب الحصة القادمة =====
function updateNextLesson() {
  const now = new Date();
  const currentDay = now.getDay(); // 0=أحد .. 6=سبت
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  // نبحث في الجدول عن اليوم الحالي ونتحقق من الوقت
  let upcomingLesson = null;
  let minDiff = Infinity;

  // نكرر على الأيام من اليوم الحالي إلى الأسبوع القادم
  for (let offset = 0; offset <= 7; offset++) {
    const dayIndex = (currentDay + offset) % 7;
    const dayData = currentScheduleData.find(r => r.dataDay === dayIndex);
    if (!dayData) continue;
    // نحلل الوقت (نتوقع صيغة "HH:MM - HH:MM")
    const timeParts = dayData.time.split(' - ');
    if (timeParts.length !== 2) continue;
    const startTime = timeParts[0].trim();
    const endTime = timeParts[1].trim();
    if (startTime === "-----") continue;

    // نحول وقت البداية إلى دقائق
    const [startH, startM] = startTime.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM)) continue;
    const startTotal = startH * 60 + startM;

    // نحسب فارق الدقائق مع مراعاة الأيام
    let diff = (startTotal - currentTotalMinutes) + (offset * 1440);
    if (diff < 0) diff += 1440; // إذا كان الوقت قد مضى نأخذ اليوم التالي

    if (diff < minDiff) {
      minDiff = diff;
      upcomingLesson = {
        day: dayData.day,
        subject: dayData.subject,
        startTime: startTime,
        endTime: endTime,
        diffMinutes: diff,
        isToday: (offset === 0 && startTotal > currentTotalMinutes) || (offset === 0 && startTotal <= currentTotalMinutes && offset === 0) // نحتاج منطق أفضل
      };
    }
  }

  // تصحيح منطق isToday: إذا كان offset=0 والوقت لم يبدأ بعد فهو اليوم، وإلا إذا كان offset=0 والوقت مضى نأخذ الغد
  // لكننا بالفعل حسبنا diff، يمكننا تحديد if (diff < 1440) => اليوم
  if (upcomingLesson) {
    const diff = upcomingLesson.diffMinutes;
    const isToday = diff < 1440;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    const seconds = Math.floor((diff % 1) * 60); // لا نحتاج للثواني لأننا نحدث كل دقيقة

    document.getElementById('hero-subject').innerText = upcomingLesson.subject;
    document.getElementById('hero-status').innerText = isToday ? "متبقي على البداية:" : "الدرس القادم (غداً أو بعد):";
    document.getElementById('hero-timer').innerText = 
      `${String(hours).padStart(2,'0')}س : ${String(minutes).padStart(2,'0')}د : 00ث`;
  } else {
    document.getElementById('hero-subject').innerText = "🎉 لا توجد حصص قادمة";
    document.getElementById('hero-status').innerText = "استمتع بوقتك!";
    document.getElementById('hero-timer').innerText = "✨ 🌸 ✨";
  }
}

// تحديث الحصة القادمة كل دقيقة
setInterval(updateNextLesson, 60000);

// تحديث تمييز اليوم كل دقيقة
setInterval(updateHighlights, 60000);

// استدعاء أولي عند التحميل
setTimeout(() => {
  updateNextLesson();
  updateHighlights();
}, 100);
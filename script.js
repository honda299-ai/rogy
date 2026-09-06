// ===== حساب الحصة القادمة بدقة (بالثواني) =====
function updateNextLesson() {
  const now = new Date();
  const currentDay = now.getDay(); // 0=أحد .. 6=سبت
  const currentSeconds = Math.floor(now.getTime() / 1000); // timestamp بالثواني

  let upcomingLesson = null;
  let minDiffSeconds = Infinity;

  // نبحث في الأيام من اليوم الحالي حتى 7 أيام قادمة
  for (let offset = 0; offset <= 7; offset++) {
    const dayIndex = (currentDay + offset) % 7;
    const dayData = currentScheduleData.find(r => r.dataDay === dayIndex);
    if (!dayData) continue;

    // تحليل الوقت - نتوقع صيغة "HH:MM - HH:MM" أو "-----"
    const timeParts = dayData.time.split(' - ');
    if (timeParts.length !== 2) continue;
    const startTime = timeParts[0].trim();
    if (startTime === "-----") continue;

    // تحويل وقت البدء إلى ساعات ودقائق
    const [startH, startM] = startTime.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM)) continue;

    // بناء كائن Date لوقت البدء في اليوم المحدد
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + offset);
    startDate.setHours(startH, startM, 0, 0); // نضع الثواني 0

    const startSeconds = Math.floor(startDate.getTime() / 1000);
    let diffSeconds = startSeconds - currentSeconds;

    // إذا كان الفرق سالباً (أي أن الوقت قد مضى)، نضيف 24 ساعة (86400 ثانية) للانتقال لليوم التالي
    if (diffSeconds < 0) {
      diffSeconds += 86400;
      // إذا كان offset=0 والوقت مضى، فهذا يعني أن الدرس سيكون غداً، لكننا سنضبط offset ليكون 1
      // لكننا بالفعل نتعامل مع الفرق، ونضيف 86400، وهذا يعطي الفرق الصحيح لليوم التالي.
      // ومع ذلك، لتحديد isToday نستخدم offset الأصلي (قبل الإضافة).
    }

    // نأخذ أصغر فرق موجب (أقرب درس قادم)
    if (diffSeconds < minDiffSeconds) {
      minDiffSeconds = diffSeconds;
      // isToday تكون true إذا كان offset === 0 والوقت لم يبدأ بعد (أي diffSeconds الأصلي موجب)
      // أو إذا كان offset===0 والوقت مضى، فإن diffSeconds بعد الإضافة سيكون >0 لكننا نعتبره غداً
      // لذا نحدد isToday بأن offset === 0 && (startSeconds > currentSeconds)
      const isToday = (offset === 0 && startSeconds > currentSeconds);
      upcomingLesson = {
        day: dayData.day,
        subject: dayData.subject,
        startTime: startTime,
        endTime: timeParts[1].trim(),
        diffSeconds: diffSeconds,
        isToday: isToday
      };
    }
  }

  // تحديث واجهة المستخدم
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

// تحديث البطاقة كل ثانية (عد تنازلي حيوي)
setInterval(updateNextLesson, 1000);
window.toggleEditMode = function() {
  isEditing = !isEditing;
  const btn = document.getElementById('editBtn');
  const btnText = document.getElementById('edit-text');
  const status = document.getElementById('editStatus');
  
  if (isEditing) {
    btnText.innerText = "حفظ";
    btn.classList.add('active');
    status.classList.add('show');
    document.querySelectorAll('.editable-cell').forEach(cell => {
      cell.contentEditable = "true";
    });
  } else {
    btnText.innerText = "تعديل";
    btn.classList.remove('active');
    status.classList.remove('show');
    document.querySelectorAll('.editable-cell').forEach(cell => {
      cell.contentEditable = "false";
    });
    
    // حفظ البيانات المعدلة
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
        subject: tds[1]?.innerText?.replace('المادة: ', '')?.trim() || originalRow.subject || "",
        time: timeText,
        notes: tds[3]?.innerText?.replace('ملاحظات: ', '')?.trim() || originalRow.notes || ""
      });
    });
    set(scheduleRef, updatedSchedule);
  }
};
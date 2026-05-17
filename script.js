const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const form = document.getElementById('classForm');
const monthSelect = document.getElementById('monthSelect');
const yearLabel = document.getElementById('yearLabel');
const selectedDateInput = document.getElementById('selectedDate');
const classTitleInput = document.getElementById('classTitle');
const classTimeInput = document.getElementById('classTime');
const classLocationInput = document.getElementById('classLocation');
const calendarGrid = document.getElementById('calendarGrid');
const addClassBtn = document.getElementById('addClassBtn');
const deleteClassBtn = document.getElementById('deleteClassBtn');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

let currentDate = new Date();
let selectedDate = null;
let selectedEntryIndex = null;

const scheduleKey = 'fitnessCenterSchedule';
const schedule = loadSchedule();

function loadSchedule() {
  try {
    const saved = localStorage.getItem(scheduleKey);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    return {};
  }
}

function saveSchedule() {
  localStorage.setItem(scheduleKey, JSON.stringify(schedule));
}

function initMonthSelect() {
  monthNames.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = name;
    monthSelect.appendChild(option);
  });

  monthSelect.value = currentDate.getMonth();
  yearLabel.textContent = currentDate.getFullYear();
}

function renderCalendar() {
  calendarGrid.innerHTML = ''; 
  yearLabel.textContent = currentDate.getFullYear();
  monthSelect.value = currentDate.getMonth();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let blank = 0; blank < firstDay; blank++) {
    const spacer = document.createElement('div');
    spacer.className = 'day-card empty-day';
    calendarGrid.appendChild(spacer);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = formatDateKey(date);
    const cell = createDayCell(date, schedule[key] || []);
    calendarGrid.appendChild(cell);
  }
}

function createDayCell(date, classes) {
  const dayCard = document.createElement('div');
  dayCard.className = 'day-card';
  dayCard.tabIndex = 0;

  const header = document.createElement('div');
  header.className = 'day-header';
  header.innerHTML = `
    <span class="day-number">${date.getDate()}</span>
    <span class="weekday">${weekdayNames[date.getDay()]}</span>
  `;

  const list = document.createElement('div');
  list.className = 'class-list';

  if (classes.length === 0) {
    const emptyNote = document.createElement('div');
    emptyNote.className = 'class-pill';
    emptyNote.textContent = 'No classes';
    list.appendChild(emptyNote);
  } else {
    classes.slice(0, 3).forEach((entry) => {
      const pill = document.createElement('div');
      pill.className = 'class-pill';
      pill.innerHTML = `
        <strong>${entry.time} • ${entry.title}</strong>
        <span>${entry.location || 'TBD'}</span>
      `;
      list.appendChild(pill);
    });

    if (classes.length > 3) {
      const more = document.createElement('div');
      more.className = 'class-pill';
      more.textContent = `+ ${classes.length - 3} more`;
      list.appendChild(more);
    }
  }

  dayCard.appendChild(header);
  dayCard.appendChild(list);
  dayCard.addEventListener('click', () => openEditor(date));
  dayCard.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      openEditor(date);
    }
  });

  return dayCard;
}

function openEditor(date) {
  selectedDate = date;
  selectedEntryIndex = null;

  selectedDateInput.value = date.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  classTitleInput.value = '';
  classTimeInput.value = '09:00';
  classLocationInput.value = '';
  deleteClassBtn.style.display = 'none';

  const key = formatDateKey(date);
  const entries = schedule[key] || [];

  if (entries.length > 0) {
    const first = entries[0];
    classTitleInput.value = first.title;
    classTimeInput.value = first.time;
    classLocationInput.value = first.location;
    deleteClassBtn.style.display = 'inline-flex';
    selectedEntryIndex = 0;
  }
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function handleFormSubmit(event) {
  event.preventDefault();
  if (!selectedDate) return;

  const key = formatDateKey(selectedDate);
  const entry = {
    title: classTitleInput.value.trim(),
    time: classTimeInput.value,
    location: classLocationInput.value.trim()
  };

  if (!entry.title || !entry.time) return;

  if (!schedule[key]) {
    schedule[key] = [];
  }

  if (selectedEntryIndex !== null && schedule[key][selectedEntryIndex]) {
    schedule[key][selectedEntryIndex] = entry;
  } else {
    schedule[key].push(entry);
  }

  schedule[key].sort((a, b) => a.time.localeCompare(b.time));
  saveSchedule();
  renderCalendar();
}

function handleDelete() {
  if (!selectedDate) return;
  const key = formatDateKey(selectedDate);
  if (!schedule[key]) return;

  if (selectedEntryIndex !== null) {
    schedule[key].splice(selectedEntryIndex, 1);
  }

  if (schedule[key].length === 0) {
    delete schedule[key];
  }

  saveSchedule();
  renderCalendar();
  openEditor(selectedDate);
}

function changeMonth(offset) {
  currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
  renderCalendar();
}

function setMonthFromSelect() {
  const selectedMonth = Number(monthSelect.value);
  currentDate = new Date(currentDate.getFullYear(), selectedMonth, 1);
  renderCalendar();
}

function addDefaultClass() {
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  openEditor(today);
}

form.addEventListener('submit', handleFormSubmit);
deleteClassBtn.addEventListener('click', handleDelete);
prevMonthBtn.addEventListener('click', () => changeMonth(-1));
nextMonthBtn.addEventListener('click', () => changeMonth(1));
monthSelect.addEventListener('change', setMonthFromSelect);
addClassBtn.addEventListener('click', addDefaultClass);

initMonthSelect();
renderCalendar();

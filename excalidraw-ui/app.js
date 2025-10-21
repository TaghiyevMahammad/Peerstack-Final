const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("emptyState");
const pagination = document.getElementById("pagination");
const tableSearch = document.getElementById("tableSearch");

const fName = document.getElementById("fName");
const fFin = document.getElementById("fFin");
const fFrom = document.getElementById("fFrom");
const fTo = document.getElementById("fTo");
const fRole = document.getElementById("fRole");

const btnSearch = document.getElementById("btnSearch");
const btnReset = document.getElementById("btnReset");
const btnToday = document.getElementById("btnToday");

const calendarGrid = document.getElementById("calendarGrid");
const currentDateEl = document.getElementById("currentDate");
const prevDayBtn = document.getElementById("prevDay");
const nextDayBtn = document.getElementById("nextDay");
const calendarSearch = document.getElementById("calendarSearch");
const staffCount = document.getElementById("staffCount");
const guestCount = document.getElementById("guestCount");
const avatarBtn = document.getElementById("avatarBtn");
const userDropdown = document.getElementById("userDropdown");
const btnLogout = document.getElementById("btnLogout");

const pageSize = 8;
let currentPage = 1;
let selectedDate = new Date();
let viewMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

function pad2(n){ return n.toString().padStart(2, "0"); }
function fmtDateOnly(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function parseISODate(str){ const [y,m,day] = str.split("-").map(Number); return new Date(y, m-1, day); }

function seedData(){
  const roles = ["Staff", "Guest"]; 
  const names = [
    "Mahammad Taghiyev","Ilqar Huseynli","Ilqar Ferhadov","Fatima Qasimova","Toghrul Mammadli","Gulnara Mammadova","Aysel Mammadova","Feyruz Alizade","Ilaha Kazimova","Javid Huseynzade",
    "Qara Qarayev","Nigar Mammadova","Rashad Aliyev","Sona Aliyeva","Umayra Mammadova","Sadiq Mesimli","Ali Nabiyev","Nariman Akhundzadeh","Sara Mammadli","Tahir Guliyev",
    "Ulvi Mammadov","Fikret Taghiyev","Emin Haziyev","Xanim Alkhasli","Zahra Isayeva"
  ];
  const today = new Date();
  let arr = [];
  for (let i=0;i<names.length;i++){
    const offset = (i%15) - 7; 
    const d = new Date(today);
    d.setDate(today.getDate()+offset);
    const dateStr = `${fmtDateOnly(d)} ${pad2(8 + (i%10))}:${pad2((i*7)%60)}`;
    const fin = `FIN${pad2(i+1)}${pad2((i*3)%99)}`;
    const role = roles[i%2];
    arr.push({ name: names[i], fin, datetime: dateStr, role });
  }
  return arr;
}

const DATA = seedData();

function filterData(){
  let q = tableSearch.value.trim().toLowerCase();
  let cq = calendarSearch.value.trim().toLowerCase();
  const nameVal = fName.value.trim().toLowerCase();
  const finVal = fFin.value.trim().toLowerCase();
  const roleVal = fRole.value;
  const fromVal = fFrom.value;
  const toVal = fTo.value;
  const selectedDateStr = fmtDateOnly(selectedDate);

  let res = DATA.filter(item => {
    let ok = true;
    if (nameVal) ok = ok && item.name.toLowerCase().includes(nameVal);
    if (finVal) ok = ok && item.fin.toLowerCase().includes(finVal);
    if (roleVal) ok = ok && item.role === roleVal;
    if (fromVal) ok = ok && new Date(item.datetime) >= parseISODate(fromVal);
    if (toVal) ok = ok && new Date(item.datetime) <= new Date(parseISODate(toVal).getTime()+86400000-1);
    if (q) ok = ok && (item.name.toLowerCase().includes(q) || item.fin.toLowerCase().includes(q) || item.role.toLowerCase().includes(q));
    if (cq) ok = ok && (item.name.toLowerCase().includes(cq) || item.fin.toLowerCase().includes(cq));
    const d = fmtDateOnly(new Date(item.datetime));
    ok = ok && d === selectedDateStr;
    return ok;
  });
  return res;
}

function renderTable(){
  const items = filterData();
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (currentPage > totalPages) currentPage = 1;
  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  tableBody.innerHTML = pageItems.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${r.fin}</td>
      <td>${r.datetime}</td>
      <td>${r.role}</td>
    </tr>
  `).join("");

  emptyState.style.display = total === 0 ? "grid" : "none";

  renderPagination(totalPages);
  updateRoleCounters(items);
}

function renderPagination(totalPages){
  let html = "";
  for (let i=1;i<=totalPages;i++){
    html += `<button data-page="${i}" class="${i===currentPage?"active":""}">${i}</button>`;
  }
  pagination.innerHTML = html;
  [...pagination.querySelectorAll("button")].forEach(btn => {
    btn.addEventListener("click", () => {
      currentPage = parseInt(btn.dataset.page, 10);
      renderTable();
    });
  });
}

function updateRoleCounters(items){
  const staff = items.filter(x=>x.role==="Staff").length;
  const guest = items.filter(x=>x.role==="Guest").length;
  staffCount.textContent = `Staff - ${staff}`;
  guestCount.textContent = `Guest - ${guest}`;
}

function setCurrentDateLabel(){
  const d = selectedDate;
  currentDateEl.textContent = fmtDateOnly(d);
}

function buildCalendar(){
  calendarGrid.innerHTML = "";
  const year = viewMonthDate.getFullYear();
  const month = viewMonthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay()+6)%7; 
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const prevDays = startWeekday;
  const totalCells = Math.ceil((prevDays + daysInMonth)/7)*7;

  for (let i=0;i<totalCells;i++){
    const dayEl = document.createElement("button");
    dayEl.className = "day";
    let d;
    if (i < prevDays){
      d = new Date(year, month, i - prevDays + 1);
      dayEl.classList.add("muted");
    } else if (i >= prevDays + daysInMonth){
      d = new Date(year, month+1, i - (prevDays + daysInMonth) + 1);
      dayEl.classList.add("muted");
    } else {
      d = new Date(year, month, i - prevDays + 1);
    }
    dayEl.textContent = d.getDate();
    if (fmtDateOnly(d) === fmtDateOnly(selectedDate)) dayEl.classList.add("selected");
    dayEl.addEventListener("click", () => {
      selectedDate = new Date(d);
      setCurrentDateLabel();
      buildCalendar();
      renderTable();
    });
    calendarGrid.appendChild(dayEl);
  }
}

function goPrevDay(){
  selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()-1);
  viewMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  setCurrentDateLabel();
  buildCalendar();
  renderTable();
}

function goNextDay(){
  selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()+1);
  viewMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  setCurrentDateLabel();
  buildCalendar();
  renderTable();
}

function resetFilters(){
  fName.value = "";
  fFin.value = "";
  fFrom.value = "";
  fTo.value = "";
  fRole.value = "";
  tableSearch.value = "";
  calendarSearch.value = "";
  currentPage = 1;
}

function setToday(){
  const t = fmtDateOnly(new Date());
  fFrom.value = t;
  fTo.value = t;
  selectedDate = parseISODate(t);
  viewMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  setCurrentDateLabel();
  buildCalendar();
}

btnSearch.addEventListener("click", () => { currentPage = 1; renderTable(); });
btnReset.addEventListener("click", () => { resetFilters(); setToday(); renderTable(); });
btnToday.addEventListener("click", () => { setToday(); renderTable(); });

prevDayBtn.addEventListener("click", goPrevDay);
nextDayBtn.addEventListener("click", goNextDay);

tableSearch.addEventListener("input", () => { currentPage = 1; renderTable(); });
calendarSearch.addEventListener("input", () => { currentPage = 1; renderTable(); });

function toggleDropdown(force){
  if (!userDropdown || !avatarBtn) return;
  const open = !userDropdown.hasAttribute("hidden");
  const next = typeof force === "boolean" ? force : !open;
  if (next) {
    userDropdown.removeAttribute("hidden");
    avatarBtn.setAttribute("aria-expanded", "true");
  } else {
    userDropdown.setAttribute("hidden", "");
    avatarBtn.setAttribute("aria-expanded", "false");
  }
}

avatarBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleDropdown();
});

document.addEventListener("click", (e) => {
  if (!userDropdown || userDropdown.hasAttribute("hidden")) return;
  const target = e.target;
  if (avatarBtn && avatarBtn.contains(target)) return;
  if (userDropdown.contains(target)) return;
  toggleDropdown(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") toggleDropdown(false);
});

btnLogout?.addEventListener("click", () => {
  alert("Logged out");
  toggleDropdown(false);
});

function init(){
  setToday();
  setCurrentDateLabel();
  buildCalendar();
  renderTable();
}

init();

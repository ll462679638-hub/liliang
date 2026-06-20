const courts = [
  { id: 'tennis', name: '网球场', meta: '室外 · 硬地 · 标准网球场', type: 'tennis' },
  { id: 'pickleball-1', name: '匹克球 1 号场', meta: '室外 · 硬地 · 标准匹克球场', type: 'pickleball' },
  { id: 'pickleball-2', name: '匹克球 2 号场', meta: '室外 · 硬地 · 标准匹克球场', type: 'pickleball' }
];
const sharePageUrl = 'https://ll462679638-hub.github.io/liliang/share.html';

const slots = {
  morning: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
  afternoon: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  evening: ['19:00', '20:00', '21:00', '22:00']
};

const state = { dateIndex: 0, court: null, time: null, period: 'morning' };
const dateStrip = document.querySelector('#dateStrip');
const courtGrid = document.querySelector('#courtGrid');
const timeGrid = document.querySelector('#timeGrid');
const modal = document.querySelector('#modal');
let dates = [];

function buildDates() {
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(current);
    date.setDate(current.getDate() + i);
    return date;
  });
}

function dateLabel(date, index) {
  if (index === 0) return '今天';
  if (index === 1) return '明天';
  return ['周日','周一','周二','周三','周四','周五','周六'][date.getDay()];
}

function renderDates() {
  dateStrip.innerHTML = dates.map((date, index) => `
    <button class="date-card ${state.dateIndex === index ? 'active' : ''}" data-index="${index}" role="option" aria-selected="${state.dateIndex === index}">
      <span>${dateLabel(date, index)}</span><strong>${date.getDate()}</strong>
    </button>`).join('');
}

function renderCourts() {
  courtGrid.innerHTML = courts.map(court => `
    <button class="court-card ${court.type} ${state.court === court.id ? 'active' : ''}" data-court="${court.id}">
      <div class="court-visual"><div class="mini-court"></div></div>
      <div class="court-copy"><strong>${court.name}</strong><span>${court.meta}</span></div>
      <span class="court-check">✓</span>
    </button>`).join('');
}

function isBusy(time) {
  const court = courts.find(c => c.id === state.court);
  const selectedDate = dates[state.dateIndex];
  const hasBooking = court && getBookings().some(item =>
    item.court === court.name &&
    item.time === time &&
    new Date(item.date).toDateString() === selectedDate.toDateString()
  );
  return Boolean(hasBooking);
}

function renderTimes() {
  timeGrid.innerHTML = slots[state.period].map(time => {
    const busy = isBusy(time);
    return `<button class="time-slot ${state.time === time ? 'active' : ''}" data-time="${time}" ${busy ? 'disabled' : ''}>${time}</button>`;
  }).join('');
}

function updateSummary() {
  const summary = document.querySelector('#selectionSummary');
  const button = document.querySelector('#confirmButton');
  if (!state.court || !state.time) {
    summary.textContent = '请选择场地和时段';
    button.disabled = true;
    return;
  }
  const court = courts.find(c => c.id === state.court);
  const date = dates[state.dateIndex];
  summary.textContent = `${date.getMonth()+1}月${date.getDate()}日 · ${state.time} · ${court.name}`;
  button.disabled = false;
}

function resetTime() { state.time = null; renderTimes(); updateSummary(); }

dateStrip.addEventListener('click', e => {
  const card = e.target.closest('.date-card'); if (!card) return;
  state.dateIndex = Number(card.dataset.index); resetTime(); renderDates();
});

courtGrid.addEventListener('click', e => {
  const card = e.target.closest('.court-card'); if (!card) return;
  state.court = card.dataset.court; resetTime(); renderCourts();
});

document.querySelector('#periodTabs').addEventListener('click', e => {
  const button = e.target.closest('button'); if (!button) return;
  state.period = button.dataset.period; state.time = null;
  document.querySelectorAll('#periodTabs button').forEach(b => b.classList.toggle('active', b === button));
  renderTimes(); updateSummary();
});

timeGrid.addEventListener('click', e => {
  const button = e.target.closest('.time-slot'); if (!button || button.disabled) return;
  if (!state.court) { showToast('请先选择一片场地'); document.querySelector('#courtGrid').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  state.time = button.dataset.time; renderTimes(); updateSummary();
});

document.querySelector('#startBooking').addEventListener('click', () => document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' }));
document.querySelector('#todayButton').addEventListener('click', () => { state.dateIndex = 0; resetTime(); renderDates(); });
document.querySelector('#profileButton').addEventListener('click', () => document.querySelector('#myBookings').scrollIntoView({ behavior: 'smooth' }));

const installModal = document.querySelector('#installModal');
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

function openInstallModal() {
  installModal.classList.add('open');
  installModal.setAttribute('aria-hidden', 'false');
}

function closeInstallModal() {
  installModal.classList.remove('open');
  installModal.setAttribute('aria-hidden', 'true');
}

document.querySelector('#installButton').addEventListener('click', openInstallModal);
document.querySelector('#installClose').addEventListener('click', closeInstallModal);
installModal.addEventListener('click', event => { if (event.target === installModal) closeInstallModal(); });

document.querySelector('.install-tabs').addEventListener('click', event => {
  const button = event.target.closest('[data-install-tab]');
  if (!button) return;
  document.querySelectorAll('[data-install-tab]').forEach(item => item.classList.toggle('active', item === button));
  document.querySelector('#iphoneGuide').classList.toggle('hidden', button.dataset.installTab !== 'iphone');
  document.querySelector('#androidGuide').classList.toggle('hidden', button.dataset.installTab !== 'android');
});

document.querySelector('#nativeInstall').addEventListener('click', async () => {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    closeInstallModal();
    return;
  }
  showToast('请按上方步骤添加到手机桌面');
});

document.querySelector('#shareLink').addEventListener('click', async () => {
  const shareData = { title: '晴朗谷网球场预约', text: '打开晴朗谷网球场预约入口', url: sharePageUrl };
  if (navigator.share) await navigator.share(shareData).catch(() => {});
  else {
    await navigator.clipboard.writeText(sharePageUrl);
    showToast('微信入口链接已复制');
  }
});

function getBookings() { return JSON.parse(localStorage.getItem('ace-bookings') || '[]'); }
function saveBookings(items) { localStorage.setItem('ace-bookings', JSON.stringify(items)); }

document.querySelector('#confirmButton').addEventListener('click', () => {
  if (!state.court || !state.time) return;
  const court = courts.find(c => c.id === state.court);
  const date = dates[state.dateIndex];
  const booking = { id: Date.now(), date: date.toISOString(), court: court.name, time: state.time };
  saveBookings([booking, ...getBookings()]);
  document.querySelector('#modalDetail').innerHTML = `${date.getMonth()+1}月${date.getDate()}日 ${state.time}<br>${court.name} · 1 小时`;
  modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
  state.time = null;
  renderTimes();
  updateSummary();
  renderBookings();
});

function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
document.querySelector('#modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeInstallModal(); } });
document.querySelector('#viewBooking').addEventListener('click', () => { closeModal(); document.querySelector('#myBookings').scrollIntoView({ behavior: 'smooth' }); });

function renderBookings() {
  const bookings = getBookings();
  document.querySelector('#bookingCount').textContent = `${bookings.length} 场`;
  document.querySelector('#bookingList').innerHTML = bookings.length ? bookings.map(item => {
    const date = new Date(item.date);
    return `<article class="booking-item">
      <div class="booking-date"><strong>${date.getDate()}</strong><span>${date.getMonth()+1}月</span></div>
      <div class="booking-info"><strong>${item.court}</strong><span>${item.time} — ${String(parseInt(item.time)+1).padStart(2,'0')}:00 · 1 小时</span></div>
      <button class="cancel-button" data-cancel="${item.id}">取消</button>
    </article>`;
  }).join('') : '<div class="empty-state">还没有预约，选个时间上场吧。</div>';
}

document.querySelector('#bookingList').addEventListener('click', e => {
  const button = e.target.closest('[data-cancel]'); if (!button) return;
  saveBookings(getBookings().filter(item => item.id !== Number(button.dataset.cancel)));
  renderBookings(); renderTimes(); updateSummary(); showToast('预约已取消');
});

let toastTimer;
function showToast(message) {
  const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function syncDatesIfNeeded() {
  const previousFirstDate = dates[0] && dates[0].toDateString();
  buildDates();
  const currentFirstDate = dates[0].toDateString();
  if (previousFirstDate !== currentFirstDate) {
    state.dateIndex = 0;
    state.time = null;
  }
  renderDates();
  renderTimes();
  updateSummary();
}

buildDates();
renderDates();
renderCourts();
renderTimes();
renderBookings();
updateSummary();

setInterval(syncDatesIfNeeded, 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncDatesIfNeeded();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

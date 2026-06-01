const pages = ['dashboard', 'settlements', 'users', 'groupbuys'];

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function updateNavBadge(id, count) {
  const el = document.getElementById(id);
  if (count > 0) {
    el.textContent = count;
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

let settlementData = [];
let settlementShown = 0;
let blockedUserData = [];
let blockedUserShown = 0;
const PAGE_SIZE = 5;

function renderSettlementRows() {
  const tbody = document.getElementById('dashboard-settlement-tbody');
  const rows = settlementData.slice(0, settlementShown);
  tbody.innerHTML = rows.length
    ? rows.map(s => `
        <tr>
          <td class="td-main">${s.title}</td>
          <td>${s.hostNickname}</td>
          <td class="amount">${s.totalAmount.toLocaleString()}원</td>
          <td><span class="chip chip-pending">PENDING</span></td>
        </tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center">대기 중인 정산이 없습니다</td></tr>';

  const btn = document.getElementById('btn-more-settlement');
  btn.style.display = settlementShown < settlementData.length ? '' : 'none';
}

function loadMoreSettlements() {
  settlementShown = Math.min(settlementShown + PAGE_SIZE, settlementData.length);
  renderSettlementRows();
}

function renderBlockedUserRows() {
  const tbody = document.getElementById('dashboard-blocked-tbody');
  const rows = blockedUserData.slice(0, blockedUserShown);
  tbody.innerHTML = rows.length
    ? rows.map(u => `
        <tr>
          <td class="td-main">${u.nickname}</td>
          <td style="color:#f44336;font-weight:600">${u.mannerScore}</td>
        </tr>`).join('')
    : '<tr><td colspan="2" style="text-align:center">차단된 유저가 없습니다</td></tr>';

  const btn = document.getElementById('btn-more-blocked');
  btn.style.display = blockedUserShown < blockedUserData.length ? '' : 'none';
}

function loadMoreBlockedUsers() {
  blockedUserShown = Math.min(blockedUserShown + PAGE_SIZE, blockedUserData.length);
  renderBlockedUserRows();
}

async function loadDashboard() {
  const stats = await getAdminStats();
  document.getElementById('stat-pending').textContent = stats.pendingSettlementCount;
  document.getElementById('stat-active').textContent = stats.activeGroupBuyCount;
  document.getElementById('stat-blocked').textContent = stats.blockedUserCount;
  document.getElementById('stat-today').textContent = stats.todaySignupCount;
  updateNavBadge('nav-badge-settlement', stats.pendingSettlementCount);

  settlementData = await getAdminSettlements('PENDING');
  settlementShown = Math.min(PAGE_SIZE, settlementData.length);
  renderSettlementRows();

  blockedUserData = await getAdminUsers('BLOCKED');
  blockedUserShown = Math.min(PAGE_SIZE, blockedUserData.length);
  renderBlockedUserRows();
}

function showPage(name) {

  pages.forEach(p => {

    const el = document.getElementById('page-' + p);

    if (!el) return;

    el.style.display = (p === name)
      ? 'block'
      : 'none';
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {

    const text = tab.innerText.replace(/\s/g, '');

    if (
      (name === 'dashboard' && text.includes('대시보드')) ||
      (name === 'settlements' && text.includes('정산')) ||
      (name === 'users' && text.includes('유저')) ||
      (name === 'groupbuys' && text.includes('게시글'))
    ) {
      tab.classList.add('active');
    }

  });

}

function showUserDetailModal(user) {

  document.getElementById('u-nickname').textContent = user.nickname;
  document.getElementById('u-email').textContent = user.email;
  document.getElementById('u-join').textContent = user.joinDate;
  document.getElementById('u-score').textContent = user.score;

  document.getElementById('user-detail-modal')
    .classList.add('show');
}

function showSettlementDetailModal(data) {

  document.getElementById('s-title').textContent = data.title;
  document.getElementById('s-host').textContent = data.host;
  document.getElementById('s-date').textContent = data.date;
  document.getElementById('s-place').textContent = data.place;

  const tbody = document.getElementById('s-users');

  tbody.innerHTML = '';

  data.users.forEach(u => {

    tbody.innerHTML += `
      <tr>
        <td>${u.name}</td>
        <td>${u.price}</td>
        <td>${u.pickup ? '완료' : '미완료'}</td>
      </tr>
    `;

  });

  document.getElementById('settlement-detail-modal')
    .classList.add('show');
}

function showPostDetailModal(post) {

  document.getElementById('p-title').textContent = post.title;
  document.getElementById('p-category').textContent = post.category;
  document.getElementById('p-host').textContent = post.host;
  document.getElementById('p-count').textContent = post.count;
  document.getElementById('p-price').textContent = post.price;
  document.getElementById('p-date').textContent = post.date;

  document.getElementById('p-desc').textContent = post.desc;

  const uBody = document.getElementById('p-users');

  uBody.innerHTML = '';

  post.users.forEach(u => {

    uBody.innerHTML += `
      <tr>
        <td>${u.name}</td>
        <td>${u.joinDate}</td>
        <td>${u.status}</td>
      </tr>
    `;

  });

  const hBody = document.getElementById('p-history');

  hBody.innerHTML = '';

  post.history.forEach(h => {

    hBody.innerHTML += `
      <tr>
        <td>${h.action}</td>
        <td>${h.date}</td>
      </tr>
    `;

  });

  document.getElementById('post-detail-modal')
    .classList.add('show');
}

function closeModal() {

  document.querySelectorAll('.modal-overlay')
    .forEach(m => {
      m.classList.remove('show');
    });

}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token || role !== 'ADMIN') {
    window.location.href = 'index.html';
    return;
  }

  fetch('/api/users/me', { headers: { Authorization: 'Bearer ' + token } })
    .then(r => r.json())
    .then(data => { document.getElementById('admin-email').textContent = data.email; });

  loadDashboard();


  document.querySelectorAll('.modal-overlay')
    .forEach(m => {

      m.addEventListener('click', e => {

        if (e.target === m) {
          closeModal();
        }

      });

    });

  document.querySelectorAll('.filter-tabs button')
    .forEach(btn => {

      btn.addEventListener('click', function () {

        const parent = this.parentElement;

        parent.querySelectorAll('button')
          .forEach(b => b.classList.remove('active'));

        this.classList.add('active');

      });

    });

});
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

let allUserData = [];
let currentUserFilter = null;

function getMannerScoreColor(grade) {
  if (grade === 'BLOCKED' || grade === 'BAD') return '#f44336';
  if (grade === 'GREAT' || grade === 'EXCELLENT') return '#4caf50';
  return '#ff9800';
}

function renderUserTable(list) {
  const tbody = document.getElementById('user-tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">유저가 없습니다</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(u => {
    const isBlocked = u.mannerGrade === 'BLOCKED';
    const statusChip = isBlocked
      ? '<span class="chip chip-red">BLOCKED</span>'
      : '<span class="chip chip-blue">ACTIVE</span>';
    const roleChip = u.role === 'ADMIN'
      ? '<span class="chip chip-pending">ADMIN</span>'
      : '<span class="chip">USER</span>';
    const blockBtn = isBlocked
      ? `<button class="btn-sm btn-sm-green" onclick="handleBlockUser(${u.id}, false)">해제</button>`
      : `<button class="btn-sm btn-sm-red" onclick="handleBlockUser(${u.id}, true)">차단</button>`;
    const joinDate = u.createdAt ? u.createdAt.substring(0, 10) : '-';
    return `
      <tr>
        <td class="td-main">${u.nickname}</td>
        <td>${u.email}</td>
        <td>${joinDate}</td>
        <td>${statusChip}</td>
        <td>${roleChip}</td>
        <td>
          ${blockBtn}
          <button class="btn-sm" onclick="showUserDetailModal(${JSON.stringify(u).replace(/"/g, '&quot;')})">상세</button>
        </td>
      </tr>`;
  }).join('');
}

function searchUsers() {
  const keyword = document.getElementById('user-search').value.trim().toLowerCase();
  const filtered = allUserData.filter(u =>
    u.nickname.toLowerCase().includes(keyword) ||
    u.email.toLowerCase().includes(keyword)
  );
  renderUserTable(filtered);
}

async function loadUsers(filter) {
  currentUserFilter = filter;

  document.querySelectorAll('#user-filter-tabs button').forEach(btn => {
    btn.classList.remove('active');
    const text = btn.textContent.trim();
    if (
      (!filter && text === '전체') ||
      (filter === 'BLOCKED' && text === 'BLOCKED') ||
      (filter === 'PREMIUM' && text === '프리미엄')
    ) btn.classList.add('active');
  });

  allUserData = await getAdminUsers(filter);
  renderUserTable(allUserData);
}

function handleBlockUser(userId, isBlock) {
  document.getElementById('block-confirm-title').textContent = isBlock ? '차단' : '차단 해제';
  document.getElementById('block-confirm-msg').textContent = isBlock
    ? '차단하시겠습니까? 해당 유저는 로그인이 불가능해집니다.'
    : '차단을 해제하시겠습니까? 매너점수가 50으로 초기화됩니다.';
  document.getElementById('block-confirm-btn').onclick = async () => {
    closeModal();
    const ok = await blockAdminUser(userId, isBlock);
    if (ok) loadUsers(currentUserFilter);
  };
  document.getElementById('block-confirm-modal').classList.add('show');
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

  if (name === 'users') loadUsers(null);

}

function showUserDetailModal(user) {
  document.getElementById('u-nickname').textContent = user.nickname;
  document.getElementById('u-email').textContent = user.email;
  document.getElementById('u-join').textContent = user.createdAt ? user.createdAt.substring(0, 10) : '-';
  document.getElementById('u-score').textContent = user.mannerScore;
  document.getElementById('u-grade').textContent = user.mannerGrade;
  document.getElementById('u-status').textContent = user.status;
  document.getElementById('u-role').textContent = user.role;
  document.getElementById('u-premium').textContent = user.premium
    ? `프리미엄 (${user.premiumUntil ? user.premiumUntil.substring(0, 10) : ''}까지)`
    : '일반';
  document.getElementById('user-detail-modal').classList.add('show');
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

  document.getElementById('user-search').addEventListener('input', searchUsers);

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
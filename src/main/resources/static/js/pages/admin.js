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
    try {
      await blockAdminUser(userId, isBlock);
      showToast(isBlock ? '차단이 완료됐습니다.' : '차단이 해제됐습니다.');
      loadUsers(currentUserFilter);
    } catch (e) {
      showToast(e.message);
    }
  };
  document.getElementById('block-confirm-modal').classList.add('show');
}

const CATEGORY_MAP = {
  ELECTRONICS: '전자제품',
  HOME_APPLIANCES: '가전제품',
  FURNITURE_INTERIOR: '가구/인테리어',
  HOME_KITCHEN: '생활/주방용품',
  BABY_KIDS: '유아/아동',
  WOMENS_CLOTHING: '여성의류',
  WOMENS_ACCESSORIES: '여성잡화',
  MENS_FASHION_ACCESSORIES: '남성패션/잡화',
  BEAUTY_PERSONAL_CARE: '뷰티/개인관리',
  SPORTS_LEISURE: '스포츠/레저',
  HOBBIES_GAMES_MUSIC: '취미/게임/음악',
  BOOKS: '도서',
  TICKETS_VOUCHERS: '티켓/상품권',
  E_COUPONS: '전자쿠폰',
  PROCESSED_FOODS: '가공식품',
  HEALTH_SUPPLEMENTS: '건강식품/영양제',
  PET_SUPPLIES: '반려동물용품',
  PLANTS: '식물',
  OTHERS: '기타'
};

let allGroupBuyData = [];
let currentGroupBuyStatus = null;

const statusChipMap = {
  OPEN: 'chip-blue', CLOSING: 'chip-pending', CLOSED: 'chip-pending',
  PAYMENT_COMPLETED: 'chip-green', HOST_PURCHASED: 'chip-green',
  PICKUP_READY: 'chip-green', PENDING: 'chip-pending',
  COMPLETED: 'chip-green', EXPIRED: 'chip-red'
};

function renderGroupBuyTable(list) {
  const tbody = document.getElementById('groupbuy-tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">게시글이 없습니다</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(g => {
    const chipClass = statusChipMap[g.status] || '';
    const deadline = g.deadline ? g.deadline.substring(0, 10) : '-';
    return `
      <tr>
        <td class="td-main">${g.title}</td>
        <td>${g.hostNickname}</td>
        <td>${g.currentCount}/${g.maxCount}</td>
        <td>${deadline}</td>
        <td><span class="chip ${chipClass}">${g.status}</span></td>
        <td>
          <button class="btn-sm btn-sm-red" onclick="handleDeleteGroupBuy(${g.id})">삭제</button>
          <button class="btn-sm" onclick="showPostDetailModal(${g.id})">상세</button>
        </td>
      </tr>`;
  }).join('');
}

async function loadGroupBuys(status) {
  currentGroupBuyStatus = status;

  document.querySelectorAll('#groupbuy-filter-tabs button').forEach(btn => {
    btn.classList.remove('active');
    const text = btn.textContent.trim();
    if ((!status && text === '전체') || (status && text === status)) {
      btn.classList.add('active');
    }
  });

  allGroupBuyData = await getAdminGroupBuys(status);
  renderGroupBuyTable(allGroupBuyData);
}

let allSettlementData = [];
let currentSettlementFilter = null;

function renderSettlementTable(list) {
  const tbody = document.getElementById('settlement-tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">정산 내역이 없습니다</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(s => {
    const chipClass = s.status === 'COMPLETED' ? 'chip-green' : 'chip-pending';
    const completeBtn = s.status !== 'COMPLETED'
      ? `<button class="btn-sm btn-sm-green" onclick="handleCompleteSettlement(${s.groupBuyId})">정산 완료</button>`
      : '';
    return `
      <tr>
        <td class="td-main">${s.title}</td>
        <td>${s.hostNickname}</td>
        <td>${s.participantCount}명</td>
        <td class="amount">${s.totalAmount.toLocaleString()}원</td>
        <td>${s.pickupCompletedCount}/${s.pickupTotalCount}</td>
        <td><span class="chip ${chipClass}">${s.status}</span></td>
        <td>
          ${completeBtn}
          <button class="btn-sm" onclick="showSettlementDetailModal(${s.groupBuyId})">상세</button>
        </td>
      </tr>`;
  }).join('');
}

async function loadSettlements(filter) {
  currentSettlementFilter = filter;

  document.querySelectorAll('#settlement-filter-tabs button').forEach(btn => {
    btn.classList.remove('active');
    const text = btn.textContent.trim();
    if ((!filter && text === '전체') || (filter && text === filter)) {
      btn.classList.add('active');
    }
  });

  allSettlementData = await getAdminSettlements(filter);
  renderSettlementTable(allSettlementData);
}

let allRefundData = [];
let currentRefundStatus = null;

function getPickupFillClass(completed, total) {
  if (total === 0) return 'none';
  const ratio = completed / total;
  if (ratio === 0) return 'none';
  if (ratio === 1) return 'full';
  return 'partial';
}

function renderRefundTable(list) {
  const tbody = document.getElementById('refund-tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center">환불 내역이 없습니다</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(r => {
    const deadline = r.pickupDeadline ? r.pickupDeadline.substring(0, 10) : '-';
    const isDone = r.refundStatus === '환불완료';
    const statusChip = isDone
      ? '<span class="chip chip-refund-done">환불 완료</span>'
      : '<span class="chip chip-refund">환불 대기</span>';
    const actionBtn = `<button class="btn-sm" onclick="showRefundActionModal(${r.groupBuyId})">상세</button>`;
    return `
      <tr>
        <td class="td-main">${r.title}</td>
        <td>
          <div>${r.hostNickname}</div>
          <div class="score-text">매너점수 ${r.hostMannerScore}</div>
        </td>
        <td><span class="${isDone ? 'deadline-text' : 'deadline-badge'}">${deadline} 만료</span></td>
        <td class="${isDone ? 'amount-gray' : 'amount-red'}">${r.refundTotal.toLocaleString()}원</td>
        <td>${statusChip}</td>
        <td>${actionBtn}</td>
      </tr>`;
  }).join('');
}

async function loadRefunds() {
  allRefundData = await getAdminRefunds();
  const pendingCount = allRefundData.filter(r => r.refundStatus === '환불대기').length;
  const badge = document.getElementById('refund-badge');
  if (pendingCount > 0) {
    badge.textContent = `환불 대기 ${pendingCount}건`;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
  filterRefunds(currentRefundStatus);
}

function filterRefunds(status) {
  currentRefundStatus = status;
  document.querySelectorAll('#refund-filter-tabs button').forEach(btn => {
    btn.classList.remove('active');
    const text = btn.textContent.trim();
    if (
      (!status && text === '전체') ||
      (status === '환불대기' && text === '환불 대기') ||
      (status === '환불완료' && text === '환불 완료')
    ) btn.classList.add('active');
  });
  const filtered = status ? allRefundData.filter(r => r.refundStatus === status) : allRefundData;
  renderRefundTable(filtered);
}

function searchRefunds() {
  const keyword = document.getElementById('refund-search').value.trim().toLowerCase();
  const base = currentRefundStatus ? allRefundData.filter(r => r.refundStatus === currentRefundStatus) : allRefundData;
  renderRefundTable(base.filter(r =>
    r.title.toLowerCase().includes(keyword) ||
    r.hostNickname.toLowerCase().includes(keyword)
  ));
}

function showRefundActionModal(id) {
  const r = allRefundData.find(r => r.groupBuyId === id);
  if (!r) return;

  const pct = r.pickupTotalCount > 0 ? Math.round(r.pickupCompletedCount / r.pickupTotalCount * 100) : 0;
  const fillClass = getPickupFillClass(r.pickupCompletedCount, r.pickupTotalCount);

  document.getElementById('rd-title').textContent = r.title;
  document.getElementById('rd-host').textContent = r.hostNickname;
  document.getElementById('rd-score').textContent = r.hostMannerScore;
  document.getElementById('rd-count').textContent = r.participantCount + '명';
  document.getElementById('rd-pickup').innerHTML = `
    <div class="pickup-progress">
      <div class="pickup-bar"><div class="pickup-fill ${fillClass}" style="width:${pct}%"></div></div>
      <span class="pickup-count ${fillClass === 'none' ? 'red' : ''}" ${fillClass === 'partial' ? 'style="color:#ff9800"' : ''}>${r.pickupCompletedCount}/${r.pickupTotalCount}</span>
    </div>`;
  document.getElementById('rd-deadline').textContent = r.pickupDeadline ? r.pickupDeadline.substring(0, 10) : '-';
  document.getElementById('rd-total').textContent = r.refundTotal.toLocaleString() + '원';
  document.getElementById('rd-status').textContent = r.refundStatus;

  const isDoneFoot = r.refundStatus === '환불완료';
  const foot = document.getElementById('refund-action-foot');
  foot.innerHTML = `
    ${!isDoneFoot ? '<p class="modal-info-text">스케줄러가 자동으로 환불 처리합니다.</p>' : ''}
    <button class="btn btn-outline" onclick="closeModal()">닫기</button>`;

  document.getElementById('refund-action-modal').classList.add('show');
}

function searchSettlements() {
  const keyword = document.getElementById('settlement-search').value.trim().toLowerCase();
  const filtered = allSettlementData.filter(s =>
    s.title.toLowerCase().includes(keyword) ||
    s.hostNickname.toLowerCase().includes(keyword)
  );
  renderSettlementTable(filtered);
}

function handleCompleteSettlement(id) {
  document.getElementById('settlement-complete-btn').onclick = async () => {
    closeModal();
    const ok = await completeAdminSettlement(id);
    if (ok) {
      loadSettlements(currentSettlementFilter);
      getAdminStats().then(stats => updateNavBadge('nav-badge-settlement', stats.pendingSettlementCount));
    }
  };
  document.getElementById('settlement-complete-modal').classList.add('show');
}

function searchGroupBuys() {
  const keyword = document.getElementById('groupbuy-search').value.trim().toLowerCase();
  const filtered = allGroupBuyData.filter(g =>
    g.title.toLowerCase().includes(keyword) ||
    g.hostNickname.toLowerCase().includes(keyword)
  );
  renderGroupBuyTable(filtered);
}

function handleDeleteGroupBuy(id) {
  document.getElementById('delete-confirm-btn').onclick = async () => {
    closeModal();
    const ok = await deleteAdminGroupBuy(id);
    if (ok) loadGroupBuys(currentGroupBuyStatus);
  };
  document.getElementById('delete-confirm-modal').classList.add('show');
}

async function showPostDetailModal(id) {
  const data = await getAdminGroupBuyDetail(id);

  document.getElementById('p-title').textContent = data.title;
  document.getElementById('p-category').textContent = CATEGORY_MAP[data.category] || data.category;
  document.getElementById('p-host').textContent = data.hostNickname;
  document.getElementById('p-count').textContent = `${data.currentCount}/${data.maxCount}`;
  document.getElementById('p-date').textContent = data.deadline ? data.deadline.substring(0, 10) : '-';
  document.getElementById('p-status').textContent = data.status;
  const firstHistory = data.history && data.history[0];
  document.getElementById('p-created').textContent = firstHistory && firstHistory.date
    ? firstHistory.date.substring(0, 10) : '-';
  document.getElementById('p-desc').textContent = data.description || '-';

  const uBody = document.getElementById('p-users');
  uBody.innerHTML = (data.participants || []).map(u => `
    <tr>
      <td>${u.nickname}</td>
      <td>${u.joinDate ? u.joinDate.substring(0, 10) : '-'}</td>
      <td>${u.statusLabel}</td>
    </tr>`).join('') || '<tr><td colspan="3">참여자 없음</td></tr>';

  document.getElementById('post-detail-modal').classList.add('show');
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

  if (name === 'dashboard') loadDashboard();
  if (name === 'settlements') { loadSettlements(null); loadRefunds(); }
  if (name === 'users') loadUsers(null);
  if (name === 'groupbuys') loadGroupBuys(null);

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

async function showSettlementDetailModal(id) {
  const data = await getAdminSettlementDetail(id);

  document.getElementById('s-title').textContent = data.title;
  document.getElementById('s-host').textContent = data.hostNickname;
  document.getElementById('s-date').textContent = data.deadline ? data.deadline.substring(0, 10) : '-';
  document.getElementById('s-place').textContent = data.pickupLocation || '-';
  document.getElementById('s-total').textContent = data.totalAmount.toLocaleString() + '원';
  document.getElementById('s-pickup').textContent = `${data.pickupCompletedCount}/${data.pickupTotalCount}`;
  document.getElementById('s-status').textContent = data.status;

  document.getElementById('s-users').innerHTML = (data.participants || []).map(u => `
    <tr>
      <td>${u.nickname}</td>
      <td>${u.amount.toLocaleString()}원</td>
      <td>${u.pickupCompleted ? '완료' : '미완료'}</td>
    </tr>`).join('') || '<tr><td colspan="3">참여자 없음</td></tr>';

  document.getElementById('settlement-detail-modal').classList.add('show');
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

  document.getElementById('settlement-search').addEventListener('input', searchSettlements);
  document.getElementById('refund-search').addEventListener('input', searchRefunds);
  document.getElementById('user-search').addEventListener('input', searchUsers);
  document.getElementById('groupbuy-search').addEventListener('input', searchGroupBuys);

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
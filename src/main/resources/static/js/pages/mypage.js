checkTokenExpiry();
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

const STATUS_LABEL = {
  OPEN: '모집중', CLOSING: '마감임박', CLOSED: '모집완료',
  PAYMENT_COMPLETED: '결제완료', HOST_PURCHASED: '주문완료',
  PICKUP_READY: '픽업준비', PENDING: '정산대기',
  COMPLETED: '거래완료', EXPIRED: '만료'
};
const STATUS_CLASS = {
  OPEN: 'badge-open', CLOSING: 'badge-closing', CLOSED: 'badge-closed',
  PAYMENT_COMPLETED: 'badge-payment', HOST_PURCHASED: 'badge-purchased',
  PICKUP_READY: 'badge-pickup', PENDING: 'badge-progress',
  COMPLETED: 'badge-done', EXPIRED: 'badge-expired'
};
const MANNER_GRADE_MAP = {
  LEGEND: { emoji: '👑', cls: 'legend' },
  GREAT:  { emoji: '😄', cls: 'great'  },
  GOOD:   { emoji: '🙂', cls: 'good'   },
  SOSO:   { emoji: '😐', cls: 'soso'   },
  BAD:    { emoji: '😢', cls: 'bad'    },
  BLOCKED:{ emoji: '🚫', cls: 'blocked' },
};

let pendingAction = null;

// ─── 내 정보 ───

async function initMyProfile() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  try {
    const [profile, createdList, participations, reviews] = await Promise.all([
      getMyProfile(),
      getGroupBuysByHost(userId),
      getMyParticipations(),
      getReceivedReviews(userId),
    ]);

    document.getElementById('profile-img').src = profile.profileImage || 'images/default-profile.png';
    document.getElementById('profile-nickname').textContent = profile.nickname;
    document.getElementById('profile-email').textContent = profile.email;

    const grade = MANNER_GRADE_MAP[profile.mannerGrade] || { emoji: '', cls: '' };
    const gradeEl = document.getElementById('profile-manner-grade');
    gradeEl.className = 'manner-grade ' + grade.cls;
    gradeEl.textContent = grade.emoji + ' ' + profile.mannerGrade;

    document.getElementById('profile-manner-score').textContent = profile.mannerScore.toFixed(1);
    document.getElementById('profile-manner-bar').style.width = profile.mannerScore + '%';

    document.getElementById('premium-box').style.display = profile.premiumActive ? 'none' : '';

    const doneCount = createdList.filter(g => g.status === 'COMPLETED').length
                    + participations.filter(p => p.groupBuyStatus === 'COMPLETED').length;
    const monthlyLimit = profile.monthlyGroupBuyCreateLimit ?? '무제한';
    document.getElementById('profile-join-count').textContent = participations.length;
    document.getElementById('profile-create-count').textContent = createdList.length;
    document.getElementById('profile-done-count').textContent = doneCount;
    document.getElementById('profile-monthly-count').textContent = profile.monthlyGroupBuyCreateCount + '/' + monthlyLimit;

    const previewEl = document.getElementById('review-preview-text');
    if (reviews.length) {
      const latest = reviews[0];
      const emoji = { BAD: '👎', GOOD: '👍', GREAT: '⭐' }[latest.rating] || '';
      const text = latest.checkedItems?.[0] || { BAD: '별로예요', GOOD: '좋아요', GREAT: '최고예요' }[latest.rating] || '';
      previewEl.textContent = emoji + ' "' + text + '"';
    } else {
      previewEl.textContent = '아직 받은 후기가 없습니다.';
    }
  } catch (e) {
    showToast(e.message || '프로필을 불러오는데 실패했습니다.');
  }
}

async function showReceivedReviewsModal() {
  const userId = localStorage.getItem('userId');
  const wrap = document.getElementById('received-reviews-wrap');
  wrap.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:1rem">불러오는 중...</p>';
  showMypageModal('modal-received-reviews');
  try {
    const reviews = await getReceivedReviews(userId);
    if (!reviews.length) {
      wrap.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:1rem">아직 받은 후기가 없습니다.</p>';
      return;
    }
    const RATING_COLOR = { BAD: '#ef4444', GOOD: '#16a34a', GREAT: '#f59e0b' };
    const RATING_EMOJI = { BAD: '👎', GOOD: '👍', GREAT: '⭐' };
    const RATING_LABEL = { BAD: '별로예요', GOOD: '좋아요', GREAT: '최고예요' };
    wrap.innerHTML = reviews.map(r => {
      const color = RATING_COLOR[r.rating] || '#374151';
      const emoji = RATING_EMOJI[r.rating] || '';
      const label = RATING_LABEL[r.rating] || r.rating;
      const date = new Date(r.createdAt).toLocaleDateString('ko-KR');
      const items = r.checkedItems?.length
        ? `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.4rem">${r.checkedItems.map(i => `<span style="background:#f3f4f6;border-radius:999px;padding:0.25rem 0.6rem;font-size:0.8rem">${i}</span>`).join('')}</div>`
        : '';
      return `<div style="border-bottom:1px solid #f3f4f6;padding:0.75rem 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:600;color:${color}">${emoji} ${label}</span>
          <span style="font-size:0.75rem;color:#9ca3af">${r.reviewerNickname} · ${date}</span>
        </div>
        ${items}
      </div>`;
    }).join('');
  } catch (e) {
    wrap.innerHTML = '<p style="text-align:center;color:#ef4444;padding:1rem">불러오기 실패</p>';
  }
}

// ─── 생성한 공동구매 ───

async function initCreatedGroupBuys() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  try {
    const list = (await getGroupBuysByHost(userId)).sort((a, b) => b.id - a.id);
    const container = document.getElementById('created-list');
    const emptyEl = document.getElementById('created-empty');
    if (!list.length) {
      container.querySelectorAll('.group-card').forEach(el => el.remove());
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    const reviewMap = {};
    const completedItems = list.filter(g => g.status === 'COMPLETED');
    if (completedItems.length) {
      const results = await Promise.all(
        completedItems.map(g => canReviewGroupBuy(g.id).catch(() => ({ status: 'EXPIRED' })))
      );
      completedItems.forEach((g, i) => { reviewMap[g.id] = results[i].status; });
    }
    renderCreatedCards(list, reviewMap);
    bindCreatedEvents();
  } catch (e) {
    showToast(e.message || '목록을 불러오는데 실패했습니다.');
  }
}

function renderCreatedCards(list, reviewMap) {
  const container = document.getElementById('created-list');
  container.querySelectorAll('.group-card').forEach(el => el.remove());
  list.forEach(g => {
    const card = document.createElement('div');
    card.className = 'group-card created-card';
    card.dataset.id = g.id;
    const btnsHtml = getCreatedButtons(g, reviewMap[g.id]);
    card.innerHTML = `
      <div class="card-img-placeholder"></div>
      <div class="card-body">
        <div class="card-title-row">
          <span class="card-status ${STATUS_CLASS[g.status] || ''}">${STATUS_LABEL[g.status] || g.status}</span>
          <h3 class="card-title">${g.title}</h3>
        </div>
        <p class="card-meta"><span class="card-label">인원</span>${g.currentParticipants} / ${g.maxParticipants}명</p>
        <p class="card-meta"><span class="card-label">픽업</span>${formatPickupLocation(g.pickupLocation) || '-'}</p>
      </div>
      ${btnsHtml ? `<div class="card-actions">${btnsHtml}</div>` : ''}
    `;
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-actions')) {
        location.href = 'detail.html?id=' + g.id;
      }
    });
    container.appendChild(card);
  });
}

function getCreatedButtons(g, canReview) {
  const { status: s, id } = g;
  if (s === 'OPEN' || s === 'CLOSING')
    return `<button class="btn btn-outline btn-created-delete" data-id="${id}">삭제하기</button>`;
  if (s === 'CLOSED')
    return `<button class="btn btn-outline btn-progress" data-id="${id}">진행 현황</button>`;
  if (s === 'PAYMENT_COMPLETED')
    return `<button class="btn btn-outline btn-progress" data-id="${id}">진행 현황</button>
            <button class="btn btn-primary btn-host-purchase" data-id="${id}">주문 완료</button>`;
  if (s === 'HOST_PURCHASED')
    return `<button class="btn btn-outline btn-progress" data-id="${id}">진행 현황</button>
            <button class="btn btn-primary btn-pickup-ready" data-id="${id}">수령 완료</button>`;
  if (s === 'PICKUP_READY')
    return `<button class="btn btn-outline btn-progress" data-id="${id}">진행 현황</button>`;
  if (s === 'PENDING')
    return `<button class="btn btn-outline btn-settlement" data-id="${id}">정산 준비 중</button>`;
  if (s === 'COMPLETED') {
    return `<button class="btn btn-primary btn-review-status" data-id="${id}" data-can-review="${canReview}">후기 현황</button>`;
  }
  return '';
}

function bindCreatedEvents() {
  const container = document.getElementById('created-list');
  container.querySelectorAll('.btn-created-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingAction = async () => {
        await deleteGroupBuy(btn.dataset.id);
        showToast('삭제되었습니다.');
        await initCreatedGroupBuys();
      };
      showMypageModal('modal-delete');
    });
  });
  container.querySelectorAll('.btn-progress').forEach(btn => {
    btn.addEventListener('click', () => showProgressModal(btn.dataset.id));
  });
  container.querySelectorAll('.btn-host-purchase').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingAction = async () => {
        await completeHostPurchase(btn.dataset.id);
        showToast('주문 완료 처리되었습니다.');
        await initCreatedGroupBuys();
      };
      showMypageModal('modal-host-purchase');
    });
  });
  container.querySelectorAll('.btn-pickup-ready').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingAction = async () => {
        await markPickupReady(btn.dataset.id);
        showToast('수령 완료 처리되었습니다.');
        await initCreatedGroupBuys();
      };
      showMypageModal('modal-pickup-ready');
    });
  });
  container.querySelectorAll('.btn-settlement').forEach(btn => {
    btn.addEventListener('click', () => showToast('정산 기능은 준비 중입니다.'));
  });
  container.querySelectorAll('.btn-review-status').forEach(btn => {
    btn.addEventListener('click', () => showReviewStatusModal(btn.dataset.id, btn.dataset.canReview));
  });
}

async function showProgressModal(groupBuyId) {
  const wrap = document.getElementById('progress-table-wrap');
  wrap.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:1rem">불러오는 중...</p>';
  showMypageModal('modal-progress');
  try {
    const participants = await getParticipants(groupBuyId);
    if (!participants.length) {
      wrap.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:1rem">참여자가 없습니다.</p>';
      return;
    }
    const rows = participants.map(p => {
      const pickup = p.pickupTime
        ? new Date(p.pickupTime).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '-';
      let statusText, statusColor;
      if (p.pickupCompletedAt) {
        statusText = '수령 완료'; statusColor = '#84cc16';
      } else if (p.groupBuyStatus === 'PICKUP_READY' && p.paymentConfirmed) {
        statusText = '픽업 대기'; statusColor = '#6b7280';
      } else if (p.paymentConfirmed) {
        statusText = '결제 완료'; statusColor = '#2563eb';
      } else {
        statusText = '결제 대기'; statusColor = '#9ca3af';
      }
      return `<tr>
        <td>${p.participantNickname}</td>
        <td>${pickup}</td>
        <td style="color:${statusColor};font-weight:600">${statusText}</td>
      </tr>`;
    }).join('');
    wrap.innerHTML = `<table class="progress-table">
      <thead><tr><th>닉네임</th><th>픽업 일시</th><th>상태</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  } catch (e) {
    wrap.innerHTML = '<p style="text-align:center;color:#ef4444;padding:1rem">불러오기 실패</p>';
  }
}

async function showReviewStatusModal(groupBuyId, canReview) {
  const wrap = document.getElementById('review-status-table-wrap');
  wrap.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:1rem">불러오는 중...</p>';
  showMypageModal('modal-review-status');
  try {
    const statuses = await getHostReviewStatuses(groupBuyId);
    if (!statuses.length) {
      wrap.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:1rem">참여자가 없습니다.</p>';
      return;
    }
    const isExpired = canReview === 'EXPIRED';
    const rows = statuses.map(p => {
      const pickup = p.pickupTime
        ? new Date(p.pickupTime).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '-';
      let reviewBtn;
      if (isExpired) {
        reviewBtn = `<button class="btn btn-outline btn-sm" disabled>기한 만료</button>`;
      } else if (p.reviewed) {
        reviewBtn = `<button class="btn btn-outline btn-sm btn-view-sent-review" data-id="${groupBuyId}" data-reviewee-id="${p.participantId}">보낸 후기 보기</button>`;
      } else {
        reviewBtn = `<a href="review.html?id=${groupBuyId}&role=host&participantId=${p.participantId}" class="btn btn-primary btn-sm">후기 보내기</a>`;
      }
      return `<tr>
        <td>${p.nickname}</td>
        <td>${pickup}</td>
        <td>${reviewBtn}</td>
      </tr>`;
    }).join('');
    wrap.innerHTML = `<table class="progress-table">
      <thead><tr><th>닉네임</th><th>픽업 일시</th><th>후기</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
    wrap.querySelectorAll('.btn-view-sent-review').forEach(btn => {
      btn.addEventListener('click', () => showSentReviewModal(btn.dataset.id, btn.dataset.revieweeId));
    });
  } catch (e) {
    wrap.innerHTML = '<p style="text-align:center;color:#ef4444;padding:1rem">불러오기 실패</p>';
  }
}

// ─── 모달 유틸 ───

function showMypageModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideMypageModal(id) { document.getElementById(id).style.display = 'none'; }

async function runPendingAction(modalId) {
  hideMypageModal(modalId);
  if (!pendingAction) return;
  try { await pendingAction(); } catch (e) { showToast(e.message || '처리에 실패했습니다.'); }
  finally { pendingAction = null; }
}

document.getElementById('btn-delete-cancel').addEventListener('click', () => hideMypageModal('modal-delete'));
document.getElementById('btn-delete-confirm').addEventListener('click', () => runPendingAction('modal-delete'));
document.getElementById('btn-purchase-cancel').addEventListener('click', () => hideMypageModal('modal-host-purchase'));
document.getElementById('btn-purchase-confirm').addEventListener('click', () => runPendingAction('modal-host-purchase'));
document.getElementById('btn-pickup-cancel').addEventListener('click', () => hideMypageModal('modal-pickup-ready'));
document.getElementById('btn-pickup-confirm').addEventListener('click', () => runPendingAction('modal-pickup-ready'));
document.getElementById('btn-progress-close').addEventListener('click', () => hideMypageModal('modal-progress'));
document.getElementById('btn-review-status-close').addEventListener('click', () => hideMypageModal('modal-review-status'));

// ─── 탭 이벤트 ───

document.getElementById('tab1').addEventListener('change', initMyProfile);
if (document.getElementById('tab1').checked) initMyProfile();
document.getElementById('tab2').addEventListener('change', initJoinedGroupBuys);
if (document.getElementById('tab2').checked) initJoinedGroupBuys();
document.getElementById('tab3').addEventListener('change', initCreatedGroupBuys);
if (document.getElementById('tab3').checked) initCreatedGroupBuys();

const tabParam = new URLSearchParams(location.search).get('tab');
if (tabParam === 'joined') {
  document.getElementById('tab2').checked = true;
  initJoinedGroupBuys();
} else if (tabParam === 'created') {
  document.getElementById('tab3').checked = true;
  initCreatedGroupBuys();
}

window.addEventListener('pageshow', () => {
  if (document.getElementById('tab3').checked) initCreatedGroupBuys();
  else if (document.getElementById('tab2').checked) initJoinedGroupBuys();
  else initMyProfile();
});

document.getElementById('btn-review-more').addEventListener('click', showReceivedReviewsModal);
document.getElementById('btn-received-reviews-close').addEventListener('click', () => hideMypageModal('modal-received-reviews'));
document.getElementById('btn-profile-edit').addEventListener('click', () => showToast('프로필 수정 페이지는 준비 중입니다.'));
document.getElementById('btn-withdraw').addEventListener('click', () => showToast('회원 탈퇴 기능은 준비 중입니다.'));

// ─── 참여한 공동구매 ───

const JOINED_STEPS = [
  { label: '결제 대기', status: 'CLOSED' },
  { label: '결제 완료', status: 'PAYMENT_COMPLETED' },
  { label: '주문 완료', status: 'HOST_PURCHASED' },
  { label: '픽업 준비', status: 'PICKUP_READY' },
  { label: '픽업 완료', status: 'COMPLETED' },
];
const STATUS_ORDER = ['CLOSED', 'PAYMENT_COMPLETED', 'HOST_PURCHASED', 'PICKUP_READY', 'COMPLETED'];
const STEP_DESCRIPTIONS = {
  CLOSED: '참여자 전원의 결제를 기다리는 중입니다.',
  PAYMENT_COMPLETED: '모든 결제가 완료되었습니다. 호스트가 물품을 주문할 예정입니다.',
  HOST_PURCHASED: '호스트가 물품을 주문했습니다. 배송을 기다리는 중입니다.',
  PICKUP_READY: '물품이 도착했습니다. 지정된 장소에서 픽업해 주세요.',
  COMPLETED: '거래가 완료되었습니다.',
};
const TOSS_CLIENT_KEY = 'test_ck_pP2YxJ4K87qv9b6gpBnJVRGZwXLO';

async function initJoinedGroupBuys() {
  try {
    const list = (await getMyParticipations()).sort((a, b) => b.id - a.id);
    const emptyEl = document.getElementById('joined-empty');
    if (!list.length) { emptyEl.style.display = 'block'; return; }
    emptyEl.style.display = 'none';
    const reviewMap = {};
    const completedItems = list.filter(p => p.groupBuyStatus === 'COMPLETED');
    if (completedItems.length) {
      const results = await Promise.all(
        completedItems.map(p => canReviewGroupBuy(p.groupBuyId).catch(() => ({ status: 'EXPIRED' })))
      );
      completedItems.forEach((p, i) => { reviewMap[p.groupBuyId] = results[i].status; });
    }
    renderJoinedCards(list, reviewMap);
    bindJoinedEvents();
  } catch (e) {
    showToast(e.message || '목록을 불러오는데 실패했습니다.');
  }
}

function renderJoinedCards(list, reviewMap) {
  const container = document.getElementById('joined-list');
  container.querySelectorAll('.group-card').forEach(el => el.remove());
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'group-card created-card';
    card.dataset.id = p.groupBuyId;
    const btnsHtml = getJoinedButtons(p, reviewMap[p.groupBuyId]);
    const pickupText = formatJoinedPickup(p);
    card.innerHTML = `
      <div class="card-img-placeholder"></div>
      <div class="card-body">
        <div class="card-title-row">
          <span class="card-status ${p.groupBuyDeleted ? 'badge-expired' : (p.pickupCompletedAt && p.groupBuyStatus === 'PICKUP_READY' ? 'badge-pickup-done' :(STATUS_CLASS[p.groupBuyStatus] || ''))}">${p.groupBuyDeleted ? '삭제됨' : (p.pickupCompletedAt && p.groupBuyStatus === 'PICKUP_READY' ? '픽업완료' : (STATUS_LABEL[p.groupBuyStatus] || p.groupBuyStatus))}</span>
          <h3 class="card-title">${p.groupBuyTitle}</h3>
        </div>
        <p class="card-meta"><span class="card-label">인원</span>${p.currentParticipants} / ${p.maxParticipants}명</p>
        <p class="card-meta"><span class="card-label">픽업</span>${pickupText}</p>
      </div>
      ${btnsHtml ? `<div class="card-actions">${btnsHtml}</div>` : ''}
    `;
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-actions')) {
        if (p.groupBuyDeleted) {
          showToast('삭제된 공동구매입니다.');
          return;
        }
        location.href = 'detail.html?id=' + p.groupBuyId;
      }
    });
    container.appendChild(card);
  });
}

function formatJoinedPickup(p) {
  if (!p.pickupLocation) return '-';
  const loc = formatPickupLocation(p.pickupLocation);
  if (!p.pickupTime) return loc;
  const d = new Date(p.pickupTime);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours < 12 ? '오전' : '오후';
  const h = hours % 12 || 12;
  return `${loc} (${month}/${day} ${ampm} ${h}:${minutes})`;
}

function getJoinedButtons(p, canReview) {
  if (p.groupBuyDeleted) return '';
  const s = p.groupBuyStatus;
  const id = p.groupBuyId;
  const safeTitle = (p.groupBuyTitle || '').replace(/"/g, '&quot;');
  const safeLoc = formatPickupLocation(p.pickupLocation || '').replace(/"/g, '&quot;');
  const progressBtn = `<button class="btn btn-outline btn-joined-progress" data-status="${s}" data-title="${safeTitle}" data-location="${safeLoc}" data-time="${p.pickupTime || ''}" data-payment="${p.paymentConfirmed}" data-pickup-done="${!!p.pickupCompletedAt}">진행 현황</button>`;
  if (s === 'CLOSED') {
    const payBtn = p.paymentConfirmed
      ? `<button class="btn btn-outline" disabled>결제 완료</button>`
      : `<button class="btn btn-primary btn-joined-payment" data-id="${id}" data-amount="${p.paymentAmount}" data-title="${safeTitle}">결제하기</button>`;
    return `${progressBtn}${payBtn}`;
  }
  if (s === 'PAYMENT_COMPLETED' || s === 'HOST_PURCHASED' || s === 'PENDING')
    return progressBtn;
  if (s === 'PICKUP_READY') {
    const pickupBtn = p.pickupCompletedAt
      ? `<button class="btn btn-outline" disabled>수령 완료</button>`
      : `<button class="btn btn-primary btn-joined-pickup" data-id="${id}">수령 완료</button>`;
    return `${progressBtn}${pickupBtn}`;
  }
  if (s === 'COMPLETED') {
    if (canReview === 'AVAILABLE') return `<a href="review.html?id=${id}&role=participant" class="btn btn-primary">후기 보내기</a>`;
    if (canReview === 'ALREADY_REVIEWED') return `<button class="btn btn-outline btn-view-sent-review" data-id="${id}">보낸 후기 보기</button>`;
    return `<button class="btn btn-outline" disabled>기한 만료</button>`;
  }
  return '';
}

function bindJoinedEvents() {
  const container = document.getElementById('joined-list');
  container.querySelectorAll('.btn-joined-progress').forEach(btn => {
    btn.addEventListener('click', () => showJoinedProgressModal(
      btn.dataset.status, btn.dataset.title, btn.dataset.location, btn.dataset.time, btn.dataset.payment === 'true', btn.dataset.pickupDone === 'true'
    ));
  });
  container.querySelectorAll('.btn-joined-pickup').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingAction = async () => {
        await completePickup(btn.dataset.id);
        showToast('수령 완료 처리되었습니다.');
        await initJoinedGroupBuys();
      };
      showMypageModal('modal-joined-pickup');
    });
  });
  container.querySelectorAll('.btn-joined-payment').forEach(btn => {
    btn.addEventListener('click', () => {
      openJoinedPaymentModal(btn.dataset.id, btn.dataset.title, Number(btn.dataset.amount));
    });
  });
  container.querySelectorAll('.btn-view-sent-review').forEach(btn => {
    btn.addEventListener('click', () => showSentReviewModal(btn.dataset.id));
  });
}

function showJoinedProgressModal(currentStatus, title, location, timeStr, paymentConfirmed, pickupDone) {
  const titleEl = document.getElementById('joined-progress-title');
  const pickupEl = document.getElementById('joined-progress-pickup');

  titleEl.textContent = title || '';

  if (location) {
    let pickupText = location;
    if (timeStr) {
      const d = new Date(timeStr);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours < 12 ? '오전' : '오후';
      const h = hours % 12 || 12;
      pickupText = `${location} (${month}/${day} ${ampm} ${h}:${minutes})`;
    }
    pickupEl.innerHTML = '';
    const label = document.createElement('span');
    label.className = 'card-label';
    label.textContent = '픽업';
    pickupEl.appendChild(label);
    pickupEl.appendChild(document.createTextNode(pickupText));
    pickupEl.style.display = '';
  } else {
    pickupEl.style.display = 'none';
  }

  const paymentEl = document.getElementById('joined-progress-payment');
  paymentEl.innerHTML = '';
  const payLabel = document.createElement('span');
  payLabel.className = 'card-label';
  payLabel.textContent = '결제';
  paymentEl.appendChild(payLabel);
  paymentEl.appendChild(document.createTextNode(paymentConfirmed ? '완료 ✅' : '대기 중'));

  const wrap = document.getElementById('joined-steps-wrap');
  const effectiveStatus = pickupDone ? 'COMPLETED' : currentStatus;
  const currentIdx = STATUS_ORDER.indexOf(effectiveStatus);
  wrap.innerHTML = JOINED_STEPS.map((step, i) => {
    const cls = i < currentIdx ? 'done' : i === currentIdx ? 'done current' : '';
    return `<div class="joined-step ${cls}">
      <div class="joined-step-dot"></div>
      <span class="joined-step-label">${step.label}</span>
    </div>`;
  }).join('');

  document.getElementById('joined-progress-desc').innerHTML = pickupDone
    ? '물품 수령이 완료되었습니다.<br>후기 보내기 버튼은 모든 참여자의 수령이 완료된 후에 나타납니다.'
    : (STEP_DESCRIPTIONS[effectiveStatus] || '');
  showMypageModal('modal-joined-progress');
}

function openJoinedPaymentModal(groupBuyId, title, amount) {
  document.getElementById('joined-payment-title').textContent = title;
  document.getElementById('joined-payment-amount').textContent = formatPrice(amount);
  const confirmBtn = document.getElementById('btn-joined-payment-confirm');
  confirmBtn.dataset.id = groupBuyId;
  showMypageModal('modal-joined-payment');
}

async function requestJoinedPayment(groupBuyId) {
  const userId = localStorage.getItem('userId');
  if (!userId) { showToast('로그인이 필요합니다.'); return; }
  let readyData;
  try {
    readyData = await readyPayment(groupBuyId);
  } catch (e) {
    showToast(e.message || '결제 준비에 실패했습니다.');
    return;
  }
  const tossPayments = TossPayments(TOSS_CLIENT_KEY);
  const payment = tossPayments.payment({ customerKey: 'U-' + userId });
  payment.requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: readyData.amount },
    orderId: readyData.orderId,
    orderName: document.getElementById('joined-payment-title').textContent,
    successUrl: window.location.origin + '/success.html?role=participant&groupBuyId=' + groupBuyId,
    failUrl: window.location.origin + '/fail.html',
    customerName: '',
  }).catch(e => {
    if (e.code !== 'USER_CANCEL') showToast(e.message || '결제 중 오류가 발생했습니다.');
  });
}

async function showSentReviewModal(groupBuyId, revieweeId = null) {
  const content = document.getElementById('sent-review-content');
  content.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:1rem">불러오는 중...</p>';
  showMypageModal('modal-sent-review');
  try {
    const reviews = await getSentReviews();
    const review = reviews.find(r =>
      r.groupBuyId == groupBuyId && (revieweeId === null || r.revieweeId == revieweeId)
    );
    if (!review) {
      content.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:1rem">후기를 찾을 수 없습니다.</p>';
      return;
    }
    const ratingLabel = { BAD: '별로예요', GOOD: '좋아요', GREAT: '최고예요' }[review.rating] || review.rating;
    const ratingColor = { BAD: '#ef4444', GOOD: '#16a34a', GREAT: '#f59e0b' }[review.rating] || '#374151';
    const ratingEmoji = { BAD: '👎', GOOD: '👍', GREAT: '⭐' }[review.rating] || '';
    const itemsLabel = review.rating === 'BAD' ? '아쉬웠던 점' : '좋았던 점';
    const date = new Date(review.createdAt).toLocaleDateString('ko-KR');
    const items = review.checkedItems?.length
      ? `<div style="margin:0.75rem 0;display:flex;flex-wrap:wrap;gap:0.5rem">${review.checkedItems.map(i => `<span style="background:#f3f4f6;border-radius:999px;padding:0.3rem 0.75rem;font-size:0.875rem">${i}</span>`).join('')}</div>`
      : '<p style="color:#9ca3af;font-size:0.875rem">선택한 항목이 없습니다.</p>';
    document.getElementById('sent-review-title').textContent = `${review.revieweeNickname}님에게 보낸 후기`;
    content.innerHTML = `
      <p style="font-size:1.5rem;font-weight:700;color:${ratingColor};text-align:center;margin-bottom:1.25rem">${ratingEmoji} ${ratingLabel}</p>
      <p style="font-size:0.8rem;color:#6b7280;margin-bottom:0.4rem">${itemsLabel}</p>
      ${items}
      <p style="font-size:0.8rem;color:#9ca3af;margin-top:0.75rem;text-align:right">작성 날짜 : ${date}</p>
    `;
  } catch (e) {
    content.innerHTML = '<p style="text-align:center;color:#ef4444;padding:1rem">불러오기 실패</p>';
  }
}

document.getElementById('btn-sent-review-close').addEventListener('click', () => hideMypageModal('modal-sent-review'));
document.getElementById('btn-joined-pickup-cancel').addEventListener('click', () => hideMypageModal('modal-joined-pickup'));
document.getElementById('btn-joined-pickup-confirm').addEventListener('click', () => runPendingAction('modal-joined-pickup'));
document.getElementById('btn-joined-progress-close').addEventListener('click', () => hideMypageModal('modal-joined-progress'));
document.getElementById('btn-joined-payment-cancel').addEventListener('click', () => hideMypageModal('modal-joined-payment'));
document.getElementById('btn-joined-payment-confirm').addEventListener('click', () => {
  const id = document.getElementById('btn-joined-payment-confirm').dataset.id;
  hideMypageModal('modal-joined-payment');
  requestJoinedPayment(id);
});

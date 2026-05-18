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

let pendingAction = null;

// ─── 생성한 공동구매 ───

async function initCreatedGroupBuys() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  try {
    const list = (await getGroupBuysByHost(userId)).sort((a, b) => b.id - a.id);
    const emptyEl = document.getElementById('created-empty');
    if (!list.length) { emptyEl.style.display = 'block'; return; }
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
        <p class="card-meta"><span class="card-label">픽업</span>${g.pickupLocation || '-'}</p>
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
    const participants = await getParticipants(groupBuyId);
    if (!participants.length) {
      wrap.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:1rem">참여자가 없습니다.</p>';
      return;
    }
    const isExpired = canReview === 'EXPIRED';
    const rows = participants.map(p => {
      const pickup = p.pickupTime
        ? new Date(p.pickupTime).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '-';
      const reviewBtn = isExpired
        ? `<button class="btn btn-outline btn-sm" disabled>기한 만료</button>`
        : `<a href="review.html?id=${groupBuyId}&role=host&participantId=${p.participantId}" class="btn btn-primary btn-sm">후기 보내기</a>`;
      return `<tr>
        <td>${p.participantNickname}</td>
        <td>${pickup}</td>
        <td>${reviewBtn}</td>
      </tr>`;
    }).join('');
    wrap.innerHTML = `<table class="progress-table">
      <thead><tr><th>닉네임</th><th>픽업 일시</th><th>후기</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
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
});

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
  if (!p.pickupTime) return p.pickupLocation;
  const d = new Date(p.pickupTime);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours < 12 ? '오전' : '오후';
  const h = hours % 12 || 12;
  return `${p.pickupLocation} (${month}/${day} ${ampm} ${h}:${minutes})`;
}

function getJoinedButtons(p, canReview) {
  if (p.groupBuyDeleted) return '';
  const s = p.groupBuyStatus;
  const id = p.groupBuyId;
  const safeTitle = (p.groupBuyTitle || '').replace(/"/g, '&quot;');
  const safeLoc = (p.pickupLocation || '').replace(/"/g, '&quot;');
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
    if (canReview === 'ALREADY_REVIEWED') return `<button class="btn btn-outline" disabled>후기 보기</button>`;
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

document.getElementById('btn-joined-pickup-cancel').addEventListener('click', () => hideMypageModal('modal-joined-pickup'));
document.getElementById('btn-joined-pickup-confirm').addEventListener('click', () => runPendingAction('modal-joined-pickup'));
document.getElementById('btn-joined-progress-close').addEventListener('click', () => hideMypageModal('modal-joined-progress'));
document.getElementById('btn-joined-payment-cancel').addEventListener('click', () => hideMypageModal('modal-joined-payment'));
document.getElementById('btn-joined-payment-confirm').addEventListener('click', () => {
  const id = document.getElementById('btn-joined-payment-confirm').dataset.id;
  hideMypageModal('modal-joined-payment');
  requestJoinedPayment(id);
});

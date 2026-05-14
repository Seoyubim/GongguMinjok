checkTokenExpiry();
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

const STATUS_LABEL = {
  OPEN: '모집중', CLOSING: '마감임박', CLOSED: '모집완료',
  PAYMENT_COMPLETED: '결제완료', HOST_PURCHASED: '주문완료',
  PICKUP_READY: '픽업대기', PENDING: '정산대기',
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
        completedItems.map(g => canReviewGroupBuy(g.id).catch(() => ({ canReview: false })))
      );
      completedItems.forEach((g, i) => { reviewMap[g.id] = results[i].canReview; });
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
  if (s === 'COMPLETED')
    return canReview
      ? `<a href="review.html?id=${id}&role=host" class="btn btn-primary">후기 보내기</a>`
      : `<button class="btn btn-outline" disabled>기한 만료</button>`;
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
      const done = !!p.pickupCompletedAt;
      return `<tr>
        <td>${p.participantNickname}</td>
        <td>${pickup}</td>
        <td style="color:${done ? '#84cc16' : '#9ca3af'};font-weight:600">${done ? '수령 완료' : '픽업 대기'}</td>
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

// ─── 탭 이벤트 ───

document.getElementById('tab3').addEventListener('change', initCreatedGroupBuys);
if (document.getElementById('tab3').checked) initCreatedGroupBuys();

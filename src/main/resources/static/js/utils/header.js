(function () {
  // 현재 페이지 이름으로 마이페이지 여부 판별
  const currentPage = location.pathname.split('/').pop() || 'index.html';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="container">
      <div class="header-content">
        <a href="index.html" class="logo">
          <img src="images/logo.jpg" alt="공구의 민족 로고" class="logo-image">
          <h1 class="logo-text">공구의 민족</h1>
        </a>
        <div class="header-actions">
          <div class="notification-wrap">
            <button id="notificationBtn" class="btn btn-outline hidden" type="button">
              🔔
              <span id="notificationBadge" class="notification-badge hidden">0</span>
            </button>
            <div id="notificationDropdown" class="notification-dropdown hidden">
              <div class="notification-dropdown-header">
                <span class="notification-dropdown-title">알림</span>
                <button id="readAllBtn" class="notification-read-all" type="button">전체 읽음</button>
              </div>
              <div id="notificationList" class="notification-list"></div>
            </div>
          </div>
          <a href="write.html" id="writeBtn" class="btn btn-primary hidden">공구 만들기</a>
          <a href="login.html" id="loginBtn" class="btn btn-outline">로그인</a>
          <a href="mypage.html" id="mypageBtn" class="btn btn-outline hidden">마이페이지</a>
          <button id="logoutBtn" class="btn btn-outline hidden" type="button">로그아웃</button>
        </div>
      </div>
    </div>
  `;
  document.body.prepend(header);

  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // 공구 만들기 클릭 시 계좌 등록 여부 확인
  document.getElementById('writeBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const profile = await getMyProfile();
      if (!profile.bankAccountRegistered) {
        sessionStorage.setItem('pendingToast', '공동구매 등록은 프로필 수정에서 계좌 등록을 한 후에만 공동구매 생성이 가능합니다.');
        window.location.href = 'mypage.html';
        return;
      }
      window.location.href = 'write.html';
    } catch {
      window.location.href = 'write.html';
    }
  });

  // 받은 시간을 상대 시간으로 변환 (방금 / N분 전 / N시간 전 / 어제 / M/D)
  function formatTimeAgo(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return '방금';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
    if (diff < 172800) return '어제';
    return (date.getMonth() + 1) + '/' + date.getDate();
  }

  // 미읽음 뱃지 업데이트
  async function updateBadge() {
    try {
      const notifications = await getNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      const badge = document.getElementById('notificationBadge');
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    } catch {}
  }

  // 알림 목록 렌더링
  async function renderNotifications() {
    const list = document.getElementById('notificationList');
    list.innerHTML = '<p class="notification-empty">불러오는 중...</p>';
    try {
      const notifications = await getNotifications();

      // 뱃지 갱신
      const unreadCount = notifications.filter(n => !n.read).length;
      const badge = document.getElementById('notificationBadge');
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }

      if (notifications.length === 0) {
        list.innerHTML = '<p class="notification-empty">알림이 없습니다.</p>';
        return;
      }

      list.innerHTML = notifications.map(n => `
        <div class="notification-item${n.read ? '' : ' unread'}" data-id="${n.id}" data-type="${n.type}" data-group-buy-id="${n.relatedGroupBuyId || ''}">
          <div class="notification-item-header">
            <p class="notification-item-title">${n.title}</p>
            <p class="notification-item-time">${formatTimeAgo(n.createdAt)}</p>
          </div>
          <p class="notification-item-content">${n.content}</p>
        </div>
      `).join('');

      // 알림 항목 클릭: 읽음 처리 + 상세 페이지 이동
      list.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', async () => {
          const id = item.dataset.id;
          const groupBuyId = item.dataset.groupBuyId;
          try { await markAsRead(id); } catch {}
          item.classList.remove('unread');
          const remaining = list.querySelectorAll('.notification-item.unread').length;
          const badge = document.getElementById('notificationBadge');
          if (remaining > 0) {
            badge.textContent = remaining;
          } else {
            badge.classList.add('hidden');
          }
          const type = item.dataset.type;
          if (type === 'REVIEW_AVAILABLE' && groupBuyId) {
            // 호스트 여부에 따라 생성한/참여한 공동구매 탭으로 이동
            try {
              const groupBuy = await getGroupBuyById(groupBuyId);
              const myUserId = localStorage.getItem('userId');
              if (String(myUserId) === String(groupBuy.hostId)) {
                window.location.href = 'mypage.html?tab=created';
              } else {
                window.location.href = 'mypage.html?tab=joined';
              }
            } catch {
              window.location.href = 'mypage.html';
            }
          } else if (groupBuyId) {
            window.location.href = 'detail.html?id=' + groupBuyId;
          }
        });
      });
    } catch {
      list.innerHTML = '<p class="notification-empty">알림을 불러올 수 없습니다.</p>';
    }
  }

  const notificationBtn = document.getElementById('notificationBtn');
  const notificationDropdown = document.getElementById('notificationDropdown');

  // 벨 버튼 클릭: 드롭다운 토글
  notificationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !notificationDropdown.classList.contains('hidden');
    if (isOpen) {
      notificationDropdown.classList.add('hidden');
    } else {
      notificationDropdown.classList.remove('hidden');
      renderNotifications();
    }
  });

  // 전체 읽음 버튼
  document.getElementById('readAllBtn').addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
      document.querySelectorAll('.notification-item').forEach(item => item.classList.remove('unread'));
      document.getElementById('notificationBadge').classList.add('hidden');
    } catch {}
  });

  // 드롭다운 외부 클릭 시 닫기
  document.addEventListener('click', () => {
    notificationDropdown.classList.add('hidden');
  });
  notificationDropdown.addEventListener('click', (e) => e.stopPropagation());

  const isMypage = currentPage === 'mypage.html';
  // 공구 만들기 버튼을 숨길 페이지 목록
  const hideWrite = ['write.html', 'edit.html', 'profile-edit.html'].includes(currentPage);

  if (isLoggedIn()) {
    document.getElementById('loginBtn').classList.add('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('notificationBtn').classList.remove('hidden');
    if (!hideWrite) {
      document.getElementById('writeBtn').classList.remove('hidden');
    }
    if (!isMypage) {
      document.getElementById('mypageBtn').classList.remove('hidden');
    }
    if (localStorage.getItem('userRole') === 'ADMIN' && currentPage === 'index.html') {
      const adminBtn = document.createElement('a');
      adminBtn.href = 'admin.html';
      adminBtn.className = 'btn btn-outline';
      adminBtn.textContent = '관리자';
      header.querySelector('.notification-wrap').before(adminBtn);
    }
    updateBadge();
  }
})();

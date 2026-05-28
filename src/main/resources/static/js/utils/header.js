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

  const isMypage = currentPage === 'mypage.html';
  // 공구 만들기 버튼을 숨길 페이지 목록
  const hideWrite = ['write.html', 'edit.html', 'profile-edit.html'].includes(currentPage);

  if (isLoggedIn()) {
    document.getElementById('loginBtn').classList.add('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    if (!hideWrite) {
      document.getElementById('writeBtn').classList.remove('hidden');
    }
    if (!isMypage) {
      document.getElementById('mypageBtn').classList.remove('hidden');
    }
  }
})();

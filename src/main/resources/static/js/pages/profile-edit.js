checkTokenExpiry();
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

const KAKAO_REST_KEY = '6862dc8015e382acfd29f23b95906a08';

let selectedLat = null;
let selectedLng = null;
let selectedCityName = null;

async function loadProfile() {
  try {
    const profile = await getMyProfile();
    document.getElementById('nickname').value = profile.nickname || '';
    document.getElementById('phone').value = profile.phone || '';
    if (profile.location) {
      document.getElementById('location').value = profile.location;
      const resultEl = document.getElementById('addr-result');
      resultEl.textContent = '주소: ' + profile.location;
      resultEl.classList.remove('hidden');
    }
    if (profile.lat) selectedLat = profile.lat;
    if (profile.lng) selectedLng = profile.lng;
    if (profile.cityName) selectedCityName = profile.cityName;
    if (profile.profileImage) {
      document.getElementById('profilePreview').src = profile.profileImage;
    }
  } catch (e) {
    showToast(e.message || '프로필을 불러오는데 실패했습니다.');
  }
}

// 프로필 사진 선택 시 미리보기
document.getElementById('profileImage').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('profilePreview').src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// 전화번호 자동 하이픈
document.getElementById('phone').addEventListener('input', (e) => {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) {
    e.target.value = digits;
  } else if (digits.length <= 7) {
    e.target.value = digits.slice(0, 3) + '-' + digits.slice(3);
  } else {
    e.target.value = digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7);
  }
});

// 비밀번호 섹션 토글
document.getElementById('btn-password-toggle').addEventListener('click', () => {
  const section = document.getElementById('password-section');
  const icon = document.getElementById('password-toggle-icon');
  const isHidden = section.style.display === 'none';
  section.style.display = isHidden ? 'block' : 'none';
  icon.textContent = isHidden ? '▲' : '▼';
});

// 주소 검색
document.getElementById('btn-addr-search').addEventListener('click', () => {
  new daum.Postcode({
    oncomplete: (data) => {
      const addr = data.roadAddress || data.jibunAddress;
      const resultEl = document.getElementById('addr-result');
      const errEl = document.getElementById('addr-err');

      fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(addr)}`, {
        headers: { 'Authorization': 'KakaoAK ' + KAKAO_REST_KEY }
      }).then(res => res.json()).then(json => {
        if (json.documents && json.documents.length > 0) {
          selectedLat = parseFloat(json.documents[0].y);
          selectedLng = parseFloat(json.documents[0].x);
          selectedCityName = extractCityName(data.sido || '', data.sigungu || '');
          document.getElementById('location').value = addr;
          errEl.textContent = '';
          resultEl.textContent = '주소: ' + addr;
          resultEl.classList.remove('hidden');
        } else {
          errEl.textContent = '주소 좌표를 가져오지 못했습니다. 다시 검색해 주세요.';
          resultEl.classList.add('hidden');
        }
      }).catch(() => {
        errEl.textContent = '주소 좌표를 가져오지 못했습니다. 다시 검색해 주세요.';
        resultEl.classList.add('hidden');
      });
    }
  }).open();
});

// 저장하기 — 프로필 수정 + 비밀번호 변경 (비밀번호 필드 입력 시에만)
document.getElementById('btn-save').addEventListener('click', async () => {
  const nickname = document.getElementById('nickname').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const location = document.getElementById('location').value.trim();
  const profileImageFile = document.getElementById('profileImage').files[0];
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;

  if (!nickname) { showToast('닉네임을 입력해주세요.'); return; }

  // 비밀번호 필드 중 하나라도 입력됐으면 전체 검증
  const passwordFilled = currentPassword || newPassword || newPasswordConfirm;
  if (passwordFilled) {
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      showToast('비밀번호 변경 시 모든 항목을 입력해주세요.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      showToast('새 비밀번호가 일치하지 않습니다.');
      return;
    }
  }

  try {
    const profileData = { nickname, phone };
    if (location) {
      profileData.location = location;
      if (selectedLat) profileData.lat = selectedLat;
      if (selectedLng) profileData.lng = selectedLng;
      if (selectedCityName) profileData.cityName = selectedCityName;
    }
    if (profileImageFile) {
      const uploaded = await uploadMyProfileImage(profileImageFile);
      profileData.profileImage = uploaded.imageUrl;
    }
    await updateMyProfile(profileData);

    if (passwordFilled) {
      await updateMyPassword({ currentPassword, newPassword, newPasswordConfirm });
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('newPasswordConfirm').value = '';
    }

    showToast('저장되었습니다.');
    setTimeout(() => { window.location.href = 'mypage.html'; }, 1000);
  } catch (e) {
    showToast(e.message || '저장에 실패했습니다.');
  }
});

loadProfile();

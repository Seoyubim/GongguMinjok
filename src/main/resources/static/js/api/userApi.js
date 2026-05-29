async function getSentReviews() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/users/me/reviews/sent', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('후기 목록을 불러오는데 실패했습니다.');
  return response.json();
}

async function getMyProfile() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/users/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('프로필 조회 실패');
  return response.json();
}

async function getUserPublicProfile(userId) {
  const response = await fetch('/api/users/' + userId + '/profile');
  if (!response.ok) throw new Error('유저 프로필을 불러오는데 실패했습니다.');
  return response.json();
}

async function getReceivedReviews(userId) {
  const response = await fetch('/api/users/' + userId + '/reviews');
  if (!response.ok) throw new Error('받은 후기 목록을 불러오는데 실패했습니다.');
  return response.json();
}

async function updateMyProfile(data) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/users/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || '프로필 수정에 실패했습니다.');
  }
  return response.json();
}

async function uploadMyProfileImage(file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/users/me/profile-image', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });
  if (!response.ok) {
    throw new Error('이미지 업로드에 실패했습니다. 다시 시도해 주세요.');
  }
  return response.json();
}

async function updateMyPassword(data) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/users/me/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || '비밀번호 변경에 실패했습니다.');
  }
}

async function updateMyAccount(data) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/users/me/account', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || '계좌 정보 저장에 실패했습니다.');
  }
  return response.json();
}

async function withdrawMyAccount() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/users/me/withdraw', {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || '회원 탈퇴에 실패했습니다.');
  }
}

async function readyPremiumPayment() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/premium/payments/ready', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
  });
  if (!response.ok) throw new Error('결제 준비에 실패했습니다.');
  return response.json();
}

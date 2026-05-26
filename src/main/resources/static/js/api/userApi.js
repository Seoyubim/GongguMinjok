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

async function readyPremiumPayment() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/premium/payments/ready', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
  });
  if (!response.ok) throw new Error('결제 준비에 실패했습니다.');
  return response.json();
}

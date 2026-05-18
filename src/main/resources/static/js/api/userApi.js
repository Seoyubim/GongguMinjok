function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  };
}

async function getMyProfile() {
  const response = await fetch('/api/users/me', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || '내 정보를 불러오지 못했습니다.');
  }
  return result;
}

async function updateMyProfile(data) {
  const response = await fetch('/api/users/me', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || '내 정보 수정에 실패했습니다.');
  }
  return result;
}

async function changeMyPassword(data) {
  const response = await fetch('/api/users/me/password', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    let message = '비밀번호 변경에 실패했습니다.';
    try {
      const result = await response.json();
      message = result.message || message;
    } catch {}
    throw new Error(message);
  }
}

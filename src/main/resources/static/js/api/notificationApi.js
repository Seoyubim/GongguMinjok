async function getNotifications() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/notifications', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('알림 조회 실패');
  return response.json();
}

async function markAsRead(id) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/notifications/' + id + '/read', {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('읽음 처리 실패');
}

async function markAllAsRead() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/notifications/read-all', {
    method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('전체 읽음 처리 실패');
}

async function getSentReviews() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/users/me/reviews/sent', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('후기 목록을 불러오는데 실패했습니다.');
  return response.json();
}

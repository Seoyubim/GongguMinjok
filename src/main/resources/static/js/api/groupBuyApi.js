async function getGroupBuys(userLat, userLng) {
  let url = '/api/groupbuys';
  if (userLat != null && userLng != null) {
    url += `?userLat=${userLat}&userLng=${userLng}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('공동구매 목록을 불러오는데 실패했습니다.');
  }
  return response.json();
}

async function searchGroupBuys(keyword) {
  const response = await fetch('/api/groupbuys/search?keyword=' + encodeURIComponent(keyword));
  if (!response.ok) throw new Error('검색에 실패했습니다.');
  return response.json();
}

async function getGroupBuyById(id) {
  const response = await fetch('/api/groupbuys/' + id);
  if (!response.ok) {
    throw new Error('공동구매 정보를 불러오는데 실패했습니다.');
  }
  return response.json();
}

async function updateGroupBuy(id, data) {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/groupbuys/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "공동구매 수정에 실패했습니다.");
  }

  return result;
}

async function getParticipants(groupBuyId) {
  const response = await fetch('/api/groupbuys/' + groupBuyId + '/participants');
  if (!response.ok) {
    throw new Error('참여자 정보를 불러오는데 실패했습니다.');
  }
  return response.json();
}

async function createGroupBuy(data) {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/groupbuys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "공동구매 생성에 실패했습니다.");
  }

  return result;
}

async function getGroupBuysByHost(hostId) {
  const response = await fetch('/api/groupbuys/host/' + hostId);
  if (!response.ok) throw new Error('생성한 공동구매 목록을 불러오는데 실패했습니다.');
  return response.json();
}

async function deleteGroupBuy(id) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/groupbuys/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || '삭제에 실패했습니다.');
  }
}

async function completeHostPurchase(id) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/groupbuys/' + id + '/host-purchase', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || '주문 완료 처리에 실패했습니다.');
  }
  return response.json();
}

async function markPickupReady(id) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/groupbuys/' + id + '/pickup-ready', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || '수령 완료 처리에 실패했습니다.');
  }
  return response.json();
}

async function canReviewGroupBuy(id) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/groupbuys/' + id + '/reviews/can-review', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) return { canReview: false };
  return response.json();
}

async function getMyParticipations() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/participations/my', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('참여한 공동구매 목록을 불러오는데 실패했습니다.');
  return response.json();
}

async function completePickup(groupBuyId) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/groupbuys/' + groupBuyId + '/pickup/complete', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || '수령 완료 처리에 실패했습니다.');
  }
  return response.json();
}

async function getHostReviewStatuses(groupBuyId) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/groupbuys/' + groupBuyId + '/reviews/host/status', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('후기 현황을 불러오는데 실패했습니다.');
  return response.json();
}

async function readyPayment(groupBuyId) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/groupbuys/' + groupBuyId + '/payments/ready', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || '결제 준비에 실패했습니다.');
  }
  return response.json();
}

async function getComments(groupBuyId) {
  const response = await fetch(`/api/group-buys/${groupBuyId}/comments`);
  if (!response.ok) throw new Error('댓글을 불러오는데 실패했습니다.');
  return response.json();
}

async function postComment(groupBuyId, content) {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/group-buys/${groupBuyId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ content }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || '댓글 등록에 실패했습니다.');
  return result;
}

async function uploadGroupBuyImages(files) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  const response = await fetch('/api/groupbuys/images', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || '이미지 업로드에 실패했습니다.');
  return result.imageUrls;
}

async function deleteComment(commentId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || '댓글 삭제에 실패했습니다.');
  }
}
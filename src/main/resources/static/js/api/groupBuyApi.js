async function getGroupBuys() {
  const response = await fetch('/api/groupbuys');
  if (!response.ok) {
    throw new Error('공동구매 목록을 불러오는데 실패했습니다.');
  }
  return response.json();
}

async function getGroupBuyById(id) {
  const response = await fetch('/api/groupbuys/' + id);
  if (!response.ok) {
    throw new Error('공동구매 정보를 불러오는데 실패했습니다.');
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
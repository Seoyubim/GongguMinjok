async function getGroupBuys() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(window.APP_DATA.groupBuys);
    }, 200);
  });
}

// DB 연동 시 fetch('/api/groupbuys/${id}') 로 교체
async function getGroupBuyById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const groupBuy = window.APP_DATA.groupBuys.find((item) => item.id === id) || null;
      resolve(groupBuy);
    }, 200);
  });
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
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
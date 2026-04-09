async function getGroupBuys() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(window.APP_DATA.groupBuys);
    }, 200);
  });
}
const logoutBtn = document.getElementById("logoutBtn");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("isLoggedIn");
  showToast("로그아웃되었습니다.");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
});

const loginForm = document.getElementById("loginForm");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showToast("이메일과 비밀번호를 입력해주세요.");
    return;
  }

  localStorage.setItem("isLoggedIn", "true");
  showToast("로그인되었습니다.");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
});
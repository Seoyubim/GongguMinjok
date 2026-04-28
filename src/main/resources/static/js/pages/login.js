const loginForm = document.getElementById("loginForm");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showToast("이메일과 비밀번호를 입력해주세요.");
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      let message = "이메일 또는 비밀번호를 확인해주세요.";
      try {
        const errorData = await response.json();
        if (errorData.message) message = errorData.message;
      } catch {}
      showToast(message);
      return;
    }

    const data = await response.json();
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("isLoggedIn", "true");
    showToast("로그인되었습니다.");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);

  } catch (e) {
    showToast("서버 연결 오류가 발생했습니다.");
  }
});
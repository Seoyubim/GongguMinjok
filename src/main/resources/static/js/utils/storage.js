function setLoginState(isLoggedIn) {
  localStorage.setItem("isLoggedIn", String(isLoggedIn));
}

function getLoginState() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function clearLoginState() {
  localStorage.removeItem("isLoggedIn");
}

function login() {
  setLoginState(true);
}

function logout() {
  clearLoginState();
  localStorage.removeItem("token");
}

function isLoggedIn() {
  return getLoginState();
}

function checkTokenExpiry() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      logout();
      alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
      window.location.href = "login.html";
    }
  } catch {}
}

(function() {
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch(...args);

    const url = typeof args[0] === "string" ? args[0] : args[0]?.url ?? "";
    if (url.includes("/api/auth/")) return response;

    if (response.status === 401 || response.status === 403) {
      logout();
      const msg = "로그인이 만료되었습니다. 다시 로그인해주세요.";
      if (typeof showToast !== "undefined") {
        showToast(msg);
      } else {
        alert(msg);
      }
      setTimeout(() => { window.location.href = "login.html"; }, 1000);
    }

    return response;
  };
})();
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
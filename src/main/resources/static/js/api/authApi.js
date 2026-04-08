// 이메일 인증코드 발송
async function sendEmailCode(email) {
  const response = await fetch("/api/auth/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  const data = await response.text();

  if (!response.ok) {
    throw new Error(data || "인증코드 발송에 실패했습니다.");
  }

  return data;
}

// 이메일 인증코드 확인
async function verifyEmailCode(email, code) {
  const response = await fetch("/api/auth/email/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, code })
  });

  const data = await response.text();

  if (!response.ok) {
    throw new Error(data || "인증코드 확인에 실패했습니다.");
  }

  return data;
}

async function loginUser(loginData) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(loginData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "로그인에 실패했습니다.");
  }

  return data;
}

async function signupUser(signupData) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(signupData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "회원가입에 실패했습니다.");
  }

  return data;
}
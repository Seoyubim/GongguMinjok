// 이메일 인증코드 발송
async function sendEmailCode(email) {
  const response = await fetch("/api/auth/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  const text = await response.text();

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error("인증코드 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || "인증코드 발송에 실패했습니다.");
    } catch {
      throw new Error("인증코드 발송에 실패했습니다.");
    }
  }

  return text;
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

async function signupUser(signupData, profileImageFile) {
  let body, headers = {};

  if (profileImageFile) {
    const formData = new FormData();
    formData.append("user", new Blob([JSON.stringify(signupData)], { type: "application/json" }));
    formData.append("profileImage", profileImageFile);
    body = formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(signupData);
  }

  const response = await fetch("/api/auth/register", { method: "POST", headers, body });

  const data = await response.json();

  if (!response.ok) {
    const msg = data.message || '';
    if (profileImageFile && (response.status >= 500 || msg.includes('S3') || msg.includes('bucket'))) {
      throw new Error("이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
    }
    throw new Error(msg || "회원가입에 실패했습니다.");
  }

  return data;
}
const emailInput     = document.getElementById('email');
const btnSendCode    = document.getElementById('btn-send-code');
const verifySection  = document.getElementById('verify-section');
const verifyCodeInput = document.getElementById('verify-code');
const btnVerifyCode  = document.getElementById('btn-verify-code');
const timerEl        = document.getElementById('timer');
const verifyMsg      = document.getElementById('verify-msg');
const formError      = document.getElementById('form-error');
const signupForm     = document.getElementById('signup-form');

const passwordConfirmMsg = document.getElementById('password-confirm-msg');
const signupToast        = document.getElementById('signup-toast');

let timerInterval  = null;
let isEmailVerified = false;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.querySelectorAll('.btn-pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '숨기기';
    } else {
      input.type = 'password';
      btn.textContent = '보기';
    }
  });
});

emailInput.addEventListener('input', () => {
  btnSendCode.disabled = !isValidEmail(emailInput.value.trim());
});

document.getElementById('phone').addEventListener('input', (e) => {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) {
    e.target.value = digits;
  } else if (digits.length <= 7) {
    e.target.value = digits.slice(0, 3) + '-' + digits.slice(3);
  } else {
    e.target.value = digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7);
  }
});

document.getElementById('password-confirm').addEventListener('input', () => {
  const pw  = document.getElementById('password').value;
  const pw2 = document.getElementById('password-confirm').value;
  if (pw2 === '') {
    passwordConfirmMsg.textContent = '';
  } else if (pw !== pw2) {
    passwordConfirmMsg.textContent = '비밀번호가 다릅니다.';
  } else {
    passwordConfirmMsg.textContent = '';
  }
});

function startTimer() {
  clearInterval(timerInterval);
  let seconds = 5 * 60;
  timerEl.textContent = '05:00';

  timerInterval = setInterval(() => {
    seconds--;
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    timerEl.textContent = `${min}:${sec}`;

    if (seconds <= 0) {
      clearInterval(timerInterval);
      timerEl.textContent = '만료';
      btnVerifyCode.disabled = true;
    }
  }, 1000);
}

btnSendCode.addEventListener('click', async () => {
  const email = emailInput.value.trim();

  btnSendCode.disabled = true;
  btnSendCode.textContent = '전송중';
  formError.textContent = '';

  try {
    await sendEmailCode(email);

    verifySection.classList.remove('hidden');
    verifyCodeInput.value = '';
    verifyCodeInput.disabled = false;
    btnVerifyCode.disabled = false;
    verifyMsg.textContent = '';
    verifyMsg.className = 'verify-msg';

    btnSendCode.textContent = '재전송';
    btnSendCode.disabled = false;

    startTimer();
  } catch (e) {
    formError.textContent = e.message;
    btnSendCode.textContent = '전송';
    btnSendCode.disabled = false;
  }
});

btnVerifyCode.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const code  = verifyCodeInput.value.trim();

  btnVerifyCode.disabled = true;

  try {
    await verifyEmailCode(email, code);

    clearInterval(timerInterval);
    timerEl.textContent = '';
    isEmailVerified = true;

    emailInput.readOnly = true;
    emailInput.style.backgroundColor = '#f3f4f6';
    btnSendCode.disabled = true;
    verifyCodeInput.disabled = true;

    verifyMsg.textContent = '인증번호가 일치합니다';
    verifyMsg.className = 'verify-msg success';
  } catch (e) {
    verifyMsg.textContent = '인증번호가 불일치 합니다';
    verifyMsg.className = 'verify-msg error';
    btnVerifyCode.disabled = false;
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';

  const email           = emailInput.value.trim();
  const password        = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('password-confirm').value;
  const nickname        = document.getElementById('nickname').value.trim();
  const phone           = document.getElementById('phone').value.trim();
  const location        = document.getElementById('location').value.trim();

  if (!isEmailVerified) {
    formError.textContent = '이메일 인증을 완료해주세요.';
    return;
  }

  if (password !== passwordConfirm) {
    formError.textContent = '비밀번호가 일치하지 않습니다.';
    return;
  }

  const submitBtn = signupForm.querySelector('.btn-signup');
  submitBtn.disabled = true;
  submitBtn.textContent = '처리 중...';

  try {
    await signupUser({ email, password, passwordConfirm, nickname, phone, location });

    signupToast.classList.add('show');
    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
  } catch (e) {
    formError.textContent = e.message;
    submitBtn.disabled = false;
    submitBtn.textContent = '회원가입';
  }
});

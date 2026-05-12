(function () {
  const params = new URLSearchParams(window.location.search);
  const message = params.get('message') || '알 수 없는 오류가 발생했습니다.';
  const code = params.get('code') || '';

  const msgEl = document.getElementById('fail-message');
  const codeEl = document.getElementById('fail-code');

  if (msgEl) msgEl.textContent = message;
  if (codeEl && code) codeEl.textContent = `오류 코드: ${code}`;
})();

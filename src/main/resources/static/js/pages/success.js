checkTokenExpiry();

(async function () {
  const params = new URLSearchParams(window.location.search);
  const paymentKey = params.get('paymentKey');
  const orderId = params.get('orderId');
  const amount = params.get('amount');
  const role = params.get('role');
  const groupBuyId = params.get('groupBuyId');

  // TODO: 백엔드 /confirm/widget 엔드포인트 구현 완료 후 임시 처리 제거
  //       현재는 404(미구현) 또는 네트워크 오류 시 임시 성공 처리
  try {
    const response = await fetch('/confirm/widget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount, role, groupBuyId }),
    });

    if (response.ok) {
      showSuccess(orderId, amount);
      return;
    }

    // TODO: 백엔드 완성 후 아래 임시 성공 처리 제거하고 showFail 사용
    if (response.status === 404 || response.status === 405) {
      showSuccess(orderId, amount);
    } else {
      const errorData = await response.json().catch(() => ({}));
      showFail(errorData.message || '결제 승인에 실패했습니다.');
    }
  } catch (e) {
    // TODO: 백엔드 /confirm/widget 완성 후 아래 임시 성공 처리 제거
    showSuccess(orderId, amount);
  }
})();

function showSuccess(orderId, amount) {
  document.getElementById('result-loading').classList.add('hidden');
  document.getElementById('result-success').classList.remove('hidden');
  document.getElementById('result-amount').textContent = Number(amount).toLocaleString() + '원';
  document.getElementById('result-order-id').textContent = orderId;
}

function showFail(message) {
  document.getElementById('result-loading').classList.add('hidden');
  document.getElementById('result-fail').classList.remove('hidden');
  document.getElementById('result-error-msg').textContent = message;
}

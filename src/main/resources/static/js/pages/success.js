checkTokenExpiry();

(async function () {
  const params = new URLSearchParams(window.location.search);
  const paymentKey = params.get('paymentKey');
  const orderId = params.get('orderId');
  const amount = params.get('amount');
  const role = params.get('role');
  const groupBuyId = params.get('groupBuyId');

  try {
    const token = localStorage.getItem('token');
    const url = role === 'premium'
      ? '/api/premium/payments/toss/confirm'
      : '/api/payments/toss/confirm';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });

    if (response.ok) {
      showSuccess(orderId, amount);
      return;
    }

    const errorData = await response.json().catch(() => ({}));
    showFail(errorData.message || '결제 승인에 실패했습니다.');
  } catch (e) {
    showFail('네트워크 오류가 발생했습니다.');
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

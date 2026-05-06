checkTokenExpiry();

// TODO: 백엔드 팀에서 발급받은 실제 클라이언트 키로 교체
const TOSS_CLIENT_KEY = 'test_ck_pP2YxJ4K87qv9b6gpBnJVRGZwXLO';

(async function () {
  const params = new URLSearchParams(window.location.search);
  const groupBuyId = params.get('id');
  const role = params.get('role'); // 'host' 또는 'participant'

  if (!groupBuyId || (role !== 'host' && role !== 'participant')) {
    alert('잘못된 접근입니다.');
    window.location.href = 'index.html';
    return;
  }

  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }

  let groupBuy;
  try {
    groupBuy = await getGroupBuyById(groupBuyId);
  } catch (e) {
    alert('공동구매 정보를 불러올 수 없습니다.');
    window.location.href = 'index.html';
    return;
  }

  // 역할별 결제 금액 결정
  // TODO: 호스트가 전체 금액을 결제하는 방식 백엔드 팀과 확정 후
  //       hostPaymentAmount 필드 의미 재정의 필요 (현재는 개인 할인 적용 금액)
  //       확정되면 아래 host 조건의 groupBuy.totalPrice → groupBuy.hostPaymentAmount 로 교체
  const amount = role === 'host'
    ? groupBuy.totalPrice
    : (groupBuy.participantPaymentAmount ?? groupBuy.participantFinalPrice);

  // 주문번호: 역할 + 유저ID + 타임스탬프로 중복 방지
  const roleCode = role === 'host' ? 'H' : 'P';
  const orderId = `GB-${groupBuyId}-${roleCode}-${userId}-${Date.now()}`;

  // 화면 정보 표시
  const badgeEl = document.getElementById('payment-role-badge');
  const titleEl = document.getElementById('payment-group-title');
  const amountEl = document.getElementById('payment-amount');

  if (badgeEl) badgeEl.textContent = role === 'host' ? '호스트 결제 (전체 금액)' : '참여자 결제';
  if (titleEl) titleEl.textContent = groupBuy.title;
  if (amountEl) amountEl.textContent = amount.toLocaleString() + '원';

  // 토스 결제위젯 초기화
  const tossPayments = TossPayments(TOSS_CLIENT_KEY);
  const widgets = tossPayments.widgets({ customerKey: 'U-' + userId });

  await widgets.setAmount({ currency: 'KRW', value: amount });

  await Promise.all([
    widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
    widgets.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' }),
  ]);

  document.getElementById('pay-btn').addEventListener('click', async () => {
    try {
      await widgets.requestPayment({
        orderId,
        orderName: groupBuy.title,
        successUrl: `${window.location.origin}/success.html?role=${role}&groupBuyId=${groupBuyId}`,
        failUrl: `${window.location.origin}/fail.html`,
        customerName: localStorage.getItem('userNickname') || '구매자',
      });
    } catch (e) {
      if (e.code !== 'USER_CANCEL') {
        alert(e.message || '결제 중 오류가 발생했습니다.');
      }
    }
  });
})();

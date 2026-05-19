const params = new URLSearchParams(location.search);
const groupBuyId = params.get('id');
const role = params.get('role'); // 'host' | 'participant'

let selectedRating = 'GOOD';
let revieweeId = null;

// 체크리스트 항목: participant = 참여자가 호스트 평가, host = 호스트가 참여자 평가
const checklistData = {
  participant: {
    BAD: [
      '응답이 느렸어요', '공지나 안내가 부족했어요', '픽업 시간이 지켜지지 않았어요',
      '픽업 장소가 불명확했어요', '물건 전달 과정이 불편했어요', '정산/결제 안내가 혼란스러웠어요',
      '약속 변경이 잦았어요', '소통이 불친절했어요', '문제 대응이 늦었어요',
      '상품 설명과 실제가 달랐어요', '다시 거래하고 싶지 않아요'
    ],
    GOOD: [
      '응답이 빨랐어요', '공지와 안내가 명확했어요', '픽업 시간이 잘 지켜졌어요',
      '픽업 장소를 찾기 쉬웠어요', '물건 전달이 정확했어요', '정산/결제 안내가 깔끔했어요',
      '약속 변경이 적었어요', '친절하게 소통했어요', '참여자를 잘 배려했어요',
      '문제 발생 시 빠르게 대응했어요', '상품 상태를 정확히 안내했어요', '다시 거래하고 싶어요'
    ],
    GREAT: [
      '응답이 빨랐어요', '공지와 안내가 명확했어요', '픽업 시간이 잘 지켜졌어요',
      '픽업 장소를 찾기 쉬웠어요', '물건 전달이 정확했어요', '정산/결제 안내가 깔끔했어요',
      '약속 변경이 적었어요', '친절하게 소통했어요', '참여자를 잘 배려했어요',
      '문제 발생 시 빠르게 대응했어요', '상품 상태를 정확히 안내했어요', '다시 거래하고 싶어요'
    ]
  },
  host: {
    BAD: [
      '결제가 늦었어요', '픽업 시간을 지키지 않았어요', '픽업 장소를 헷갈려 했어요',
      '연락이 잘 되지 않았어요', '응답이 느렸어요', '공지사항을 확인하지 않았어요',
      '약속 변경이 잦았어요', '거래 태도가 불친절했어요', '수령 확인이 늦었어요',
      '문제 발생 시 협조가 부족했어요', '노쇼가 있었어요', '다시 거래하고 싶지 않아요'
    ],
    GOOD: [
      '결제를 빠르게 완료했어요', '픽업 시간을 잘 지켰어요', '픽업 장소에 정확히 도착했어요',
      '연락이 잘 되었어요', '응답이 빨랐어요', '공지사항을 잘 확인했어요',
      '약속 변경이 적었어요', '거래 태도가 친절했어요', '물건 수령 확인을 빠르게 해줬어요',
      '문제 발생 시 협조적이었어요', '다시 거래하고 싶어요'
    ],
    GREAT: [
      '결제를 빠르게 완료했어요', '픽업 시간을 잘 지켰어요', '픽업 장소에 정확히 도착했어요',
      '연락이 잘 되었어요', '응답이 빨랐어요', '공지사항을 잘 확인했어요',
      '약속 변경이 적었어요', '거래 태도가 친절했어요', '물건 수령 확인을 빠르게 해줬어요',
      '문제 발생 시 협조적이었어요', '다시 거래하고 싶어요'
    ]
  }
};

function renderChecklist() {
  const list = checklistData[role][selectedRating];
  const container = document.getElementById('checklist');
  container.innerHTML = '';
  list.forEach(item => {
    const label = document.createElement('label');
    label.className = 'checkbox-item';
    label.innerHTML = `<input type="checkbox"> ${item}`;
    container.appendChild(label);
  });
}

async function init() {
  if (!groupBuyId || !role || !checklistData[role]) {
    alert('잘못된 접근입니다.');
    history.back();
    return;
  }

  try {
    if (role === 'participant') {
      // 공동구매 조회 → 호스트 ID를 revieweeId로 설정
      const groupBuy = await getGroupBuyById(groupBuyId);
      revieweeId = groupBuy.hostId;
    } else {
      const participantId = params.get('participantId');
      if (participantId) {
        // 후기 현황 모달에서 특정 참여자 선택 후 진입 → 드롭다운 스킵
        revieweeId = Number(participantId);
      } else {
        // 직접 진입 시 드롭다운 표시
        const participants = await getParticipants(groupBuyId);
        if (participants.length === 0) {
          alert('참여자 정보를 불러올 수 없습니다.');
          history.back();
          return;
        }
        const select = document.getElementById('participantSelect');
        participants.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.participantId;
          opt.textContent = p.participantNickname;
          select.appendChild(opt);
        });
        document.getElementById('participantSection').style.display = '';
        revieweeId = Number(select.value);
        select.addEventListener('change', () => {
          revieweeId = Number(select.value);
        });
      }
    }
  } catch (e) {
    alert('정보를 불러오는데 실패했습니다.');
    history.back();
    return;
  }

  renderChecklist();
}

document.querySelectorAll('.rating-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedRating = btn.dataset.value;
    renderChecklist();
  });
});

document.getElementById('submitBtn').addEventListener('click', async () => {
  if (!revieweeId) {
    alert('후기를 작성할 대상을 선택해주세요.');
    return;
  }

  const checkedItems = [...document.querySelectorAll('.checkbox-item input:checked')]
    .map(cb => cb.parentElement.textContent.trim());

  const token = localStorage.getItem('token');
  try {
    const endpoint = role === 'host' ? 'host' : 'participant';
    const response = await fetch(`/api/groupbuys/${groupBuyId}/reviews/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ revieweeId, rating: selectedRating, checkedItems })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || '후기 작성에 실패했습니다.');
    }

    showToast('후기가 작성되었습니다.');
    const dest = role === 'participant' ? 'mypage.html?tab=joined' : 'mypage.html?tab=created';
    setTimeout(() => { location.href = dest; }, 1500);
  } catch (e) {
    showToast(e.message);
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  location.href = 'login.html';
});

init();

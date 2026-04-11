let currentStep = 1;
let selectedType = '';
let pickupTimes = [];
let selectedLat = null;
let selectedLng = null;
let selectedDongName = '';

// 날짜 입력 최솟값을 오늘로 설정
(() => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  document.getElementById('cr-pdate').min = `${yyyy}-${mm}-${dd}`;

  // 임시저장 데이터 있으면 팝업 표시
  if (localStorage.getItem('groupbuy_draft')) {
    document.getElementById('cr-draft-modal').style.display = 'flex';
  }
})();

// 임시저장 불러오기
function applyDraft() {
  const draft = JSON.parse(localStorage.getItem('groupbuy_draft'));
  if (!draft) return;

  if (draft.type) {
    const cards = document.querySelectorAll('.type-card');
    for (const card of cards) {
      if (card.getAttribute('onclick').indexOf(draft.type) !== -1) {
        crType(card, draft.type);
        break;
      }
    }
  }
  if (draft.title) document.getElementById('cr-title').value = draft.title;
  if (draft.category) document.getElementById('cr-category').value = draft.category;
  if (draft.desc) document.getElementById('cr-desc').value = draft.desc;
  if (draft.total) document.getElementById('cr-total').value = draft.total;
  if (draft.qty) document.getElementById('cr-qty').value = draft.qty;
  if (draft.head) document.getElementById('cr-head').value = draft.head;
  if (draft.addr) {
    document.getElementById('cr-addr').value = draft.addr;
    const resultEl = document.getElementById('cr-addr-result');
    resultEl.textContent = '주소: ' + draft.addr;
    resultEl.classList.remove('hidden');
  }
  if (draft.pickupTimes) {
    pickupTimes = draft.pickupTimes.slice();
    renderPickupChips();
  }

  ccnt('cr-title', 'cr-tc', 40);
  ccnt('cr-desc', 'cr-dc', 500);
  calcPrice();

  document.getElementById('cr-draft-modal').style.display = 'none';
}

// 임시저장 삭제 후 팝업 닫기
function dismissDraft() {
  localStorage.removeItem('groupbuy_draft');
  document.getElementById('cr-draft-modal').style.display = 'none';
}

// 페이지 이동
function go(page) {
  if (page === 'list') {
    window.location.href = 'index.html';
  }
}

// 구매 유형 선택
function crType(el, type) {
  document.querySelectorAll('.type-card').forEach(card => card.classList.remove('active'));
  el.classList.add('active');
  selectedType = type;
  document.getElementById('cr-type-err').style.display = 'none';

  // 온라인 마켓일 때 제품 링크 필드 표시
  const linkGroup = document.getElementById('cr-link-group');
  if (type === 'COUPANG_LINK') {
    linkGroup.classList.remove('hidden');
  } else {
    linkGroup.classList.add('hidden');
  }
}

// 글자 수 카운트
function ccnt(inputId, counterId, max) {
  const len = document.getElementById(inputId).value.length;
  document.getElementById(counterId).textContent = len;
}

// 스텝퍼 증감
function stepV(id, dir, min, max) {
  const input = document.getElementById(id);
  let val = parseInt(input.value) + dir;
  if (val < min) val = min;
  if (val > max) val = max;
  input.value = val;
  calcPrice();
}

// 인당 금액 및 호스트 예상 할인 계산
function calcPrice() {
  const totalEl = document.getElementById('cr-total');
  const headEl = document.getElementById('cr-head');
  if (!totalEl || !headEl) return;
  const total = parseInt(totalEl.value) || 0;
  const head = parseInt(headEl.value) || 1;

  // 인당 예상 금액
  const perPerson = head > 0 ? Math.ceil(total / head) : 0;
  document.getElementById('cr-pp-val').textContent = perPerson.toLocaleString() + ' 원';

  // 호스트 예상 할인
  const discEl = document.getElementById('cr-host-disc');
  if (total > 0) {
    const discountRate = Math.min(head * 0.01, 0.10);
    const discountAmount = Math.min(Math.floor(perPerson * discountRate), 15000);
    const discountPct = Math.round(discountRate * 100);
    discEl.textContent = `${discountPct}% → ${discountAmount.toLocaleString()}원`;
  } else {
    discEl.textContent = '— ';
  }
}

// 오늘 날짜 선택 시 현재 시각 이전 시/분 옵션 비활성화
function updateTimeOptions() {
  const dateVal = document.getElementById('cr-pdate').value;
  const hourSel = document.getElementById('cr-phour');
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const opt of hourSel.options) opt.disabled = false;

  if (dateVal === today) {
    const curHour = now.getHours();
    const curMin = now.getMinutes();
    const minHour = curMin >= 50 ? curHour + 1 : curHour;
    for (const opt of hourSel.options) {
      if (parseInt(opt.value) < minHour) opt.disabled = true;
    }
    if (hourSel.options[hourSel.selectedIndex].disabled) {
      for (let i = 0; i < hourSel.options.length; i++) {
        if (!hourSel.options[i].disabled) {
          hourSel.selectedIndex = i;
          break;
        }
      }
    }
  }

  updateMinOptions();
}

// 현재 시각 선택 시 현재 분 이전 옵션 비활성화
function updateMinOptions() {
  const dateVal = document.getElementById('cr-pdate').value;
  const hourSel = document.getElementById('cr-phour');
  const minSel = document.getElementById('cr-pmin');
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const opt of minSel.options) opt.disabled = false;

  if (dateVal === today && parseInt(hourSel.value) === now.getHours()) {
    const curMin = now.getMinutes();
    for (const opt of minSel.options) {
      if (parseInt(opt.value) <= curMin) opt.disabled = true;
    }
    if (minSel.options[minSel.selectedIndex].disabled) {
      for (let i = 0; i < minSel.options.length; i++) {
        if (!minSel.options[i].disabled) {
          minSel.selectedIndex = i;
          break;
        }
      }
    }
  }
}

// 픽업 시간 추가
function addPickupTime() {
  const date = document.getElementById('cr-pdate').value;
  const hour = document.getElementById('cr-phour').value;
  const min = document.getElementById('cr-pmin').value;
  const errEl = document.getElementById('cr-pickup-err');

  if (!date) {
    errEl.textContent = '날짜를 선택해 주세요.';
    errEl.style.display = 'block';
    return;
  }

  const datetime = `${date}T${hour}:${min}:00`;
  if (pickupTimes.indexOf(datetime) !== -1) return;

  pickupTimes.push(datetime);
  renderPickupChips();
  errEl.style.display = 'none';
}

function renderPickupChips() {
  const list = document.getElementById('cr-pickup-list');
  list.innerHTML = '';
  pickupTimes.forEach((dt, idx) => {
    const [date, timePart] = dt.split('T');
    const time = timePart.slice(0, 5);
    const chip = document.createElement('div');
    chip.className = 'pickup-chip';
    chip.innerHTML = `<span>${date} ${time}</span><button type="button" onclick="removePickupTime(${idx})">×</button>`;
    list.appendChild(chip);
  });
}

// 픽업 시간 삭제
function removePickupTime(idx) {
  pickupTimes.splice(idx, 1);
  renderPickupChips();
}

// 단계별 유효성 검사
function validateStep(step) {
  let valid = true;

  if (step === 1) {
    if (!selectedType) {
      document.getElementById('cr-type-err').style.display = 'block';
      valid = false;
    }
    const title = document.getElementById('cr-title').value.trim();
    const titleErr = document.getElementById('cr-title-err');
    if (title.length < 5) {
      titleErr.style.display = 'block';
      valid = false;
    } else {
      titleErr.style.display = 'none';
    }
    const category = document.getElementById('cr-category').value;
    const categoryErr = document.getElementById('cr-category-err');
    if (!category) {
      categoryErr.style.display = 'block';
      valid = false;
    } else {
      categoryErr.style.display = 'none';
    }
    const desc = document.getElementById('cr-desc').value.trim();
    const descErr = document.getElementById('cr-desc-err');
    if (desc.length < 10) {
      descErr.style.display = 'block';
      valid = false;
    } else {
      descErr.style.display = 'none';
    }
  }

  if (step === 2) {
    const total = document.getElementById('cr-total').value;
    const totalErr = document.getElementById('cr-total-err');
    if (!total || parseInt(total) <= 0) {
      totalErr.style.display = 'block';
      valid = false;
    } else {
      totalErr.style.display = 'none';
    }
    const qty = document.getElementById('cr-qty').value;
    const qtyErr = document.getElementById('cr-qty-err');
    if (!qty || parseInt(qty) <= 0) {
      qtyErr.style.display = 'block';
      valid = false;
    } else {
      qtyErr.style.display = 'none';
    }
  }

  if (step === 3) {
    const addr = document.getElementById('cr-addr').value.trim();
    const addrErr = document.getElementById('cr-addr-err');
    if (!addr) {
      addrErr.style.display = 'block';
      valid = false;
    } else {
      addrErr.style.display = 'none';
    }
    const pickupErr = document.getElementById('cr-pickup-err');
    if (pickupTimes.length === 0) {
      pickupErr.textContent = '픽업 시간을 1개 이상 추가해 주세요.';
      pickupErr.style.display = 'block';
      valid = false;
    } else {
      pickupErr.style.display = 'none';
    }
  }

  return valid;
}

function updateStepUI() {
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`cr-s${i}`).classList.toggle('active', i === currentStep);
    document.getElementById(`cr-si-${i}`).classList.toggle('active', i === currentStep);
  }

  const prevBtn = document.getElementById('cr-prev-btn');
  if (currentStep === 1) {
    prevBtn.classList.add('hidden');
  } else {
    prevBtn.classList.remove('hidden');
  }

  const nextBtn = document.getElementById('cr-next-btn');
  nextBtn.textContent = currentStep === 4 ? '등록하기' : '다음 단계 →';
}

function crNext() {
  if (currentStep === 4) {
    submitGroupBuy();
    return;
  }
  if (!validateStep(currentStep)) return;
  if (currentStep === 3) renderPreview();
  currentStep++;
  updateStepUI();
  window.scrollTo(0, 0);
}

function crPrev() {
  if (currentStep === 1) return;
  currentStep--;
  updateStepUI();
  window.scrollTo(0, 0);
}

function renderPreview() {
  const typeLabel = selectedType === 'COUPANG_LINK' ? '온라인 마켓' : '산지 직배송';
  const categoryEl = document.getElementById('cr-category');
  const categoryLabel = categoryEl.options[categoryEl.selectedIndex].text;
  const title = document.getElementById('cr-title').value.trim();
  const desc = document.getElementById('cr-desc').value.trim();
  const total = parseInt(document.getElementById('cr-total').value);
  const qty = document.getElementById('cr-qty').value;
  const head = document.getElementById('cr-head').value;
  const addr = document.getElementById('cr-addr').value.trim();
  const perPerson = Math.ceil(total / parseInt(head));
  const discountRate = Math.min(parseInt(head) * 0.01, 0.10);
  const discountAmount = Math.min(Math.floor(perPerson * discountRate), 15000);
  const discountPct = Math.round(discountRate * 100);
  const discountText = `${discountPct}% → ${discountAmount.toLocaleString()}원`;

  const timesHtml = pickupTimes.map(dt => {
    const [date, timePart] = dt.split('T');
    return `<li>${date} ${timePart.slice(0, 5)}</li>`;
  }).join('');

  document.getElementById('preview').innerHTML =
    '<div class="sec-title">📋 등록 내용 확인</div>' +
    '<table style="width:100%;font-size:14px;border-collapse:collapse">' +
    `<tr><td style="padding:6px 0;color:#6b7280;width:40%">구매 유형</td><td style="font-weight:600">${typeLabel}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">카테고리</td><td style="font-weight:600">${categoryLabel}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">제목</td><td style="font-weight:600">${title}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">설명</td><td style="font-weight:600">${desc}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">총 금액</td><td style="font-weight:600">${total.toLocaleString()} 원</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">총 수량</td><td style="font-weight:600">${qty} 개</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">최대 인원</td><td style="font-weight:600">${head} 명</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">인당 금액</td><td style="font-weight:600;color:#84cc16">${perPerson.toLocaleString()} 원</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">호스트 예상 할인</td><td style="font-weight:600;color:#84cc16">${discountText}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">픽업 장소</td><td style="font-weight:600">${addr}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">픽업 시간</td><td><ul style="padding-left:16px">${timesHtml}</ul></td></tr>` +
    '</table>';
}

// 임시저장
function saveDraft() {
  const draft = {
    type: selectedType,
    title: document.getElementById('cr-title').value,
    category: document.getElementById('cr-category').value,
    desc: document.getElementById('cr-desc').value,
    total: document.getElementById('cr-total').value,
    qty: document.getElementById('cr-qty').value,
    head: document.getElementById('cr-head').value,
    addr: document.getElementById('cr-addr').value,
    pickupTimes: pickupTimes.slice()
  };
  localStorage.setItem('groupbuy_draft', JSON.stringify(draft));
  alert('임시저장 되었습니다.');
}

function searchAddress() {
  new daum.Postcode({
    oncomplete: (data) => {
      // 도로명 주소 우선 사용 없으면 지번 주소 사용
      const addr = data.roadAddress || data.jibunAddress;
      selectedDongName = data.bname || '';
      document.getElementById('cr-addr').value = addr;
      document.getElementById('cr-addr-err').style.display = 'none';
      const resultEl = document.getElementById('cr-addr-result');
      resultEl.textContent = '주소: ' + addr;
      resultEl.classList.remove('hidden');

      // 카카오 REST API로 주소를 위도/경도로 변환
      fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(addr)}`, {
        headers: { 'Authorization': 'KakaoAK 6862dc8015e382acfd29f23b95906a08' }
      }).then(res => res.json()).then(json => {
        if (json.documents && json.documents.length > 0) {
          selectedLat = parseFloat(json.documents[0].y);
          selectedLng = parseFloat(json.documents[0].x);
        }
      });
    }
  }).open();
}

function submitGroupBuy() {
  if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }
  const data = {
    title: document.getElementById('cr-title').value.trim(),
    description: document.getElementById('cr-desc').value.trim(),
    productType: selectedType,
    category: document.getElementById('cr-category').value,
    totalPrice: parseInt(document.getElementById('cr-total').value),
    totalQuantity: parseInt(document.getElementById('cr-qty').value),
    maxParticipants: parseInt(document.getElementById('cr-head').value),
    pickupLocation: document.getElementById('cr-addr').value.trim(),
    lat: selectedLat,
    lng: selectedLng,
    dongName: selectedDongName,
    pickupTimes: pickupTimes.slice(),
    imageUrls: []
  };

  const nextBtn = document.getElementById('cr-next-btn');
  nextBtn.disabled = true;
  nextBtn.textContent = '등록 중...';

  createGroupBuy(data).then(() => {
    localStorage.removeItem('groupbuy_draft');
    window.location.href = 'index.html';
  }).catch((err) => {
    alert(err.message);
    nextBtn.disabled = false;
    nextBtn.textContent = '등록하기';
  });
}

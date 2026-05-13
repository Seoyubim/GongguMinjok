checkTokenExpiry();

const groupBuyId = new URLSearchParams(location.search).get('id');

let currentStep = 1;
let pickupTimes = [];
let selectedLat = null;
let selectedLng = null;
let selectedDongName = '';
let originalDeadline = null;
let originalData = null;
let protectedPickupTimes = [];

(async () => {
  if (!groupBuyId) {
    window.location.href = 'index.html';
    return;
  }

  const [data, participants] = await Promise.all([
    getGroupBuyById(groupBuyId),
    getParticipants(groupBuyId)
  ]);
  originalData = data;

  protectedPickupTimes = participants
    .filter(p => p.pickupTime !== null)
    .map(p => p.pickupTime);

  document.getElementById('cr-title').value = data.title;
  document.getElementById('cr-category').value = data.category;
  document.getElementById('cr-desc').value = data.description;
  document.getElementById('cr-deadline').value = data.deadline.slice(0, 10);

  ccnt('cr-title', 'cr-tc', 40);
  ccnt('cr-desc', 'cr-dc', 500);

  selectedLat = data.lat;
  selectedLng = data.lng;
  selectedDongName = data.dongName;
  document.getElementById('cr-addr').value = data.pickupLocation;
  const resultEl = document.getElementById('cr-addr-result');
  resultEl.textContent = '주소: ' + data.pickupLocation;
  resultEl.classList.remove('hidden');

  // API 응답의 픽업 시간은 {id, pickupTime} 객체 배열이라 시간 문자열만 추출
  pickupTimes = data.pickupTimes.map(pt => pt.pickupTime);
  renderPickupChips();

  // 마감일 최솟값: 기존 마감일 (단축 불가)
  document.getElementById('cr-deadline').min = data.deadline.slice(0, 10);

  // 마감일 최댓값: originalDeadline + 7일
  originalDeadline = data.originalDeadline;
  const maxDate = new Date(originalDeadline);
  maxDate.setDate(maxDate.getDate() + 7);
  document.getElementById('cr-deadline').max = maxDate.toISOString().slice(0, 10);

  updatePickupMin();
})();

function alertImageUpload() {
  showToast('이미지 업로드는 추후 지원 예정입니다.');
  return false;
}

function go(page) {
  if (page === 'list') window.location.href = 'index.html';
}

function ccnt(inputId, counterId, max) {
  const len = document.getElementById(inputId).value.length;
  document.getElementById(counterId).textContent = len;
}

function updatePickupMin() {
  const deadlineVal = document.getElementById('cr-deadline').value;
  const pickupInput = document.getElementById('cr-pdatetime');
  if (deadlineVal) {
    pickupInput.min = deadlineVal + 'T23:59';
  } else {
    const now = new Date();
    pickupInput.min = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + 'T' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');
  }
}

function addPickupTime() {
  const val = document.getElementById('cr-pdatetime').value;
  const errEl = document.getElementById('cr-pickup-err');
  const deadlineVal = document.getElementById('cr-deadline').value;

  if (!val) {
    errEl.textContent = '날짜와 시간을 선택해 주세요.';
    errEl.style.display = 'block';
    return;
  }

  if (deadlineVal && new Date(val) <= new Date(deadlineVal + 'T23:59')) {
    errEl.textContent = '픽업 시간은 모집 마감일 이후로 설정해 주세요.';
    errEl.style.display = 'block';
    return;
  }

  // 픽업 시간은 마감일로부터 14일 이내여야 함 (백엔드 정책과 동일)
  const maxPickup = new Date(deadlineVal + 'T23:59');
  maxPickup.setDate(maxPickup.getDate() + 14);
  if (new Date(val) > maxPickup) {
    errEl.textContent = '픽업 시간은 마감일로부터 14일 이내로 설정해 주세요.';
    errEl.style.display = 'block';
    return;
  }

  const datetime = val + ':00';
  if (pickupTimes.indexOf(datetime) !== -1) return;
  pickupTimes.push(datetime);
  renderPickupChips();
  errEl.style.display = 'none';
  document.getElementById('cr-pdatetime').value = '';
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

function removePickupTime(idx) {
  if (protectedPickupTimes.includes(pickupTimes[idx])) {
    showToast('참여자가 선택한 픽업 시간은 삭제할 수 없습니다.');
    return;
  }
  pickupTimes.splice(idx, 1);
  renderPickupChips();
}

function validateStep(step) {
  let valid = true;

  if (step === 1) {
    const title = document.getElementById('cr-title').value.trim();
    const titleErr = document.getElementById('cr-title-err');
    if (title.length < 2) {
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
    if (desc.length < 5) {
      descErr.style.display = 'block';
      valid = false;
    } else {
      descErr.style.display = 'none';
    }
  }

  if (step === 2) {
    const deadline = document.getElementById('cr-deadline').value;
    const deadlineErr = document.getElementById('cr-deadline-err');
    const originalMin = new Date(originalData.deadline.slice(0, 10));
    const maxDate = new Date(originalDeadline);
    maxDate.setDate(maxDate.getDate() + 7);

    if (!deadline) {
      deadlineErr.textContent = '모집 마감일을 입력해 주세요.';
      deadlineErr.style.display = 'block';
      valid = false;
    } else if (new Date(deadline) < originalMin) {
      deadlineErr.textContent = '마감일은 기존 마감일보다 이전으로 변경할 수 없습니다.';
      deadlineErr.style.display = 'block';
      valid = false;
    } else if (new Date(deadline) > maxDate) {
      deadlineErr.textContent = '마감일은 최초 마감일 기준 7일을 초과할 수 없습니다.';
      deadlineErr.style.display = 'block';
      valid = false;
    } else {
      deadlineErr.style.display = 'none';
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
      const deadlineVal = document.getElementById('cr-deadline').value;
      const maxPickup = new Date(deadlineVal + 'T23:59');
      maxPickup.setDate(maxPickup.getDate() + 14);
      if (deadlineVal && pickupTimes.some(dt => new Date(dt) <= new Date(deadlineVal + 'T23:59'))) {
        pickupErr.textContent = '픽업 시간은 모집 마감일 이후로 설정해 주세요.';
        pickupErr.style.display = 'block';
        valid = false;
      } else if (pickupTimes.some(dt => new Date(dt) > maxPickup)) {
        pickupErr.textContent = '픽업 시간은 마감일로부터 14일 이내로 설정해 주세요.';
        pickupErr.style.display = 'block';
        valid = false;
      } else {
        pickupErr.style.display = 'none';
      }
    }
  }

  return valid;
}

function updateStepUI() {
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`cr-s${i}`).classList.toggle('active', i === currentStep);
    document.getElementById(`cr-si-${i}`).classList.toggle('active', i === currentStep);
    document.getElementById(`cr-si-${i}`).classList.toggle('completed', i < currentStep);
  }

  const prevBtn = document.getElementById('cr-prev-btn');
  currentStep === 1 ? prevBtn.classList.add('hidden') : prevBtn.classList.remove('hidden');

  const nextBtn = document.getElementById('cr-next-btn');
  nextBtn.textContent = currentStep === 4 ? '수정하기' : '다음 단계 →';
}

function crNext() {
  if (currentStep === 4) { submitGroupBuy(); return; }
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
  const categoryEl = document.getElementById('cr-category');
  const categoryLabel = categoryEl.options[categoryEl.selectedIndex].text;
  const title = document.getElementById('cr-title').value.trim();
  const desc = document.getElementById('cr-desc').value.trim();
  const addr = document.getElementById('cr-addr').value.trim();
  const deadlineLabel = document.getElementById('cr-deadline').value;
  const timesHtml = pickupTimes.map(dt => {
    const [date, timePart] = dt.split('T');
    return `<li>${date} ${timePart.slice(0, 5)}</li>`;
  }).join('');

  document.getElementById('preview').innerHTML =
    '<div class="sec-title">📋 수정 내용 확인</div>' +
    '<table style="width:100%;font-size:14px;border-collapse:collapse">' +
    `<tr><td style="padding:6px 0;color:#6b7280;width:40%">카테고리</td><td style="font-weight:600">${categoryLabel}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">제목</td><td style="font-weight:600">${title}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">설명</td><td style="font-weight:600">${desc}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">모집 마감일</td><td style="font-weight:600">${deadlineLabel}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280">픽업 장소</td><td style="font-weight:600">${addr}</td></tr>` +
    `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">픽업 시간</td><td><ul style="padding-left:16px">${timesHtml}</ul></td></tr>` +
    '</table>';
}

function searchAddress() {
  new daum.Postcode({
    oncomplete: (data) => {
      // 도로명 주소 우선 사용, 없으면 지번 주소 사용
      const addr = data.roadAddress || data.jibunAddress;
      const addrErr = document.getElementById('cr-addr-err');
      const resultEl = document.getElementById('cr-addr-result');

      // 카카오 REST API로 주소를 위도/경도로 변환 — 성공 후 주소 확정
      fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(addr)}`, {
        headers: { 'Authorization': 'KakaoAK 6862dc8015e382acfd29f23b95906a08' }
      }).then(res => res.json()).then(json => {
        if (json.documents && json.documents.length > 0) {
          selectedLat = parseFloat(json.documents[0].y);
          selectedLng = parseFloat(json.documents[0].x);
          selectedDongName = data.bname || '';
          document.getElementById('cr-addr').value = addr;
          addrErr.style.display = 'none';
          resultEl.textContent = '주소: ' + addr;
          resultEl.classList.remove('hidden');
        } else {
          addrErr.textContent = '주소 좌표를 가져오지 못했습니다. 다시 검색해 주세요.';
          addrErr.style.display = 'block';
          resultEl.classList.add('hidden');
        }
      }).catch(() => {
        addrErr.textContent = '주소 좌표를 가져오지 못했습니다. 다시 검색해 주세요.';
        addrErr.style.display = 'block';
        resultEl.classList.add('hidden');
      });
    }
  }).open();
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

function submitGroupBuy() {
  if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  const data = {
    title: document.getElementById('cr-title').value.trim(),
    description: document.getElementById('cr-desc').value.trim(),
    productType: originalData.productType,
    category: document.getElementById('cr-category').value,
    totalPrice: originalData.totalPrice,
    totalQuantity: originalData.totalQuantity,
    maxParticipants: originalData.maxParticipants,
    pickupLocation: document.getElementById('cr-addr').value.trim(),
    lat: selectedLat,
    lng: selectedLng,
    dongName: selectedDongName,
    deadline: document.getElementById('cr-deadline').value + 'T23:59:00',
    pickupTimes: pickupTimes.slice(),
    imageUrls: originalData.imageUrls || []
  };

  const nextBtn = document.getElementById('cr-next-btn');
  nextBtn.disabled = true;
  nextBtn.textContent = '수정 중...';

  updateGroupBuy(groupBuyId, data).then(() => {
    window.location.href = 'detail.html?id=' + groupBuyId;
  }).catch((err) => {
    showToast(err.message || '수정에 실패했습니다.');
    nextBtn.disabled = false;
    nextBtn.textContent = '수정하기';
  });
}

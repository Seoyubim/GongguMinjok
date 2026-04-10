// 현재 단계 및 입력 상태
var currentStep = 1;
var selectedType = '';
var pickupTimes = [];

// 날짜 입력 최솟값을 오늘로 설정 (이전 날짜 선택 불가)
(function() {
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var dd = String(today.getDate()).padStart(2, '0');
  document.getElementById('cr-pdate').min = yyyy + '-' + mm + '-' + dd;
})();

// 페이지 이동
function go(page) {
  if (page === 'list') {
    window.location.href = 'index.html';
  }
}

// 구매 유형 선택
function crType(el, type) {
  var cards = document.querySelectorAll('.type-card');
  for (var i = 0; i < cards.length; i++) {
    cards[i].classList.remove('active');
  }
  el.classList.add('active');
  selectedType = type;
  document.getElementById('cr-type-err').style.display = 'none';

  // 온라인 마켓일 때만 제품 링크 필드 표시
  var linkGroup = document.getElementById('cr-link-group');
  if (type === 'COUPANG_LINK') {
    linkGroup.classList.remove('hidden');
  } else {
    linkGroup.classList.add('hidden');
  }
}

// 글자 수 카운트
function ccnt(inputId, counterId, max) {
  var len = document.getElementById(inputId).value.length;
  document.getElementById(counterId).textContent = len;
}

// 스텝퍼 증감
function stepV(id, dir, min, max) {
  var input = document.getElementById(id);
  var val = parseInt(input.value) + dir;
  if (val < min) val = min;
  if (val > max) val = max;
  input.value = val;
  calcPrice();
}

// 인당 금액 계산
function calcPrice() {
  var totalEl = document.getElementById('cr-total');
  var headEl = document.getElementById('cr-head');
  if (!totalEl || !headEl) return;
  var total = parseInt(totalEl.value) || 0;
  var head = parseInt(headEl.value) || 1;
  var perPerson = head > 0 ? Math.ceil(total / head) : 0;
  document.getElementById('cr-pp-val').textContent = perPerson.toLocaleString() + ' 원';
}

// 오늘 날짜 선택 시 현재 시각 이전 시/분 옵션 비활성화
function updateTimeOptions() {
  var dateVal = document.getElementById('cr-pdate').value;
  var hourSel = document.getElementById('cr-phour');
  var now = new Date();
  var today = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');

  for (var i = 0; i < hourSel.options.length; i++) {
    hourSel.options[i].disabled = false;
  }

  if (dateVal === today) {
    var curHour = now.getHours();
    var curMin = now.getMinutes();
    // 분이 50 이상이면 현재 시도 선택 불가 (남은 10분 단위 없음)
    var minHour = curMin >= 50 ? curHour + 1 : curHour;
    for (var i = 0; i < hourSel.options.length; i++) {
      if (parseInt(hourSel.options[i].value) < minHour) {
        hourSel.options[i].disabled = true;
      }
    }
    // 선택된 시가 비활성화됐으면 첫 번째 유효한 시로 이동
    if (hourSel.options[hourSel.selectedIndex].disabled) {
      for (var i = 0; i < hourSel.options.length; i++) {
        if (!hourSel.options[i].disabled) {
          hourSel.selectedIndex = i;
          break;
        }
      }
    }
  }

  updateMinOptions();
}

// 시 변경 시 현재 시각 이전 분 옵션 비활성화
function updateMinOptions() {
  var dateVal = document.getElementById('cr-pdate').value;
  var hourSel = document.getElementById('cr-phour');
  var minSel = document.getElementById('cr-pmin');
  var now = new Date();
  var today = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');

  for (var j = 0; j < minSel.options.length; j++) {
    minSel.options[j].disabled = false;
  }

  if (dateVal === today && parseInt(hourSel.value) === now.getHours()) {
    var curMin = now.getMinutes();
    for (var j = 0; j < minSel.options.length; j++) {
      if (parseInt(minSel.options[j].value) <= curMin) {
        minSel.options[j].disabled = true;
      }
    }
    // 선택된 분이 비활성화됐으면 첫 번째 유효한 분으로 이동
    if (minSel.options[minSel.selectedIndex].disabled) {
      for (var j = 0; j < minSel.options.length; j++) {
        if (!minSel.options[j].disabled) {
          minSel.selectedIndex = j;
          break;
        }
      }
    }
  }
}

// 픽업 시간 추가
function addPickupTime() {
  var date = document.getElementById('cr-pdate').value;
  var hour = document.getElementById('cr-phour').value;
  var min = document.getElementById('cr-pmin').value;
  var errEl = document.getElementById('cr-pickup-err');

  if (!date) {
    errEl.textContent = '날짜를 선택해 주세요.';
    errEl.style.display = 'block';
    return;
  }

  var datetime = date + 'T' + hour + ':' + min + ':00';

  if (pickupTimes.indexOf(datetime) !== -1) return;

  pickupTimes.push(datetime);
  renderPickupChips();
  errEl.style.display = 'none';
}

// 픽업 시간 칩 렌더링
function renderPickupChips() {
  var list = document.getElementById('cr-pickup-list');
  list.innerHTML = '';
  for (var i = 0; i < pickupTimes.length; i++) {
    (function(idx) {
      var dt = pickupTimes[idx];
      var parts = dt.split('T');
      var date = parts[0];
      var time = parts[1].slice(0, 5);
      var chip = document.createElement('div');
      chip.className = 'pickup-chip';
      chip.innerHTML = '<span>' + date + ' ' + time + '</span><button type="button" onclick="removePickupTime(' + idx + ')">×</button>';
      list.appendChild(chip);
    })(i);
  }
}

// 픽업 시간 삭제
function removePickupTime(idx) {
  pickupTimes.splice(idx, 1);
  renderPickupChips();
}

// 단계별 유효성 검사
function validateStep(step) {
  var valid = true;

  if (step === 1) {
    if (!selectedType) {
      document.getElementById('cr-type-err').style.display = 'block';
      valid = false;
    }
    var title = document.getElementById('cr-title').value.trim();
    var titleErr = document.getElementById('cr-title-err');
    if (title.length < 5) {
      titleErr.style.display = 'block';
      valid = false;
    } else {
      titleErr.style.display = 'none';
    }
    var category = document.getElementById('cr-category').value;
    var categoryErr = document.getElementById('cr-category-err');
    if (!category) {
      categoryErr.style.display = 'block';
      valid = false;
    } else {
      categoryErr.style.display = 'none';
    }
    var desc = document.getElementById('cr-desc').value.trim();
    var descErr = document.getElementById('cr-desc-err');
    if (desc.length < 10) {
      descErr.style.display = 'block';
      valid = false;
    } else {
      descErr.style.display = 'none';
    }
  }

  if (step === 2) {
    var total = document.getElementById('cr-total').value;
    var totalErr = document.getElementById('cr-total-err');
    if (!total || parseInt(total) <= 0) {
      totalErr.style.display = 'block';
      valid = false;
    } else {
      totalErr.style.display = 'none';
    }
    var qty = document.getElementById('cr-qty').value;
    var qtyErr = document.getElementById('cr-qty-err');
    if (!qty || parseInt(qty) <= 0) {
      qtyErr.style.display = 'block';
      valid = false;
    } else {
      qtyErr.style.display = 'none';
    }
  }

  if (step === 3) {
    var addr = document.getElementById('cr-addr').value.trim();
    var addrErr = document.getElementById('cr-addr-err');
    if (!addr) {
      addrErr.style.display = 'block';
      valid = false;
    } else {
      addrErr.style.display = 'none';
    }
    var pickupErr = document.getElementById('cr-pickup-err');
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

// 스텝 UI 갱신
function updateStepUI() {
  for (var i = 1; i <= 4; i++) {
    document.getElementById('cr-s' + i).classList.toggle('active', i === currentStep);
    document.getElementById('cr-si-' + i).classList.toggle('active', i === currentStep);
  }

  var prevBtn = document.getElementById('cr-prev-btn');
  if (currentStep === 1) {
    prevBtn.classList.add('hidden');
  } else {
    prevBtn.classList.remove('hidden');
  }

  var nextBtn = document.getElementById('cr-next-btn');
  nextBtn.textContent = currentStep === 4 ? '등록하기' : '다음 단계 →';
}

// 다음 단계
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

// 이전 단계
function crPrev() {
  if (currentStep === 1) return;
  currentStep--;
  updateStepUI();
  window.scrollTo(0, 0);
}

// 미리보기 렌더링 (step 4 진입 시 호출)
function renderPreview() {
  var typeLabel = selectedType === 'COUPANG_LINK' ? '온라인 마켓' : '산지 직배송';
  var categoryEl = document.getElementById('cr-category');
  var categoryLabel = categoryEl.options[categoryEl.selectedIndex].text;
  var title = document.getElementById('cr-title').value.trim();
  var desc = document.getElementById('cr-desc').value.trim();
  var total = parseInt(document.getElementById('cr-total').value);
  var qty = document.getElementById('cr-qty').value;
  var head = document.getElementById('cr-head').value;
  var addr = document.getElementById('cr-addr').value.trim();
  var perPerson = Math.ceil(total / parseInt(head));

  var timesHtml = '';
  for (var i = 0; i < pickupTimes.length; i++) {
    var parts = pickupTimes[i].split('T');
    timesHtml += '<li>' + parts[0] + ' ' + parts[1].slice(0, 5) + '</li>';
  }

  document.getElementById('preview').innerHTML =
    '<div class="sec-title">📋 등록 내용 확인</div>' +
    '<table style="width:100%;font-size:14px;border-collapse:collapse">' +
    '<tr><td style="padding:6px 0;color:#6b7280;width:40%">구매 유형</td><td style="font-weight:600">' + typeLabel + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280">카테고리</td><td style="font-weight:600">' + categoryLabel + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280">제목</td><td style="font-weight:600">' + title + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280">설명</td><td style="font-weight:600">' + desc + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280">총 금액</td><td style="font-weight:600">' + total.toLocaleString() + ' 원</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280">총 수량</td><td style="font-weight:600">' + qty + ' 개</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280">최대 인원</td><td style="font-weight:600">' + head + ' 명</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280">인당 금액</td><td style="font-weight:600;color:#84cc16">' + perPerson.toLocaleString() + ' 원</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280">픽업 장소</td><td style="font-weight:600">' + addr + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">픽업 시간</td><td><ul style="padding-left:16px">' + timesHtml + '</ul></td></tr>' +
    '</table>';
}

// 임시저장
function saveDraft() {
  var draft = {
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

// =====================
// 픽업 장소 주소 검색 (카카오 우편번호 검색)
// =====================

function searchAddress() {
  new daum.Postcode({
    oncomplete: function(data) {
      // 도로명 주소 우선, 없으면 지번 주소 사용
      var addr = data.roadAddress || data.jibunAddress;
      document.getElementById('cr-addr').value = addr;
      document.getElementById('cr-addr-err').style.display = 'none';
    }
  }).open();
}

// 공구 등록
function submitGroupBuy() {
  var data = {
    title: document.getElementById('cr-title').value.trim(),
    description: document.getElementById('cr-desc').value.trim(),
    productType: selectedType,
    category: document.getElementById('cr-category').value,
    totalPrice: parseInt(document.getElementById('cr-total').value),
    totalQuantity: parseInt(document.getElementById('cr-qty').value),
    maxParticipants: parseInt(document.getElementById('cr-head').value),
    pickupLocation: document.getElementById('cr-addr').value.trim(),
    pickupTimes: pickupTimes.slice(),
    imageUrls: [],
    rewardPerUser: 0,
    maxReward: 0
  };

  var nextBtn = document.getElementById('cr-next-btn');
  nextBtn.disabled = true;
  nextBtn.textContent = '등록 중...';

  createGroupBuy(data).then(function() {
    localStorage.removeItem('groupbuy_draft');
    window.location.href = 'index.html';
  }).catch(function(err) {
    alert(err.message);
    nextBtn.disabled = false;
    nextBtn.textContent = '등록하기';
  });
}

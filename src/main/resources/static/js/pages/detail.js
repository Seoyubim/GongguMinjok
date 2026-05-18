checkTokenExpiry();
(function () {
  const state = {
    groupBuy: null,
    selectedTime: null,
    selectedTimeId: null,
    participants: [],
    pickupMap: null,
    pickupLocationMarker: null,
    pickupCurrentLocationMarker: null,
    modalMode: 'join',      // 'join' | 'changePickup'
    hostPickupTimes: []     // 호스트 픽업 시간 변경 모달 작업 목록
  };

  document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    init();
    bindPickupMapEvents();
  });

  // =============================
  // 카카오맵 SDK 로드 대기
  // =============================
  // autoload=false 방식: window.kakao 객체 생성 여부만 확인
  // kakao.maps.Map 준비는 kakao.maps.load() 콜백에서 보장
  function waitForKakao(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const isReady = () => window.kakaoSdkReady === true || window.kakao != null;

      if (isReady()) {
        resolve();
        return;
      }

      const interval = 100;
      let elapsed = 0;

      const timer = setInterval(() => {
        elapsed += interval;

        if (isReady()) {
          clearInterval(timer);
          resolve();
          return;
        }

        if (elapsed >= timeout) {
          clearInterval(timer);
          reject(new Error("카카오맵 SDK 로드 시간이 초과되었습니다."));
        }
      }, interval);
    });
  }

  // =============================
  // 픽업 장소 지도 Modal
  // =============================

  /**
   * 픽업 장소 텍스트를 키워드 검색으로 좌표 변환 후 지도 초기화.
   * 이미 지도가 생성된 경우 중심만 재설정.
   *
   * detail.html은 autoload 없이 SDK를 로드하므로
   * waitForKakao() 완료 시점에 services 포함 모든 라이브러리가 준비됨.
   * kakao.maps.load() 추가 호출 불필요 → keywordSearch 즉시 실행 가능.
   *
   * @param {string} pickupLocation - 픽업 장소 텍스트 (예: "광주 공원")
   */
  // lat, lng: groupBuy 데이터의 좌표값 (DB 연동 시 API 응답에서 그대로 전달)
  // lat/lng가 없을 경우 광주 기본 좌표로 폴백
  async function initPickupMap(lat, lng, pickupLocation) {
    const mapContainer = document.getElementById("pickupMap");
    if (!mapContainer) return;

    try {
      await waitForKakao();
    } catch (e) {
      console.error("카카오맵 SDK 로드 실패:", e);
      return;
    }

    // autoload=false 방식: kakao.maps.load() 콜백 안에서 지도 API 사용 (index.html과 동일한 패턴)
    kakao.maps.load(() => {
      const centerLatLng =
        lat != null && lng != null
          ? new kakao.maps.LatLng(lat, lng)
          : new kakao.maps.LatLng(35.1469, 126.9229);

      renderPickupMap(mapContainer, centerLatLng, pickupLocation);
    });
  }

  /**
   * 지도 생성 또는 중심 이동 + 마커 표시
   */
  function renderPickupMap(mapContainer, centerLatLng, pickupLocation) {
    if (!state.pickupMap) {
      // 최초 생성
      state.pickupMap = new kakao.maps.Map(mapContainer, {
        center: centerLatLng,
        level: 4
      });

      state.pickupMap.setZoomable(true);
      state.pickupMap.setDraggable(true);

      const zoomControl = new kakao.maps.ZoomControl();
      state.pickupMap.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
    } else {
      // 이미 있으면 중심만 재설정
      state.pickupMap.setCenter(centerLatLng);
      state.pickupMap.setLevel(4);

      if (state.pickupLocationMarker) {
        state.pickupLocationMarker.setMap(null);
      }
    }

    // 픽업 장소 마커
    state.pickupLocationMarker = new kakao.maps.Marker({
      map: state.pickupMap,
      position: centerLatLng,
      title: pickupLocation
    });

    // 인포윈도우
    const infowindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:8px 12px; font-size:13px; font-weight:600;">📍 ${pickupLocation}</div>`
    });
    infowindow.open(state.pickupMap, state.pickupLocationMarker);

    // modal이 display:flex 된 직후라 크기 재계산 필요
    setTimeout(() => {
      state.pickupMap.relayout();
      state.pickupMap.setCenter(centerLatLng);
    }, 50);
  }

  /**
   * 픽업 지도 modal 이벤트 바인딩
   */
  function bindPickupMapEvents() {
    const trigger = document.getElementById("pickupMapTrigger");
    const modal = document.getElementById("pickupMapModal");
    const closeBtn = document.getElementById("closePickupMapBtn");
    const locationBtn = document.getElementById("pickupLocationBtn");

    if (!trigger || !modal) return;

    // 지도 보기 → 버튼 클릭
    trigger.addEventListener("click", () => {
      const { lat, lng, pickupLocation } = state.groupBuy ?? {};
      modal.classList.remove("hidden");
      initPickupMap(lat, lng, pickupLocation || "광주광역시");
    });

    // × 닫기 버튼
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }

    // 모달 바깥 클릭
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });

    // 내 위치 버튼
    if (locationBtn) {
      locationBtn.addEventListener("click", () => {
        if (!state.pickupMap) return;

        if (!navigator.geolocation) {
          showToast("위치 정보를 지원하지 않는 브라우저입니다.");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const myLatLng = new kakao.maps.LatLng(
              position.coords.latitude,
              position.coords.longitude
            );

            state.pickupMap.setCenter(myLatLng);
            state.pickupMap.setLevel(3);

            if (state.pickupCurrentLocationMarker) {
              state.pickupCurrentLocationMarker.setMap(null);
            }

            state.pickupCurrentLocationMarker = new kakao.maps.Marker({
              map: state.pickupMap,
              position: myLatLng,
              title: "내 위치"
            });
          },
          () => {
            showToast("현재 위치를 가져올 수 없습니다.");
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      });
    }
  }

  function updateAuthUI() {
    const loginBtn = document.getElementById("loginBtn");
    const mypageBtn = document.getElementById("mypageBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const writeBtn = document.getElementById("writeBtn");

    if (!loginBtn || !mypageBtn || !logoutBtn) return;

    const isLoggedIn =
      typeof getLoginState === "function" ? getLoginState() : false;

    if (isLoggedIn) {
      loginBtn.classList.add("hidden");
      mypageBtn.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");
      writeBtn?.classList.remove("hidden");
      logoutBtn.addEventListener("click", handleLogout);
    } else {
      loginBtn.classList.remove("hidden");
      mypageBtn.classList.add("hidden");
      logoutBtn.classList.add("hidden");
      writeBtn?.classList.add("hidden");
    }
  }

  async function init() {
    const groupBuyId = getGroupBuyIdFromUrl();

    try {
      // DB 연동 시 getGroupBuyById 내부만 fetch로 교체하면 이 코드는 그대로 유지
      let groupBuy = await getGroupBuyById(groupBuyId);

      // id로 못 찾으면 첫 번째 항목으로 폴백 (개발 환경용)
      if (!groupBuy) {
        const allGroupBuys = await getGroupBuys();
        groupBuy = allGroupBuys[0];
      }

      if (!groupBuy) {
        console.error("상세 데이터를 찾을 수 없습니다.");
        showToast("상세 데이터를 찾을 수 없습니다.");
        return;
      }

      state.groupBuy = groupBuy;
      const firstTime = groupBuy.pickupTimes?.[0];
      state.selectedTime = firstTime?.pickupTime ?? null;
      state.selectedTimeId = firstTime?.id ?? null;

      try {
        const participants = await fetch(`/api/groupbuys/${groupBuy.id}/participants`);
        state.participants = participants.ok ? await participants.json() : [];
      } catch {
        state.participants = [];
      }

      renderDetail(groupBuy);
      bindEvents();
    } catch (e) {
      console.error("데이터 로드 실패:", e);
      showToast("데이터를 불러올 수 없습니다.");
    }
  }

  function getGroupBuyIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    return Number.isNaN(id) ? null : id;
  }

  function getInitialSelectedTime(groupBuy) {
    if (Array.isArray(groupBuy.pickupTimes) && groupBuy.pickupTimes.length > 0) {
      return groupBuy.pickupTimes[0];
    }
    return null;
  }

  function renderDetail(groupBuy) {
    renderHero(groupBuy);
    renderBasicInfo(groupBuy);
    renderGroupBuyInfo(groupBuy);
    renderRecruitmentStatus(groupBuy);
    renderParticipants(state.participants);
    renderComments(groupBuy.comments || []);
    renderBottomBar(groupBuy);
    renderModal(groupBuy);
  }

  function renderHero(groupBuy) {
    const imageEl = document.getElementById("detailImage");
    if (!imageEl) return;

    imageEl.src = groupBuy.imageUrls?.[0] || "";
    imageEl.onerror = () => {
      imageEl.onerror = null;
      imageEl.src = "";
    };
  }

  function renderBasicInfo(groupBuy) {
    const titleEl = document.querySelector(".detail-title");
    const metaEl = document.querySelector(".detail-meta");
    const descEl = document.querySelector(".card .medium-note");

    if (titleEl) {
      titleEl.textContent = groupBuy.title;
    }

    if (metaEl) {
      const spans = metaEl.querySelectorAll("span");

      if (spans[0]) {
        spans[0].textContent = `👤 ${groupBuy.hostNickname}`;
      }

      if (spans[1]) {
        if (groupBuy.hostMannerGrade != null) {
          spans[1].textContent = `${getBadgeEmoji(groupBuy.hostMannerGrade)} ${Number(groupBuy.hostMannerScore).toFixed(1)}`;
        }
      }
    }

    if (descEl) {
      descEl.textContent = groupBuy.description;
    }
  }

  function renderGroupBuyInfo(groupBuy) {
    const infoCard = getCardBySectionTitle("📄 공동구매 정보");
    if (!infoCard) return;

    const rows = infoCard.querySelectorAll(".split-row.small-note");

    if (rows[0]) {
      const strong = rows[0].querySelector("strong");
      if (strong) {
        strong.textContent = formatPrice(groupBuy.participantFinalPrice);
      }
    }

    if (rows[1]) {
      const valueSpan = rows[1].querySelectorAll("span")[1];
      if (valueSpan) {
        valueSpan.textContent = `최대 ${groupBuy.maxParticipants}명`;
      }
    }

    if (rows[2]) {
      const valueSpan = rows[2].querySelectorAll("span")[1];
      if (valueSpan) {
        valueSpan.textContent = groupBuy.pickupLocation;
      }
    }

    if (rows[3]) {
      const valueSpan = rows[3].querySelectorAll("span")[1];
      if (valueSpan) {
        valueSpan.textContent = getPickupDateText(groupBuy.pickupTimes);
      }
    }
  }

  function renderRecruitmentStatus(groupBuy) {
    const statusCard = getCardBySectionTitle("👥 모집 현황");
    if (!statusCard) return;

    const rows = statusCard.querySelectorAll(".split-row.small-note");
    const progressFill = statusCard.querySelector(".progress-fill");

    if (rows[0]) {
      const rightSpan = rows[0].querySelectorAll("span")[1];
      if (rightSpan) {
        rightSpan.innerHTML = `<strong class="text-lime">${groupBuy.currentParticipants}</strong> / ${groupBuy.maxParticipants}명`;
      }
    }

    if (progressFill) {
      const percent = Math.round(
        (groupBuy.currentParticipants / groupBuy.maxParticipants) * 100
      );
      progressFill.style.width = `${percent}%`;
    }

    if (rows[1]) {
      const rightSpan = rows[1].querySelectorAll("span")[1];
      if (rightSpan) {
        rightSpan.textContent = getDeadlineText(groupBuy);
      }
    }
  }

  function renderParticipants(participants) {
    const participantCard = getCardBySectionTitle("참여자");
    if (!participantCard) return;

    const oldRows = participantCard.querySelectorAll(".inline-info-row");
    oldRows.forEach((row) => row.remove());

    const oldEmptyMessage = participantCard.querySelector(".participant-empty");
    if (oldEmptyMessage) {
      oldEmptyMessage.remove();
    }

    if (!participants.length) {
      const emptyEl = document.createElement("p");
      emptyEl.className = "small-note participant-empty";
      emptyEl.textContent = "아직 참여자가 없습니다.";
      participantCard.appendChild(emptyEl);
      return;
    }

    participants.forEach((participant) => {
      const row = document.createElement("div");
      row.className = "inline-info-row";

      const participantName = participant.participantNickname || participant.nickname || "이웃";
      const avatarText = participant.avatarText || participantName.charAt(0);
      const participantScore = participant.mannerScore ?? null;
      const participantBadge = getBadgeEmoji(participant.mannerGrade);

      const participantTime = formatPickupTime(
        participant.selectedTime ||
        participant.pickupTime ||
        participant.joinedAt
      ) || "시간 미정";

      row.innerHTML = `
        <div class="avatar-circle-md">${escapeHtml(avatarText)}</div>
        <span class="small-note">${escapeHtml(participantName)}</span>
        <span class="small-note">${participantBadge}${participantScore !== null ? ` ${Number(participantScore).toFixed(1)}` : ""}</span>
        <span class="small-note">${escapeHtml(participantTime)}</span>
      `;

      participantCard.appendChild(row);
    });
  }

  function renderComments(comments) {
    const commentList = document.getElementById("commentList");
    if (!commentList) return;

    commentList.innerHTML = "";

    if (!comments.length) {
      commentList.innerHTML = `<p class="small-note">아직 댓글이 없습니다.</p>`;
      return;
    }

    comments.forEach((comment) => {
      commentList.appendChild(createCommentElement(comment));
    });
  }

  function createCommentElement(comment) {
    const commentItem = document.createElement("div");
    commentItem.className = "comment-item";

    const repliesHtml = Array.isArray(comment.replies)
      ? comment.replies
          .map(
            (reply) => `
              <div class="comment-item reply">
                <div class="avatar-circle-md">${escapeHtml(reply.avatarText || reply.author.charAt(0))}</div>
                <div class="comment-content">
                  <div class="comment-meta">
                    <strong>${escapeHtml(reply.author)}</strong>
                    <span class="small-note">${escapeHtml(reply.createdAt || "방금 전")}</span>
                  </div>
                  <p class="comment-text">${escapeHtml(reply.content)}</p>
                </div>
              </div>
            `
          )
          .join("")
      : "";

    commentItem.innerHTML = `
      <div class="avatar-circle-md">${escapeHtml(comment.avatarText || comment.author.charAt(0))}</div>
      <div class="comment-content">
        <div class="comment-meta">
          <strong>${escapeHtml(comment.author)}</strong>
          <span class="small-note">${escapeHtml(comment.createdAt || "방금 전")}</span>
        </div>
        <p class="comment-text">${escapeHtml(comment.content)}</p>
        <button class="reply-btn" type="button">답글</button>
        <div class="reply-list">
          ${repliesHtml}
        </div>
        <div class="reply-input-box hidden">
          <input type="text" placeholder="답글을 입력하세요..." />
          <button class="btn btn-primary" type="button">등록</button>
        </div>
      </div>
    `;

    const replyBtn = commentItem.querySelector(".reply-btn");
    const replyInputBox = commentItem.querySelector(".reply-input-box");
    const replyInput = replyInputBox.querySelector("input");
    const replySubmitBtn = replyInputBox.querySelector("button");
    const replyList = commentItem.querySelector(".reply-list");

    replyBtn.addEventListener("click", () => {
      replyInputBox.classList.toggle("hidden");
      if (!replyInputBox.classList.contains("hidden")) {
        replyInput.focus();
      }
    });

    replySubmitBtn.addEventListener("click", () => {
      const value = replyInput.value.trim();

      if (!value) {
        showToast("답글 내용을 입력해 주세요.");
        return;
      }

      const currentUser = window.APP_DATA.currentUser || {
        name: "나",
        avatarText: "나"
      };

      const replyItem = document.createElement("div");
      replyItem.className = "comment-item reply";
      replyItem.innerHTML = `
        <div class="avatar-circle-md">${escapeHtml(currentUser.avatarText || currentUser.name.charAt(0))}</div>
        <div class="comment-content">
          <div class="comment-meta">
            <strong>${escapeHtml(currentUser.name)}</strong>
            <span class="small-note">방금 전</span>
          </div>
          <p class="comment-text">${escapeHtml(value)}</p>
        </div>
      `;

      replyList.appendChild(replyItem);
      replyInput.value = "";
      replyInputBox.classList.add("hidden");
      showToast("답글이 등록되었습니다.");
    });

    return commentItem;
  }

  function renderBottomBar(groupBuy) {
    const priceEl = document.querySelector(".fixed-bottom .price");
    if (priceEl) {
      priceEl.textContent = `1인 부담금\n${formatPrice(groupBuy.participantFinalPrice)}`;
    }

    const openModalBtn = document.getElementById("openModal");
    const bottomBtnGroup = document.getElementById("bottomBtnGroup");
    const hostBtnGroup = document.getElementById("hostBtnGroup");
    const participantPickupBtnGroup = document.getElementById("participantPickupBtnGroup");
    const cancelBtn = document.getElementById("cancelBtn");
    const pickupTimeBtn = document.getElementById("pickupTimeBtn");

    if (!openModalBtn) return;

    // 초기화
    openModalBtn.classList.remove("hidden");
    bottomBtnGroup?.classList.add("hidden");
    hostBtnGroup?.classList.add("hidden");
    participantPickupBtnGroup?.classList.add("hidden");
    delete openModalBtn.dataset.action;
    delete openModalBtn.dataset.role;
    delete openModalBtn.dataset.gbId;
    openModalBtn.disabled = false;
    cancelBtn?.classList.remove("is-disabled");
    pickupTimeBtn?.classList.remove("is-disabled");
    if (cancelBtn) delete cancelBtn.dataset.gbId;

    const isLoggedIn = typeof getLoginState === "function" ? getLoginState() : false;
    const userId = isLoggedIn ? localStorage.getItem("userId") : null;
    const isHost = userId && String(userId) === String(groupBuy.hostId);
    const isParticipant = !isHost && state.participants.some(p => String(p.participantId) === String(userId));

    const { status } = groupBuy;

    if (status === "EXPIRED") {
      openModalBtn.textContent = "마감된 공동구매입니다";
      openModalBtn.disabled = true;

    } else if (status === "COMPLETED") {
      openModalBtn.textContent = "완료된 공동구매입니다";
      openModalBtn.disabled = true;

    } else if (status === "PICKUP_READY" || status === "HOST_PURCHASED") {
      if (isHost) {
        if (status === "HOST_PURCHASED") {
          // HOST_PURCHASED: 픽업 시간 변경 + 수령 완료 두 버튼
          openModalBtn.classList.add("hidden");
          hostBtnGroup?.classList.remove("hidden");
        } else {
          // PICKUP_READY: 단일 픽업 시간 변경 버튼
          openModalBtn.textContent = "픽업 시간 변경";
          openModalBtn.dataset.action = "host-pickup-time";
          openModalBtn.dataset.gbId = groupBuy.id;
        }
      } else if (isParticipant) {
        const myParticipation = state.participants.find(p => String(p.participantId) === String(userId));
        openModalBtn.classList.add("hidden");
        participantPickupBtnGroup?.classList.remove("hidden");
        const pPickupTimeBtn = document.getElementById("participantPickupTimeBtn");
        const pPickupReadyBtn = document.getElementById("participantPickupReadyBtn");
        if (myParticipation?.pickupCompletedAt) {
          // 이미 수령 완료한 참여자 — 두 버튼 모두 비활
          if (pPickupTimeBtn) pPickupTimeBtn.disabled = true;
          if (pPickupReadyBtn) pPickupReadyBtn.disabled = true;
        }
      } else {
        openModalBtn.textContent = "마감";
        openModalBtn.disabled = true;
      }

    } else if (status === "PAYMENT_COMPLETED") {
      if (isHost) {
        openModalBtn.textContent = "주문완료";
        openModalBtn.dataset.action = "host-purchase";
        openModalBtn.dataset.gbId = groupBuy.id;
      } else if (isParticipant) {
        openModalBtn.textContent = "결제 완료";
        openModalBtn.disabled = true;
      } else {
        openModalBtn.textContent = "마감";
        openModalBtn.disabled = true;
      }

    } else if (status === "CLOSED") {
      if (isHost) {
        openModalBtn.textContent = "참여자 결제 대기 중";
        openModalBtn.disabled = true;
      } else if (isParticipant) {
        const myParticipation = state.participants.find(p => String(p.participantId) === String(userId));
        if (myParticipation?.paymentConfirmed) {
          openModalBtn.textContent = "결제 완료";
          openModalBtn.disabled = true;
        } else {
          openModalBtn.textContent = "결제하기";
          openModalBtn.dataset.action = "payment";
          openModalBtn.dataset.role = "participant";
          openModalBtn.dataset.gbId = groupBuy.id;
        }
      } else {
        openModalBtn.textContent = "마감";
        openModalBtn.disabled = true;
      }

    } else if (status === "PENDING") {
      if (isHost) {
        openModalBtn.textContent = "정산";
        openModalBtn.dataset.action = "settlement";
      } else {
        openModalBtn.textContent = "완료된 공동구매입니다";
        openModalBtn.disabled = true;
      }

    } else if (status === "OPEN" || status === "CLOSING") {
      if (isHost) {
        openModalBtn.textContent = "수정하기";
        if (status === "OPEN") {
          openModalBtn.dataset.action = "edit";
          openModalBtn.dataset.gbId = groupBuy.id;
        } else {
          openModalBtn.disabled = true;
        }
      } else if (isParticipant) {
        // 두 버튼 표시
        openModalBtn.classList.add("hidden");
        bottomBtnGroup?.classList.remove("hidden");
        if (cancelBtn) cancelBtn.dataset.gbId = groupBuy.id;
        if (status === "CLOSING") {
          cancelBtn?.classList.add("is-disabled");
          pickupTimeBtn?.classList.add("is-disabled");
        }
      }
    }
  }

  function renderModal(groupBuy) {
    const modal = document.getElementById("joinModal");
    if (!modal) return;

    const modalHeader = modal.querySelector(".modal-header h3");
    const modalDesc = modal.querySelector(".modal-desc");
    const modalSections = modal.querySelectorAll(".modal-section");
    const modalPriceStrong = modal.querySelector(".modal-price strong");
    const modalPriceSection = modal.querySelector(".modal-price");
    const modalTimeGrid = modal.querySelector(".time-grid");
    const modalConfirmBtn = modal.querySelector(".btn.btn-primary.btn-full");

    // modalMode에 따라 제목·설명·버튼 텍스트·가격 섹션 업데이트
    if (state.modalMode === 'changePickup') {
      if (modalHeader) modalHeader.textContent = "픽업 시간 변경";
      if (modalDesc) modalDesc.textContent = "변경할 픽업 시간을 선택해 주세요.";
      if (modalConfirmBtn) modalConfirmBtn.textContent = "변경 완료";
      modalPriceSection?.classList.add("hidden");
    } else {
      if (modalHeader) modalHeader.textContent = "공동구매 참여하기";
      if (modalDesc) modalDesc.textContent = "픽업 시간을 선택하고 참여를 확정해 주세요.";
      if (modalConfirmBtn) modalConfirmBtn.textContent = "참여 확정하기";
      modalPriceSection?.classList.remove("hidden");
    }

    if (modalSections[0]) {
      const locationP = modalSections[0].querySelector("p");
      if (locationP) {
        locationP.textContent = groupBuy.pickupLocation;
      }
    }

    if (modalTimeGrid) {
      modalTimeGrid.innerHTML = "";
      const now = new Date();

      (groupBuy.pickupTimes || []).forEach((timeItem, index) => {
        const timeId = timeItem.id;
        const dateTimeStr = timeItem.pickupTime;
        const isPast = new Date(dateTimeStr) < now;

        const btn = document.createElement("button");
        btn.className = "time-box";
        btn.type = "button";
        btn.dataset.time = dateTimeStr;
        btn.dataset.timeId = timeId;
        btn.textContent = formatPickupTime(dateTimeStr);

        // 픽업 시간 변경 모달에서 지난 시간 선택 불가
        if (state.modalMode === 'changePickup' && isPast) {
          btn.disabled = true;
          btn.classList.add("is-disabled");
        }

        if (state.selectedTimeId === timeId || (!state.selectedTimeId && index === 0)) {
          if (!btn.disabled) btn.classList.add("active");
        }

        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          state.selectedTime = dateTimeStr;
          state.selectedTimeId = timeId;
          updateTimeBoxActive(modalTimeGrid, dateTimeStr);
        });

        modalTimeGrid.appendChild(btn);
      });
    }

    if (modalPriceStrong) {
      modalPriceStrong.textContent = formatPrice(groupBuy.participantFinalPrice);
    }
  }

  function bindEvents() {
    bindModalEvents();
    bindPaymentModalEvents();
    bindCommentSubmit();
    bindPrivateCheck();
    bindHostPickupModalEvents();
  }

  function bindModalEvents() {
    const openModalBtn = document.getElementById("openModal");
    const closeModalBtn = document.getElementById("closeModal");
    const modal = document.getElementById("joinModal");
    const modalConfirmBtn = modal?.querySelector(".btn.btn-primary.btn-full");
    const cancelBtn = document.getElementById("cancelBtn");
    const pickupTimeBtn = document.getElementById("pickupTimeBtn");

    // HOST_PURCHASED 호스트 — 픽업 시간 변경 버튼
    const hostPickupTimeBtn = document.getElementById("hostPickupTimeBtn");
    if (hostPickupTimeBtn) {
      hostPickupTimeBtn.addEventListener("click", () => openHostPickupModal());
    }

    // HOST_PURCHASED 호스트 — 수령 완료 버튼
    const hostPickupReadyBtn = document.getElementById("hostPickupReadyBtn");
    if (hostPickupReadyBtn) {
      hostPickupReadyBtn.addEventListener("click", () => {
        const gbId = state.groupBuy?.id;
        const confirmModal = document.getElementById("confirmModal");
        const descEl = confirmModal?.querySelector(".modal-desc");
        const okBtn = document.getElementById("confirmModalOk");
        const cancelBtnConfirm = document.getElementById("confirmModalCancel");
        if (descEl) descEl.textContent = "수령 완료 처리하시겠습니까?";
        confirmModal.classList.remove("hidden");
        okBtn.onclick = async () => {
          confirmModal.classList.add("hidden");
          try {
            await markPickupReady(gbId);
            showToast("수령 완료 처리되었습니다.");
            const [updatedGroupBuy, updatedParticipants] = await Promise.all([
              fetch(`/api/groupbuys/${gbId}`).then(r => r.json()),
              fetch(`/api/groupbuys/${gbId}/participants`).then(r => r.json()),
            ]);
            state.groupBuy = updatedGroupBuy;
            state.participants = updatedParticipants;
            renderBottomBar(updatedGroupBuy);
            renderParticipants(updatedParticipants);
          } catch (e) {
            showToast(e.message || "수령 완료 처리에 실패했습니다.");
          }
        };
        cancelBtnConfirm.onclick = () => confirmModal.classList.add("hidden");
      });
    }

    // PICKUP_READY 참여자 — 픽업 시간 변경 버튼
    const participantPickupTimeBtn = document.getElementById("participantPickupTimeBtn");
    if (participantPickupTimeBtn) {
      participantPickupTimeBtn.addEventListener("click", () => openParticipantPickupModal());
    }

    // PICKUP_READY 참여자 — 수령 완료 버튼
    const participantPickupReadyBtn = document.getElementById("participantPickupReadyBtn");
    if (participantPickupReadyBtn) {
      participantPickupReadyBtn.addEventListener("click", () => {
        const gbId = state.groupBuy?.id;
        const confirmModal = document.getElementById("confirmModal");
        const descEl = confirmModal?.querySelector(".modal-desc");
        const okBtn = document.getElementById("confirmModalOk");
        const cancelBtnConfirm = document.getElementById("confirmModalCancel");
        if (descEl) descEl.textContent = "수령 완료 처리하시겠습니까?";
        confirmModal.classList.remove("hidden");
        okBtn.onclick = async () => {
          confirmModal.classList.add("hidden");
          try {
            await completePickup(gbId);
            showToast("수령 완료 처리되었습니다.");
            const [updatedGroupBuy, updatedParticipants] = await Promise.all([
              fetch(`/api/groupbuys/${gbId}`).then(r => r.json()),
              fetch(`/api/groupbuys/${gbId}/participants`).then(r => r.json()),
            ]);
            state.groupBuy = updatedGroupBuy;
            state.participants = updatedParticipants;
            renderBottomBar(updatedGroupBuy);
            renderParticipants(updatedParticipants);
          } catch (e) {
            showToast(e.message || "수령 완료 처리에 실패했습니다.");
          }
        };
        cancelBtnConfirm.onclick = () => confirmModal.classList.add("hidden");
      });
    }

    // OPEN·CLOSING 참여자 — 참여 취소 버튼
    if (cancelBtn) {
      cancelBtn.addEventListener("click", async () => {
        if (cancelBtn.classList.contains("is-disabled")) {
          showToast("마감 24시간 전에는 참여 취소 및 픽업 시간 변경이 불가합니다.");
          return;
        }
        const gbId = cancelBtn.dataset.gbId;
        const confirmModal = document.getElementById("confirmModal");
        const descEl = confirmModal?.querySelector(".modal-desc");
        const okBtn = document.getElementById("confirmModalOk");
        const cancelBtnConfirm = document.getElementById("confirmModalCancel");
        if (descEl) descEl.textContent = "정말 참여를 취소하시겠습니까?";
        confirmModal.classList.remove("hidden");
        okBtn.onclick = async () => {
          confirmModal.classList.add("hidden");
          const token = localStorage.getItem("token");
          try {
            const response = await fetch(`/api/groupbuys/${gbId}/cancel`, {
              method: "DELETE",
              headers: { "Authorization": "Bearer " + token },
            });
            if (response.ok) {
              showToast("참여가 취소되었습니다.");
              const [updatedGroupBuy, updatedParticipants] = await Promise.all([
                fetch(`/api/groupbuys/${gbId}`).then(r => r.json()),
                fetch(`/api/groupbuys/${gbId}/participants`).then(r => r.json()),
              ]);
              state.groupBuy = updatedGroupBuy;
              state.participants = updatedParticipants;
              renderBottomBar(updatedGroupBuy);
              renderParticipants(updatedParticipants);
            } else {
              const errorData = await response.json().catch(() => ({}));
              showToast(errorData.message || "취소에 실패했습니다.");
            }
          } catch {
            showToast("네트워크 오류가 발생했습니다.");
          }
        };
        cancelBtnConfirm.onclick = () => confirmModal.classList.add("hidden");
      });
    }

    // OPEN·CLOSING 참여자 — 픽업 시간 변경 버튼
    if (pickupTimeBtn) {
      pickupTimeBtn.addEventListener("click", () => {
        if (pickupTimeBtn.classList.contains("is-disabled")) {
          showToast("마감 24시간 전에는 참여 취소 및 픽업 시간 변경이 불가합니다.");
          return;
        }
        openParticipantPickupModal();
      });
    }

    if (openModalBtn && modal) {
      openModalBtn.addEventListener("click", async () => {
        const action = openModalBtn.dataset.action;
        const gbId = openModalBtn.dataset.gbId;

        if (action === "payment") {
          openPaymentModal(openModalBtn.dataset.role);
          return;
        }

        if (action === "edit") {
          location.href = `edit.html?id=${gbId}`;
          return;
        }

        if (action === "settlement") {
          showToast("정산 기능은 준비 중입니다.");
          return;
        }

        if (action === "host-purchase") {
          const confirmModal = document.getElementById("confirmModal");
          const descEl = confirmModal?.querySelector(".modal-desc");
          const okBtn = document.getElementById("confirmModalOk");
          const cancelBtnConfirm = document.getElementById("confirmModalCancel");
          if (descEl) descEl.textContent = "주문 완료 처리하시겠습니까?";
          confirmModal.classList.remove("hidden");
          okBtn.onclick = async () => {
            confirmModal.classList.add("hidden");
            try {
              await completeHostPurchase(gbId);
              showToast("주문 완료 처리되었습니다.");
              const [updatedGroupBuy, updatedParticipants] = await Promise.all([
                fetch(`/api/groupbuys/${gbId}`).then(r => r.json()),
                fetch(`/api/groupbuys/${gbId}/participants`).then(r => r.json()),
              ]);
              state.groupBuy = updatedGroupBuy;
              state.participants = updatedParticipants;
              renderBottomBar(updatedGroupBuy);
              renderParticipants(updatedParticipants);
            } catch (e) {
              showToast(e.message || "주문 완료 처리에 실패했습니다.");
            }
          };
          cancelBtnConfirm.onclick = () => confirmModal.classList.add("hidden");
          return;
        }

        if (action === "host-pickup-time") {
          openHostPickupModal();
          return;
        }

        if (action === "pickup-time") {
          openParticipantPickupModal();
          return;
        }

        const isLoggedIn =
          typeof getLoginState === "function" ? getLoginState() : false;

        if (!isLoggedIn) {
          showToast("로그인이 필요합니다.");
          window.location.href = "login.html";
          return;
        }

        // 일반 참여하기
        state.modalMode = 'join';
        renderModal(state.groupBuy);
        modal.classList.remove("hidden");
      });
    }

    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
        state.modalMode = 'join';
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.add("hidden");
          state.modalMode = 'join';
        }
      });
    }

    if (modalConfirmBtn) {
      modalConfirmBtn.addEventListener("click", async () => {
        const isLoggedIn =
          typeof getLoginState === "function" ? getLoginState() : false;

        if (!isLoggedIn) {
          showToast("로그인이 필요합니다.");
          window.location.href = "login.html";
          return;
        }

        if (!state.selectedTimeId) {
          showToast("픽업 시간을 선택해 주세요.");
          return;
        }

        const token = localStorage.getItem("token");

        // 픽업 시간 변경 모드
        if (state.modalMode === 'changePickup') {
          try {
            const response = await fetch(`/api/groupbuys/${state.groupBuy.id}/pickup-time`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
              },
              body: JSON.stringify({ pickupTimeId: state.selectedTimeId }),
            });
            if (response.ok) {
              showToast("픽업 시간이 변경되었습니다.");
              modal.classList.add("hidden");
              state.modalMode = 'join';
              const [updatedGroupBuy, updatedParticipants] = await Promise.all([
                fetch(`/api/groupbuys/${state.groupBuy.id}`).then(r => r.json()),
                fetch(`/api/groupbuys/${state.groupBuy.id}/participants`).then(r => r.json()),
              ]);
              state.groupBuy = updatedGroupBuy;
              state.participants = updatedParticipants;
              renderBottomBar(updatedGroupBuy);
              renderParticipants(updatedParticipants);
            } else {
              const errorData = await response.json().catch(() => ({}));
              showToast(errorData.message || "픽업 시간 변경에 실패했습니다.");
            }
          } catch {
            showToast("네트워크 오류가 발생했습니다.");
          }
          return;
        }

        // 일반 참여하기
        try {
          const response = await fetch(`/api/groupbuys/${state.groupBuy.id}/join`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({ pickupTimeId: state.selectedTimeId }),
          });

          if (response.ok) {
            showToast("참여가 완료되었습니다.");
            modal.classList.add("hidden");

            // 참여 후 최신 상태 반영
            const [updatedGroupBuy, updatedParticipants] = await Promise.all([
              fetch(`/api/groupbuys/${state.groupBuy.id}`).then(r => r.json()),
              fetch(`/api/groupbuys/${state.groupBuy.id}/participants`).then(r => r.json()),
            ]);
            state.groupBuy = updatedGroupBuy;
            state.participants = updatedParticipants;
            renderBottomBar(updatedGroupBuy);
            renderRecruitmentStatus(updatedGroupBuy);
            renderParticipants(updatedParticipants);
          } else {
            const errorData = await response.json().catch(() => ({}));
            showToast(errorData.message || "참여에 실패했습니다.");
          }
        } catch {
          showToast("네트워크 오류가 발생했습니다.");
        }
      });
    }
  }

  // 참여자 픽업 시간 변경 모달 열기
  function openParticipantPickupModal() {
    const userId = localStorage.getItem("userId");
    const myParticipation = state.participants.find(p => String(p.participantId) === String(userId));
    // 현재 선택한 픽업 시간을 기본 선택으로 설정
    if (myParticipation?.pickupTimeId) {
      state.selectedTimeId = myParticipation.pickupTimeId;
      state.selectedTime = myParticipation.pickupTime;
    }
    state.modalMode = 'changePickup';
    renderModal(state.groupBuy);
    document.getElementById("joinModal").classList.remove("hidden");
  }

  // 호스트 픽업 시간 변경 모달 열기
  function openHostPickupModal() {
    state.hostPickupTimes = (state.groupBuy.pickupTimes || []).map(slot => ({
      id: slot.id,
      pickupTime: slot.pickupTime,
      selectedCount: state.participants.filter(p => p.pickupTimeId === slot.id).length
    }));
    renderHostPickupModal();
    document.getElementById("hostPickupModal")?.classList.remove("hidden");
  }

  // 호스트 픽업 시간 변경 모달 슬롯 목록 렌더링
  function renderHostPickupModal() {
    const slotList = document.getElementById("hostPickupSlotList");
    if (!slotList) return;

    slotList.innerHTML = "";

    if (state.hostPickupTimes.length === 0) {
      slotList.innerHTML = `<p class="small-note">등록된 픽업 시간이 없습니다.</p>`;
      return;
    }

    state.hostPickupTimes.forEach((slot, index) => {
      const item = document.createElement("div");
      item.className = "host-pickup-slot-item";
      const canDelete = slot.selectedCount === 0;
      item.innerHTML = `
        <span class="small-note">${formatPickupTime(slot.pickupTime)}</span>
        <span class="slot-count">${slot.selectedCount > 0 ? `${slot.selectedCount}명 선택` : ""}</span>
        <button class="btn btn-outline btn-sm slot-delete-btn" data-index="${index}" ${canDelete ? "" : "disabled"} type="button">삭제</button>
      `;
      slotList.appendChild(item);
    });
  }

  // 호스트 픽업 시간 변경 모달 이벤트 바인딩
  function bindHostPickupModalEvents() {
    const modal = document.getElementById("hostPickupModal");
    const closeBtn = document.getElementById("closeHostPickupModal");
    const addBtn = document.getElementById("hostPickupAddBtn");
    const slotList = document.getElementById("hostPickupSlotList");
    const confirmBtn = document.getElementById("hostPickupConfirmBtn");

    if (!modal) return;

    if (closeBtn) {
      closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });

    // 슬롯 삭제 이벤트 위임
    if (slotList) {
      slotList.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest(".slot-delete-btn");
        if (!deleteBtn || deleteBtn.disabled) return;
        const index = Number(deleteBtn.dataset.index);
        state.hostPickupTimes.splice(index, 1);
        renderHostPickupModal();
      });
    }

    // 슬롯 추가
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const input = document.getElementById("hostPickupNewTime");
        const value = input?.value;
        if (!value) {
          showToast("추가할 픽업 시간을 선택해 주세요.");
          return;
        }
        const pickupTimeStr = value.length === 16 ? value + ":00" : value;
        const deadline = state.groupBuy.deadline;
        const maxAllowed = new Date(new Date(deadline).getTime() + 14 * 24 * 60 * 60 * 1000);
        const pickupDate = new Date(pickupTimeStr);

        if (pickupDate <= new Date()) {
          showToast("현재 시간 이후의 픽업 시간을 선택해 주세요.");
          return;
        }
        if (pickupDate <= new Date(deadline)) {
          showToast("픽업 시간은 마감일 이후여야 합니다.");
          return;
        }
        if (pickupDate > maxAllowed) {
          showToast("픽업 시간은 마감일로부터 14일 이내여야 합니다.");
          return;
        }
        if (state.hostPickupTimes.some(s => s.pickupTime === pickupTimeStr)) {
          showToast("이미 등록된 픽업 시간입니다.");
          return;
        }
        state.hostPickupTimes.push({ id: null, pickupTime: pickupTimeStr, selectedCount: 0 });
        if (input) input.value = "";
        renderHostPickupModal();
      });
    }

    // 변경 완료 PUT
    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        const token = localStorage.getItem("token");
        const gb = state.groupBuy;
        const pickupTimes = state.hostPickupTimes.map(s => s.pickupTime);

        try {
          const response = await fetch(`/api/groupbuys/${gb.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
              title: gb.title,
              description: gb.description,
              productType: gb.productType,
              totalPrice: gb.totalPrice,
              totalQuantity: gb.totalQuantity,
              maxParticipants: gb.maxParticipants,
              pickupLocation: gb.pickupLocation,
              lat: gb.lat,
              lng: gb.lng,
              dongName: gb.dongName,
              category: gb.category,
              deadline: gb.deadline,
              imageUrls: gb.imageUrls || [],
              pickupTimes,
            }),
          });
          if (response.ok) {
            showToast("픽업 시간이 변경되었습니다.");
            modal.classList.add("hidden");
            const [updatedGroupBuy, updatedParticipants] = await Promise.all([
              fetch(`/api/groupbuys/${gb.id}`).then(r => r.json()),
              fetch(`/api/groupbuys/${gb.id}/participants`).then(r => r.json()),
            ]);
            state.groupBuy = updatedGroupBuy;
            state.participants = updatedParticipants;
            renderBottomBar(updatedGroupBuy);
            renderParticipants(updatedParticipants);
          } else {
            const errorData = await response.json().catch(() => ({}));
            showToast(errorData.message || "픽업 시간 변경에 실패했습니다.");
          }
        } catch {
          showToast("네트워크 오류가 발생했습니다.");
        }
      });
    }
  }

  function bindCommentSubmit() {
    const input = document.getElementById("commentInput");
    const submitBtn = document.getElementById("submitComment");

    if (!input || !submitBtn) return;

    submitBtn.addEventListener("click", () => {
      const value = input.value.trim();

      if (!value) {
        showToast("댓글 내용을 입력해 주세요.");
        return;
      }

      const currentUser = window.APP_DATA.currentUser || {
        name: "나",
        avatarText: "나"
      };

      const newComment = {
        id: Date.now(),
        author: currentUser.name,
        avatarText: currentUser.avatarText || currentUser.name.charAt(0),
        content: value,
        createdAt: "방금 전",
        replies: []
      };

      if (!Array.isArray(state.groupBuy.comments)) {
        state.groupBuy.comments = [];
      }

      state.groupBuy.comments.unshift(newComment);
      renderComments(state.groupBuy.comments);

      input.value = "";
      showToast("댓글이 등록되었습니다.");
    });
  }

  const TOSS_CLIENT_KEY = "test_ck_pP2YxJ4K87qv9b6gpBnJVRGZwXLO";

  function openPaymentModal(role) {
    const groupBuy = state.groupBuy;
    if (!groupBuy) return;

    const modal = document.getElementById("paymentModal");
    const roleEl = document.getElementById("payment-modal-role");
    const titleEl = document.getElementById("payment-modal-title");
    const amountEl = document.getElementById("payment-modal-amount");
    const confirmBtn = document.getElementById("payment-modal-btn");

    if (roleEl) roleEl.textContent = role === "host" ? "호스트 결제 (전체 금액)" : "참여자 결제";
    if (titleEl) titleEl.textContent = groupBuy.title;

    // TODO: 호스트 결제 금액은 백엔드 팀과 확정 후 groupBuy.hostPaymentAmount 등으로 교체
    const amount = role === "host"
      ? groupBuy.totalPrice
      : (groupBuy.participantPaymentAmount ?? groupBuy.participantFinalPrice);
    if (amountEl) amountEl.textContent = formatPrice(amount);

    if (confirmBtn) {
      confirmBtn.dataset.role = role;
      confirmBtn.dataset.amount = amount;
    }

    if (modal) modal.classList.remove("hidden");
  }

  function bindPaymentModalEvents() {
    const modal = document.getElementById("paymentModal");
    const closeBtn = document.getElementById("closePaymentModal");
    const confirmBtn = document.getElementById("payment-modal-btn");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal?.classList.add("hidden");
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        const role = confirmBtn.dataset.role;
        const amount = Number(confirmBtn.dataset.amount);
        requestTossPayment(role, amount);
      });
    }
  }

  async function requestTossPayment(role, amount) {
    const groupBuy = state.groupBuy;
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId) {
      showToast("로그인이 필요합니다.");
      window.location.href = "login.html";
      return;
    }

    let readyData;
    try {
      const res = await fetch(`/api/groupbuys/${groupBuy.id}/payments/ready`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || "결제 준비에 실패했습니다.");
        return;
      }
      readyData = await res.json();
    } catch (e) {
      showToast("결제 준비 중 오류가 발생했습니다.");
      return;
    }

    const tossPayments = TossPayments(TOSS_CLIENT_KEY);
    const payment = tossPayments.payment({ customerKey: "U-" + userId });

    payment.requestPayment({
      method: "CARD",
      amount: { currency: "KRW", value: readyData.amount },
      orderId: readyData.orderId,
      orderName: groupBuy.title,
      successUrl: `${window.location.origin}/success.html?role=${role}&groupBuyId=${groupBuy.id}`,
      failUrl: `${window.location.origin}/fail.html`,
      customerName: "",
    }).catch((e) => {
      if (e.code !== "USER_CANCEL") {
        showToast(e.message || "결제 중 오류가 발생했습니다.");
      }
    });
  }

  function bindPrivateCheck() {
    const privateCheck = document.getElementById("privateCheck");
    if (!privateCheck) return;

    privateCheck.addEventListener("change", () => {
      privateCheck.checked = false;
      showToast("비공개 댓글 기능은 나중에 추가 예정입니다");
    });
  }

  function updateTimeBoxActive(container, selectedTime) {
    const buttons = container.querySelectorAll(".time-box");

    buttons.forEach((btn) => {
      btn.classList.toggle(
        "active",
        btn.dataset.time === selectedTime || btn.textContent.trim() === selectedTime
      );
    });
  }

  function syncModalSelectedTime(selectedTime) {
    const modal = document.getElementById("joinModal");
    const modalGrid = modal?.querySelector(".time-grid");

    if (!modalGrid) return;

    updateTimeBoxActive(modalGrid, selectedTime);
  }

  function getCardBySectionTitle(titleText) {
    const cards = document.querySelectorAll(".card");

    return (
      Array.from(cards).find((card) => {
        const title = card.querySelector(".section-title");
        return title && title.textContent.trim() === titleText;
      }) || null
    );
  }

  function getPickupDateText(pickupTimes) {
    if (Array.isArray(pickupTimes) && pickupTimes.length > 0) {
      const pt = pickupTimes[0].pickupTime;
      if (!pt) return "미정";
      const date = new Date(pt);
      if (isNaN(date.getTime())) return "미정";
      return formatDateKorean(date);
    }
    return "미정";
  }

  function getDeadlineText(groupBuy) {
    if (!groupBuy.deadline) return "미정";
    const date = new Date(groupBuy.deadline);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  }

  function formatDateKorean(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();

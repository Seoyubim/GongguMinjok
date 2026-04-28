(function () {
  const state = {
    groupBuy: null,
    selectedTime: null,
    pickupMap: null,
    pickupLocationMarker: null,
    pickupCurrentLocationMarker: null
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
      state.selectedTime = getInitialSelectedTime(groupBuy);

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
    renderParticipants(groupBuy.participants || []);
    renderComments(groupBuy.comments || []);
    renderTimeSlots(groupBuy.pickupTimes || []);
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
          spans[1].textContent = `${getBadgeEmoji(groupBuy.hostMannerGrade)} ${groupBuy.hostMannerScore}`;
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

      const participantName = participant.nickname || participant.name || "이웃";
      const avatarText = participant.avatarText || participantName.charAt(0);
      const participantScore = participant.mannerScore ?? null;
      const participantBadge = getBadgeEmoji(participant.mannerGrade);

      const participantTime =
        participant.selectedTime ||
        participant.pickupTime ||
        participant.joinedAt ||
        "시간 미정";

      row.innerHTML = `
        <div class="avatar-circle-md">${escapeHtml(avatarText)}</div>
        <span class="small-note">${escapeHtml(participantName)}</span>
        <span class="small-note">${participantBadge}${participantScore !== null ? ` ${participantScore}` : ""}</span>
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

  function renderTimeSlots(pickupTimes) {
    const timeCard = getCardBySectionTitle("🕒 픽업 시간 선택");
    if (!timeCard) return;

    const timeGrid = timeCard.querySelector(".time-grid");
    if (!timeGrid) return;

    timeGrid.innerHTML = "";

    if (!pickupTimes.length) {
      timeGrid.innerHTML = `<p class="small-note">선택 가능한 픽업 시간이 없습니다.</p>`;
      return;
    }

    pickupTimes.forEach((dateTimeStr, index) => {
      const button = document.createElement("button");
      button.className = "time-box";
      button.type = "button";
      button.dataset.time = dateTimeStr;

      if (state.selectedTime === dateTimeStr || (!state.selectedTime && index === 0)) {
        button.classList.add("active");
      }

      button.innerHTML = `
        <div class="time">${escapeHtml(formatPickupTime(dateTimeStr))}</div>
      `;

      button.addEventListener("click", () => {
        state.selectedTime = dateTimeStr;
        updateTimeBoxActive(timeGrid, dateTimeStr);
        syncModalSelectedTime(dateTimeStr);
      });

      timeGrid.appendChild(button);
    });
  }

  function renderBottomBar(groupBuy) {
    const priceEl = document.querySelector(".fixed-bottom .price");
    if (priceEl) {
      priceEl.textContent = `1인 부담금 ${formatPrice(groupBuy.participantFinalPrice)}`;
    }
  }

  function renderModal(groupBuy) {
    const modal = document.getElementById("joinModal");
    if (!modal) return;

    const modalSections = modal.querySelectorAll(".modal-section");
    const modalPriceStrong = modal.querySelector(".modal-price strong");
    const modalTimeGrid = modal.querySelector(".time-grid");

    if (modalSections[0]) {
      const locationP = modalSections[0].querySelector("p");
      if (locationP) {
        locationP.textContent = groupBuy.pickupLocation;
      }
    }

    if (modalTimeGrid) {
      modalTimeGrid.innerHTML = "";

      (groupBuy.pickupTimes || []).forEach((dateTimeStr, index) => {
        const btn = document.createElement("button");
        btn.className = "time-box";
        btn.type = "button";
        btn.dataset.time = dateTimeStr;
        btn.textContent = formatPickupTime(dateTimeStr);

        if (state.selectedTime === dateTimeStr || (!state.selectedTime && index === 0)) {
          btn.classList.add("active");
        }

        btn.addEventListener("click", () => {
          state.selectedTime = dateTimeStr;
          updateTimeBoxActive(modalTimeGrid, dateTimeStr);
          syncPageSelectedTime(dateTimeStr);
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
    bindCommentSubmit();
    bindPrivateCheck();
  }

  function bindModalEvents() {
    const openModalBtn = document.getElementById("openModal");
    const closeModalBtn = document.getElementById("closeModal");
    const modal = document.getElementById("joinModal");
    const modalConfirmBtn = modal?.querySelector(".btn.btn-primary.btn-full");

    if (openModalBtn && modal) {
      openModalBtn.addEventListener("click", () => {
        const isLoggedIn =
          typeof getLoginState === "function" ? getLoginState() : false;

        if (!isLoggedIn) {
          showToast("로그인이 필요합니다.");
          window.location.href = "login.html";
          return;
        }

        modal.classList.remove("hidden");
      });
    }

    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.add("hidden");
        }
      });
    }

    if (modalConfirmBtn) {
      modalConfirmBtn.addEventListener("click", () => {
        const isLoggedIn =
          typeof getLoginState === "function" ? getLoginState() : false;

        if (!isLoggedIn) {
          showToast("로그인이 필요합니다.");
          window.location.href = "login.html";
          return;
        }

        if (!state.selectedTime) {
          showToast("픽업 시간을 선택해 주세요.");
          return;
        }

        showToast(`${state.selectedTime} 픽업 시간으로 참여를 신청했습니다.`);
        modal.classList.add("hidden");
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

  function syncPageSelectedTime(selectedTime) {
    const timeCard = getCardBySectionTitle("🕒 픽업 시간 선택");
    const pageGrid = timeCard?.querySelector(".time-grid");

    if (!pageGrid) return;

    updateTimeBoxActive(pageGrid, selectedTime);
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
      return formatDateKorean(new Date(pickupTimes[0]));
    }
    return "미정";
  }

  function getDeadlineText(groupBuy) {
    if (!groupBuy.deadline) return "미정";
    return formatDateKorean(new Date(groupBuy.deadline));
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

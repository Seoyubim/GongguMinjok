(function () {
  const state = {
    groupBuy: null,
    selectedTime: null
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!window.APP_DATA || !Array.isArray(window.APP_DATA.groupBuys)) {
      console.error("APP_DATA 또는 groupBuys 데이터를 찾을 수 없습니다.");
      showToast("임시 데이터를 불러올 수 없습니다.");
      return;
    }

    const groupBuyId = getGroupBuyIdFromUrl();
    const groupBuy = getGroupBuyById(groupBuyId) || window.APP_DATA.groupBuys[0];

    if (!groupBuy) {
      console.error("상세 데이터를 찾을 수 없습니다.");
      showToast("상세 데이터를 찾을 수 없습니다.");
      return;
    }

    state.groupBuy = groupBuy;
    state.selectedTime = getInitialSelectedTime(groupBuy);

    renderDetail(groupBuy);
    bindEvents();
  }

  function getGroupBuyIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    return Number.isNaN(id) ? null : id;
  }

  function getGroupBuyById(id) {
    if (!id) return null;
    return window.APP_DATA.groupBuys.find((item) => item.id === id) || null;
  }

  function getInitialSelectedTime(groupBuy) {
    if (Array.isArray(groupBuy.pickupTimeSlots) && groupBuy.pickupTimeSlots.length > 0) {
      return groupBuy.pickupTimeSlots[0].time;
    }

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
    renderTimeSlots(groupBuy.pickupTimeSlots || []);
    renderBottomBar(groupBuy);
    renderModal(groupBuy);
  }

  function renderHero(groupBuy) {
    const heroIcon = document.querySelector(".detail-hero-icon");
    if (!heroIcon) return;

    const emojiMap = {
      농산물: "🥬",
      식품: "🍽️",
      생활용품: "🧴",
      음료: "🥤"
    };

    heroIcon.textContent = emojiMap[groupBuy.category] || "🛍️";
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
        spans[0].textContent = `👤 ${groupBuy.hostName}`;
      }

      if (spans[1]) {
        spans[1].textContent = `${getBadgeEmoji(groupBuy.hostMannerScore)} ${groupBuy.hostMannerScore}`;
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
        strong.textContent = formatPrice(groupBuy.price);
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
        valueSpan.textContent = getPickupDateText(groupBuy);
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
      const participantScore =
        participant.mannerScore ??
        participant.rating ??
        participant.score ??
        0;

      const participantBadge = getBadgeEmoji(participantScore);

      const participantTime =
        participant.selectedTime ||
        participant.pickupTime ||
        participant.joinedAt ||
        "시간 미정";

      row.innerHTML = `
        <div class="avatar-circle-md">${escapeHtml(avatarText)}</div>
        <span class="small-note">${escapeHtml(participantName)}</span>
        <span class="small-note">${participantBadge} ${escapeHtml(String(participantScore))}</span>
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

  function renderTimeSlots(timeSlots) {
    const timeCard = getCardBySectionTitle("🕒 픽업 시간 선택");
    if (!timeCard) return;

    const timeGrid = timeCard.querySelector(".time-grid");
    if (!timeGrid) return;

    timeGrid.innerHTML = "";

    if (!timeSlots.length) {
      timeGrid.innerHTML = `<p class="small-note">선택 가능한 픽업 시간이 없습니다.</p>`;
      return;
    }

    timeSlots.forEach((slot, index) => {
      const button = document.createElement("button");
      button.className = "time-box";
      button.type = "button";
      button.dataset.time = slot.time;

      if (state.selectedTime === slot.time || (!state.selectedTime && index === 0)) {
        button.classList.add("active");
      }

      button.innerHTML = `
        <div class="time">${escapeHtml(slot.time)}</div>
        <div class="count">${slot.count}명 선택</div>
      `;

      button.addEventListener("click", () => {
        state.selectedTime = slot.time;
        updateTimeBoxActive(timeGrid, slot.time);
        syncModalSelectedTime(slot.time);
      });

      timeGrid.appendChild(button);
    });
  }

  function renderBottomBar(groupBuy) {
    const priceEl = document.querySelector(".fixed-bottom .price");
    if (priceEl) {
      priceEl.textContent = `1인 부담금 ${formatPrice(groupBuy.price)}`;
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

      (groupBuy.pickupTimeSlots || []).forEach((slot, index) => {
        const btn = document.createElement("button");
        btn.className = "time-box";
        btn.type = "button";
        btn.dataset.time = slot.time;
        btn.textContent = slot.time;

        if (state.selectedTime === slot.time || (!state.selectedTime && index === 0)) {
          btn.classList.add("active");
        }

        btn.addEventListener("click", () => {
          state.selectedTime = slot.time;
          updateTimeBoxActive(modalTimeGrid, slot.time);
          syncPageSelectedTime(slot.time);
        });

        modalTimeGrid.appendChild(btn);
      });
    }

    if (modalPriceStrong) {
      modalPriceStrong.textContent = formatPrice(groupBuy.price);
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

  function getPickupDateText(groupBuy) {
    const today = new Date();
    const pickupDate = new Date(today);
    pickupDate.setDate(today.getDate() + ((groupBuy.id % 4) + 1));
    return formatDateKorean(pickupDate);
  }

  function getDeadlineText(groupBuy) {
    const today = new Date();
    const deadline = new Date(today);
    deadline.setDate(today.getDate() + (groupBuy.status === "closing" ? 0 : 1));
    return formatDateKorean(deadline);
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
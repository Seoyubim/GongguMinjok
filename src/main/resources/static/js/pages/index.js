import { initMap } from "../utils/map.js";
checkTokenExpiry();

if (sessionStorage.getItem('logoutToast')) {
  sessionStorage.removeItem('logoutToast');
  showToast('로그아웃되었습니다.');
}

const groupbuyGrid = document.getElementById("groupbuyGrid");
const groupCount = document.getElementById("groupCount");
const tabButtons = document.querySelectorAll(".tab-trigger");

const loginBtn = document.getElementById("loginBtn");
const mypageBtn = document.getElementById("mypageBtn");
const logoutBtn = document.getElementById("logoutBtn");
const writeBtn = document.getElementById("writeBtn");
const toast = document.getElementById("toast");

const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadMoreWrap = document.getElementById("loadMoreWrap");

let selectedCategories = [];
let selectedStatus = "all";
let selectedRadius = "neighborhood";

let userLat = null;
let userLng = null;
let allGroupBuys = [];

const ITEMS_PER_PAGE = 20;
let visibleCount = ITEMS_PER_PAGE;

function renderAuthButtons() {
  const loggedIn = getLoginState();

  if (loggedIn) {
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

function bindCategoryCheckboxes() {
  const checkboxes = document.querySelectorAll('#categoryFilter input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedCategories.push(checkbox.value);
      } else {
        selectedCategories = selectedCategories.filter((c) => c !== checkbox.value);
      }
      visibleCount = ITEMS_PER_PAGE;
      renderGroupBuys();
    });
  });
}

async function initUserLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        resolve();
      },
      () => resolve()
    );
  });
}

function getFilteredGroupBuys() {
  let filtered = allGroupBuys.filter((item) => {
    const matchCategory =
      selectedCategories.length === 0 || selectedCategories.includes(item.category);

    const matchStatus =
      selectedStatus === "all" ||
      (selectedStatus === "recruiting" && item.status === "OPEN") ||
      (selectedStatus === "closing" && item.status === "CLOSING");

    const matchRadius = selectedRadius === "neighborhood"
      ? true
      : (item.distance != null && item.distance <= Number(selectedRadius));

    return item.status !== "EXPIRED" && matchCategory && matchStatus && matchRadius;
  });

  if (selectedRadius === "neighborhood") {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  return filtered;
}

function getMainStatusLabel(status) {
  if (status === "OPEN") return "모집중";
  if (status === "CLOSING") return "마감임박";
  if (status === "CLOSED" || status === "PAYMENT_COMPLETED" || status === "HOST_PURCHASED" || status === "PICKUP_READY" || status === "PENDING") return "진행중";
  if (status === "COMPLETED") return "완료";
  return "";
}

function getMainStatusClass(status) {
  if (status === "OPEN") return "badge-recruiting";
  if (status === "CLOSING") return "badge-closing";
  if (status === "CLOSED" || status === "PAYMENT_COMPLETED" || status === "HOST_PURCHASED" || status === "PICKUP_READY" || status === "PENDING") return "badge-progress";
  if (status === "COMPLETED") return "badge-completed";
  return "";
}

function createGroupBuyCard(item) {
  const progress = (item.currentParticipants / item.maxParticipants) * 100;
  const imageUrl = item.imageUrls?.[0] || "";
  const distanceText = item.distance != null ? item.distance.toFixed(1) + "km" : "";
  const pickupTimeText = (item.pickupTimes || []).length > 0
    ? [...new Set(
        item.pickupTimes.map(t => {
          const d = new Date(t.pickupTime);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        })
      )].join(' · ')
    : "";
  const mannerScoreHtml = item.hostMannerScore != null
    ? `<span class="text-gray">${Number(item.hostMannerScore).toFixed(1)}</span>`
    : "";

  return `
    <a class="groupbuy-card-link" href="detail.html?id=${item.id}">
      <div class="groupbuy-card">
        <div class="card-image">
          <img src="${imageUrl}" alt="${item.title}">
          <div class="card-badge ${getMainStatusClass(item.status)}">
            ${getMainStatusLabel(item.status)}
          </div>
          <div class="card-category">${getCategoryLabel(item.category)}</div>
        </div>

        <div class="card-content">
          <h3 class="card-title">${item.title}</h3>

          <div class="card-price-row">
            <span class="card-price">${formatPrice(item.participantFinalPrice)}</span>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" style="width:${progress}%;"></div>
          </div>

          <div class="card-info">
            <div class="info-row">
              📍 <span>${formatPickupLocation(item.pickupLocation)}</span>
              ${distanceText ? `<span class="text-lime info-distance">${distanceText}</span>` : ""}
            </div>
            <div class="info-row">
              🕐 <span>${pickupTimeText}</span>
            </div>
          </div>

          <div class="card-host">
            <div class="host-info">
              <div class="host-avatar">${getBadgeEmoji(item.hostMannerGrade)}</div>
              <span>${item.hostNickname}</span>
            </div>
            <div class="host-rating">
              ${mannerScoreHtml}
            </div>
          </div>
        </div>
      </div>
    </a>
  `;
}

function createClusterCard(item) {
  const progress = Math.round((item.currentParticipants / item.maxParticipants) * 100);

  const uniqueDates = [...new Set(
    (item.pickupTimes || []).map(t => {
      const d = new Date(t.pickupTime);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    })
  )].join(' · ') || '미정';

  const mannerScoreHtml = item.hostMannerScore != null
    ? `<span class="text-gray">${Number(item.hostMannerScore).toFixed(1)}점</span>`
    : '';

  return `
    <a class="groupbuy-card-link" href="detail.html?id=${item.id}">
      <div class="cluster-card">
        <div class="cluster-card-top">
          <div class="cluster-card-top-left">
            <span class="cluster-card-badge ${getStatusClass(item.status)}">${getStatusLabel(item.status)}</span>
            <span class="cluster-card-title">${item.title}</span>
          </div>
          <div class="cluster-card-top-right">
            ${getBadgeEmoji(item.hostMannerGrade)} ${item.hostNickname} ${mannerScoreHtml}
          </div>
        </div>
        <div class="cluster-card-info"><span class="cluster-card-label">금액</span>${formatPrice(item.participantFinalPrice)}</div>
        <div class="cluster-card-info"><span class="cluster-card-label">장소</span>${formatPickupLocation(item.pickupLocation)}</div>
        <div class="cluster-card-info"><span class="cluster-card-label">픽업일</span>${uniqueDates}</div>
        <div class="cluster-card-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${progress}%;"></div>
          </div>
          <span class="cluster-card-count">${item.currentParticipants} / ${item.maxParticipants}명</span>
        </div>
      </div>
    </a>
  `;
}

function openClusterModal(items, areaName) {
  const modal = document.getElementById("clusterModal");
  const title = document.getElementById("clusterModalTitle");
  const list = document.getElementById("clusterModalList");

  const label = areaName
    ? `${areaName} 공동구매 (${items.length}개)`
    : `이 지역 공동구매 (${items.length}개)`;

  title.textContent = label;
  list.innerHTML = items.map(createClusterCard).join("");
  modal.classList.remove("hidden");
}

function bindClusterModalEvents() {
  const modal = document.getElementById("clusterModal");
  const closeBtn = document.getElementById("closeClusterModal");

  closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}

async function renderGroupBuys() {
  const filtered = getFilteredGroupBuys();
  const visibleItems = filtered.slice(0, visibleCount);

  groupCount.textContent = "";

  if (filtered.length === 0) {
    groupbuyGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <p>조건에 맞는 공동구매가 없습니다.</p>
      </div>
    `;
    loadMoreWrap.classList.add("hidden");
    return;
  }

  groupbuyGrid.innerHTML = visibleItems.map(createGroupBuyCard).join("");

  if (filtered.length > visibleCount) {
    loadMoreWrap.classList.remove("hidden");
  } else {
    loadMoreWrap.classList.add("hidden");
  }
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    selectedStatus = button.dataset.status;
    visibleCount = ITEMS_PER_PAGE;
    renderGroupBuys();
  });
});

const radiusButtons = document.querySelectorAll(".radius-trigger");
radiusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    radiusButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    selectedRadius = button.dataset.radius;
    visibleCount = ITEMS_PER_PAGE;
    renderGroupBuys();
  });
});

loadMoreBtn.addEventListener("click", () => {
  visibleCount += ITEMS_PER_PAGE;
  renderGroupBuys();
});

logoutBtn.addEventListener("click", handleLogout);

async function initPage() {
  renderAuthButtons();
  bindCategoryCheckboxes();
  bindClusterModalEvents();
  await initUserLocation();
  allGroupBuys = await getGroupBuys(userLat, userLng);
  await initMap((items, areaName) => openClusterModal(items, areaName));
  renderGroupBuys();
}

initPage();
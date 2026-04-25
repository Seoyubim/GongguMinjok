import { initMap } from "../utils/map.js";

const data = window.APP_DATA;
const groupbuyGrid = document.getElementById("groupbuyGrid");
const categoryFilter = document.getElementById("categoryFilter");
const groupCount = document.getElementById("groupCount");
const tabButtons = document.querySelectorAll(".tab-trigger");

const loginBtn = document.getElementById("loginBtn");
const mypageBtn = document.getElementById("mypageBtn");
const logoutBtn = document.getElementById("logoutBtn");
const writeBtn = document.getElementById("writeBtn");
const toast = document.getElementById("toast");

const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadMoreWrap = document.getElementById("loadMoreWrap");

let selectedCategory = "전체";
let selectedStatus = "all";

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

function handleLogout() {
  logout();
  renderAuthButtons();
  showToast("로그아웃되었습니다.");
}

function renderCategories() {
  categoryFilter.innerHTML = data.categories
    .map(
      (category) => `
        <button
          class="category-btn ${category === selectedCategory ? "active" : ""}"
          data-category="${category}"
          type="button"
        >
          ${category}
        </button>
      `
    )
    .join("");

  document.querySelectorAll(".category-btn").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;
      visibleCount = ITEMS_PER_PAGE;
      renderCategories();
      renderGroupBuys();
    });
  });
}

async function getFilteredGroupBuys() {
  const groupBuys = await getGroupBuys();

  return groupBuys.filter((item) => {
    const matchCategory =
      selectedCategory === "전체" || item.category === selectedCategory;
    const matchStatus =
      selectedStatus === "all" || item.status === selectedStatus;

    return matchCategory && matchStatus;
  });
}

function createGroupBuyCard(item) {
  const progress = (item.currentParticipants / item.maxParticipants) * 100;

  return `
    <a class="groupbuy-card-link" href="detail.html?id=${item.id}">
      <div class="groupbuy-card">
        <div class="card-image">
          <img src="${item.imageUrl}" alt="${item.title}">
          <div class="card-badge ${getStatusClass(item.status)}">
            ${getStatusLabel(item.status)}
          </div>
          <div class="card-category">${item.category}</div>
        </div>

        <div class="card-content">
          <h3 class="card-title">${item.title}</h3>

          <div class="card-price-row">
            <span class="card-price">${formatPrice(item.price)}</span>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" style="width:${progress}%;"></div>
          </div>

          <div class="card-info">
            <div class="info-row">
              📍 <span>${item.pickupLocation}</span>
              <span class="text-lime info-distance">${item.distance}km</span>
            </div>
            <div class="info-row">
              🕐 <span>${item.pickupTimes[0]}</span>
            </div>
          </div>

          <div class="card-host">
            <div class="host-info">
              <div class="host-avatar">${item.hostName.charAt(0)}</div>
              <span>${item.hostName}</span>
            </div>
            <div class="host-rating">
              <span>${getBadgeEmoji(item.hostMannerScore)}</span>
              <span class="text-gray">${item.hostMannerScore}</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  `;
}

async function renderGroupBuys() {
  const filtered = await getFilteredGroupBuys();
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

loadMoreBtn.addEventListener("click", () => {
  visibleCount += ITEMS_PER_PAGE;
  renderGroupBuys();
});

logoutBtn.addEventListener("click", handleLogout);

async function initPage() {
  renderAuthButtons();
  //renderCategories();
  await initMap();
  await renderGroupBuys();
}

initPage();
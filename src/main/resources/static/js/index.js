const data = window.APP_DATA;
const groupbuyGrid = document.getElementById("groupbuyGrid");
const categoryFilter = document.getElementById("categoryFilter");
const groupCount = document.getElementById("groupCount");
const mapTitle = document.getElementById("mapTitle");
const mapSubTitle = document.getElementById("mapSubTitle");
const mapMarkers = document.getElementById("mapMarkers");
const tabButtons = document.querySelectorAll(".tab-trigger");

let selectedCategory = "전체";
let selectedStatus = "all";

function formatPrice(price) {
  return `${price.toLocaleString()}원`;
}

function getStatusLabel(status) {
  if (status === "recruiting") return "모집중";
  if (status === "closing") return "마감임박";
  if (status === "completed") return "완료";
  return "";
}

function getStatusClass(status) {
  if (status === "recruiting") return "badge-recruiting";
  if (status === "closing") return "badge-closing";
  if (status === "completed") return "badge-completed";
  return "";
}

function getBadgeEmoji(score) {
  if (score >= 90) return "🥇";
  if (score >= 80) return "🥈";
  return "🥉";
}

function renderMap() {
  mapTitle.textContent = `${data.map.locationName} 기준 주변 공동구매`;
  mapSubTitle.textContent = `총 ${data.groupBuys.length}개의 공동구매 진행 중`;

  mapMarkers.innerHTML = data.map.markers.map(marker => {
    const styles = [];
    if (marker.top !== undefined) styles.push(`top:${marker.top}px`);
    if (marker.left !== undefined) styles.push(`left:${marker.left}px`);
    if (marker.right !== undefined) styles.push(`right:${marker.right}px`);

    return `<div class="map-marker marker-${marker.type}" style="${styles.join(";")}">👥</div>`;
  }).join("");
}

function renderCategories() {
  categoryFilter.innerHTML = data.categories.map(category => `
    <button class="category-btn ${category === selectedCategory ? "active" : ""}" data-category="${category}">
      ${category}
    </button>
  `).join("");

  document.querySelectorAll(".category-btn").forEach(button => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;
      renderCategories();
      renderGroupBuys();
    });
  });
}

function getFilteredGroupBuys() {
  return data.groupBuys.filter(item => {
    const matchCategory = selectedCategory === "전체" || item.category === selectedCategory;
    const matchStatus = selectedStatus === "all" || item.status === selectedStatus;
    return matchCategory && matchStatus;
  });
}

function renderGroupBuys() {
  const filtered = getFilteredGroupBuys();
  groupCount.textContent = `${filtered.length}개`;

  if (filtered.length === 0) {
    groupbuyGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <p>조건에 맞는 공동구매가 없습니다.</p>
      </div>
    `;
    return;
  }

  groupbuyGrid.innerHTML = filtered.map(item => {
    const progress = (item.currentParticipants / item.maxParticipants) * 100;

    return `
      <a class="groupbuy-card-link" href="detail.html?id=${item.id}">
        <div class="groupbuy-card">
          <div class="card-image">
            <img src="${item.imageUrl}" alt="${item.title}">
            <div class="card-badge ${getStatusClass(item.status)}">${getStatusLabel(item.status)}</div>
            <div class="card-category">${item.category}</div>
          </div>

          <div class="card-content">
            <h3 class="card-title">${item.title}</h3>

            <div class="card-price-row">
              <span class="card-price">${formatPrice(item.price)}</span>
              <span class="card-participants">${item.currentParticipants}/${item.maxParticipants}명</span>
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
  }).join("");
}

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    tabButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    selectedStatus = button.dataset.status;
    renderGroupBuys();
  });
});

renderMap();
renderCategories();
renderGroupBuys();
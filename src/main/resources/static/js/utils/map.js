let map;
let modalMap;
let markers = [];
let modalMarkers = [];

function getMarkerImageSrc(status) {
  if (status === "ongoing" || status === "recruiting" || status === "active") {
    return "images/marker-green.png";
  }

  if (status === "closing" || status === "deadline") {
    return "images/marker-red.png";
  }

  if (status === "done" || status === "completed" || status === "closed") {
    return "images/marker-blue.png";
  }

  return "images/marker-default.png";
}

function createMarkerImage(status) {
  const imageSrc = getMarkerImageSrc(status);
  const imageSize = new kakao.maps.Size(36, 40);
  const imageOption = {
    offset: new kakao.maps.Point(18, 40)
  };

  return new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
}

function clearMarkers(markerList) {
  markerList.forEach((marker) => marker.setMap(null));
  markerList.length = 0;
}

function createInfoWindowContent(item) {
  return `
    <div style="padding:10px; min-width:180px; font-size:13px; line-height:1.5;">
      <strong>${item.title}</strong><br>
      <span>📍 ${item.pickupLocation || "위치 정보 없음"}</span><br>
      <span>👥 ${item.currentParticipants || 0} / ${item.maxParticipants || 0}</span>
    </div>
  `;
}

function addMarkersToMap(targetMap, markerList, groupBuys) {
  clearMarkers(markerList);

  if (!Array.isArray(groupBuys) || groupBuys.length === 0) {
    return;
  }

  const bounds = new kakao.maps.LatLngBounds();

  groupBuys.forEach((item) => {
    if (item.lat == null || item.lng == null) return;

    const position = new kakao.maps.LatLng(item.lat, item.lng);

    const marker = new kakao.maps.Marker({
      map: targetMap,
      position,
      title: item.title,
      image: createMarkerImage(item.status)
    });

    const infowindow = new kakao.maps.InfoWindow({
      content: createInfoWindowContent(item)
    });

    kakao.maps.event.addListener(marker, "click", function () {
      infowindow.open(targetMap, marker);
    });

    markerList.push(marker);
    bounds.extend(position);
  });

  if (!bounds.isEmpty()) {
    targetMap.setBounds(bounds);
  }
}

async function getSafeGroupBuys() {
  if (typeof window.getGroupBuys !== "function") {
    console.warn("getGroupBuys 함수를 찾을 수 없습니다.");
    return [];
  }

  try {
    const groupBuys = await window.getGroupBuys();
    return Array.isArray(groupBuys) ? groupBuys : [];
  } catch (error) {
    console.error("공동구매 데이터 조회 실패:", error);
    return [];
  }
}

function bindModalEvents() {
  const mapElement = document.getElementById("map");
  const mapModal = document.getElementById("mapModal");
  const closeMapModalBtn = document.getElementById("closeMapModalBtn");
  const modalMapElement = document.getElementById("modalMap");

  if (!mapElement || !mapModal || !closeMapModalBtn || !modalMapElement) return;

  let isMouseDown = false;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  mapElement.addEventListener("mousedown", (e) => {
    isMouseDown = true;
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
  });

  mapElement.addEventListener("mousemove", (e) => {
    if (!isMouseDown) return;

    const moveX = Math.abs(e.clientX - startX);
    const moveY = Math.abs(e.clientY - startY);

    if (moveX > 5 || moveY > 5) {
      isDragging = true;
    }
  });

  mapElement.addEventListener("mouseup", async () => {
    if (!isDragging) {
      mapModal.classList.remove("hidden");

      const groupBuys = await getSafeGroupBuys();

      if (!modalMap) {
        modalMap = new kakao.maps.Map(modalMapElement, {
          center: new kakao.maps.LatLng(35.1469, 126.9229),
          level: 4
        });

        modalMap.setZoomable(true);
        modalMap.setDraggable(true);

        const zoomControl = new kakao.maps.ZoomControl();
        modalMap.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
      }

      setTimeout(() => {
        modalMap.relayout();
        addMarkersToMap(modalMap, modalMarkers, groupBuys);
      }, 0);
    }

    isMouseDown = false;
    isDragging = false;
  });

  mapElement.addEventListener("mouseleave", () => {
    isMouseDown = false;
    isDragging = false;
  });

  closeMapModalBtn.addEventListener("click", () => {
    mapModal.classList.add("hidden");
  });

  mapModal.addEventListener("click", (event) => {
    if (event.target === mapModal) {
      mapModal.classList.add("hidden");
    }
  });
}

export async function initMap() {
  const mapContainer = document.getElementById("map");
  const mapTitle = document.getElementById("mapTitle");
  const mapSubTitle = document.getElementById("mapSubTitle");

  if (!mapContainer || typeof kakao === "undefined" || !kakao.maps) return;

  if (mapTitle && window.APP_DATA?.map?.locationName) {
    mapTitle.textContent = `${window.APP_DATA.map.locationName} 기준 주변 공동구매`;
  }

  map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(35.1469, 126.9229),
    level: 4
  });

  map.setZoomable(true);
  map.setDraggable(true);

  const zoomControl = new kakao.maps.ZoomControl();
  map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

  const groupBuys = await getSafeGroupBuys();

  if (mapSubTitle) {
    mapSubTitle.textContent = `총 ${groupBuys.length}개의 공동구매`;
  }

  addMarkersToMap(map, markers, groupBuys);
  bindModalEvents();
}
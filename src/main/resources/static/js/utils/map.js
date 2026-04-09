let map;
let modalMap;
let markers = [];
let modalMarkers = [];
let currentLocationMarker = null;
let modalCurrentLocationMarker = null;
let mapGeocoder = null;
let lastTitleCenterKey = "";

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

function addMarkersToMap(targetMap, markerList, groupBuys, shouldFitBounds = true) {
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

  if (shouldFitBounds && !bounds.isEmpty()) {
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

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저에서는 위치 정보를 지원하지 않습니다."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000
      }
    );
  });
}

function ensureGeocoder() {
  if (!mapGeocoder && kakao.maps.services) {
    mapGeocoder = new kakao.maps.services.Geocoder();
  }

  return mapGeocoder;
}

function updateMapTitleByCenter(targetMap) {
  const mapTitle = document.getElementById("mapTitle");
  if (!targetMap || !mapTitle) return;

  const geocoder = ensureGeocoder();
  if (!geocoder) return;

  const center = targetMap.getCenter();
  const centerKey = `${center.getLat().toFixed(4)},${center.getLng().toFixed(4)}`;

  if (lastTitleCenterKey === centerKey) return;
  lastTitleCenterKey = centerKey;

  geocoder.coord2RegionCode(center.getLng(), center.getLat(), (result, status) => {
    if (status !== kakao.maps.services.Status.OK) return;

    const region =
      result.find((item) => item.region_type === "H") ||
      result.find((item) => item.region_type === "B");

    if (!region) return;

    mapTitle.textContent = `${region.address_name} 기준 주변 공동구매`;
  });
}

async function setMapToCurrentLocation(targetMap, markerType = "main") {
  if (!targetMap) return;

  try {
    const position = await getCurrentPosition();
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const currentLatLng = new kakao.maps.LatLng(lat, lng);

    targetMap.setCenter(currentLatLng);
    targetMap.setLevel(3);

    if (markerType === "main") {
      if (currentLocationMarker) {
        currentLocationMarker.setMap(null);
      }

      currentLocationMarker = new kakao.maps.Marker({
        map: targetMap,
        position: currentLatLng,
        title: "내 위치"
      });
    }

    if (markerType === "modal") {
      if (modalCurrentLocationMarker) {
        modalCurrentLocationMarker.setMap(null);
      }

      modalCurrentLocationMarker = new kakao.maps.Marker({
        map: targetMap,
        position: currentLatLng,
        title: "내 위치"
      });
    }

    if (targetMap === map) {
      updateMapTitleByCenter(map);
    }
  } catch (error) {
    console.error("현재 위치를 가져오지 못했습니다.", error);
  }
}

function bindLocationEvents() {
  const mainLocationBtn = document.getElementById("mainLocationBtn");
  const modalLocationBtn = document.getElementById("modalLocationBtn");

  if (mainLocationBtn) {
    mainLocationBtn.addEventListener("click", async () => {
      await setMapToCurrentLocation(map, "main");
    });
  }

  if (modalLocationBtn) {
    modalLocationBtn.addEventListener("click", async () => {
      if (!modalMap) return;
      await setMapToCurrentLocation(modalMap, "modal");
    });
  }
}

function bindResizeEvents() {
  window.addEventListener("resize", () => {
    if (!map) return;
    map.relayout();
  });
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
      if (!map) return;

      const currentCenter = map.getCenter();
      const currentLevel = map.getLevel();

      mapModal.classList.remove("hidden");

      if (!modalMap) {
        modalMap = new kakao.maps.Map(modalMapElement, {
          center: currentCenter,
          level: currentLevel
        });

        modalMap.setZoomable(true);
        modalMap.setDraggable(true);

        const zoomControl = new kakao.maps.ZoomControl();
        modalMap.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
      }

      setTimeout(async () => {
        modalMap.relayout();
        modalMap.setCenter(currentCenter);
        modalMap.setLevel(currentLevel);

        const groupBuys = await getSafeGroupBuys();
        addMarkersToMap(modalMap, modalMarkers, groupBuys, false);
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

function bindMapEvents() {
  if (!map) return;

  kakao.maps.event.addListener(map, "idle", function () {
    updateMapTitleByCenter(map);
  });
}

async function setupMap() {
  const mapContainer = document.getElementById("map");
  const mapTitle = document.getElementById("mapTitle");
  const mapSubTitle = document.getElementById("mapSubTitle");

  if (!mapContainer) return;

  map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(35.1469, 126.9229),
    level: 4
  });

  map.setZoomable(true);
  map.setDraggable(true);

  const zoomControl = new kakao.maps.ZoomControl();
  map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

  if (mapTitle) {
    mapTitle.textContent = "내 주변 공동구매";
  }

  const groupBuys = await getSafeGroupBuys();

  if (mapSubTitle) {
    mapSubTitle.textContent = `총 ${groupBuys.length}개의 공동구매`;
  }

  addMarkersToMap(map, markers, groupBuys, true);

  bindModalEvents();
  bindLocationEvents();
  bindResizeEvents();

  setTimeout(() => {
    map.relayout();
    setMapToCurrentLocation(map, "main");
  }, 300);

  setTimeout(() => {
    bindMapEvents();
    updateMapTitleByCenter(map);
  }, 800);
}

/**
 * 카카오맵 SDK 스크립트가 완전히 다운로드될 때까지 폴링으로 대기.
 *
 * autoload=false 옵션 사용 시:
 *   - SDK 스크립트 다운로드 완료 → window.kakao 객체 생성됨
 *   - kakao.maps.load() 호출 후 콜백 내부 → window.kakao.maps 완전히 준비됨
 *
 * 따라서 여기서는 window.kakao 의 존재만 확인하고,
 * window.kakao.maps 의 준비는 kakao.maps.load() 의 콜백에 맡김.
 *
 * index.html 의 onload="window.kakaoSdkReady = true;" 도 함께 체크하여
 * 두 조건 중 하나라도 충족되면 resolve.
 */
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

export async function initMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  try {
    await waitForKakao();
  } catch (error) {
    console.error("카카오맵 SDK 로드 실패:", error);
    return;
  }

  kakao.maps.load(async function () {
    try {
      await setupMap();
    } catch (error) {
      console.error("지도 초기화 실패:", error);
    }
  });
}

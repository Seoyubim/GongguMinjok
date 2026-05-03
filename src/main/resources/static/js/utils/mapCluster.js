// 현재 지도/모달에 표시된 CustomOverlay 목록
const overlays = [];
const modalOverlays = [];
let debounceTimer = null;
let modalDebounceTimer = null;

// 두 좌표 사이 거리(km) 계산 — Haversine 공식
function calcDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// dongName 기준 그룹핑 — 레벨 7 이상(축소)에서 사용
function groupByDong(groupBuys) {
  const dongMap = {};

  groupBuys.forEach(item => {
    if (!item.dongName || item.lat == null || item.lng == null) return;

    if (!dongMap[item.dongName]) {
      dongMap[item.dongName] = { items: [], latSum: 0, lngSum: 0 };
    }

    dongMap[item.dongName].items.push(item);
    dongMap[item.dongName].latSum += item.lat;
    dongMap[item.dongName].lngSum += item.lng;
  });

  return Object.entries(dongMap).map(([dongName, data]) => ({
    dongName,
    items: data.items,
    lat: data.latSum / data.items.length,
    lng: data.lngSum / data.items.length
  }));
}

// 300m 이내 좌표 기준 그룹핑 — 레벨 6 이하(확대)에서 사용
function groupByProximity(groupBuys) {
  const threshold = 0.3;
  const used = new Set();
  const clusters = [];

  groupBuys.forEach((item, i) => {
    if (item.lat == null || item.lng == null) return;
    if (used.has(i)) return;

    const cluster = { items: [item], latSum: item.lat, lngSum: item.lng };
    used.add(i);

    groupBuys.forEach((other, j) => {
      if (i === j || used.has(j)) return;
      if (other.lat == null || other.lng == null) return;

      if (calcDistanceKm(item.lat, item.lng, other.lat, other.lng) <= threshold) {
        cluster.items.push(other);
        cluster.latSum += other.lat;
        cluster.lngSum += other.lng;
        used.add(j);
      }
    });

    clusters.push({
      items: cluster.items,
      lat: cluster.latSum / cluster.items.length,
      lng: cluster.lngSum / cluster.items.length
    });
  });

  return clusters;
}

// 행정동 말풍선 CustomOverlay 생성 — 레벨 7 이상에서 사용
function createDongLabel(map, dongName, count, lat, lng, items, onClickFn) {
  const el = document.createElement('div');
  el.className = 'dong-label';
  el.innerHTML = `<span class="dong-name">${dongName}</span><span class="dong-count">${count}개</span>`;

  el.addEventListener('mousedown', (e) => e.stopPropagation());
  el.addEventListener('mouseup', (e) => e.stopPropagation());
  if (onClickFn) {
    el.addEventListener('click', (e) => { e.stopPropagation(); onClickFn(items, dongName); });
  }

  const overlay = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(lat, lng),
    content: el,
    xAnchor: 0.5,
    yAnchor: 1.0,
    zIndex: 3
  });

  overlay.setMap(map);
  return overlay;
}

// 녹색 원 클러스터 CustomOverlay 생성 — 레벨 6 이하에서 사용
function createClusterDot(map, count, lat, lng, items, onClickFn) {
  const sizeClass = count >= 10 ? 'lg' : count >= 4 ? 'md' : 'sm';

  const el = document.createElement('div');
  el.className = `cluster-dot cluster-dot-${sizeClass}`;
  el.textContent = count;

  el.addEventListener('mousedown', (e) => e.stopPropagation());
  el.addEventListener('mouseup', (e) => e.stopPropagation());
  if (onClickFn) {
    el.addEventListener('click', (e) => { e.stopPropagation(); onClickFn(items, null); });
  }

  const overlay = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(lat, lng),
    content: el,
    xAnchor: 0.5,
    yAnchor: 0.5,
    zIndex: 3
  });

  overlay.setMap(map);
  return overlay;
}

// overlayList의 모든 CustomOverlay를 지도에서 제거하고 배열을 비움
function clearOverlays(overlayList) {
  overlayList.forEach(overlay => overlay.setMap(null));
  overlayList.length = 0;
}

// 현재 줌 레벨에 따라 적절한 마커를 렌더링
function renderByZoomLevel(map, groupBuys, overlayList, onClickFn) {
  clearOverlays(overlayList);

  const level = map.getLevel();

  if (level >= 7) {
    // 축소 상태 — 행정동 말풍선
    const dongGroups = groupByDong(groupBuys);
    dongGroups.forEach(({ dongName, items, lat, lng }) => {
      const overlay = createDongLabel(map, dongName, items.length, lat, lng, items, onClickFn);
      overlayList.push(overlay);
    });
  } else {
    // 확대 상태 — 녹색 원 클러스터
    const clusters = groupByProximity(groupBuys);
    clusters.forEach(({ items, lat, lng }) => {
      const overlay = createClusterDot(map, items.length, lat, lng, items, onClickFn);
      overlayList.push(overlay);
    });
  }
}

// 메인 지도 클러스터 초기화 — map.js에서 호출
export function initCluster(map, groupBuys, onClickFn) {
  const active = groupBuys.filter(i => i.status === "OPEN" || i.status === "CLOSING");
  renderByZoomLevel(map, active, overlays, onClickFn);

  kakao.maps.event.addListener(map, 'zoom_changed', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderByZoomLevel(map, active, overlays, onClickFn);
    }, 150);
  });
}

// 모달 지도 클러스터 초기화 — zoom_changed 포함
export function initModalCluster(map, groupBuys, onClickFn = null) {
  const active = groupBuys.filter(i => i.status === "OPEN" || i.status === "CLOSING");
  renderByZoomLevel(map, active, modalOverlays, onClickFn);

  kakao.maps.event.addListener(map, 'zoom_changed', () => {
    clearTimeout(modalDebounceTimer);
    modalDebounceTimer = setTimeout(() => {
      renderByZoomLevel(map, active, modalOverlays, onClickFn);
    }, 150);
  });
}

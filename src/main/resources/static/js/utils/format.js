function formatPrice(price) {
  return `${price.toLocaleString()}원`;
}

function getStatusLabel(status) {
  if (status === "OPEN") return "모집중";
  if (status === "CLOSING") return "마감임박";
  if (status === "CLOSED" || status === "PAYMENT_COMPLETED" || status === "PICKUP_READY" || status === "COMPLETED") return "완료";
  return "";
}

function getStatusClass(status) {
  if (status === "OPEN") return "badge-recruiting";
  if (status === "CLOSING") return "badge-closing";
  if (status === "CLOSED" || status === "PAYMENT_COMPLETED" || status === "PICKUP_READY" || status === "COMPLETED") return "badge-completed";
  return "";
}

function getMarkerClassByStatus(status) {
  if (status === "OPEN") return "marker-green";
  if (status === "CLOSING") return "marker-red";
  if (status === "CLOSED" || status === "PAYMENT_COMPLETED" || status === "PICKUP_READY" || status === "COMPLETED") return "marker-blue";
  return "marker-green";
}

function getCategoryLabel(category) {
  const map = {
    ELECTRONICS: "전자제품",
    HOME_APPLIANCES: "가전제품",
    FURNITURE_INTERIOR: "가구/인테리어",
    HOME_KITCHEN: "생활/주방용품",
    BABY_KIDS: "유아/아동",
    WOMENS_CLOTHING: "여성의류",
    WOMENS_ACCESSORIES: "여성잡화",
    MENS_FASHION_ACCESSORIES: "남성패션/잡화",
    BEAUTY_PERSONAL_CARE: "뷰티/개인관리",
    SPORTS_LEISURE: "스포츠/레저",
    HOBBIES_GAMES_MUSIC: "취미/게임/음악",
    BOOKS: "도서",
    TICKETS_VOUCHERS: "티켓/상품권",
    E_COUPONS: "전자쿠폰",
    PROCESSED_FOODS: "가공식품",
    HEALTH_SUPPLEMENTS: "건강식품/영양제",
    PET_SUPPLIES: "반려동물용품",
    PLANTS: "식물",
    OTHERS: "기타"
  };
  return map[category] || category;
}

function formatPickupTime(dateTimeStr) {
  if (!dateTimeStr) return "";
  const date = new Date(dateTimeStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

function getBadgeEmoji(grade) {
  const emojis = {
    LEGEND: "👑",
    GREAT:  "😄",
    GOOD:   "🙂",
    SOSO:   "😐",
    BAD:    "😢",
  };
  return emojis[grade] ?? "";
  /* 이미지로 전환 시 위 return을 아래로 교체:
  if (!emojis[grade]) return "";
  return `<img src="/images/grade_${grade.toLowerCase()}.png" alt="${grade}" class="manner-badge-img" style="height:1em">`;
  */
}
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

function getMarkerClassByStatus(status) {
  if (status === "recruiting") return "marker-green";
  if (status === "closing") return "marker-red";
  if (status === "completed") return "marker-blue";
  return "marker-green";
}

function getBadgeEmoji(score) {
  if (score >= 90) return "🥇";
  if (score >= 80) return "🥈";
  return "🥉";
}
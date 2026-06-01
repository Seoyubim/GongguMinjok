async function getAdminStats() {
  const res = await fetch('/api/admin/stats', {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.json();
}

async function getAdminSettlements(filter) {
  const url = filter ? `/api/admin/settlements?filter=${filter}` : '/api/admin/settlements';
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.json();
}

async function getAdminUsers(filter) {
  const url = filter ? `/api/admin/users?filter=${filter}` : '/api/admin/users';
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.json();
}

async function getAdminGroupBuys(status) {
  const url = status ? `/api/admin/groupbuys?status=${status}` : '/api/admin/groupbuys';
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.json();
}

async function getAdminGroupBuyDetail(id) {
  const res = await fetch(`/api/admin/groupbuys/${id}/detail`, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.json();
}

async function deleteAdminGroupBuy(id) {
  const res = await fetch(`/api/admin/groupbuys/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.ok;
}

async function getAdminSettlementDetail(id) {
  const res = await fetch(`/api/admin/settlements/${id}/detail`, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.json();
}

async function completeAdminSettlement(id) {
  const res = await fetch(`/api/admin/settlements/${id}/complete`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.ok;
}

async function blockAdminUser(userId, isBlock) {
  const res = await fetch(`/api/admin/users/${userId}/block`, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ block: isBlock })
  });
  return res.ok;
}

async function getAdminRefunds() {
  const res = await fetch('/api/admin/refunds', {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.json();
}

async function processAdminRefund(id) {
  const res = await fetch(`/api/admin/refunds/${id}/process`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });
  return res.ok;
}

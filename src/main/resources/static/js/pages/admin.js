const pages = ['dashboard', 'settlements', 'users', 'groupbuys'];

function showPage(name) {

  pages.forEach(p => {

    const el = document.getElementById('page-' + p);

    if (!el) return;

    el.style.display = (p === name)
      ? 'block'
      : 'none';
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {

    const text = tab.innerText.replace(/\s/g, '');

    if (
      (name === 'dashboard' && text.includes('대시보드')) ||
      (name === 'settlements' && text.includes('정산')) ||
      (name === 'users' && text.includes('유저')) ||
      (name === 'groupbuys' && text.includes('게시글'))
    ) {
      tab.classList.add('active');
    }

  });

}

function showUserDetailModal(user) {

  document.getElementById('u-nickname').textContent = user.nickname;
  document.getElementById('u-email').textContent = user.email;
  document.getElementById('u-join').textContent = user.joinDate;
  document.getElementById('u-score').textContent = user.score;

  document.getElementById('user-detail-modal')
    .classList.add('show');
}

function showSettlementDetailModal(data) {

  document.getElementById('s-title').textContent = data.title;
  document.getElementById('s-host').textContent = data.host;
  document.getElementById('s-date').textContent = data.date;
  document.getElementById('s-place').textContent = data.place;

  const tbody = document.getElementById('s-users');

  tbody.innerHTML = '';

  data.users.forEach(u => {

    tbody.innerHTML += `
      <tr>
        <td>${u.name}</td>
        <td>${u.price}</td>
        <td>${u.pickup ? '완료' : '미완료'}</td>
      </tr>
    `;

  });

  document.getElementById('settlement-detail-modal')
    .classList.add('show');
}

function showPostDetailModal(post) {

  document.getElementById('p-title').textContent = post.title;
  document.getElementById('p-category').textContent = post.category;
  document.getElementById('p-host').textContent = post.host;
  document.getElementById('p-count').textContent = post.count;
  document.getElementById('p-price').textContent = post.price;
  document.getElementById('p-date').textContent = post.date;

  document.getElementById('p-desc').textContent = post.desc;

  const uBody = document.getElementById('p-users');

  uBody.innerHTML = '';

  post.users.forEach(u => {

    uBody.innerHTML += `
      <tr>
        <td>${u.name}</td>
        <td>${u.joinDate}</td>
        <td>${u.status}</td>
      </tr>
    `;

  });

  const hBody = document.getElementById('p-history');

  hBody.innerHTML = '';

  post.history.forEach(h => {

    hBody.innerHTML += `
      <tr>
        <td>${h.action}</td>
        <td>${h.date}</td>
      </tr>
    `;

  });

  document.getElementById('post-detail-modal')
    .classList.add('show');
}

function closeModal() {

  document.querySelectorAll('.modal-overlay')
    .forEach(m => {
      m.classList.remove('show');
    });

}

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.modal-overlay')
    .forEach(m => {

      m.addEventListener('click', e => {

        if (e.target === m) {
          closeModal();
        }

      });

    });

  document.querySelectorAll('.filter-tabs button')
    .forEach(btn => {

      btn.addEventListener('click', function () {

        const parent = this.parentElement;

        parent.querySelectorAll('button')
          .forEach(b => b.classList.remove('active'));

        this.classList.add('active');

      });

    });

});
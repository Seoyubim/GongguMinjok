const MANNER_GRADE_MAP = {
  LEGEND:  { emoji: '👑', cls: 'legend',  label: 'LEGEND'  },
  GREAT:   { emoji: '😄', cls: 'great',   label: 'GREAT'   },
  GOOD:    { emoji: '🙂', cls: 'good',    label: 'GOOD'    },
  SOSO:    { emoji: '😐', cls: 'soso',    label: 'SOSO'    },
  BAD:     { emoji: '😢', cls: 'bad',     label: 'BAD'     },
  BLOCKED: { emoji: '🚫', cls: 'blocked', label: 'BLOCKED' },
};

const RATING_EMOJI = {
  GREAT: '😄',
  GOOD:  '👍',
  BAD:   '😢',
};

document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

async function init() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  if (!userId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const [profile, createdList] = await Promise.all([
      getUserPublicProfile(userId),
      getGroupBuysByHost(userId),
    ]);

    // 프로필 이미지
    document.getElementById('profileImg').src = profile.profileImage || 'images/default-profile.png';

    // 닉네임
    document.getElementById('profileNickname').textContent = profile.nickname;

    // 프리미엄 배지 (월 생성 제한이 null이면 프리미엄)
    if (profile.monthlyGroupBuyCreateLimit === null) {
      document.getElementById('premiumBadge').classList.remove('hidden');
    }

    // 매너 등급 배지
    const grade = MANNER_GRADE_MAP[profile.mannerGrade] || { emoji: '', cls: '', label: profile.mannerGrade };
    const gradeEl = document.getElementById('mannerGrade');
    gradeEl.className = 'manner-grade ' + grade.cls;
    gradeEl.textContent = grade.emoji + ' ' + grade.label;

    // 매너 점수
    document.getElementById('mannerScore').textContent = Number(profile.mannerScore).toFixed(1);
    document.getElementById('mannerBar').style.width = profile.mannerScore + '%';

    // 총 생성 횟수
    document.getElementById('createCount').textContent = createdList.length;

    // 월 생성횟수
    const monthly = profile.monthlyGroupBuyCreateLimit === null
      ? profile.monthlyGroupBuyCreateCount + ' (무제한)'
      : profile.monthlyGroupBuyCreateCount + '/' + profile.monthlyGroupBuyCreateLimit;
    document.getElementById('monthlyCount').textContent = monthly;

    // 받은 후기
    renderReviews(profile.recentReviews || []);

  } catch (e) {
    showToast(e.message || '프로필을 불러오는데 실패했습니다.');
  }
}

function renderReviews(reviews) {
  const listEl = document.getElementById('reviewList');

  if (reviews.length === 0) {
    listEl.innerHTML = '<p style="color:#9ca3af;font-size:0.875rem;text-align:center;padding:2rem 0;">아직 받은 후기가 없습니다.</p>';
    return;
  }

  listEl.innerHTML = reviews.map(review => {
    const emoji = RATING_EMOJI[review.rating] || '💬';
    const items = (review.checkedItems || []).map(item => `<span>${item}</span>`).join(' · ');
    return `
      <div class="review-item">
        ${emoji} ${items || review.rating}
        <div style="font-size:0.78rem;color:#9ca3af;margin-top:0.3rem;">${review.reviewerNickname}</div>
      </div>
    `;
  }).join('');
}

init();

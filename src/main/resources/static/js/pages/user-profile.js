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
    const profileImg = document.getElementById('profileImg');
    profileImg.src = profile.profileImage || 'images/default-profile.png';
    profileImg.onerror = () => { profileImg.src = 'images/default-profile.png'; };

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

    // 총 참여 횟수
    document.getElementById('joinCount').textContent = profile.participationCount;

    // 총 생성 횟수
    document.getElementById('createCount').textContent = createdList.length;

    // 월 생성횟수
    const monthly = profile.monthlyGroupBuyCreateLimit === null
      ? profile.monthlyGroupBuyCreateCount + ' (무제한)'
      : profile.monthlyGroupBuyCreateCount + '/' + profile.monthlyGroupBuyCreateLimit;
    document.getElementById('monthlyCount').textContent = monthly;

    // 받은 후기
    renderReviews(profile.receivedReviewItemCounts || []);

  } catch (e) {
    showToast(e.message || '프로필을 불러오는데 실패했습니다.');
  }
}

function renderReviews(itemCounts) {
  const listEl = document.getElementById('reviewList');

  if (!itemCounts.length) {
    listEl.innerHTML = '<p style="color:#9ca3af;font-size:0.875rem;text-align:center;padding:2rem 0;">아직 받은 후기가 없습니다.</p>';
    return;
  }

  const max = itemCounts[0].count;
  listEl.innerHTML = itemCounts.map(({ item, count }) => {
    const pct = (count / max * 100).toFixed(1);
    const opacity = (0.12 + 0.88 * count / max).toFixed(2);
    const fillColor = `rgba(163,230,53,${opacity})`;
    return `<div class="review-item" style="display:flex;justify-content:space-between;align-items:center;background:linear-gradient(to right,${fillColor} ${pct}%,#f9fafb 0%)">
      <span>"${item}"</span>
      <span style="font-weight:600;color:#6b7280;flex-shrink:0;margin-left:0.75rem">${count}</span>
    </div>`;
  }).join('');
}

init();

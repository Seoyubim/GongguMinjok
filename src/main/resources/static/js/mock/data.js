window.APP_DATA = {
  categories: ["전체", "농산물", "식품", "생활용품", "음료"],

  map: {
    locationName: "학동"
  },

  groupBuys: Array.from({ length: 72 }, (_, i) => {
    const id = i + 1;

    const categories = ["농산물", "식품", "생활용품", "음료"];
    const statusList = ["recruiting", "closing", "completed"];
    const locations = [
      "광주 공원",
      "문화전당",
      "광주광역시교육청 중앙도서관",
      "CU 조대중앙점",
      "남광주농협 염주지점"
    ];
    const names = ["이지은", "박서준", "최유나", "정민호", "강하늘"];
    const badges = ["골드", "실버"];

    const category = categories[i % categories.length];
    const status = statusList[i % statusList.length];
    const pickupLocation = locations[i % locations.length];
    const hostName = names[i % names.length];
    const hostBadge = badges[i % badges.length];

    const maxParticipants = 4 + (i % 3);
    const currentParticipants =
      status === "completed"
        ? maxParticipants
        : Math.min((i % maxParticipants) + 1, maxParticipants - 1);

    const col = i % 15;
    const row = Math.floor(i / 15);

   const markerTop = 30 + row * 65;
    const markerLeft = 60 + col * 120;

    return {
      id,
      title: `${category} 공동구매 ${id}`,
      category,
      price: 10000 + (i % 8) * 3000,
      currentParticipants,
      maxParticipants,
      pickupLocation,
      pickupTimes:
        i % 2 === 0
          ? ["오늘 18:00-19:00", "내일 10:00-12:00"]
          : ["내일 08:00-09:00"],
      distance: Number((0.3 + (i % 10) * 0.2).toFixed(1)),
      status,
      hostName,
      hostRating: Number((4.1 + (i % 9) * 0.1).toFixed(1)),
      hostMannerScore: 82 + (i % 18),
      hostBadge,
      description: `${category} 상품 공동구매입니다. ${id}번 게시글 예시 데이터입니다.`,
      productLink: `https://example.com/product${id}`,
      imageUrl: `https://picsum.photos/400/300?random=${id}`,

      markerTop,
      markerLeft
    };
  }),

  currentUser: {
    name: "김민수",
    avatarText: "김",
    mannerScore: 92,
    badge: "골드",
    totalGroupBuys: 24,
    completedGroupBuys: 23,
    completionRate: 96
  },

  mypage: {
    activity: {
      ongoing: [
        { title: "제주 한라봉 5kg 공동구매", role: "진행자", createdAt: "2026-03-18" },
        { title: "코스트코 키친타올 12롤 소분", role: "참여자", createdAt: "2026-03-17" }
      ],
      completed: [
        { title: "강원도 감자 10kg 공동구매", role: "참여자", createdAt: "2026-03-15" }
      ]
    },
    mannerReviews: [
      { text: "약속 시간을 잘 지켜요", score: "+3" },
      { text: "친절하게 응대했어요", score: "+2" },
      { text: "거래 진행이 매끄러웠어요", score: "+4" }
    ],
    benefits: [
      { title: "진행자 할인 4%", desc: "현재 진행 중 공구 기준 예상 혜택" },
      { title: "골드 등급 유지", desc: "우선 참여 및 신뢰 표시" }
    ]
  }
};
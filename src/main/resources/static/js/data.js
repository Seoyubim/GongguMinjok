window.APP_DATA = {
  categories: ["전체", "농산물", "식품", "생활용품", "음료"],
  map: {
    locationName: "학동",
    markers: [
      { top: 88, left: 78, type: "green" },
      { top: 180, right: 292, type: "red" },
      { top: 180, left: 520, type: "blue" },
      { top: 24, right: 516, type: "green" }
    ]
  },
  groupBuys: [
    {
      id: 1,
      title: "제주 한라봉 5kg 공동구매",
      category: "농산물",
      price: 35000,
      currentParticipants: 4,
      maxParticipants: 5,
      pickupLocation: "광주 공원",
      pickupTimes: ["오늘 18:00-19:00", "내일 10:00-12:00"],
      distance: 0.5,
      status: "closing",
      hostName: "이지은",
      hostRating: 4.8,
      hostMannerScore: 95,
      hostBadge: "골드",
      description: "제주 직송 한라봉 5kg입니다. 산지에서 직배송으로 받아서 나눠가져요!",
      productLink: "https://example.com/product1",
      imageUrl: "https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop"
    },
    {
      id: 2,
      title: "코스트코 키친타올 12롤 소분",
      category: "생활용품",
      price: 18000,
      currentParticipants: 2,
      maxParticipants: 6,
      pickupLocation: "문화전당",
      pickupTimes: ["오늘 20:00-21:00"],
      distance: 1.2,
      status: "recruiting",
      hostName: "박서준",
      hostRating: 4.5,
      hostMannerScore: 88,
      hostBadge: "실버",
      description: "코스트코 대용량 키친타올 소분합니다. 2롤씩 나눠가져요!",
      productLink: "https://example.com/product2",
      imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=300&fit=crop"
    },
    {
      id: 3,
      title: "마켓컬리 새벽배송 같이 시켜요",
      category: "식품",
      price: 25000,
      currentParticipants: 3,
      maxParticipants: 4,
      pickupLocation: "광주광역시교육청 중앙도서관",
      pickupTimes: ["내일 08:00-09:00"],
      distance: 0.3,
      status: "recruiting",
      hostName: "최유나",
      hostRating: 4.9,
      hostMannerScore: 98,
      hostBadge: "골드",
      description: "배송비 아끼려고 같이 주문해요. 신선식품 위주로 구매 예정입니다.",
      productLink: "https://example.com/product3",
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop"
    },
    {
      id: 4,
      title: "강원도 감자 10kg 공동구매",
      category: "농산물",
      price: 28000,
      currentParticipants: 5,
      maxParticipants: 5,
      pickupLocation: "CU 조대중앙점",
      pickupTimes: ["내일 19:00-20:00"],
      distance: 2.1,
      status: "completed",
      hostName: "정민호",
      hostRating: 4.7,
      hostMannerScore: 91,
      hostBadge: "골드",
      description: "강원도 햇감자 공동구매입니다. 완료된 공구 예시입니다.",
      productLink: "https://example.com/product4",
      imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop"
    },
    {
      id: 5,
      title: "쿠팡 생수 2박스 나눠요",
      category: "음료",
      price: 16000,
      currentParticipants: 1,
      maxParticipants: 4,
      pickupLocation: "남광주농협 염주지점",
      pickupTimes: ["오늘 17:00-18:00"],
      distance: 0.8,
      status: "recruiting",
      hostName: "강하늘",
      hostRating: 4.4,
      hostMannerScore: 86,
      hostBadge: "실버",
      description: "생수 공동구매입니다. 무거워서 나눠서 가져가면 좋아요.",
      productLink: "https://example.com/product5",
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop"
    }
  ],
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
# 📦 공구의 민족 (NeighborDeal)

![Java](https://img.shields.io/badge/Java-17-orange)
![SpringBoot](https://img.shields.io/badge/SpringBoot-3.x-green)
![MySQL](https://img.shields.io/badge/MySQL-8-blue)
![AWS](https://img.shields.io/badge/AWS-EC2-yellow)
![Docker](https://img.shields.io/badge/Docker-Container-blue)

> 🏡 동네 기반 공동구매 플랫폼  
> **"혼자 말고, 같이 사자"**


---

## 🖼️ 예상 서비스 화면

<img src="./docs/images/예상서비스화면1.png" width="700"/>
<img src="./docs/images/예상서비스화면2.png" width="700"/>
<img src="./docs/images/예상서비스화면3.png" width="700"/>

---

## 📌 프로젝트 개요

- 지역 기반 공동구매 플랫폼
- 오프라인 픽업 중심 C2C 구조
- 공동구매 전 과정 자동화 시스템

---

## 🎯 핵심 가치

- 💰 생활비 절감
- 🤝 이웃 간 연결
- ⚡ 공동구매 자동화

---

## 🚀 주요 기능

### 👤 사용자 기능
- 회원가입 / 로그인 (JWT)
- 공동구매 생성 / 참여 / 취소
- 모집 인원 실시간 확인
- 픽업 시간 및 장소 선택
- 거래 후 매너 평가

---

### 🗺️ 지도 기반 서비스
- 현재 위치 기반 공동구매 조회
- 지도 마커 표시 (모집중 / 마감임박 / 완료)
- 거리 기반 필터링

---

### ⚙️ 공동구매 시스템
- 모집 → 참여 → 확정 → 픽업 → 평가 자동 흐름
- 정원 초과 방지 (트랜잭션 기반 동시성 제어)
- 참여자 수에 따른 할인 자동 반영

---

### 🔔 실시간 기능
- 공동구매 상태 알림
- Firebase 기반 푸시 알림

---

### ⭐ 신뢰도 시스템
- 매너지수 평가
- 노쇼 / 취소 이력 반영
- 점수 기반 참여 제한

---

## 🛠️ 기술 스택

### 🔹 Frontend
- HTML
- CSS
- JavaScript

### 🔹 Backend
- Java
- Spring Boot (REST API)

### 🔹 Database
- MySQL
- 트랜잭션 및 동시성 제어

### 🔹 Infra
- AWS (EC2, RDS, S3)
- Docker

### 🔹 기타
- Firebase Cloud Messaging (FCM)
- GitLab

---

## 📂 프로젝트 구조
```text
backend/
├── config/
├── controller/
├── domain/
├── dto/
├── repository/
├── service/
└── GongguMinjokApplication.java
```

## 📡 API 명세

### 👤 회원 API

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/users/signup` | 회원가입 |
| POST | `/api/users/login` | 로그인 |
| GET | `/api/users/mypage` | 마이페이지 조회 |

### 🛒 공동구매 API

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/deals` | 공동구매 목록 조회 |
| GET | `/api/deals/{id}` | 공동구매 상세 조회 |
| POST | `/api/deals` | 공동구매 생성 |
| PUT | `/api/deals/{id}` | 공동구매 수정 |
| DELETE | `/api/deals/{id}` | 공동구매 삭제 |

### 🙋 참여 API

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/deals/{id}/join` | 공동구매 참여 |
| DELETE | `/api/deals/{id}/join` | 공동구매 참여 취소 |

### ⭐ 평가 API

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/reviews` | 거래 후 매너 평가 |
| GET | `/api/users/{id}/manner` | 사용자 매너지수 조회 |

---

## 🧠 ERD

### User
- `id`
- `email`
- `password`
- `nickname`
- `manner_score`
- `location`

### Deal
- `id`
- `title`
- `description`
- `max_member`
- `current_member`
- `pickup_place`
- `pickup_time`
- `status`
- `created_by`

### Participation
- `id`
- `user_id`
- `deal_id`
- `status`
- `joined_at`

### Review
- `id`
- `from_user_id`
- `to_user_id`
- `deal_id`
- `score`
- `comment`

---

## 🔥 핵심 기술

### 1. 동시성 제어
- 공동구매 참여 시 여러 사용자가 동시에 요청해도 정원을 초과하지 않도록 처리
- 트랜잭션 기반으로 데이터 정합성 유지

### 2. 상태 관리
- 공동구매 진행 상태를 자동으로 변경
- 예시 흐름: 모집중 → 모집완료 → 픽업대기 → 거래완료

### 3. 위치 기반 서비스
- 사용자 위치를 기반으로 주변 공동구매 조회
- 지역 필터링 및 지도 시각화 기능 지원

---

## 👥 팀 구성

| 이름 | 역할 |
|------|------|
| 김민정 | Backend |
| 서유빈 | Backend |
| 김경준 | Frontend |
| 전진범 | Frontend |

---

## 📈 기대 효과

### 사회적 효과
- 1인 가구의 소비 부담 완화
- 지역 커뮤니티 활성화
- 이웃 간 신뢰 형성

### 경제적 효과
- 대량 구매를 통한 비용 절감
- 배송비 분담 가능
- 향후 수익 모델 확장 가능

### 기술적 효과
- 동시성 제어 경험 확보
- 위치 기반 서비스 구현 경험 확보
- 실서비스형 웹 플랫폼 개발 경험 확보

---

## 🔮 확장 가능성
- JWT 기반 인증 고도화
- Firebase 알림 기능 연동
- 지도 API 연동
- 공동구매 채팅 기능 추가
- 결제 기능 연동
- 관리자 페이지 확장

---

## 🏁 프로젝트 목표

> 지역 주민이 함께 구매하고, 함께 절약할 수 있는  
> 동네 기반 공동구매 플랫폼 구축

---

## ✨ 한 줄 소개

> 혼자 사기엔 많고, 같이 사면 더 좋은  
> 하이퍼로컬 공동구매 플랫폼
package com.nbang.GongguMinjok.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_buys")
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class GroupBuy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @Column(nullable = false)
    private String title;

    // 상품 출처 유형
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ProductType productType;

    // 상세 설명
    @Column(columnDefinition = "TEXT")
    private String description;

    public enum ProductType {
        COUPANG_LINK,       // 쿠팡 링크
        DIRECT_DELIVERY     // 산지직배송
    }

    @Column(nullable = false)
    private int totalPrice; // 총 구매 가격 (예: 100,000원)

    @Column(nullable = false)
    private int totalQuantity; // 총 수량 (예: 10개)

    // 보상 정책
    @Column(nullable = false)
    private int rewardPerUser; // k 값 (예: 500원)

    @Column(nullable = false)
    private int maxReward; // 최대 보상 (예: 5000원)

    @Column(nullable = false)
    private int maxParticipants;

    @Column(nullable = false)
    private int currentParticipants = 1;

    @Column(nullable = false)
    private String pickupLocation;

    @Column
    private Double lat;

    @Column
    private Double lng;

    @Column(length = 50)
    private String dongName;

    // 호스트가 지정한 픽업 가능 시간 목록
    @OneToMany(mappedBy = "groupBuy", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupBuyPickupTime> pickupTimes = new ArrayList<>();

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Category category;

    public enum Category {
        ELECTRONICS,              // 전자제품
        HOME_APPLIANCES,          // 가전제품
        FURNITURE_INTERIOR,       // 가구/인테리어
        HOME_KITCHEN,             // 생활/주방용품
        BABY_KIDS,                // 유아/아동
        WOMENS_CLOTHING,          // 여성의류
        WOMENS_ACCESSORIES,       // 여성잡화
        MENS_FASHION_ACCESSORIES, // 남성패션/잡화
        BEAUTY_PERSONAL_CARE,     // 뷰티/개인관리
        SPORTS_LEISURE,           // 스포츠/레저
        HOBBIES_GAMES_MUSIC,      // 취미/게임/음악
        BOOKS,                    // 도서
        TICKETS_VOUCHERS,         // 티켓/상품권
        E_COUPONS,                // 전자쿠폰
        PROCESSED_FOODS,          // 가공식품
        HEALTH_SUPPLEMENTS,       // 건강식품/영양제
        PET_SUPPLIES,             // 반려동물용품
        PLANTS,                   // 식물
        OTHERS                    // 기타
    }

    @OneToMany(mappedBy = "groupBuy", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupBuyImage> images = new ArrayList<>(); // 최대 5개

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status = Status.OPEN;

    @Column(nullable = false)
    private LocalDateTime deadline;

    // 결제 확정 여부
    @Column(name = "is_paid", nullable = false)
    private boolean paid = false;

    // 마감 처리 완료 여부 (스케줄러 중복 실행 방지)
    @Column(nullable = false)
    private boolean deadlineNotified = false;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column
    private LocalDateTime updatedAt;

    public enum Status {
        OPEN,              // 현재 인원을 모집 중인 상태
        CLOSING,           // 마감 24시간 전 상태
        CLOSED,            // 정원이 모두 찼으며, 현재 결제 대기 중인 상태
        PAYMENT_COMPLETED, // 모든 참여자의 결제가 완료된 상태
        PICKUP_READY,      // 호스트가 물건을 수령하여 픽업이 가능한 상태
        COMPLETED,         // 픽업이 모두 종료된 상태
        EXPIRED            // 모집 미달, 미결제, 취소 등으로 인해 만료된 상태
    }

    // --- 할인 계산 메서드 (DB 미저장) ---

    public int getUnitPrice() {
        if (totalQuantity == 0) return 0;
        return totalPrice / totalQuantity;
    }

    public int getHostDiscount() {
        double discountRate = Math.min(currentParticipants * 0.01, 0.10);
        int discount = (int) (getUnitPrice() * discountRate);
        return Math.min(discount, maxReward);
    }

    public int getHostFinalPrice() {
        return getUnitPrice() - getHostDiscount();
    }

    public int getParticipantFinalPrice() {
        int participantCount = currentParticipants - 1; // 호스트 제외
        if (participantCount <= 0) return getUnitPrice();
        return getUnitPrice() + (getHostDiscount() / participantCount);
    }
}
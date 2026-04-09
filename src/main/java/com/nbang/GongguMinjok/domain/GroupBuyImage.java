package com.nbang.GongguMinjok.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "group_buy_images")
@Getter
@Setter
@NoArgsConstructor
public class GroupBuyImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_buy_id", nullable = false)
    private GroupBuy groupBuy;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private int orderIndex; // 사진 순서 (0~4)
}
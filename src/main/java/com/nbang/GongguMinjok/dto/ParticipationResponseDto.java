package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.GroupBuyImage;
import com.nbang.GongguMinjok.domain.Participation;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
public class ParticipationResponseDto {

    private Long id;
    private Long groupBuyId;
    private String groupBuyTitle;
    private GroupBuy.Status groupBuyStatus;
    private boolean groupBuyDeleted;
    private LocalDateTime groupBuyDeletedAt;
    private String pickupLocation;
    private int currentParticipants;
    private int maxParticipants;
    private Long participantId;
    private String participantNickname;
    private boolean paymentConfirmed;
    private Integer paymentAmount;
    private LocalDateTime paymentDeadline;
    private LocalDateTime paidAt;
    private LocalDateTime pickupCompletedAt;
    private LocalDateTime joinedAt;
    private Long pickupTimeId;
    private LocalDateTime pickupTime;
    private String participantProfileImage;
    private List<String> groupBuyImages;

    public static ParticipationResponseDto from(Participation participation) {
        ParticipationResponseDto dto = new ParticipationResponseDto();
        dto.id = participation.getId();
        dto.groupBuyId = participation.getGroupBuy().getId();
        dto.groupBuyTitle = participation.getGroupBuy().getTitle();
        dto.groupBuyStatus = participation.getGroupBuy().getStatus();
        dto.groupBuyDeleted = participation.getGroupBuy().isDeleted();
        dto.groupBuyDeletedAt = participation.getGroupBuy().getDeletedAt();
        dto.pickupLocation = participation.getGroupBuy().getPickupLocation();
        dto.currentParticipants = participation.getGroupBuy().getCurrentParticipants();
        dto.maxParticipants = participation.getGroupBuy().getMaxParticipants();
        dto.participantId = participation.getParticipant().getId();
        dto.participantNickname = participation.getParticipant().getNickname();
        dto.paymentConfirmed = participation.isPaymentConfirmed();
        dto.paymentAmount = participation.getPaymentAmount();
        dto.paymentDeadline = participation.getPaymentDeadline();
        dto.paidAt = participation.getPaidAt();
        dto.pickupCompletedAt = participation.getPickupCompletedAt();
        dto.joinedAt = participation.getJoinedAt();
        if (participation.getPickupTime() != null) {
            dto.pickupTimeId = participation.getPickupTime().getId();
            dto.pickupTime = participation.getPickupTime().getPickupTime();
        }
        dto.participantProfileImage = participation.getParticipant().getProfileImage();
        dto.groupBuyImages = participation.getGroupBuy().getImages().stream()
                .sorted(Comparator.comparingInt(GroupBuyImage::getOrderIndex))
                .map(GroupBuyImage::getImageUrl)
                .collect(Collectors.toList());
        return dto;
    }
}

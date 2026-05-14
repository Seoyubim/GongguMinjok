package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.GroupBuy;
import com.nbang.GongguMinjok.domain.Participation;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ParticipationResponseDto {

    private Long id;
    private Long groupBuyId;
    private String groupBuyTitle;
    private GroupBuy.Status groupBuyStatus;
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

    public static ParticipationResponseDto from(Participation participation) {
        ParticipationResponseDto dto = new ParticipationResponseDto();
        dto.id = participation.getId();
        dto.groupBuyId = participation.getGroupBuy().getId();
        dto.groupBuyTitle = participation.getGroupBuy().getTitle();
        dto.groupBuyStatus = participation.getGroupBuy().getStatus();
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
        return dto;
    }
}

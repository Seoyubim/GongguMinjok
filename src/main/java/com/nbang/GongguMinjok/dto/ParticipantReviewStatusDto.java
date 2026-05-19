package com.nbang.GongguMinjok.dto;

import com.nbang.GongguMinjok.domain.Participation;
import com.nbang.GongguMinjok.domain.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ParticipantReviewStatusDto {

    private final Long participantId;
    private final String nickname;
    private final LocalDateTime pickupTime;
    private final boolean reviewed;

    public ParticipantReviewStatusDto(Participation participation, boolean reviewed) {
        User participant = participation.getParticipant();
        this.participantId = participant.getId();
        this.nickname = participant.getNickname();
        this.pickupTime = participation.getPickupTime() != null
                ? participation.getPickupTime().getPickupTime()
                : null;
        this.reviewed = reviewed;
    }
}

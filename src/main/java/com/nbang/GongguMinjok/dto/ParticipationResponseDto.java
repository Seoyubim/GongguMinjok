package com.nbang.GongguMinjok.dto;

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
    private Long participantId;
    private String participantNickname;
    private LocalDateTime joinedAt;

    public static ParticipationResponseDto from(Participation participation) {
        ParticipationResponseDto dto = new ParticipationResponseDto();
        dto.id = participation.getId();
        dto.groupBuyId = participation.getGroupBuy().getId();
        dto.groupBuyTitle = participation.getGroupBuy().getTitle();
        dto.participantId = participation.getParticipant().getId();
        dto.participantNickname = participation.getParticipant().getNickname();
        dto.joinedAt = participation.getJoinedAt();
        return dto;
    }
}

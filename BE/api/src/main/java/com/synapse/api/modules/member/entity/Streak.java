package com.synapse.api.modules.member.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "streaks")
public class Streak {

    @Id
    @Column(name = "member_id")
    private UUID memberId;

    @MapsId
    @OneToOne
    @JoinColumn(name = "member_id")
    private Member member;

    private int count;
}


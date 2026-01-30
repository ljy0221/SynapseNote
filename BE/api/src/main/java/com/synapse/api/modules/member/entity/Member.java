package com.synapse.api.modules.member.entity;

import com.synapse.api.util.entity.BaseEntity;
import com.synapse.api.util.generator.UuidV7Generator;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "members", indexes = {
        @Index(name = "idx_members_email", columnList = "email")
})
@Getter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseEntity {

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(
        name = "uuid-v7",
        type = UuidV7Generator.class
    )
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    @OneToOne(mappedBy = "member")
    private Streak streak;

    public void updateName(String name) {
        this.name = name;
    }
}

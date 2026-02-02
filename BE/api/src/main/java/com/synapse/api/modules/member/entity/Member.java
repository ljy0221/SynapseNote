package com.synapse.api.modules.member.entity;

import com.synapse.api.util.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UuidGenerator;

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
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean light = true;


    public void updateName(String name) {
        this.name = name;
    }
    public void updateLight(boolean isLight) { this.light = isLight; }

}

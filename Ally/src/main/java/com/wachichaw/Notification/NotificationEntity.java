package com.wachichaw.Notification;

import java.time.Instant;

import com.wachichaw.User.Entity.UserEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import lombok.Getter;

@Entity
@Getter
@Table(name = "in_app_notifications", indexes = @Index(columnList = "recipient_id, id"))
public class NotificationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private UserEntity recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    private int caseId;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private boolean seen;

    protected NotificationEntity() {}

    NotificationEntity(UserEntity recipient, NotificationType type, int caseId) {
        this.recipient = recipient;
        this.type = type;
        this.caseId = caseId;
        this.createdAt = Instant.now();
    }
}

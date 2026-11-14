package com.wachichaw.Notification;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wachichaw.Case.Entity.LegalCasesEntity;
import com.wachichaw.User.Entity.UserEntity;

@Service
public class NotificationService {
    public record Item(Long id, NotificationType type, int caseId, Instant createdAt, boolean seen) {
        Item(NotificationEntity entity) {
            this(entity.getId(), entity.getType(), entity.getCaseId(), entity.getCreatedAt(), entity.isSeen());
        }
    }

    public record Inbox(List<Item> items, boolean hasUnread) {}

    private final NotificationRepo notifications;

    public NotificationService(NotificationRepo notifications) {
        this.notifications = notifications;
    }

    public void notify(UserEntity recipient, int caseId, NotificationType type) {
        if (recipient != null) notifications.save(new NotificationEntity(recipient, type, caseId));
    }

    public void notifyOtherParticipant(LegalCasesEntity legalCase, int actorId, NotificationType type) {
        var client = legalCase.getClient();
        var lawyer = legalCase.getLawyer();
        if (client != null && client.getUserId() == actorId) notify(lawyer, legalCase.getCaseId(), type);
        else if (lawyer != null && lawyer.getUserId() == actorId) notify(client, legalCase.getCaseId(), type);
    }

    @Transactional(readOnly = true)
    public Inbox inbox(int userId) {
        var items = notifications.findTop30ByRecipientUserIdOrderByIdDesc(userId).stream().map(Item::new).toList();
        return new Inbox(items, notifications.existsByRecipientUserIdAndSeenFalse(userId));
    }

    @Transactional
    public void markReadThrough(int userId, long throughId) {
        notifications.markReadThrough(userId, throughId);
    }
}

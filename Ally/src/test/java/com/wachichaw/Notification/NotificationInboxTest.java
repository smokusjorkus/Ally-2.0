package com.wachichaw.Notification;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.wachichaw.Case.Entity.LegalCasesEntity;
import com.wachichaw.Client.Entity.ClientEntity;
import com.wachichaw.Lawyer.Entity.LawyerEntity;
import com.wachichaw.User.Entity.UserEntity;
import com.wachichaw.User.Repo.UserRepo;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class NotificationInboxTest {
    @Autowired private NotificationController controller;
    @Autowired private NotificationService notifications;
    @Autowired private UserRepo users;

    @Test void onlyTheRecipientCanReadAndMarkTheirOwnUpdates() {
        var client = saveUser(new ClientEntity());
        var lawyer = saveUser(new LawyerEntity());
        var legalCase = new LegalCasesEntity();
        legalCase.setCaseId(100);
        legalCase.setClient(client);
        legalCase.setLawyer(lawyer);

        notifications.notifyOtherParticipant(legalCase, lawyer.getUserId(), NotificationType.APPOINTMENT_PROPOSED);
        var clientInbox = controller.inbox(client).getBody();
        assertTrue(clientInbox.hasUnread());
        assertEquals(NotificationType.APPOINTMENT_PROPOSED, clientInbox.items().getFirst().type());
        assertTrue(controller.inbox(lawyer).getBody().items().isEmpty());
        assertEquals(401, assertThrows(ResponseStatusException.class, () -> controller.inbox(null)).getStatusCode().value());

        long firstId = clientInbox.items().getFirst().id();
        controller.markRead(lawyer, firstId);
        assertTrue(controller.inbox(client).getBody().hasUnread());

        notifications.notify(client, 100, NotificationType.CASE_ACCEPTED);
        controller.markRead(client, firstId);
        var refreshed = controller.inbox(client).getBody();
        assertTrue(refreshed.hasUnread());
        assertFalse(refreshed.items().getFirst().seen());
        assertTrue(refreshed.items().getLast().seen());

        controller.markRead(client, refreshed.items().getFirst().id());
        assertFalse(controller.inbox(client).getBody().hasUnread());
    }

    private <T extends UserEntity> T saveUser(T user) {
        user.setFname("Notification");
        user.setLname("Test");
        user.setEmail(UUID.randomUUID() + "@example.invalid");
        user.setPassword("test-only");
        return users.saveAndFlush(user);
    }
}

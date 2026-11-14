package com.wachichaw.Notification;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.wachichaw.User.Entity.UserEntity;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notifications;

    public NotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @GetMapping
    public ResponseEntity<NotificationService.Inbox> inbox(@AuthenticationPrincipal UserEntity actor) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(notifications.inbox(requireUser(actor)));
    }

    @PutMapping("/read-through/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@AuthenticationPrincipal UserEntity actor, @PathVariable long id) {
        notifications.markReadThrough(requireUser(actor), id);
    }

    private int requireUser(UserEntity actor) {
        if (actor == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return actor.getUserId();
    }
}

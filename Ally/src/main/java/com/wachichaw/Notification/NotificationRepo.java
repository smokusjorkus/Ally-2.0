package com.wachichaw.Notification;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepo extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findTop30ByRecipientUserIdOrderByIdDesc(int userId);

    boolean existsByRecipientUserIdAndSeenFalse(int userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update NotificationEntity n set n.seen = true where n.recipient.userId = :userId and n.id <= :throughId and n.seen = false")
    void markReadThrough(@Param("userId") int userId, @Param("throughId") long throughId);
}

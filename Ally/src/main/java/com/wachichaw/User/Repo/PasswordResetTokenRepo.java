package com.wachichaw.User.Repo;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wachichaw.User.Entity.PasswordResetToken;
import com.wachichaw.User.Entity.UserEntity;

public interface PasswordResetTokenRepo extends JpaRepository<PasswordResetToken, Long> {
    void deleteByUser(UserEntity user);

    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(
            String tokenHash,
            LocalDateTime currentTime);
}

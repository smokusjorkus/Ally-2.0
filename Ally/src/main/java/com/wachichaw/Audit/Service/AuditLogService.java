package com.wachichaw.Audit.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.wachichaw.Audit.Entity.AuditLogEntity;
import com.wachichaw.Audit.Repo.AuditLogRepo;
import com.wachichaw.User.Entity.UserEntity;
import com.wachichaw.User.Repo.UserRepo;

@Service
public class AuditLogService {

    private final AuditLogRepo auditLogRepo;
    private final UserRepo userRepo;

    public AuditLogService(AuditLogRepo auditLogRepo, UserRepo userRepo) {
        this.auditLogRepo = auditLogRepo;
        this.userRepo = userRepo;
    }

    public AuditLogEntity log(Integer actorId, String action, String moduleName, String targetType,
                              String targetId, String description, String status) {
        AuditLogEntity entry = new AuditLogEntity();
        entry.setActorId(actorId);
        entry.setAction(action);
        entry.setModuleName(moduleName);
        entry.setTargetType(targetType);
        entry.setTargetId(targetId);
        entry.setDescription(description);
        entry.setStatus(status);

        if (actorId != null) {
            Optional<UserEntity> user = userRepo.findById(actorId);
            if (user.isPresent()) {
                entry.setActorEmail(user.get().getEmail());
                entry.setActorRole(user.get().getAccountType() != null ? user.get().getAccountType().name() : null);
            }
        }

        return auditLogRepo.save(entry);
    }

    public AuditLogEntity log(UserEntity actor, String action, String moduleName, String targetType,
                              String targetId, String description, String status) {
        Integer actorId = actor != null ? actor.getUserId() : null;
        AuditLogEntity entry = log(actorId, action, moduleName, targetType, targetId, description, status);
        if (actor != null) {
            entry.setActorEmail(actor.getEmail());
            entry.setActorRole(actor.getAccountType() != null ? actor.getAccountType().name() : null);
            return auditLogRepo.save(entry);
        }
        return entry;
    }

    public List<AuditLogEntity> getRecent(String moduleName, String action, Integer actorId, int limit) {
        int boundedLimit = Math.max(1, Math.min(limit, 500));
        return auditLogRepo.findRecent(emptyToNull(moduleName), emptyToNull(action), actorId, PageRequest.of(0, boundedLimit));
    }

    private String emptyToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }
}

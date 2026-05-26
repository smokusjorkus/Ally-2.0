package com.wachichaw.Audit.Repo;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.wachichaw.Audit.Entity.AuditLogEntity;

@Repository
public interface AuditLogRepo extends JpaRepository<AuditLogEntity, Integer> {

    @Query("""
        SELECT a FROM AuditLogEntity a
        WHERE (:moduleName IS NULL OR a.moduleName = :moduleName)
          AND (:action IS NULL OR a.action = :action)
          AND (:actorId IS NULL OR a.actorId = :actorId)
        ORDER BY a.createdAt DESC
    """)
    List<AuditLogEntity> findRecent(
        @Param("moduleName") String moduleName,
        @Param("action") String action,
        @Param("actorId") Integer actorId,
        Pageable pageable
    );
}

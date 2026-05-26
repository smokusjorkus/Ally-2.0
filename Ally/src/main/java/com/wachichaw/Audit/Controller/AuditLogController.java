package com.wachichaw.Audit.Controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.wachichaw.Audit.Entity.AuditLogEntity;
import com.wachichaw.Audit.Service.AuditLogService;
import com.wachichaw.Config.JwtUtil;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final JwtUtil jwtUtil;

    public AuditLogController(AuditLogService auditLogService, JwtUtil jwtUtil) {
        this.auditLogService = auditLogService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public ResponseEntity<?> getAuditLogs(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String moduleName,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Integer actorId,
            @RequestParam(defaultValue = "200") int limit) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing authorization token");
            }

            String token = authHeader.substring(7);
            String accountType = jwtUtil.extractAccountType(token);
            if (!"ADMIN".equals(accountType) && !"LAWYER".equals(accountType)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins and lawyers can view audit logs");
            }

            List<AuditLogEntity> logs = auditLogService.getRecent(moduleName, action, actorId, limit);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to load audit logs: " + e.getMessage());
        }
    }
}

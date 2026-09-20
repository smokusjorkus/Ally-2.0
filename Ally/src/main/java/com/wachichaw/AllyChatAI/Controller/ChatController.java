package com.wachichaw.AllyChatAI.Controller;

import com.wachichaw.AllyChatAI.Service.DeepSeekChatService;
import com.wachichaw.AllyChatAI.Service.AiChatHistoryService;
import com.wachichaw.AllyRAG.*;
import com.wachichaw.Audit.Service.AuditLogService;
import com.wachichaw.Config.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private DeepSeekChatService deepSeekChatService;

    @Autowired
    private RagService ragService;

    @Value("${rag.relevance.threshold:54.0}")
    private double relevanceThreshold;

    @Autowired
    private LegalQuestionValidator validator;
    @Autowired
    private AuditLogService auditLogService;
    @Autowired
    private AiChatHistoryService aiChatHistoryService;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/prompt")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request, HttpServletRequest httpRequest) {
        ChatResponse chatResponse = new ChatResponse();
        chatResponse.setRagEnabled(request.isUseRAG());
        try {
            chatResponse.setConversationId(request.getConversationId() == null
                ? java.util.UUID.randomUUID().toString() : java.util.UUID.fromString(request.getConversationId()).toString());
            chatResponse.setRequestId(request.getRequestId() == null
                ? java.util.UUID.randomUUID().toString() : java.util.UUID.fromString(request.getRequestId()).toString());
        } catch (IllegalArgumentException invalidId) {
            chatResponse.setResponse("Unable to open this conversation. Please start a new chat.");
            return ResponseEntity.badRequest().body(chatResponse);
        }
        Integer conversationUserId = extractOptionalUserId(httpRequest);
        if (httpRequest.getHeader("Authorization") != null && conversationUserId == null) {
            chatResponse.setResponse("Your session has expired. Please sign in again to continue your saved conversation.");
            return ResponseEntity.status(401).body(chatResponse);
        }
        var priorTurns = conversationUserId == null
            ? java.util.List.<com.wachichaw.AllyChatAI.Entity.AiChatHistoryEntity>of()
            : aiChatHistoryService.getConversation(conversationUserId, chatResponse.getConversationId());
        chatResponse.setTimestamp(LocalDateTime.now().toString());

        // Anonymous chats carry bounded browser history; signed-in chats use owned database records.
        if (conversationUserId == null && request.getPreviousMessages() != null) {
            var guestTurns = new java.util.ArrayList<com.wachichaw.AllyChatAI.Entity.AiChatHistoryEntity>();
            String previousUser = null;
            int chars = 0;
            var previous = request.getPreviousMessages();
            for (var message : previous.subList(Math.max(0, previous.size() - 40), previous.size())) {
                if (message == null || message.content() == null) continue;
                chars += message.content().length();
                if (chars > 80000) break;
                if ("user".equals(message.role())) previousUser = message.content();
                else if ("assistant".equals(message.role()) && previousUser != null) {
                    var turn = new com.wachichaw.AllyChatAI.Entity.AiChatHistoryEntity();
                    turn.setUserMessage(previousUser);
                    turn.setAiResponse(message.content());
                    guestTurns.add(turn);
                    previousUser = null;
                }
            }
            priorTurns = guestTurns;
        }

        System.out.println("\n" + "=".repeat(60));
        System.out.println("📝 Received message: " + request.getMessage());
        System.out.println("🔍 RAG enabled: " + request.isUseRAG());
        
        String enhancedPrompt = request.getMessage();

        // ==========================================
        // STAGE 1: Python DeepSeek Validation
        // ==========================================
        System.out.println("🔍 Stage 1: Running Python DeepSeek validation...");
        ValidationResponse pythonValidation = priorTurns.isEmpty() ? ragService.validateQuestion(request.getMessage()) : null;
        
        if (pythonValidation != null && pythonValidation.getIsValid() != null && !pythonValidation.getIsValid()) {
            System.out.println("❌ REJECTED by DeepSeek classifier (" + pythonValidation.getMethod() + ")");
            System.out.println("   Reason: " + pythonValidation.getRejectionReason());
            System.out.println("   Confidence: " + pythonValidation.getConfidence());
            System.out.println("=".repeat(60) + "\n");
            
            // USE THE PYTHON MESSAGE DIRECTLY - DON'T OVERRIDE IT!
            chatResponse.setResponse(pythonValidation.getRejectionReason());
            chatResponse.setRelevantCases(null);
            chatResponse.setCaseCount(0);
            chatResponse.setConfidence("Rejected - DeepSeek");
            saveHistoryIfAuthenticated(httpRequest, request.getMessage(), chatResponse);
            
            return ResponseEntity.badRequest().body(chatResponse);
        }
        
        System.out.println("✅ PASSED DeepSeek validation (Stage 1)");
        if (pythonValidation != null && pythonValidation.getConfidence() != null) {
            System.out.println("   Confidence: " + String.format("%.3f", pythonValidation.getConfidence()));
        }

        // ==========================================
        // STAGE 2: Basic Java Validation
        // ==========================================
        LegalQuestionValidator.ValidationResult javaValidation = validator.validate(request.getMessage());

        if (!javaValidation.isValid()) {
            System.out.println("❌ REJECTED by Java validator: " + javaValidation.getMessage());
            System.out.println("=".repeat(60) + "\n");
            
            chatResponse.setResponse(javaValidation.getMessage());
            chatResponse.setRelevantCases(null);
            chatResponse.setCaseCount(0);
            chatResponse.setConfidence("Rejected - Length");
            saveHistoryIfAuthenticated(httpRequest, request.getMessage(), chatResponse);
            
            return ResponseEntity.badRequest().body(chatResponse);
        }

        System.out.println("✅ PASSED basic validation (Stage 2)");
        
        // ==========================================
        // Check if greeting/meta - skip RAG
        // ==========================================
        if (isGreetingOrMetaQuestion(request.getMessage())) {
            System.out.println("💬 Greeting/Meta question detected - skipping RAG");
            request.setUseRAG(false);
        }
        
        // ==========================================
        // STAGE 3: RAG Processing (if enabled)
        // ==========================================
        if (request.isUseRAG()) {
            System.out.println("🔍 RAG enabled - calling Python service...");
            
            RagSearchResponse ragResults;
            try {
                ragResults = ragService.searchRelevantCases(request.getMessage(), 3);
                if (ragResults == null || "system_error".equals(ragResults.getRejectionStage()))
                    throw new IllegalStateException();
            } catch (Exception unavailable) {
                chatResponse.setResponse("Case retrieval is unavailable. Please try again later.");
                chatResponse.setConfidence("Service unavailable");
                return ResponseEntity.status(503).body(chatResponse);
            }
            chatResponse.setLegalValidationStatus(ragResults.getLegalValidationStatus());
            chatResponse.setCanStateFinalOutcome(ragResults.isCanStateFinalOutcome());
            chatResponse.setValidationWarning(ragResults.getValidationWarning());
            List<LegalCase> cases = ragResults.getCases() == null ? List.of()
                : ragResults.getCases().stream().limit(3).toList();
            chatResponse.setRelevantCases(cases);
            chatResponse.setCaseCount(cases.size());
            chatResponse.setConfidence(cases.isEmpty() ? null : String.format("%.1f%%", cases.get(0).getScore()));
            // Never generate an inferred outcome from retrieved excerpts.
            chatResponse.setResponse(Boolean.TRUE.equals(ragResults.getRejected())
                ? ragResults.getRejectionReason()
                : cases.isEmpty() ? "No relevant cases found. Try a more specific case title or case number."
                : "Retrieved case text is shown below. Review the source decision before relying on a legal outcome.");
            saveHistoryIfAuthenticated(httpRequest, request.getMessage(), chatResponse);
            return ResponseEntity.ok(chatResponse);

        } else {
            System.out.println("ℹ️  RAG not enabled - direct to DeepSeek");
            System.out.println("=".repeat(60) + "\n");
        }
        
        System.out.println("Sending to DeepSeek...");
        String response = deepSeekChatService.sendMessage(enhancedPrompt, priorTurns);
        chatResponse.setResponse(response);
        System.out.println("Response generated (" + response.length() + " chars)");
        Integer userId = extractOptionalUserId(httpRequest);
        saveHistoryIfAuthenticated(userId, request.getMessage(), chatResponse);
        auditLogService.log(userId, "AI_QUERY", "AI", "CHAT", null,
            "Processed AI legal inquiry with RAG " + (request.isUseRAG() ? "enabled" : "disabled"), "SUCCESS");
        
        return ResponseEntity.ok(chatResponse);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getChatHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) String conversationId) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing authorization token");
            }

            int userId = Integer.parseInt(jwtUtil.extractUserId(authHeader.substring(7)));
            return ResponseEntity.ok(conversationId == null
                ? aiChatHistoryService.getRecentForUser(userId, limit)
                : aiChatHistoryService.getConversation(userId, conversationId));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Please sign in again to load your chat history.");
        }
    }

    @DeleteMapping("/history/{historyId}")
    public ResponseEntity<?> deleteChatHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable int historyId) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing authorization token");
            }

            int userId = Integer.parseInt(jwtUtil.extractUserId(authHeader.substring(7)));
            boolean deleted = aiChatHistoryService.deleteForUser(historyId, userId);

            if (!deleted) {
                return ResponseEntity.status(404).body("AI chat history entry not found");
            }

            auditLogService.log(userId, "DELETE_AI_CHAT", "AI_CHAT_HISTORY", "AI", String.valueOf(historyId),
                "Deleted AI chat history entry", "SUCCESS");
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to delete AI chat history: " + e.getMessage());
        }
    }

    private void saveHistoryIfAuthenticated(HttpServletRequest request, String userMessage, ChatResponse chatResponse) {
        saveHistoryIfAuthenticated(extractOptionalUserId(request), userMessage, chatResponse);
    }

    private void saveHistoryIfAuthenticated(Integer userId, String userMessage, ChatResponse chatResponse) {
        if (userId == null || chatResponse.getResponse() == null) {
            return;
        }

        try {
            aiChatHistoryService.save(
                userId,
                userMessage,
                chatResponse.getResponse(),
                chatResponse.isRagEnabled(),
                chatResponse.getCaseCount(),
                chatResponse.getConfidence(),
                chatResponse.getConversationId(), chatResponse.getRequestId(),
                new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(chatResponse)
            );
        } catch (Exception historyError) {
            historyError.printStackTrace();
        }
    }

    private Integer extractOptionalUserId(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return null;
            }
            return Integer.parseInt(jwtUtil.extractUserId(authHeader.substring(7)));
        } catch (Exception e) {
            return null;
        }
    }

    private boolean isGreetingOrMetaQuestion(String message) {
        if (message == null || message.trim().isEmpty()) {
            return false;
        }
        
        String lower = message.toLowerCase().trim();
        
        if (lower.length() <= 30) {
            String[] greetings = {
                "hi", "hello", "hey", "sup", 
                "good morning", "good afternoon", "good evening",
                "how are you", "what's up", "whats up"
            };
            
            for (String greeting : greetings) {
                if (lower.matches("^" + greeting + "\\s*[.!?]*$")) {
                    return true;
                }
            }
        }
        
        if (lower.contains("ally") && 
            (lower.contains("who") || lower.contains("what") || 
             lower.contains("why") || lower.contains("how"))) {
            return true;
        }
        
        if (lower.matches("(?i).*(who|what).*(you|your|this bot|this assistant).*")) {
            return true;
        }
        
        if (lower.matches("(?i).*(your|the)\\s+(name|creator|developer|team|purpose|project).*")) {
            return true;
        }
        
        if (lower.contains("capstone") || lower.contains("thesis") || 
            (lower.contains("school") && lower.contains("project"))) {
            return true;
        }
        
        return false;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "running");
        boolean ragAvailable = ragService.isRagServiceHealthy();
        health.put("ragService", ragAvailable ? "running" : "down");
        health.put("ragAvailable", ragAvailable);
        health.put("message", ragAvailable ? "RAG available" : "RAG unavailable. Case search is temporarily unavailable; AI chat can still be used.");
        health.put("relevanceThreshold", relevanceThreshold + "%");
        health.put("classifier", "DeepSeek V4 Flash");
        return ResponseEntity.ok(health);
    }

    @GetMapping("/reset")
    public ResponseEntity<String> resetChat() {
        deepSeekChatService.resetHistory();
        return ResponseEntity.ok("🔄 Chat history reset.");
    }
}

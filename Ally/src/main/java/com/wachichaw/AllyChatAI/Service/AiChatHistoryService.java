package com.wachichaw.AllyChatAI.Service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.wachichaw.AllyChatAI.Entity.AiChatHistoryEntity;
import com.wachichaw.AllyChatAI.Repo.AiChatHistoryRepo;

@Service
public class AiChatHistoryService {

    private final AiChatHistoryRepo aiChatHistoryRepo;

    public AiChatHistoryService(AiChatHistoryRepo aiChatHistoryRepo) {
        this.aiChatHistoryRepo = aiChatHistoryRepo;
    }

    public AiChatHistoryEntity save(int userId, String userMessage, String aiResponse,
                                    boolean ragEnabled, Integer caseCount, String confidence) {
        AiChatHistoryEntity history = new AiChatHistoryEntity();
        history.setUserId(userId);
        history.setUserMessage(userMessage);
        history.setAiResponse(aiResponse);
        history.setRagEnabled(ragEnabled);
        history.setCaseCount(caseCount);
        history.setConfidence(confidence);
        return aiChatHistoryRepo.save(history);
    }

    public List<AiChatHistoryEntity> getRecentForUser(int userId, int limit) {
        int boundedLimit = Math.max(1, Math.min(limit, 100));
        return aiChatHistoryRepo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, boundedLimit));
    }

    public boolean deleteForUser(int historyId, int userId) {
        return aiChatHistoryRepo.findByHistoryIdAndUserId(historyId, userId)
            .map(history -> {
                aiChatHistoryRepo.delete(history);
                return true;
            })
            .orElse(false);
    }
}

package com.wachichaw.AllyChatAI.Repo;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.wachichaw.AllyChatAI.Entity.AiChatHistoryEntity;

@Repository
public interface AiChatHistoryRepo extends JpaRepository<AiChatHistoryEntity, Integer> {
    List<AiChatHistoryEntity> findByUserIdOrderByCreatedAtDesc(int userId, Pageable pageable);
}

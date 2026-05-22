package com.wachichaw.AllyChatAI.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class GeminiChatService {

    @Value("${deepseek.api-key:}")
    private String apiKey;

    @Value("${deepseek.base-url:https://api.deepseek.com}")
    private String baseUrl;

    @Value("${deepseek.model:deepseek-chat}")
    private String model;

    private static final String SYSTEM_PROMPT =
        "You are Ally, a helpful legal AI assistant for the Philippines. " +
        "Answer strictly based on Philippine Law. " +
        "If the user asks about non-legal topics, politely steer them back to legal matters. " +
        "Keep your answers professional, concise, and helpful.";

    private final List<ObjectNode> conversationHistory = new ArrayList<>();
    private final ObjectMapper mapper = new ObjectMapper();

    public String sendMessage(String prompt) {
        try {
            if (apiKey == null || apiKey.isBlank()) {
                return "DeepSeek API key is not configured. Please set DEEPSEEK_API_KEY in the server environment.";
            }

            ObjectNode userNode = mapper.createObjectNode();
            userNode.put("role", "user");
            userNode.put("content", prompt);
            conversationHistory.add(userNode);

            ObjectNode requestBody = mapper.createObjectNode();
            requestBody.put("model", model);
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 1024);

            ArrayNode messagesNode = mapper.createArrayNode();
            ObjectNode systemNode = mapper.createObjectNode();
            systemNode.put("role", "system");
            systemNode.put("content", SYSTEM_PROMPT);
            messagesNode.add(systemNode);

            for (ObjectNode message : conversationHistory) {
                messagesNode.add(message);
            }
            requestBody.set("messages", messagesNode);

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);
            String endpointUrl = baseUrl.replaceAll("/+$", "") + "/chat/completions";

            System.out.println("Connecting to DeepSeek model: " + model);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.postForEntity(endpointUrl, entity, String.class);
            String modelResponseText = extractTextFromResponse(response.getBody());

            ObjectNode modelNode = mapper.createObjectNode();
            modelNode.put("role", "assistant");
            modelNode.put("content", modelResponseText);
            conversationHistory.add(modelNode);

            return modelResponseText;
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("DeepSeek API Error: " + e.getMessage());
            return "Error connecting to Ally AI: " + e.getMessage();
        }
    }

    private String extractTextFromResponse(String json) {
        try {
            JsonNode root = mapper.readTree(json);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                return choices.get(0).path("message").path("content").asText();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return "No response text found.";
    }

    public void resetHistory() {
        conversationHistory.clear();
        System.out.println("Chat history cleared.");
    }
}

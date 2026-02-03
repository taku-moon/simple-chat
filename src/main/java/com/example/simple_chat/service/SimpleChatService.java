package com.example.simple_chat.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;

@Service
public class SimpleChatService {
	private final ChatClient chatClient;
	private final ChatClient chatClientWithoutLogger;

	public SimpleChatService(ChatClient.Builder chatClientBuilder, Advisor[] advisors) {
		// 기본 클라이언트 (모든 Advisor 포함)
		this.chatClient = chatClientBuilder.defaultAdvisors(advisors).build();

		// 로거 제외 클라이언트 (스트림용)
		this.chatClientWithoutLogger = chatClientBuilder
			.defaultAdvisors(
				Arrays.stream(advisors)
					.filter(advisor -> !(advisor instanceof SimpleLoggerAdvisor))
					.toArray(Advisor[]::new)
			).build();
	}

	public ChatResponse call(String conversationId, Prompt prompt) {
		return buildChatClientRequestSpec(chatClient, conversationId, prompt)
			.call()
			.chatResponse();
	}

	public Flux<String> stream(String conversationId, Prompt prompt) {
		return buildChatClientRequestSpec(chatClient, conversationId, prompt)
			.stream()
			.content();
	}

	public Flux<String> streamWithoutLogger(String conversationId, Prompt prompt) {
		return buildChatClientRequestSpec(chatClientWithoutLogger, conversationId, prompt)
			.stream()
			.content();
	}

	public EmotionEvaluation callEmotionEvaluation(String conversationId, Prompt prompt) {
		return buildChatClientRequestSpec(chatClient, conversationId, prompt)
			.call()
			.entity(EmotionEvaluation.class);
	}

	private ChatClient.ChatClientRequestSpec buildChatClientRequestSpec(
		ChatClient client, String conversationId, Prompt prompt) {
		return client.prompt(prompt)
			.advisors(advisorSpec -> advisorSpec.param(ChatMemory.CONVERSATION_ID, conversationId));
	}

	public enum Emotion {
		VERY_NEGATIVE, NEGATIVE, NEUTRAL, POSITIVE, VERY_POSITIVE
	}

	public record EmotionEvaluation(Emotion emotion, List<String> reason) {
	}
}

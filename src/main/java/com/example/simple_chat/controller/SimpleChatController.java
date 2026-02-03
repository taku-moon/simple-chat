package com.example.simple_chat.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.DefaultChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.simple_chat.service.SimpleChatService;

import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/simple")
public class SimpleChatController {

	private final SimpleChatService simpleChatService;

	public SimpleChatController(SimpleChatService simpleChatService) {
		this.simpleChatService = simpleChatService;
	}

	@PostMapping(value = "/call", produces = MediaType.APPLICATION_JSON_VALUE)
	ChatResponse call(@RequestBody @Valid PromptBody promptBody) {
		Prompt.Builder promptBuilder = getPromptBuilder(promptBody);
		return this.simpleChatService.call(promptBody.conversationId, promptBuilder.build());
	}

	@PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	Flux<String> stream(@RequestBody @Valid PromptBody promptBody) {
		Prompt.Builder promptBuilder = getPromptBuilder(promptBody);
		return this.simpleChatService.streamWithoutLogger(promptBody.conversationId, promptBuilder.build());
	}

	@PostMapping(value = "/emotion", produces = MediaType.APPLICATION_JSON_VALUE)
	SimpleChatService.EmotionEvaluation callEmotionEvaluation(@RequestBody @Valid PromptBody promptBody) {
		Prompt.Builder promptBuilder = getPromptBuilder(promptBody);
		return this.simpleChatService.callEmotionEvaluation(promptBody.conversationId, promptBuilder.build());
	}

	private static Prompt.Builder getPromptBuilder(PromptBody promptBody) {
		List<Message> messages = new ArrayList<>();

		Optional.ofNullable(promptBody.systemPrompt)
			.filter(Predicate.not(String::isBlank))
			.map(systemPrompt -> SystemMessage.builder().text(systemPrompt).build())
			.ifPresent(messages::add);

		messages.add(UserMessage.builder().text(promptBody.userPrompt).build());

		Prompt.Builder promptBuilder = Prompt.builder().messages(messages);

		Optional.ofNullable(promptBody.chatOptions).ifPresent(promptBuilder::chatOptions);

		return promptBuilder;
	}

	public record PromptBody(
		@NotEmpty String conversationId,
		@Nullable String systemPrompt,
		@NotEmpty String userPrompt,
		DefaultChatOptions chatOptions
	) {
	}
}

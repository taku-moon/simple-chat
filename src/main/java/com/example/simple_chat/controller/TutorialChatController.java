package com.example.simple_chat.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/tutorial")
public class TutorialChatController {

	private final ChatClient chatClient;

	public TutorialChatController(ChatClient.Builder chatClientBuilder) {
		this.chatClient = chatClientBuilder.build();
	}

	@GetMapping("/ai")
	String generation(String userInput) {
		return this.chatClient.prompt().user(userInput).call().content();
	}

	@GetMapping(value = "/call", produces = MediaType.APPLICATION_JSON_VALUE)
	ChatResponse call(String userInput) {
		return this.chatClient.prompt().user(userInput).call().chatResponse();
	}

	@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	Flux<String> stream(String userInput) {
		return this.chatClient.prompt().user(userInput).stream().content();
	}
}

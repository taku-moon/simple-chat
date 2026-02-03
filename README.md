# Simple Chat

Spring AI를 활용한 챗봇 애플리케이션 데모 프로젝트입니다.

## 기술 스택

- Java 21
- Spring Boot 3.5.10
- Spring AI 1.1.2
- OpenAI / Ollama 모델 지원

## 주요 기능

### Tutorial Chat (`/tutorial`)

기본적인 ChatClient 사용법을 테스트할 수 있는 엔드포인트입니다.

| 엔드포인트              | 메서드 | 설명                   |
|--------------------|-----|----------------------|
| `/tutorial/ai`     | GET | String 응답            |
| `/tutorial/call`   | GET | ChatResponse JSON 응답 |
| `/tutorial/stream` | GET | SSE 스트리밍 응답          |

### Simple Chat (`/simple`)

고급 기능이 포함된 ChatClient를 테스트할 수 있는 엔드포인트입니다.

| 엔드포인트             | 메서드  | 설명                        |
|-------------------|------|---------------------------|
| `/simple/call`    | POST | ChatResponse JSON 응답      |
| `/simple/stream`  | POST | SSE 스트리밍 응답               |
| `/simple/emotion` | POST | 감정 분석 (Structured Output) |

**Simple Chat 특징:**

- 대화 기록 관리 (ChatMemory)
- System Prompt 설정
- ChatOptions 커스터마이징
- Structured Output

## 프로젝트 구조

```
src/main/
├── java/com/example/simple_chat/
│   ├── SimpleChatApplication.java
│   ├── config/
│   │   └── SimpleChatConfig.java
│   ├── controller/
│   │   ├── TutorialChatController.java
│   │   └── SimpleChatController.java
│   └── service/
│       └── SimpleChatService.java
└── resources/
    ├── application.yml
    └── static/                    # SPA 프론트엔드
        ├── index.html
        ├── css/
        │   └── app.css
        └── js/
            ├── app.js
            ├── router.js
            ├── utils.js
            └── views/
                ├── home.js
                ├── tutorial.js
                └── simple.js
```

## 실행 방법

### 0. 사전 요구사항: Ollama

이 프로젝트는 기본적으로 Ollama 의존성을 포함하고 있습니다. **로컬에 Ollama가 설치되어 있지 않으면 애플리케이션이 실행되지 않습니다.**

**옵션 1: Ollama 설치**

[Ollama 공식 사이트](https://ollama.com)에서 Ollama를 설치합니다.

**옵션 2: Ollama 의존성 비활성화**

Ollama를 사용하지 않는 경우 `build.gradle`에서 Ollama 의존성을 주석 처리합니다:

```gradle
dependencies {
    // ...
    // implementation 'org.springframework.ai:spring-ai-starter-model-ollama'
    implementation 'org.springframework.ai:spring-ai-starter-model-openai'
    // ...
}
```

### 1. 환경 변수 설정

GitHub Models API를 사용하는 경우:

```bash
export GITHUB_TOKEN=your_github_token
```

### 2. 애플리케이션 실행

```bash
./gradlew bootRun
```

### 3. 브라우저에서 접속

```
http://localhost:8080
```

## API 사용 예시

### Tutorial Chat

```bash
# String 응답
curl "http://localhost:8080/tutorial/ai?userInput=안녕하세요"

# JSON 응답
curl "http://localhost:8080/tutorial/call?userInput=안녕하세요"

# SSE 스트리밍
curl "http://localhost:8080/tutorial/stream?userInput=안녕하세요"
```

### Simple Chat

```bash
# JSON 응답
curl -X POST http://localhost:8080/simple/call \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-001",
    "userPrompt": "안녕하세요",
    "systemPrompt": "당신은 친절한 AI 어시스턴트입니다."
  }'

# 감정 분석
curl -X POST http://localhost:8080/simple/emotion \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-001",
    "userPrompt": "오늘 정말 기분이 좋아요!"
  }'
```

## 설정

`application.yml`에서 AI 모델 설정을 변경할 수 있습니다.

```yaml
spring:
  ai:
    model:
      chat: openai  # openai 또는 ollama

    openai:
      api-key: ${GITHUB_TOKEN}
      chat:
        base-url: https://models.github.ai/inference
        options:
          model: openai/gpt-4.1-nano

    ollama:
      chat:
        options:
          model: hf.co/rippertnt/HyperCLOVAX-SEED-Text-Instruct-1.5B-Q4_K_M-GGUF
```

### CLI 모드

`application.yml`에서 `spring.application.cli`를 `true`로 설정하면 콘솔에서 스트리밍 방식으로 채팅할 수 있습니다.

```yaml
spring:
  application:
    cli: true

logging:
  level:
    org.springframework.ai.chat.client.advisor: INFO
```

> **Note**: CLI 모드에서는 `advisor` 로깅 레벨을 `INFO`로 변경해야 콘솔 출력이 깔끔합니다. `DEBUG`로 설정하면 상세 로그가 함께 출력됩니다.

실행 후 콘솔에서 직접 메시지를 입력하고 AI 응답을 실시간으로 확인할 수 있습니다.

## 프론트엔드

Hash 기반 SPA(Single Page Application) 구조로 구현되어 있습니다.

| 라우트          | 설명                |
|--------------|-------------------|
| `#/`         | 홈 페이지             |
| `#/tutorial` | Tutorial Chat 테스트 |
| `#/simple`   | Simple Chat 테스트   |

## 기술적 포인트: 스트리밍과 SimpleLoggerAdvisor

### 문제

`SimpleLoggerAdvisor`가 활성화된 상태에서 스트리밍 방식으로 호출하면, 응답이 실시간으로 출력되지 않고 전체 응답이 완료된 후에 한꺼번에 출력됩니다. 이는 `SimpleLoggerAdvisor`가
로깅을 위해 전체 응답을 버퍼링하기 때문입니다.

### 해결 방법

**1. CLI 모드**

콘솔에서 실시간 스트리밍 출력을 위해 코드 레벨에서 `SimpleLoggerAdvisor`의 콘솔 Appender를 명시적으로 분리(detach)했습니다.

```
LoggerContext context = (LoggerContext)LoggerFactory.getILoggerFactory();
context.getLogger("ROOT").detachAppender("CONSOLE");
```

**2. Simple Chat**

`SimpleChatService`에서 로거를 제외한 별도의 스트림 전용 `ChatClient`를 생성하여 사용합니다.

```
// 기본 클라이언트 (모든 Advisor 포함)
this.chatClient =chatClientBuilder.defaultAdvisors(advisors).build();

// 로거 제외 클라이언트 (스트림용)
this.chatClientWithoutLogger =chatClientBuilder
    .defaultAdvisors(
	    Arrays.stream(advisors)
            .filter(advisor ->!(advisor instanceof SimpleLoggerAdvisor))
	.toArray(Advisor[]::new)
    ).build();
```

이를 통해 스트리밍 호출 시 실시간 출력이 가능하면서도, 일반 호출에서는 로깅 기능을 유지할 수 있습니다.

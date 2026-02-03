# Spring AI Advisor

## 개요

Spring AI의 Advisor는 ChatClient 파이프라인에서 요청과 응답을 가로채어 부가 기능을 제공하는 컴포넌트입니다. AOP(Aspect-Oriented Programming)와 유사한 방식으로
동작하며, 여러 Advisor를 체인으로 연결하여 복합적인 기능을 구현할 수 있습니다.

---

## 1. SimpleLoggerAdvisor

### 목적

ChatClient 호출의 전후 흐름을 로깅하여 프롬프트 생성, 모델 호출, 응답 수신 등 한 번의 대화 요청이 어떻게 처리되는지 관찰할 수 있습니다.

### 동작 위치

- Spring AI의 ChatClient 파이프라인에 끼어드는 인터셉터 역할
- 요청을 모델로 보내기 직전과 응답을 받은 직후에 로그 기록

### 설정 예시

```
@Bean
public SimpleLoggerAdvisor simpleLoggerAdvisor() {
	return SimpleLoggerAdvisor.builder().build();
}
```

### 학습 포인트

- **스트리밍 흐름 확인**: 스트리밍 응답 시 토큰이 순차적으로 전달되는 과정 추적 가능
- **파라미터 검증**: 모델명, temperature 등 호출 파라미터와 Prompt 구성 내용 확인
- **디버깅 도구**: 개발 단계에서 요청/응답 흐름을 파악하는 데 유용

### 주의 사항

- **보안 고려사항**
    - 프롬프트에 개인정보, 인증 토큰, 내부 문서가 포함될 수 있음
    - 실서비스 환경에서는 로깅 수준 조정 및 민감 정보 마스킹 필수
- **성능 영향**
    - 과도한 로깅은 디스크 I/O 부담 증가
    - 로그 관측 노이즈 발생 가능
- **비용 관리**
    - 로그 저장 및 분석 비용 고려 필요

---

## 2. ChatMemory

### 목적

대화 문맥(context)을 유지하기 위한 저장소로, 사용자가 이어서 질문할 때 이전 메시지들을 함께 제공하여 LLM이 맥락을 이해하도록 합니다.

### 왜 필요한가?

- **상태 비저장 특성**: LLM은 기본적으로 상태를 기억하지 않음
- **문맥 유지**: 이전 대화 내용을 매 요청마다 프롬프트로 재주입해야 대화가 이어짐
- **책임 분리**: 메시지 저장과 관리를 추상화하여 비즈니스 로직과 분리

### 구현체: MessageWindowChatMemory

#### 특징

- 최근 N개의 메시지만 유지하는 **슬라이딩 윈도우** 방식
- 설정된 maxMessages를 초과하면 오래된 메시지부터 자동 삭제

#### 설정 예시

```
@Bean
public ChatMemory chatMemory() {
	return MessageWindowChatMemory.builder()
		.maxMessages(10)  // 최근 10개 메시지만 유지
		.build();
}
```

### 메시지 범위

#### 저장 대상

- **User 메시지**: 사용자가 입력한 질문/명령
- **Assistant 메시지**: 모델이 생성한 응답

#### 저장하지 않는 대상

- **SystemMessage**:
    - "항상 들어가야 하는 지침" 성격
    - 매 요청마다 별도로 고정 주입하거나 다른 방식으로 관리
    - 메모리에 저장하면 윈도우 공간을 낭비하게 됨

### 대화 식별자(Conversation ID)

#### 개념

```java
// 예시: "cli"라는 ID로 대화 세션 구분
simpleChatService.stream("cli",userMessage);
```

#### 동작 방식

- **같은 ID**: 동일한 대화 메모리 공유 → 문맥 유지
- **다른 ID**: 별도의 대화로 분리 → 독립적인 문맥

#### 설계 고려사항

- 사용자별 고유 ID 할당 (예: userId, sessionId)
- 동시 다중 대화 지원 시 대화방별 ID 분리
- ID 충돌 방지 전략 수립

### 윈도우 크기 조정 가이드

| maxMessages | 장점           | 단점           | 권장 사용 케이스     |
|-------------|--------------|--------------|---------------|
| 5-10개       | 빠른 응답, 낮은 비용 | 문맥 빠르게 소실    | 단순 Q&A, 짧은 대화 |
| 20-30개      | 충분한 문맥 유지    | 토큰 증가, 비용 상승 | 일반적인 대화형 서비스  |
| 50개 이상      | 긴 대화 전체 기억   | 높은 비용, 응답 지연 | 장문 분석, 복잡한 작업 |

### 주의 사항

- **문맥 손실**: 윈도우가 작으면 이전 내용을 "잊어버린 것처럼" 동작
- **비용 증가**: 윈도우가 크면 매 요청마다 전송되는 토큰 수 증가
- **학습 권장사항**: 10-20 정도로 시작하여 문맥 유지와 비용 간 트레이드오프 체감

---

## 3. MessageChatMemoryAdvisor

### 목적

ChatClient 호출 시 ChatMemory를 이용해 대화 내역을 프롬프트에 자동 주입하고, 모델 응답을 다시 ChatMemory에 저장하는 역할을 수행합니다.

### 동작 흐름

#### 1단계: 요청 전처리 (Before Request)

```
[사용자 메시지] 
    ↓
[ChatMemory에서 과거 메시지 조회]
    ↓
[과거 메시지 + 현재 메시지 = 문맥 포함 프롬프트]
```

#### 2단계: 모델 호출 (Request Execution)

```
[문맥 포함 프롬프트] → [LLM 모델] → [응답 생성]
```

#### 3단계: 응답 후처리 (After Response)

```
[사용자 메시지 + 모델 응답]
    ↓
[ChatMemory에 저장]
    ↓
[다음 요청 시 문맥으로 활용]
```

### 설정 예시

```
@Bean
public MessageChatMemoryAdvisor messageChatMemoryAdvisor(ChatMemory chatMemory) {
	return MessageChatMemoryAdvisor.builder(chatMemory)
		.build();
}
```

### 학습 포인트

- **자동화**: 수동으로 대화 내역을 관리할 필요 없이 자동으로 문맥 유지
- **투명성**: Advisor 체인을 통해 메모리 주입 시점과 저장 시점을 명확히 파악
- **확장성**: 다른 Advisor와 조합하여 로깅, 필터링 등 복합 기능 구현 가능

### 주의 사항

#### 스트리밍 응답 처리

- **문제점**: 응답 완성 전 토큰 단위로 저장하면 불완전한 문장이 메모리에 저장됨
- **해결책**: 스트림 완료 후 최종 응답을 한 번에 저장하는 방식 권장

#### Advisor 실행 순서

```
// 순서 예시
@Bean
public SimpleLoggerAdvisor simpleLoggerAdvisor() {
	return SimpleLoggerAdvisor.builder()
		.order(0)  // 먼저 실행
		.build();
}

@Bean
public MessageChatMemoryAdvisor messageChatMemoryAdvisor(ChatMemory chatMemory) {
	return MessageChatMemoryAdvisor.builder(chatMemory)
		.order(100)  // 나중에 실행
		.build();
}
```

**실행 순서 영향**:

- **로깅 먼저**: 메모리 주입 전 원본 프롬프트 로깅
- **메모리 먼저**: 문맥 포함된 최종 프롬프트 로깅

#### 멀티 사용자/세션 환경

- **문제 상황**: 동일 ID 공유 시 대화 내용 혼선
- **해결 방안**:

```java
  // 사용자별 ID 생성
String conversationId = "user-" + userId + "-" + sessionId;
  chatService.

stream(conversationId, message);
```

---

## Advisor 체인 설계 가이드

### 실행 순서(Order) 이해

#### 기본 원칙

- **낮은 값 → 먼저 실행**: order=0이 order=100보다 먼저 실행됨
- **요청 전처리**: order가 작은 순서대로 실행
- **응답 후처리**: order가 큰 순서대로 역순 실행 (양파 껍질 패턴)

#### 권장 순서

```
1. 로깅/모니터링 (order=0)
2. 보안/인증 (order=50)
3. 메모리 주입 (order=100)
4. 커스텀 비즈니스 로직 (order=200)
```

### 조합 예시

```java

@Configuration
public class AdvisorConfig {

	@Bean
	public SimpleLoggerAdvisor simpleLoggerAdvisor() {
		return SimpleLoggerAdvisor.builder()
			.order(0)
			.build();
	}

	@Bean
	public ChatMemory chatMemory() {
		return MessageWindowChatMemory.builder()
			.maxMessages(20)
			.build();
	}

	@Bean
	public MessageChatMemoryAdvisor messageChatMemoryAdvisor(ChatMemory chatMemory) {
		return MessageChatMemoryAdvisor.builder(chatMemory)
			.order(100)
			.build();
	}
}
```

// Home View

export const homeView = {
    render() {
        return `
<div class="wrap">
    <header class="main-header">
        <div class="header-content">
            <div class="logo-section">
                <div class="logo">🤖</div>
                <div>
                    <h1>Spring AI Chat</h1>
                    <p class="tagline">통합 테스트 환경</p>
                </div>
            </div>
            <div class="version-badge">v1.0</div>
        </div>
    </header>

    <div class="cards-grid">
        <!-- Tutorial Card -->
        <div class="feature-card">
            <div class="card-header">
                <div class="card-icon">📚</div>
                <div class="card-badge tutorial">Tutorial</div>
            </div>
            <h3 class="card-title">Tutorial Chat</h3>
            <p class="card-description">
                기본 ChatClient 구현을 테스트합니다. 간단한 GET 요청으로 AI 응답을 받아볼 수 있습니다.
            </p>
            <div class="card-features">
                <div class="feature-item">
                    <span class="feature-icon disabled">✗</span>
                    <span>대화 기록 관리</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>String 응답</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>ChatResponse JSON 응답</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>SSE 스트리밍 응답</span>
                </div>
            </div>
            <a href="#/tutorial" class="card-button btn-tutorial">
                <span>시작하기</span>
                <span class="arrow">→</span>
            </a>
        </div>

        <!-- Simple Chat Card -->
        <div class="feature-card">
            <div class="card-header">
                <div class="card-icon">💬</div>
                <div class="card-badge simple">Advanced</div>
            </div>
            <h3 class="card-title">Simple Chat</h3>
            <p class="card-description">
                고급 기능이 포함된 ChatClient를 테스트합니다. 대화 기록 관리와 감정 분석 기능을 제공합니다.
            </p>
            <div class="card-features">
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>대화 기록 관리</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>System Prompt 설정</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>ChatOptions 커스터마이징</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">✓</span>
                    <span>감정 분석 - Structured Output</span>
                </div>
            </div>
            <a href="#/simple" class="card-button btn-simple">
                <span>시작하기</span>
                <span class="arrow">→</span>
            </a>
        </div>
    </div>

    <footer>
        <div class="footer-content">
            <p>🚀 Spring AI ChatClient 테스트 환경</p>
            <p class="footer-links">
                <a href="https://docs.spring.io/spring-ai/reference/" target="_blank">Spring AI Docs</a>
                <span class="separator">|</span>
                <a href="https://github.com/spring-projects/spring-ai" target="_blank">GitHub</a>
            </p>
        </div>
    </footer>
</div>
        `;
    },

    mount() {
        console.log("✅ Home View 초기화 완료");
    },

    unmount() {
        // Nothing to clean up
    }
};

// Tutorial View

import {$, qs, setOutputError, setOutputLoading, setOutputSuccess, setStreamStatus} from '../utils.js';

let es = null;

function stopStream() {
    if (es) {
        es.close();
        es = null;
    }
    setStreamStatus(false);
}

function getUserInput() {
    const el = $("userInput");
    return el ? el.value || "" : "";
}

async function callAi() {
    stopStream();
    setOutputLoading("outAi", "✨ /tutorial/ai 호출 중...");

    const url = `/tutorial/ai?${qs({userInput: getUserInput()})}`;

    try {
        const res = await fetch(url, {method: "GET"});
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const text = await res.text();
        setOutputSuccess("outAi", text || "(응답이 비어있습니다)");
    } catch (e) {
        setOutputError("outAi", e.message);
    }
}

async function callCall() {
    stopStream();
    setOutputLoading("outCall", "✨ /tutorial/call 호출 중...");

    const url = `/tutorial/call?${qs({userInput: getUserInput()})}`;

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {"Accept": "application/json"}
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        const formatted = JSON.stringify(json, null, 2);
        setOutputSuccess("outCall", formatted);
    } catch (e) {
        setOutputError("outCall", e.message);
    }
}

function startStream() {
    stopStream();
    setOutputLoading("outStream", "🔄 Stream 연결 중...");

    const url = `/tutorial/stream?${qs({userInput: getUserInput()})}`;

    try {
        es = new EventSource(url);
    } catch (e) {
        setOutputError("outStream", e.message);
        setStreamStatus(false);
        return;
    }

    setStreamStatus(true);

    let isFirstMessage = true;

    es.onopen = () => {
        setOutputSuccess("outStream", "");
    };

    es.onmessage = (evt) => {
        const outEl = $("outStream");

        if (isFirstMessage) {
            outEl.textContent = "";
            isFirstMessage = false;
        }

        outEl.textContent += evt.data;
        outEl.scrollTop = outEl.scrollHeight;
    };

    es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
            const outEl = $("outStream");
            if (outEl.textContent.trim() === "") {
                setOutputError("outStream", "연결이 종료되었습니다 (응답 없음)");
            }
        }
        stopStream();
    };
}

function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        callAi();
    }
}

export const tutorialView = {
    render() {
        return `
<div class="wrap">
    <header>
        <div class="header-content">
            <div class="title-group">
                <a href="#/" class="back-link">← 홈</a>
                <div class="icon">📚</div>
                <div>
                    <h1>Tutorial Chat 테스트</h1>
                    <p class="subtitle">기본 ChatClient 엔드포인트</p>
                </div>
            </div>
            <div class="endpoint-badges">
                <span class="badge badge-tutorial">/tutorial/ai</span>
                <span class="badge badge-tutorial">/tutorial/call</span>
                <span class="badge badge-tutorial">/tutorial/stream</span>
            </div>
        </div>
    </header>

    <div class="grid tutorial-grid">
        <!-- 입력 패널 -->
        <div class="card input-panel">
            <h2 class="card-title">
                <span class="emoji">⚙️</span>
                메시지 입력
            </h2>

            <div class="form-group">
                <label for="userInput">메시지</label>
                <textarea id="userInput" placeholder="AI에게 질문할 내용을 입력하세요...&#10;예: 너는 누구야?"></textarea>
            </div>

            <div class="actions">
                <h3 class="actions-title">API 호출</h3>
                <div class="button-grid tutorial-button-grid">
                    <button id="btnAi" class="btn btn-primary">
                        <span class="btn-icon">📝</span>
                        <div>
                            <div class="btn-label">/tutorial/ai</div>
                            <div class="btn-desc">문자열 응답</div>
                        </div>
                    </button>
                    <button id="btnCall" class="btn btn-secondary">
                        <span class="btn-icon">📦</span>
                        <div>
                            <div class="btn-label">/tutorial/call</div>
                            <div class="btn-desc">JSON 응답</div>
                        </div>
                    </button>
                    <button id="btnStreamStart" class="btn btn-accent">
                        <span class="btn-icon">▶️</span>
                        <div>
                            <div class="btn-label">/tutorial/stream</div>
                            <div class="btn-desc">SSE 스트리밍 연결</div>
                        </div>
                    </button>
                    <button id="btnStreamStop" class="btn btn-danger" disabled>
                        <span class="btn-icon">⏹️</span>
                        <div>
                            <div class="btn-label">스트림 중지</div>
                            <div class="btn-desc">연결 종료</div>
                        </div>
                    </button>
                </div>
                <div class="status-bar">
                    <span id="streamStatus" class="status disconnected">
                        <span class="status-dot"></span>
                        Stream: Disconnected
                    </span>
                </div>
            </div>
        </div>

        <!-- 결과 패널 -->
        <div class="card results-panel">
            <h2 class="card-title">
                <span class="emoji">📊</span>
                응답 결과
            </h2>

            <div class="result-section">
                <div class="result-header">
                    <label>/tutorial/ai 결과</label>
                    <span class="format-badge">String</span>
                </div>
                <pre id="outAi" class="output-box empty">대기 중...</pre>
            </div>

            <div class="result-section">
                <div class="result-header">
                    <label>/tutorial/call 결과</label>
                    <span class="format-badge">JSON</span>
                </div>
                <pre id="outCall" class="output-box mono empty">대기 중...</pre>
            </div>

            <div class="result-section">
                <div class="result-header">
                    <label>/tutorial/stream 결과</label>
                    <span class="format-badge">SSE</span>
                </div>
                <pre id="outStream" class="output-box stream empty">대기 중...</pre>
            </div>
        </div>
    </div>

    <footer>
        <div class="footer-content">
            <p>💡 Tip: Stream 연결 시 토큰이 실시간으로 표시됩니다</p>
            <p>📌 Ctrl(또는 Cmd)+Enter로 빠르게 호출할 수 있습니다</p>
        </div>
    </footer>
</div>
        `;
    },

    mount() {
        $("btnAi")?.addEventListener("click", callAi);
        $("btnCall")?.addEventListener("click", callCall);
        $("btnStreamStart")?.addEventListener("click", startStream);
        $("btnStreamStop")?.addEventListener("click", stopStream);
        $("userInput")?.addEventListener("keydown", handleKeydown);

        setStreamStatus(false);
        console.log("✅ Tutorial Chat 테스트 화면 초기화 완료");
    },

    unmount() {
        stopStream();
        $("btnAi")?.removeEventListener("click", callAi);
        $("btnCall")?.removeEventListener("click", callCall);
        $("btnStreamStart")?.removeEventListener("click", startStream);
        $("btnStreamStop")?.removeEventListener("click", stopStream);
        $("userInput")?.removeEventListener("keydown", handleKeydown);
    }
};

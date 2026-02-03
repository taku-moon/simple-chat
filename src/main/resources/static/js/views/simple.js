// Simple View

import {$, copyToClipboard, setOutputError, setOutputLoading, setOutputSuccess, setStreamStatus} from '../utils.js';

let es = null;

function stopStream() {
    if (es) {
        es.close();
        es = null;
    }
    setStreamStatus(false);
}

function buildRequestBody() {
    const conversationId = $("conversationId")?.value.trim() || "";
    const systemPrompt = $("systemPrompt")?.value.trim() || "";
    const userPrompt = $("userPrompt")?.value.trim() || "";

    if (!conversationId) {
        throw new Error("Conversation ID는 필수입니다");
    }

    if (!userPrompt) {
        throw new Error("User Prompt는 필수입니다");
    }

    const body = {
        conversationId,
        userPrompt
    };

    if (systemPrompt) {
        body.systemPrompt = systemPrompt;
    }

    const chatOptions = buildChatOptions();
    if (chatOptions && Object.keys(chatOptions).length > 0) {
        body.chatOptions = chatOptions;
    }

    return body;
}

function buildChatOptions() {
    const options = {};
    const model = $("model")?.value || "";

    if (model && model !== "") {
        options.model = model;
    }

    return options;
}

async function callApi() {
    stopStream();
    setOutputLoading("outCall", "✨ /simple/call 호출 중...");

    try {
        const requestBody = buildRequestBody();
        const url = `/simple/call`;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
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

    try {
        const requestBody = buildRequestBody();
        const url = `/simple/stream`;

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream"
            },
            body: JSON.stringify(requestBody)
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            setStreamStatus(true);
            setOutputSuccess("outStream", "");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = "";

            function flushSseLines(text) {
                const outEl = $("outStream");
                const lines = text.split("\n");

                for (const line of lines) {
                    const trimmed = line.replace(/\r$/, "");

                    if (trimmed === "") continue;

                    if (trimmed.startsWith("data:")) {
                        outEl.textContent += trimmed.slice(5).replace(/^ /, "");
                        outEl.scrollTop = outEl.scrollHeight;
                    }
                }
            }

            function read() {
                reader.read().then(({done, value}) => {
                    if (done) {
                        const outEl = $("outStream");
                        if (outEl.textContent.trim() === "") {
                            setOutputError("outStream", "연결이 종료되었습니다 (응답 없음)");
                        }
                        stopStream();
                        return;
                    }

                    buffer += decoder.decode(value, {stream: true});

                    const lastNewline = buffer.lastIndexOf("\n");
                    if (lastNewline !== -1) {
                        const chunkToProcess = buffer.slice(0, lastNewline + 1);
                        buffer = buffer.slice(lastNewline + 1);
                        flushSseLines(chunkToProcess);
                    }

                    read();
                }).catch(err => {
                    setOutputError("outStream", err.message);
                    stopStream();
                });
            }

            read();
        }).catch(err => {
            setOutputError("outStream", err.message);
            stopStream();
        });
    } catch (e) {
        setOutputError("outStream", e.message);
        setStreamStatus(false);
    }
}

async function callEmotion() {
    stopStream();
    setOutputLoading("outEmotion", "🎭 감정 분석 중...");
    $("emotionVisual")?.classList.add("hidden");

    try {
        const requestBody = buildRequestBody();
        const url = `/simple/emotion`;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
        }

        const json = await res.json();
        const formatted = JSON.stringify(json, null, 2);
        setOutputSuccess("outEmotion", formatted);

        updateEmotionVisualization(json);
    } catch (e) {
        setOutputError("outEmotion", e.message);
    }
}

function updateEmotionVisualization(emotionData) {
    const visualEl = $("emotionVisual");
    if (!visualEl) return;
    visualEl.classList.remove("hidden");

    let emotion = emotionData.emotion || "NEUTRAL";
    let reasons = emotionData.reason || [];

    const emotionScores = {
        "VERY_NEGATIVE": 0,
        "NEGATIVE": 25,
        "NEUTRAL": 50,
        "POSITIVE": 75,
        "VERY_POSITIVE": 100
    };

    const score = emotionScores[emotion] || 50;

    const meterFill = $("emotionMeterFill");
    const meterValue = $("emotionMeterValue");
    if (meterFill) meterFill.style.width = `${score}%`;
    if (meterValue) meterValue.textContent = emotion;

    const emotionPrimary = $("emotionPrimary");
    const emotionSecondary = $("emotionSecondary");
    if (emotionPrimary) emotionPrimary.textContent = emotion;
    if (emotionSecondary) emotionSecondary.textContent = reasons.join(", ") || "-";
}

function handleCopyCall() {
    const text = $("outCall")?.textContent || "";
    if (text && !text.includes("대기 중")) {
        copyToClipboard(text);
    }
}

function handleCopyStream() {
    const text = $("outStream")?.textContent || "";
    if (text && !text.includes("대기 중")) {
        copyToClipboard(text);
    }
}

function handleCopyEmotion() {
    const text = $("outEmotion")?.textContent || "";
    if (text && !text.includes("대기 중")) {
        copyToClipboard(text);
    }
}

function handleOptionsToggle() {
    const toggle = $("optionsToggle");
    const content = $("optionsContent");
    toggle?.classList.toggle("active");
    content?.classList.toggle("active");
}

function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        callApi();
    }
}

export const simpleView = {
    render() {
        return `
<div class="wrap">
    <header>
        <div class="header-content">
            <div class="title-group">
                <a href="#/" class="back-link">← 홈</a>
                <div class="icon">💬</div>
                <div>
                    <h1>Simple Chat 테스트</h1>
                    <p class="subtitle">대화 기록 관리 및 감정 분석</p>
                </div>
            </div>
            <div class="endpoint-badges">
                <span class="badge badge-blue">/simple/call</span>
                <span class="badge badge-purple">/simple/stream</span>
                <span class="badge badge-pink">/simple/emotion</span>
            </div>
        </div>
    </header>

    <div class="grid simple-grid">
        <div class="card input-panel">
            <h2 class="card-title">
                <span class="emoji">⚙️</span>
                메시지 입력 및 설정
            </h2>

            <div class="form-group">
                <label for="conversationId">
                    Conversation ID
                    <span class="required">*</span>
                </label>
                <input id="conversationId" type="text" placeholder="예: conv-001" value="conv-001"/>
                <div class="help-text">대화를 구분하는 고유 ID</div>
            </div>

            <div class="form-group">
                <label for="systemPrompt">System Prompt</label>
                <textarea id="systemPrompt" rows="3" placeholder="예: 당신은 친절한 AI 어시스턴트입니다."></textarea>
                <div class="help-text">선택사항 · AI의 역할과 행동을 정의</div>
            </div>

            <div class="form-group">
                <label for="userPrompt">
                    User Prompt
                    <span class="required">*</span>
                </label>
                <textarea id="userPrompt" rows="4" placeholder="사용자 메시지를 입력하세요..."></textarea>
            </div>

            <div class="collapsible">
                <button class="collapsible-toggle" id="optionsToggle">
                    <span class="toggle-icon">▶</span>
                    <span>고급 옵션 (Model)</span>
                </button>

                <div class="collapsible-content" id="optionsContent">
                    <div class="form-group">
                        <label for="model">Model</label>
                        <select id="model">
                            <option value="">기본 모델 사용</option>

                            <optgroup label="GPT-4o">
                                <option value="openai/gpt-4o">GPT-4o</option>
                                <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                            </optgroup>

                            <optgroup label="GPT-4.1">
                                <option value="openai/gpt-4.1">4.1</option>
                                <option value="openai/gpt-4.1-mini">4.1 mini</option>
                                <option value="openai/gpt-4.1-nano">4.1 nano</option>
                            </optgroup>
                        </select>

                        <div class="help-text">
                            서버에서 허용한 모델만 선택 가능
                        </div>
                    </div>
                </div>
            </div>


            <div class="actions">
                <h3 class="actions-title">API 호출</h3>
                <div class="button-grid simple-button-grid">
                    <button id="btnCall" class="btn btn-primary">
                        <span class="btn-icon">📦</span>
                        <div>
                            <div class="btn-label">/simple/call</div>
                            <div class="btn-desc">JSON 응답</div>
                        </div>
                    </button>
                    <button id="btnStreamStart" class="btn btn-accent">
                        <span class="btn-icon">▶️</span>
                        <div>
                            <div class="btn-label">/simple/stream</div>
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
                    <button id="btnEmotion" class="btn btn-special">
                        <span class="btn-icon">🎭</span>
                        <div>
                            <div class="btn-label">/simple/emotion</div>
                            <div class="btn-desc">감정 분석</div>
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

        <div class="card results-panel">
            <h2 class="card-title">
                <span class="emoji">📊</span>
                응답 결과
            </h2>

            <div class="result-section">
                <div class="result-header">
                    <label>/simple/call 결과</label>
                    <div class="header-actions">
                        <span class="format-badge">JSON</span>
                        <button class="icon-btn" id="btnCopyCall" title="복사">📋</button>
                    </div>
                </div>
                <pre id="outCall" class="output-box mono empty">대기 중...</pre>
            </div>

            <div class="result-section">
                <div class="result-header">
                    <label>/simple/stream 결과</label>
                    <div class="header-actions">
                        <span class="format-badge">SSE</span>
                        <button class="icon-btn" id="btnCopyStream" title="복사">📋</button>
                    </div>
                </div>
                <pre id="outStream" class="output-box stream empty">대기 중...</pre>
            </div>

            <div class="result-section">
                <div class="result-header">
                    <label>/simple/emotion 결과</label>
                    <div class="header-actions">
                        <span class="format-badge">Emotion</span>
                        <button class="icon-btn" id="btnCopyEmotion" title="복사">📋</button>
                    </div>
                </div>
                <pre id="outEmotion" class="output-box emotion empty">대기 중...</pre>
                <div id="emotionVisual" class="emotion-visual hidden">
                    <div class="emotion-meter">
                        <div class="meter-label">감정 점수</div>
                        <div class="meter-bar">
                            <div class="meter-fill" id="emotionMeterFill"></div>
                            <span class="meter-value" id="emotionMeterValue">0</span>
                        </div>
                    </div>
                    <div class="emotion-details">
                        <div class="emotion-item">
                            <span class="emotion-label">Primary:</span>
                            <span class="emotion-value" id="emotionPrimary">-</span>
                        </div>
                        <div class="emotion-item">
                            <span class="emotion-label">Secondary:</span>
                            <span class="emotion-value" id="emotionSecondary">-</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <footer>
        <div class="footer-content">
            <p>💡 Tip: Conversation ID를 동일하게 유지하면 대화 맥락이 이어집니다</p>
            <p>🎭 감정 분석 기능으로 사용자의 감정 상태를 평가할 수 있습니다</p>
        </div>
    </footer>
</div>
        `;
    },

    mount() {
        $("btnCopyCall")?.addEventListener("click", handleCopyCall);
        $("btnCopyStream")?.addEventListener("click", handleCopyStream);
        $("btnCopyEmotion")?.addEventListener("click", handleCopyEmotion);
        $("btnCall")?.addEventListener("click", callApi);
        $("btnStreamStart")?.addEventListener("click", startStream);
        $("btnStreamStop")?.addEventListener("click", stopStream);
        $("btnEmotion")?.addEventListener("click", callEmotion);
        $("optionsToggle")?.addEventListener("click", handleOptionsToggle);
        $("userPrompt")?.addEventListener("keydown", handleKeydown);

        setStreamStatus(false);
        console.log("✅ Simple Chat 테스트 화면 초기화 완료");
    },

    unmount() {
        stopStream();
        $("btnCopyCall")?.removeEventListener("click", handleCopyCall);
        $("btnCopyStream")?.removeEventListener("click", handleCopyStream);
        $("btnCopyEmotion")?.removeEventListener("click", handleCopyEmotion);
        $("btnCall")?.removeEventListener("click", callApi);
        $("btnStreamStart")?.removeEventListener("click", startStream);
        $("btnStreamStop")?.removeEventListener("click", stopStream);
        $("btnEmotion")?.removeEventListener("click", callEmotion);
        $("optionsToggle")?.removeEventListener("click", handleOptionsToggle);
        $("userPrompt")?.removeEventListener("keydown", handleKeydown);
    }
};

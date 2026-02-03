// Common Utility Functions

export const $ = (id) => document.getElementById(id);

export function setStreamStatus(connected) {
    const statusEl = $("streamStatus");
    if (!statusEl) return;

    if (connected) {
        statusEl.textContent = "Stream: Connected";
        statusEl.classList.remove("disconnected");
        statusEl.classList.add("connected");
    } else {
        statusEl.textContent = "Stream: Disconnected";
        statusEl.classList.remove("connected");
        statusEl.classList.add("disconnected");
    }

    const dotEl = statusEl.querySelector('.status-dot');
    if (!dotEl) {
        const dot = document.createElement('span');
        dot.className = 'status-dot';
        statusEl.insertBefore(dot, statusEl.firstChild);
    }

    const btnStart = $("btnStreamStart");
    const btnStop = $("btnStreamStop");
    if (btnStart) btnStart.disabled = connected;
    if (btnStop) btnStop.disabled = !connected;
}

export function setOutputEmpty(id, isEmpty = true) {
    const el = $(id);
    if (!el) return;
    if (isEmpty) {
        el.classList.add("empty");
        el.textContent = "대기 중...";
    } else {
        el.classList.remove("empty");
    }
}

export function setOutputLoading(id, message = "요청 중...") {
    const el = $(id);
    if (!el) return;
    el.classList.add("empty");
    el.textContent = message;
}

export function setOutputError(id, errorMessage) {
    const el = $(id);
    if (!el) return;
    el.classList.remove("empty");
    el.textContent = `오류 발생\n\n${errorMessage}`;
    el.style.color = "var(--accent-danger)";
    setTimeout(() => {
        el.style.color = "";
    }, 3000);
}

export function setOutputSuccess(id, content) {
    const el = $(id);
    if (!el) return;
    el.classList.remove("empty");
    el.textContent = content;
}

export function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log("클립보드에 복사됨");
    }).catch(err => {
        console.error("복사 실패:", err);
    });
}

export function qs(params) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) usp.set(k, v);
    return usp.toString();
}

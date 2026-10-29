/*
 * VetVision: interactive "wrong image" popup.
 * Replaces the plain browser alert when the backend rejects a photo.
 * Add to the page:  <script src="../js/upload-error-modal.js"></script>
 * (put it BEFORE the page's own script).
 */
(function () {
    const STYLE_ID = "vv-upload-modal-style";

    const css = `
    .vv-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;
        background:rgba(20,28,24,.55);backdrop-filter:blur(4px);opacity:0;transition:opacity .2s ease;padding:16px}
    .vv-overlay.vv-show{opacity:1}
    .vv-card{width:100%;max-width:420px;background:#fff;border-radius:22px;padding:32px 28px 24px;text-align:center;
        box-shadow:0 24px 60px rgba(0,0,0,.3);transform:translateY(24px) scale(.92);
        transition:transform .28s cubic-bezier(.2,1.3,.4,1);font-family:inherit}
    .vv-overlay.vv-show .vv-card{transform:translateY(0) scale(1)}
    .vv-icon{width:84px;height:84px;margin:0 auto 14px;border-radius:50%;background:#fff3e0;display:flex;
        align-items:center;justify-content:center;font-size:42px;position:relative;animation:vv-shake .6s .25s}
    .vv-badge{position:absolute;right:-4px;bottom:-4px;width:30px;height:30px;border-radius:50%;
        background:#e53935;color:#fff;font-size:18px;font-weight:700;display:flex;align-items:center;
        justify-content:center;border:3px solid #fff}
    .vv-title{margin:0 0 8px;font-size:21px;font-weight:700;color:#1f3a2e}
    .vv-msg{margin:0 0 20px;font-size:15px;line-height:1.5;color:#5b6b63}
    .vv-tips{list-style:none;margin:0 0 22px;padding:12px 16px;background:#f2f6f3;border-radius:12px;
        text-align:left;font-size:13px;color:#4a5b52}
    .vv-tips li{padding:3px 0}
    .vv-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
    .vv-btn{border:0;cursor:pointer;border-radius:12px;padding:12px 20px;font-size:15px;font-weight:600;
        font-family:inherit;transition:transform .12s ease,box-shadow .12s ease}
    .vv-btn:hover{transform:translateY(-1px)}
    .vv-primary{background:#5b8c6e;color:#fff;box-shadow:0 6px 16px rgba(91,140,110,.4)}
    .vv-secondary{background:#fff;color:#4a5b52;border:1px solid #cfdad3}
    @keyframes vv-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}
        40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
    `;

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    }

    function pickEmoji(text) {
        const t = String(text || "").toLowerCase();
        if (t.includes("dog")) return "🐶";
        if (t.includes("cat") && !t.includes("cattle")) return "🐱";
        if (t.includes("cattle") || t.includes("cow")) return "🐄";
        return "🐾";
    }

    function close(overlay) {
        overlay.classList.remove("vv-show");
        setTimeout(() => overlay.remove(), 200);
        document.removeEventListener("keydown", overlay._onKey);
    }

    function openFilePicker() {
        const input = document.querySelector('input[type="file"]');
        if (input) {
            input.value = "";
            input.click();
        }
    }

    function showUploadError(message) {
        injectStyle();
        document.querySelectorAll(".vv-overlay").forEach(o => o.remove());

        const overlay = document.createElement("div");
        overlay.className = "vv-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.innerHTML = `
            <div class="vv-card">
                <div class="vv-icon">${pickEmoji(message)}<span class="vv-badge">!</span></div>
                <h3 class="vv-title">Wrong photo uploaded</h3>
                <p class="vv-msg"></p>
                <ul class="vv-tips">
                    <li>✔ Upload a photo of the animal you selected</li>
                    <li>✔ Make sure the animal is clearly visible</li>
                    <li>✔ Use good light, no people or other objects</li>
                </ul>
                <div class="vv-actions">
                    <button type="button" class="vv-btn vv-primary">Upload correct image</button>
                    <button type="button" class="vv-btn vv-secondary">Cancel</button>
                </div>
            </div>`;

        overlay.querySelector(".vv-msg").textContent =
            message || "Please upload a clear photo of the selected animal.";

        overlay.querySelector(".vv-primary").addEventListener("click", () => {
            close(overlay);
            setTimeout(openFilePicker, 220);
        });
        overlay.querySelector(".vv-secondary").addEventListener("click", () => close(overlay));
        overlay.addEventListener("click", e => { if (e.target === overlay) close(overlay); });

        overlay._onKey = e => { if (e.key === "Escape") close(overlay); };
        document.addEventListener("keydown", overlay._onKey);

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("vv-show"));
        overlay.querySelector(".vv-primary").focus();
    }

    window.showUploadError = showUploadError;

    // Your pages already call alert(...) with the backend message.
    // This turns that alert into the popup, only for the "wrong image" message.
    const nativeAlert = window.alert.bind(window);
    window.alert = function (message) {
        const text = String(message || "");
        if (/could not recogni[sz]e|clear photo of|doesn.t look like/i.test(text)) {
            showUploadError(text);
        } else {
            nativeAlert(text);
        }
    };
})();
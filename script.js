/**
 * SARDOR SAFAROV — CV JAVASCRIPT
 * 
 * Features:
 * 1. Instant Bilingual Toggle (RU / EN) with LocalStorage persistence & Title/Aria update
 * 2. Signature Gooey Avatar Bubbles Physics Animation (60fps, 0 external dependencies)
 * 3. Print / Save as PDF Handler with keyboard shortcut integration
 * 4. Interactive Copy-to-Clipboard with Button Feedback & Toast Notification
 * 5. Keyboard shortcut: 'L' toggles language
 */

document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------------------------
    // 1. Instant Language Toggle (RU / EN)
    // -------------------------------------------------------------------------
    const btnLangRu = document.getElementById('btnLangRu');
    const btnLangEn = document.getElementById('btnLangEn');
    const printBtn = document.getElementById('printBtn');
    const copyPhoneBtn = document.getElementById('copyPhoneBtn');
    const copyEmailBtn = document.getElementById('copyEmailBtn');
    const copyTgBtn = document.getElementById('copyTgBtn');

    function setLanguage(lang) {
        const targetLang = (lang === 'en') ? 'en' : 'ru';
        document.body.setAttribute('data-lang', targetLang);

        if (btnLangRu && btnLangEn) {
            if (targetLang === 'ru') {
                btnLangRu.classList.add('active');
                btnLangEn.classList.remove('active');
            } else {
                btnLangEn.classList.add('active');
                btnLangRu.classList.remove('active');
            }
        }

        try {
            localStorage.setItem('sardor_cv_lang', targetLang);
        } catch (e) {}

        // Update document title & metadata dynamically
        if (targetLang === 'en') {
            document.title = 'Sardor Safarov | CV — Platform Architect & Senior Backend Engineer';
            if (printBtn) printBtn.setAttribute('title', 'Print or Save as PDF (Ctrl + P)');
            if (copyPhoneBtn) {
                copyPhoneBtn.setAttribute('title', 'Copy phone number');
                copyPhoneBtn.setAttribute('aria-label', 'Copy phone number');
            }
            if (copyEmailBtn) {
                copyEmailBtn.setAttribute('title', 'Copy email address');
                copyEmailBtn.setAttribute('aria-label', 'Copy email address');
            }
            if (copyTgBtn) {
                copyTgBtn.setAttribute('title', 'Copy Telegram handle');
                copyTgBtn.setAttribute('aria-label', 'Copy Telegram handle');
            }
        } else {
            document.title = 'Сардор Сафаров | Резюме — Platform Architect & Senior Backend Engineer';
            if (printBtn) printBtn.setAttribute('title', 'Распечатать или сохранить в PDF (Ctrl + P)');
            if (copyPhoneBtn) {
                copyPhoneBtn.setAttribute('title', 'Скопировать телефон');
                copyPhoneBtn.setAttribute('aria-label', 'Скопировать телефон');
            }
            if (copyEmailBtn) {
                copyEmailBtn.setAttribute('title', 'Скопировать email');
                copyEmailBtn.setAttribute('aria-label', 'Скопировать email');
            }
            if (copyTgBtn) {
                copyTgBtn.setAttribute('title', 'Скопировать Telegram');
                copyTgBtn.setAttribute('aria-label', 'Скопировать Telegram');
            }
        }
    }

    // Bind click events
    if (btnLangRu) {
        btnLangRu.addEventListener('click', () => setLanguage('ru'));
    }
    if (btnLangEn) {
        btnLangEn.addEventListener('click', () => setLanguage('en'));
    }

    // Read stored preference or URL parameter (?lang=en)
    const urlParams = new URLSearchParams(window.location.search);
    const paramLang = urlParams.get('lang');
    let savedLang = 'ru';
    try {
        savedLang = localStorage.getItem('sardor_cv_lang') || 'ru';
    } catch (e) {}

    setLanguage(paramLang || savedLang);

    // Keyboard shortcut: Press 'L' to toggle language
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.isContentEditable) return;
        if (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') {
            const currentLang = document.body.getAttribute('data-lang') || 'ru';
            setLanguage(currentLang === 'ru' ? 'en' : 'ru');
        }
    });

    // -------------------------------------------------------------------------
    // 2. Signature Gooey Avatar Bubbles Physics Animation (60fps, 0-dep)
    // -------------------------------------------------------------------------
    const bubbles = [];
    const numBubbles = 11;

    for (let i = 0; i < numBubbles; i++) {
        const el = document.querySelector('.bubble' + i);
        if (el) {
            bubbles.push({
                el: el,
                speedX: 0.0012 + (i % 5) * 0.0004,
                speedY: 0.0010 + ((i + 2) % 5) * 0.0005,
                ampX: 13 + (i % 4) * 4,
                ampY: 13 + ((i + 1) % 4) * 4,
                phaseX: (i * Math.PI) / 5.5,
                phaseY: (i * Math.PI) / 3.5
            });
        }
    }

    let startTime = performance.now();

    function animateBubbles(currentTime) {
        const elapsed = currentTime - startTime;

        for (let i = 0; i < bubbles.length; i++) {
            const b = bubbles[i];
            const x = Math.sin(elapsed * b.speedX + b.phaseX) * b.ampX;
            const y = Math.cos(elapsed * b.speedY + b.phaseY) * b.ampY;
            b.el.setAttribute('transform', `translate(${x.toFixed(2)}, ${y.toFixed(2)})`);
        }

        requestAnimationFrame(animateBubbles);
    }

    if (bubbles.length > 0) {
        requestAnimationFrame(animateBubbles);
    }

    // -------------------------------------------------------------------------
    // 3. Print / Save as PDF Button
    // -------------------------------------------------------------------------
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // -------------------------------------------------------------------------
    // 4. Copy to Clipboard with Toast Notification & Button Feedback
    // -------------------------------------------------------------------------
    const toast = document.getElementById('copyToast');
    let toastTimeout = null;

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const textToCopy = btn.getAttribute('data-copy');
            if (!textToCopy) return;

            const currentLang = document.body.getAttribute('data-lang') || 'ru';
            const prefix = (currentLang === 'en') ? 'Copied to clipboard: ' : 'Скопировано в буфер: ';

            function onSuccess() {
                showToast(prefix + textToCopy);
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.classList.remove('copied');
                }, 1800);
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(onSuccess).catch(() => {
                    fallbackCopy(textToCopy, prefix, btn);
                });
            } else {
                fallbackCopy(textToCopy, prefix, btn);
            }
        });
    });

    function fallbackCopy(text, prefix, btn) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast(prefix + text);
            if (btn) {
                btn.classList.add('copied');
                setTimeout(() => btn.classList.remove('copied'), 1800);
            }
        } catch (err) {
            showToast(prefix + text);
        }
        document.body.removeChild(textarea);
    }

});

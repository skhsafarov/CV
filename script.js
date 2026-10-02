/**
 * Sardor Safarov — Interactive CV Script
 * - Organic Liquid Bubble Goo Physics Animation (Native 60fps Physics)
 * - PDF Export & Print Integration
 * - Contact Quick-Copy with Toast Feedback
 */

(function () {
    'use strict';

    // ---------------------------------------------------------
    // 1. Organic Liquid Bubble Animation (Native 60fps Physics)
    // ---------------------------------------------------------
    const bubbles = [];
    const totalBubbles = 11;

    for (let i = 0; i < totalBubbles; i++) {
        const el = document.querySelector('.bubble' + i);
        if (!el) continue;

        const baseRadius = i === 0 ? 102 : 92;

        bubbles.push({
            el: el,
            index: i,
            baseRadius: baseRadius,
            currentRadius: baseRadius,
            targetRadius: baseRadius,
            x: 171.5,
            y: 175.6,
            baseX: 171.5,
            baseY: 175.6,
            vx: 0,
            vy: 0,
            angle: (i / (totalBubbles - 1)) * Math.PI * 2,
            orbitSpeed: 0.008 + (i * 0.002),
            orbitDist: i === 0 ? 0 : 16 + (i * 5),
            noiseOffset: i * 1.7,
            phase: Math.random() * Math.PI * 2
        });
    }

    let mouseX = 171.5;
    let mouseY = 175.6;
    let isHovered = false;
    let time = 0;

    const container = document.getElementById('bubbleContainer');

    if (container) {
        container.addEventListener('mousemove', function (e) {
            const rect = container.getBoundingClientRect();
            // Scale mouse coordinate into SVG viewBox 343 x 351
            mouseX = ((e.clientX - rect.left) / rect.width) * 343;
            mouseY = ((e.clientY - rect.top) / rect.height) * 351;
            isHovered = true;
        });

        container.addEventListener('mouseleave', function () {
            mouseX = 171.5;
            mouseY = 175.6;
            isHovered = false;
        });

        // Click ripple burst
        container.addEventListener('click', function () {
            bubbles.forEach((b, idx) => {
                if (idx === 0) return;
                const angle = Math.random() * Math.PI * 2;
                const force = 12 + Math.random() * 18;
                b.vx += Math.cos(angle) * force;
                b.vy += Math.sin(angle) * force;
            });
        });
    }

    function animatePhysics() {
        time += 0.02;

        bubbles.forEach((b) => {
            if (b.index === 0) {
                // Central anchor
                const breathing = Math.sin(time * 1.5) * 4;
                b.el.setAttribute('r', b.baseRadius + breathing);
                return;
            }

            // Target orbit calculation
            b.angle += b.orbitSpeed;
            const floatX = Math.cos(time + b.noiseOffset) * 12;
            const floatY = Math.sin(time * 0.9 + b.noiseOffset) * 12;

            let targetX = b.baseX + Math.cos(b.angle) * b.orbitDist + floatX;
            let targetY = b.baseY + Math.sin(b.angle) * b.orbitDist + floatY;

            // Interactive attraction/repulsion on hover
            if (isHovered) {
                const dx = mouseX - b.x;
                const dy = mouseY - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120 && dist > 1) {
                    const pull = (120 - dist) * 0.08;
                    b.vx += (dx / dist) * pull;
                    b.vy += (dy / dist) * pull;
                }
            }

            // Spring force towards target orbit
            const ax = (targetX - b.x) * 0.04;
            const ay = (targetY - b.y) * 0.04;

            b.vx = (b.vx + ax) * 0.88; // Damping
            b.vy = (b.vy + ay) * 0.88;

            b.x += b.vx;
            b.y += b.vy;

            // Subtle dynamic radius oscillation
            const rOffset = Math.sin(time * 2 + b.phase) * 5;
            b.currentRadius = b.baseRadius + rOffset;

            b.el.setAttribute('cx', b.x.toFixed(2));
            b.el.setAttribute('cy', b.y.toFixed(2));
            b.el.setAttribute('r', Math.max(30, b.currentRadius).toFixed(2));
        });

        requestAnimationFrame(animatePhysics);
    }

    if (bubbles.length > 0) {
        requestAnimationFrame(animatePhysics);
    }

    // ---------------------------------------------------------
    // 2. Print / PDF Export Handler
    // ---------------------------------------------------------
    const btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
        btnPrint.addEventListener('click', function () {
            window.print();
        });
    }

    // ---------------------------------------------------------
    // 3. Share / Copy Link with Animated Toast Feedback
    // ---------------------------------------------------------
    const btnShare = document.getElementById('btnShare');
    const toast = document.getElementById('toast');

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(function () {
            toast.classList.remove('show');
        }, 3200);
    }

    if (btnShare) {
        btnShare.addEventListener('click', function () {
            const url = window.location.href;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url)
                    .then(() => showToast('Ссылка на резюме скопирована в буфер!'))
                    .catch(() => copyFallback(url));
            } else {
                copyFallback(url);
            }
        });
    }

    function copyFallback(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('Ссылка скопирована!');
        } catch (err) {
            showToast('Не удалось скопировать: ' + window.location.href);
        }
        document.body.removeChild(textarea);
    }

})();

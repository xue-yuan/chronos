import confetti from 'canvas-confetti';

const COLORS = ['#a78bfa', '#f472b6', '#38bdf8', '#ffffff'];

export const celebrate = (el?: Element | null, big = false) => {
    navigator.vibrate?.(big ? [10, 40, 20] : 10);
    const rect = el?.getBoundingClientRect();
    const origin = rect
        ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
        : { x: 0.5, y: 0.4 };
    confetti({
        particleCount: big ? 160 : 70,
        spread: big ? 110 : 70,
        startVelocity: big ? 45 : 30,
        origin,
        colors: COLORS,
        disableForReducedMotion: true,
        zIndex: 9999,
    });
};

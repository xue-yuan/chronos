import { onCleanup, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';

const isTyping = (el: EventTarget | null) =>
    el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/** ← / → move to the previous / next period, T jumps to the current one, ↑ zooms out. */
export const useTimelineKeys = (hrefs: { prev: () => string; next: () => string; current: () => string; parent?: () => string }) => {
    const navigate = useNavigate();
    onMount(() => {
        const onKey = (e: KeyboardEvent) => {
            if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.modal-open')) return;
            const target = e.key === 'ArrowLeft' ? hrefs.prev()
                : e.key === 'ArrowRight' ? hrefs.next()
                    : e.key === 't' || e.key === 'T' ? hrefs.current()
                        : e.key === 'ArrowUp' ? hrefs.parent?.()
                            : undefined;
            if (!target) return;
            e.preventDefault();
            navigate(target);
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => window.removeEventListener('keydown', onKey));
    });
};

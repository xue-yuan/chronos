import { createSignal } from "solid-js";

export interface Toast {
    id: number;
    message: string;
    kind: 'info' | 'success' | 'error';
    action?: { label: string; run: () => void };
}

const [toasts, setToasts] = createSignal<Toast[]>([]);
let seq = 0;

export const dismissToast = (id: number) => setToasts(list => list.filter(t => t.id !== id));

export const toast = (message: string, kind: Toast['kind'] = 'info', action?: Toast['action']) => {
    const id = ++seq;
    setToasts(list => [...list.slice(-3), { id, message, kind, action }]);
    setTimeout(() => dismissToast(id), action ? 6000 : 4000);
};

export const reportError = (what: string) => (err: unknown) => {
    console.error(`[chronos] ${what}`, err);
    const code = (err as { code?: string })?.code;
    toast(code === 'permission-denied' ? `${what}: permission denied` : `${what} failed${code ? ` (${code})` : ''}`, 'error');
};

export { toasts };

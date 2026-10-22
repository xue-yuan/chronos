import { type Component, For, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { dismissToast, toasts } from '../store/toast';

const KIND = {
    info: 'text-base-content',
    success: 'text-success',
    error: 'text-error',
} as const;

const Toaster: Component = () => (
    <Portal>
        <div class="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[min(92vw,420px)]" aria-live="polite">
            <For each={toasts()}>
                {(t) => (
                    <div class={`flex items-center gap-3 px-4 py-3 rounded-xl bg-base-100 border border-base-300 shadow-lg text-sm font-medium animate-fade-in ${KIND[t.kind]}`}>
                        <span class="flex-1">{t.message}</span>
                        <Show when={t.action}>
                            <button class="btn btn-xs btn-ghost text-primary" onClick={() => { t.action!.run(); dismissToast(t.id); }}>{t.action!.label}</button>
                        </Show>
                        <button class="btn btn-xs btn-ghost btn-circle text-base-content/40" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>✕</button>
                    </div>
                )}
            </For>
        </div>
    </Portal>
);

export default Toaster;

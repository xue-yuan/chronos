import { createSignal } from "solid-js";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const [deferred, setDeferred] = createSignal<BeforeInstallPromptEvent | null>(null);

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setDeferred(e as BeforeInstallPromptEvent);
});
window.addEventListener('appinstalled', () => setDeferred(null));

export const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const canInstall = () => deferred() !== null;

export const promptInstall = async () => {
    const e = deferred();
    if (!e) return;
    await e.prompt();
    await e.userChoice;
    setDeferred(null);
};

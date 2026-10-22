import { type Component, Show, createSignal } from 'solid-js';
import { buildIcs, downloadFile, googleCalendarUrl, type Reminder } from '../lib/reminders';
import { exportData } from '../store/backup';
import { canInstall, isIos, isStandalone, promptInstall } from '../store/install';
import { reportError, toast } from '../store/toast';

const STORAGE_KEY = 'chronos:reminders';

const loadTimes = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (saved?.morning && saved?.evening) return saved as { morning: string; evening: string };
    } catch { /* storage unavailable */ }
    return { morning: '08:30', evening: '21:30' };
};

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
    onLogout: () => void;
    email?: string | null;
}

const SettingsModal: Component<SettingsModalProps> = (props) => {
    const initial = loadTimes();
    const [morning, setMorning] = createSignal(initial.morning);
    const [evening, setEvening] = createSignal(initial.evening);
    const [exporting, setExporting] = createSignal(false);

    const appUrl = () => window.location.origin + '/';

    const reminders = (): Reminder[] => [
        { title: 'Chronos · Plan your day', time: morning(), description: 'Pick the ONE thing, 3 crucial results and 5 quick wins.' },
        { title: 'Chronos · Evening check-in', time: evening(), description: 'Check off your habits and close out the day.' },
    ];

    const persist = () => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ morning: morning(), evening: evening() })); } catch { /* ignore */ }
    };

    const downloadIcs = () => {
        persist();
        downloadFile('chronos-reminders.ics', buildIcs(reminders(), appUrl()), 'text/calendar');
        toast('Open the downloaded file to add both reminders to your calendar.', 'success');
    };

    const runExport = async () => {
        setExporting(true);
        try {
            await exportData();
            toast('Backup downloaded', 'success');
        } catch (e) {
            reportError('Export')(e);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div class={`modal ${props.open ? 'modal-open backdrop-blur-sm' : ''}`} role="dialog" aria-modal="true" aria-label="Settings"
            onKeyDown={(e) => e.key === 'Escape' && props.onClose()}>
            <div class="modal-box bg-base-100 border border-base-300 shadow-xl max-w-lg p-0 overflow-hidden">
                <div class="px-6 py-4 border-b border-base-300 flex justify-between items-center">
                    <h3 class="font-semibold text-lg">Settings</h3>
                    <button onClick={props.onClose} class="btn btn-sm btn-square btn-ghost text-base-content/50" aria-label="Close">✕</button>
                </div>

                <div class="p-6 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
                    <section>
                        <h4 class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">Daily reminders</h4>
                        <p class="text-sm text-base-content/55 mb-4">Two recurring calendar events with an alert, so Chronos nudges you even when it's closed.</p>
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <label class="form-control">
                                <span class="text-xs text-base-content/60 mb-1 block">Morning plan</span>
                                <input type="time" class="input input-sm w-full" value={morning()} onInput={(e) => setMorning(e.currentTarget.value || '08:30')} />
                            </label>
                            <label class="form-control">
                                <span class="text-xs text-base-content/60 mb-1 block">Evening check-in</span>
                                <input type="time" class="input input-sm w-full" value={evening()} onInput={(e) => setEvening(e.currentTarget.value || '21:30')} />
                            </label>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button class="btn btn-sm btn-neutral" onClick={downloadIcs}>Apple / Outlook (.ics)</button>
                            <a class="btn btn-sm btn-outline border-base-300 font-medium" target="_blank" rel="noopener noreferrer" href={googleCalendarUrl(reminders()[0], appUrl())} onClick={persist}>Google · morning</a>
                            <a class="btn btn-sm btn-outline border-base-300 font-medium" target="_blank" rel="noopener noreferrer" href={googleCalendarUrl(reminders()[1], appUrl())} onClick={persist}>Google · evening</a>
                        </div>
                    </section>

                    <Show when={!isStandalone()}>
                        <section>
                            <h4 class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">Install the app</h4>
                            <Show when={canInstall()} fallback={
                                <p class="text-sm text-base-content/55">
                                    {isIos() ? 'In Safari, tap Share → "Add to Home Screen" to get Chronos as an app icon.' : 'Use your browser menu → "Install app" / "Add to Home screen" to keep Chronos one tap away.'}
                                </p>
                            }>
                                <p class="text-sm text-base-content/55 mb-3">Opens in its own window, works offline, and shows today's remaining count on the icon.</p>
                                <button class="btn btn-sm btn-neutral" onClick={promptInstall}>Install Chronos</button>
                            </Show>
                        </section>
                    </Show>

                    <section>
                        <h4 class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-1">Your data</h4>
                        <p class="text-sm text-base-content/55 mb-3">Download all habits and plans as JSON.</p>
                        <button class="btn btn-sm btn-outline border-base-300 font-medium" disabled={exporting()} onClick={runExport}>
                            <Show when={exporting()}><span class="loading loading-spinner loading-xs"></span></Show>
                            Export backup
                        </button>
                    </section>

                    <section>
                        <h4 class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">Keyboard</h4>
                        <p class="text-sm text-base-content/55 leading-7"><kbd class="kbd kbd-sm">←</kbd> <kbd class="kbd kbd-sm">→</kbd> previous / next day, week, month or year · <kbd class="kbd kbd-sm">↑</kbd> zoom out · <kbd class="kbd kbd-sm">T</kbd> back to now</p>
                    </section>
                </div>

                <div class="px-6 py-3 border-t border-base-300 flex items-center justify-between">
                    <span class="text-sm text-base-content/50 truncate">{props.email}</span>
                    <button class="btn btn-ghost btn-sm text-error" onClick={props.onLogout}>Sign out</button>
                </div>
            </div>
            <div class="modal-backdrop">
                <button onClick={props.onClose} type="button">close</button>
            </div>
        </div>
    );
};

export default SettingsModal;

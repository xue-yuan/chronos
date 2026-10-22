import { type Component, Show, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { useNavigate, type RouteSectionProps } from '@solidjs/router';
import { authStore } from '../store/auth';
import { daysStore } from '../store/days';
import { settingsOpen, setSettingsOpen } from '../store/ui';
import Toaster from './Toaster';
import SettingsModal from './SettingsModal';

const Layout: Component<RouteSectionProps> = (props) => {
    const { user, logout } = authStore;
    const navigate = useNavigate();

    createEffect(() => {
        if (!authStore.loading() && !authStore.user()) {
            navigate("/login", { replace: true });
        }
    });

    createEffect(() => {
        if (!daysStore.ready()) return;
        const s = daysStore.todayStatus();
        const remaining = Math.max(0, s.total - s.done);
        document.title = remaining ? `(${remaining}) Chronos` : 'Chronos';
        const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
        (remaining ? nav.setAppBadge?.(remaining) : nav.clearAppBadge?.())?.catch(() => { });
    });

    return (
        <Show when={!authStore.loading() && user()} fallback={
            <div class="min-h-dvh flex items-center justify-center">
                <span class="loading loading-spinner text-base-content/40"></span>
            </div>
        }>
            {props.children}
            <Portal>
                <SettingsModal open={settingsOpen()} onClose={() => setSettingsOpen(false)} onLogout={logout} email={user()?.email} />
            </Portal>
            <Toaster />
        </Show>
    );
};

export default Layout;

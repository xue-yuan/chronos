import { type Component, Show, createEffect } from 'solid-js';
import { authStore } from '../store/auth';
import { useNavigate } from '@solidjs/router';

const Login: Component = () => {
    const { login, user, error, loading } = authStore;
    const navigate = useNavigate();

    createEffect(() => {
        if (!loading() && user()) {
            navigate("/", { replace: true });
        }
    });

    return (
        <main class="min-h-dvh flex flex-col items-center justify-center px-6">
            <div class="w-full max-w-xs">
                <div class="w-10 h-10 rounded-xl bg-base-content text-base-100 flex items-center justify-center mb-8">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path stroke-linecap="round" d="M12 8v4l2.5 2.5" /></svg>
                </div>
                <h1 class="text-3xl font-semibold tracking-tight">Chronos</h1>
                <p class="text-base-content/55 mt-2 mb-10 leading-relaxed">
                    One thing, three results, five quick wins. Every day, with your year in view.
                </p>

                <Show when={error()}>
                    <div role="alert" class="text-sm text-error border border-error/30 bg-error/5 rounded-lg px-3 py-2 mb-4">{error()}</div>
                </Show>

                <button class="btn btn-neutral w-full gap-3" onClick={login} disabled={loading()}>
                    <Show when={!loading()} fallback={<span class="loading loading-spinner loading-sm"></span>}>
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.52-.232-2.260H12.24z" /></svg>
                        Continue with Google
                    </Show>
                </button>
            </div>
        </main>
    );
};

export default Login;

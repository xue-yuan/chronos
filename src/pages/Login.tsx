import { type Component, Show } from 'solid-js';
import { authStore } from '../store/auth';
import { useNavigate } from '@solidjs/router';

const Login: Component = () => {
    const { login, user, error, loading } = authStore;
    const navigate = useNavigate();

    import("solid-js").then(({ createEffect }) => {
        createEffect(() => {
            if (!loading() && user()) {
                navigate("/", { replace: true });
            }
        });
    });

    return (
        <div class="relative min-h-screen flex items-center justify-center bg-[#0f1014] overflow-hidden">
            <div class="absolute inset-0 overflow-hidden">
                <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
            </div>

            <div class="card w-full max-w-sm bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] z-10 relative overflow-hidden group hover:bg-white/10 transition-colors duration-500">
                <div class="absolute inset-0 bg-noise opacity-[0.05]"></div>

                <div class="card-body items-center text-center p-10">
                    <div class="mb-8 relative">
                        <div class="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                        <div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 mb-6 mx-auto relative ring-1 ring-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h1 class="text-4xl font-black text-white tracking-tighter mb-2">Chronos</h1>
                        <p class="text-white/40 text-sm font-medium tracking-widest uppercase">Design your time<br />Master your life</p>
                    </div>

                    <Show when={error()}>
                        <div role="alert" class="alert alert-error text-xs py-3 px-4 mb-6 rounded-xl shadow-lg border border-error/20 bg-error/10 text-error-content font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error()}</span>
                        </div>
                    </Show>

                    <button
                        class="btn btn-primary btn-block shadow-lg shadow-primary/20 normal-case text-lg font-bold h-14 min-h-0 border-none hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 relative overflow-hidden"
                        onClick={login}
                        disabled={loading()}
                    >
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>
                        <Show when={!loading()} fallback={<span class="loading loading-spinner loading-md text-white"></span>}>
                            <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.52-.232-2.260H12.24z" /></svg>
                            Continue with Google
                        </Show>
                    </button>

                    <div class="mt-8 text-xs text-white/20">
                        &copy; {new Date().getFullYear()} Chronos Inc.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

import { type Component, Show, createSignal } from 'solid-js';
import { A, useNavigate, type RouteSectionProps } from '@solidjs/router';
import { authStore } from '../store/auth';
import { plansStore } from '../store/plans';

const Layout: Component<RouteSectionProps> = (props) => {
    const { user, logout } = authStore;
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = createSignal(false);

    import("solid-js").then(({ createEffect }) => {
        createEffect(() => {
            if (!authStore.loading() && !authStore.user()) {
                navigate("/login", { replace: true });
            }
        });
    });

    return (
        <div class="drawer lg:drawer-open font-sans text-base-content bg-[#0f1014]">
            <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
            <div class="drawer-content flex flex-col items-center justify-start h-screen relative overflow-y-auto bg-black/40 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div class="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div class="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] animate-pulse"></div>
                    <div class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[150px] animate-pulse" style="animation-delay: 3s"></div>
                    <div class="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px] animate-pulse" style="animation-delay: 1.5s"></div>
                </div>

                <div class="w-full navbar bg-base-100/5 backdrop-blur-xl lg:hidden border-b border-white/5 sticky top-0 z-30">
                    <div class="flex-none">
                        <label for="my-drawer-2" class="btn btn-square btn-ghost btn-sm hover:bg-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </label>
                    </div>
                    <div class="flex-1 px-2 mx-2 font-bold text-lg tracking-tight text-white/90">Chronos</div>
                </div>

                <main class="w-full p-4 lg:p-8 max-w-[1600px] animate-fade-in relative z-10">
                    {props.children}
                </main>

            </div>

            <div class="drawer-side z-40">
                <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
                <aside class={`h-full bg-[#12141a]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out relative z-50 overflow-hidden ${isCollapsed() ? 'w-[80px]' : 'w-[280px]'}`}>

                    <div class="h-20 flex items-center px-5 relative shrink-0">
                        <div class="flex items-center gap-4 overflow-hidden w-full">
                            <div class="w-10 h-10 min-w-[2.5rem] rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/10 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div class={`flex flex-col transition-opacity duration-300 ${isCollapsed() ? 'opacity-0' : 'opacity-100'}`}>
                                <span class="text-xl font-bold tracking-tight text-white whitespace-nowrap">Chronos</span>
                                <span class="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Pro</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-8 scrollbar-none">
                        <div class="space-y-2">
                            <div class={`flex items-center gap-3 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 transition-all duration-300 ${isCollapsed() ? 'justify-center w-12 h-12 mx-auto p-0' : 'w-full'}`}>
                                <div class="w-6 h-6 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 fill-current animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div class={`flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed() ? 'w-0 opacity-0' : 'w-auto opacity-100 flex-1'}`}>
                                    <span class="text-xs font-bold uppercase tracking-wider opacity-70">
                                        Streak
                                    </span>
                                    <span class="text-lg font-black leading-none">
                                        {plansStore.currentStreak()} Days
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <NavLabel isCollapsed={isCollapsed()}>Focus</NavLabel>
                            <NavItem href="/" icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} label="Daily Action" isCollapsed={isCollapsed()} colorClass="group-hover:text-primary" activeClass="bg-primary/10 text-primary" />
                            <NavItem href="/habits" icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} label="Habit Tracker" isCollapsed={isCollapsed()} colorClass="group-hover:text-primary" activeClass="bg-primary/10 text-primary" />
                        </div>

                        <div class="space-y-2">
                            <NavLabel isCollapsed={isCollapsed()}>Planning</NavLabel>
                            <NavItem href="/planning/weekly" icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} label="Weekly Rhythm" isCollapsed={isCollapsed()} colorClass="group-hover:text-secondary" activeClass="bg-secondary/10 text-secondary" />
                            <NavItem href="/planning/monthly" icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>} label="Monthly Milestone" isCollapsed={isCollapsed()} colorClass="group-hover:text-accent" activeClass="bg-accent/10 text-accent" />
                            <NavItem href="/planning/annual" icon={<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="Annual Vision" isCollapsed={isCollapsed()} colorClass="group-hover:text-info" activeClass="bg-info/10 text-info" />
                        </div>
                    </div>

                    <div class="px-3 py-2 shrink-0">
                        <button
                            class={`btn btn-sm btn-ghost w-full flex items-center text-white/40 hover:text-white hover:bg-white/5 transition-all group ${isCollapsed() ? 'justify-center px-0 gap-0' : 'justify-start px-3 gap-3'}`}
                            onClick={() => setIsCollapsed(!isCollapsed())}
                            title={isCollapsed() ? "Expand" : "Collapse"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300 group-hover:scale-110" style={{ transform: isCollapsed() ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                            <span class={`text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed() ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                Collapse
                            </span>
                        </button>
                    </div>

                    <div class="p-4 border-t border-white/5 shrink-0">
                        <Show when={user()}>
                            <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group overflow-hidden">
                                <div class="avatar online shrink-0">
                                    <div class="w-10 h-10 rounded-full ring-2 ring-white/10 group-hover:ring-primary transition-all">
                                        <img src={user()?.photoURL || ""} alt="avatar" />
                                    </div>
                                </div>
                                <div class={`flex flex-col min-w-0 transition-opacity duration-300 ${isCollapsed() ? 'opacity-0 w-0' : 'opacity-100 flex-1'}`}>
                                    <span class="text-sm font-bold text-white truncate">{user()?.displayName}</span>
                                    <span class="text-xs text-white/40 truncate">{user()?.email}</span>
                                </div>
                                <Show when={!isCollapsed()}>
                                    <button class="btn btn-ghost btn-xs btn-square text-white/30 hover:text-error hover:bg-error/10" onClick={logout}>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    </button>
                                </Show>
                            </div>
                        </Show>
                    </div>
                </aside>
            </div>
        </div>
    );
};

const NavItem: Component<{ href: string, icon: any, label: string, isCollapsed: boolean, colorClass?: string, activeClass?: string }> = (props) => {
    return (
        <A
            href={props.href}
            end={props.href === '/'}
            activeClass={props.activeClass || "bg-white/10 text-white shadow-lg"}
            class={`flex items-center rounded-xl transition-all duration-300 group hover:bg-white/5 hover:text-white text-gray-400 overflow-hidden relative ${props.isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'h-12 w-full px-3'}`}
            title={props.label}
        >
            <div class={`flex items-center justify-center w-6 h-6 shrink-0 transition-colors ${props.colorClass || ''}`}>
                {props.icon}
            </div>
            <span class={`ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 ${props.isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                {props.label}
            </span>

            {props.isCollapsed && <div class="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-current rounded-l-full opacity-0 group-[.active]:opacity-100 transition-opacity" />}
        </A>
    );
}

const NavLabel: Component<{ children: any, isCollapsed: boolean }> = (props) => {
    return (
        <div class={`text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 px-3 mt-6 mb-2 transition-all duration-300 overflow-hidden whitespace-nowrap ${props.isCollapsed ? 'h-0 opacity-0 mt-0 mb-0' : 'h-auto opacity-100'}`}>
            {props.children}
        </div>
    );
}

export default Layout;

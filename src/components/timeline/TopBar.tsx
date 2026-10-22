import { type Component, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { daysStore } from '../../store/days';
import { setSettingsOpen } from '../../store/ui';

export interface Crumb {
    label: string;
    /** Shorter label for narrow screens. */
    short?: string;
    href?: string;
}

interface TopBarProps {
    crumbs: Crumb[];
    /** Link back to the current period at this zoom level, shown when viewing another one. */
    current?: { href: string; label: string; active: boolean };
}

const Chevron = () => (
    <svg class="h-3.5 w-3.5 shrink-0 text-base-content/25" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
    </svg>
);

const TopBar: Component<TopBarProps> = (props) => {
    const streak = () => daysStore.streak();
    return (
        <header class="sticky top-0 z-40 bg-base-100/85 backdrop-blur-md border-b border-base-300 pt-[env(safe-area-inset-top)]">
            <div class="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center gap-2">
                <A href="/" class="hidden sm:flex shrink-0 mr-1 w-7 h-7 rounded-lg bg-base-content text-base-100 items-center justify-center" aria-label="Chronos, today">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path stroke-linecap="round" d="M12 8v4l2.5 2.5" /></svg>
                </A>

                <nav ref={(el) => requestAnimationFrame(() => { el.scrollLeft = el.scrollWidth; })} aria-label="Timeline" class="-ml-1.5 sm:ml-0 flex items-center gap-0.5 min-w-0 overflow-x-auto scrollbar-none">
                    <For each={props.crumbs}>
                        {(crumb, i) => (
                            <>
                                <Show when={i() > 0}><Chevron /></Show>
                                <Show when={crumb.href && i() < props.crumbs.length - 1} fallback={
                                    <span class="px-1 sm:px-1.5 py-1 text-sm font-semibold whitespace-nowrap" aria-current="page">
                                        <span class="hidden sm:inline">{crumb.label}</span>
                                        <span class="sm:hidden">{crumb.short ?? crumb.label}</span>
                                    </span>
                                }>
                                    <A href={crumb.href!} class="px-1 sm:px-1.5 py-1 rounded-md text-sm text-base-content/55 hover:text-base-content hover:bg-base-200 whitespace-nowrap transition-colors">
                                        <span class="hidden sm:inline">{crumb.label}</span>
                                        <span class="sm:hidden">{crumb.short ?? crumb.label}</span>
                                    </A>
                                </Show>
                            </>
                        )}
                    </For>
                </nav>

                <div class="ml-auto flex items-center gap-1 shrink-0">
                    <Show when={props.current && !props.current.active}>
                        <A href={props.current!.href} class="btn btn-ghost btn-sm h-8 min-h-8 px-2.5 font-medium text-primary">{props.current!.label}</A>
                    </Show>
                    <div
                        class={`flex items-center gap-1 h-8 px-2.5 rounded-lg text-sm font-semibold tabular-nums ${streak().count > 0 ? 'text-warning' : 'text-base-content/40'}`}
                        title={streak().includesToday ? `${streak().count}-day streak, today included` : `${streak().count}-day streak. Finish today's one thing and habits to extend it`}
                    >
                        <svg class={`h-4 w-4 ${streak().includesToday || streak().count === 0 ? '' : 'opacity-50'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd" />
                        </svg>
                        {streak().count}
                    </div>
                    <A href="/habits" class="btn btn-ghost btn-sm h-8 min-h-8 px-2 gap-1.5 font-medium text-base-content/70" activeClass="!text-base-content bg-base-200" aria-label="Habits">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span class="hidden sm:inline">Habits</span>
                    </A>
                    <button class="btn btn-ghost btn-sm btn-square h-8 min-h-8 w-8 text-base-content/70" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;

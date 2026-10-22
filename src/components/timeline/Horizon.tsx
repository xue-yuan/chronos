import { type Component, For, Show, onMount } from 'solid-js';
import { A } from '@solidjs/router';

export interface HorizonItem {
    key: string;
    label?: string;
    sub: string;
    href: string;
    /** 0..1 completion, or null when there's nothing to show. */
    ratio: number | null;
    complete?: boolean;
    selected?: boolean;
    /** Contains today. */
    current?: boolean;
    future?: boolean;
}

interface HorizonProps {
    items: HorizonItem[];
    prev: { href: string; label: string };
    next: { href: string; label: string };
}

const Arrow = (props: { dir: 'prev' | 'next'; href: string; label: string }) => (
    <A href={props.href} aria-label={props.label} title={props.label} class="shrink-0 w-6 sm:w-8 self-stretch flex items-center justify-center rounded-lg text-base-content/40 hover:text-base-content hover:bg-base-200 transition-colors">
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            {props.dir === 'prev'
                ? <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                : <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />}
        </svg>
    </A>
);

const Horizon: Component<HorizonProps> = (props) => {
    let scroller: HTMLDivElement | undefined;
    onMount(() => requestAnimationFrame(() => {
        scroller?.querySelector('[aria-current="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    }));

    return (
        <div class="flex items-stretch gap-1 py-3">
            <Arrow dir="prev" href={props.prev.href} label={props.prev.label} />
            <div ref={scroller} class="flex-1 min-w-0 grid grid-flow-col auto-cols-[minmax(2.25rem,1fr)] sm:auto-cols-[minmax(2.75rem,1fr)] gap-1 overflow-x-auto scrollbar-none">
                <For each={props.items}>
                    {(item) => (
                        <A
                            href={item.href}
                            aria-current={item.selected ? 'true' : undefined}
                            class={`group rounded-lg px-1.5 sm:px-2.5 pt-2 pb-2.5 flex flex-col items-center sm:items-start gap-1 border transition-colors ${item.selected
                                ? 'border-base-content/15 bg-base-200'
                                : 'border-transparent hover:bg-base-200/70'} ${item.future ? 'opacity-55' : ''}`}
                        >
                            <Show when={item.label} fallback={<span class={`w-1.5 h-1.5 rounded-full my-[3px] ${item.current ? 'bg-primary' : 'bg-transparent'}`}></span>}>
                                <span class={`text-[11px] font-medium uppercase tracking-wide ${item.current ? 'text-primary' : 'text-base-content/45'}`}>{item.label}</span>
                            </Show>
                            <span class={`text-sm sm:text-base font-semibold tabular-nums leading-none ${item.selected ? '' : 'text-base-content/80'}`}>{item.sub}</span>
                            <div class="w-full h-1 rounded-full bg-base-300 overflow-hidden mt-1">
                                <Show when={item.ratio !== null}>
                                    <div class={`h-full rounded-full ${item.complete ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.max(6, Math.round((item.ratio ?? 0) * 100))}%` }}></div>
                                </Show>
                            </div>
                        </A>
                    )}
                </For>
            </div>
            <Arrow dir="next" href={props.next.href} label={props.next.label} />
        </div>
    );
};

export default Horizon;

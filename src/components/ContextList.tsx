import { type Component, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import type { Task } from '../lib/model';

interface ContextListProps {
    title: string;
    items: Task[];
    href: string;
    emptyText: string;
}

const ContextList: Component<ContextListProps> = (props) => (
    <A href={props.href} class="flex items-baseline gap-3 py-2 px-3 -mx-3 rounded-lg hover:bg-base-200/70 transition-colors group">
        <span class="text-xs font-semibold uppercase tracking-wider text-base-content/40 shrink-0">{props.title}</span>
        <Show when={props.items.length > 0} fallback={<span class="text-sm text-base-content/35">{props.emptyText}</span>}>
            <ul class="flex flex-wrap gap-x-4 gap-y-1 min-w-0">
                <For each={props.items}>
                    {(item) => (
                        <li class={`text-sm ${item.completed ? 'line-through text-base-content/35' : 'text-base-content/75'}`}>{item.text}</li>
                    )}
                </For>
            </ul>
        </Show>
        <span class="ml-auto text-base-content/30 group-hover:text-base-content/60 shrink-0" aria-hidden="true">→</span>
    </A>
);

export default ContextList;

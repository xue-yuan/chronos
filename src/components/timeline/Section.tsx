import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';

interface SectionProps {
    title: string;
    meta?: JSX.Element;
    action?: JSX.Element;
    children: JSX.Element;
    class?: string;
}

const Section: Component<SectionProps> = (props) => (
    <section class={props.class}>
        <header class="flex items-center gap-3 mb-3">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-base-content/50">{props.title}</h2>
            <Show when={props.meta}><span class="text-xs tabular-nums text-base-content/40">{props.meta}</span></Show>
            <div class="flex-1 h-px bg-base-300"></div>
            <Show when={props.action}>{props.action}</Show>
        </header>
        {props.children}
    </section>
);

export default Section;

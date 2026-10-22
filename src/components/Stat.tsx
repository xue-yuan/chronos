import type { Component } from 'solid-js';

const Stat: Component<{ label: string; value: string | number }> = (props) => (
    <div class="rounded-xl border border-base-300 px-4 py-3">
        <div class="text-2xl font-semibold tabular-nums">{props.value}</div>
        <div class="text-xs text-base-content/50 mt-0.5">{props.label}</div>
    </div>
);

export default Stat;

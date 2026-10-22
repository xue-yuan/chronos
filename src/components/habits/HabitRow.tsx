import { type Component, Show, createEffect, createSignal, on } from 'solid-js';
import type { Habit, HabitLog } from '../../lib/model';
import { isLogDone, nextLog, scheduleLabel } from '../../lib/progress';
import { isCommitEnter } from '../Checklist';

interface HabitRowProps {
    habit: Habit;
    log: HabitLog | undefined;
    onLog: (log: HabitLog, delta?: number) => void;
    streak?: number;
    readOnly?: boolean;
    restDay?: boolean;
}

const R = 15;
const C = 2 * Math.PI * R;

export const ProgressRing: Component<{ progress: number; done: boolean; class?: string }> = (props) => (
    <svg viewBox="0 0 36 36" class={props.class ?? 'w-9 h-9'} aria-hidden="true">
        <circle cx="18" cy="18" r={R} fill={props.done ? 'var(--color-primary)' : 'none'} stroke={props.done ? 'var(--color-primary)' : 'color-mix(in oklab, var(--color-base-content) 15%, transparent)'} stroke-width="2.5" />
        <Show when={!props.done && props.progress > 0}>
            <circle cx="18" cy="18" r={R} fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round"
                stroke-dasharray={`${C * Math.min(1, props.progress)} ${C}`} transform="rotate(-90 18 18)" />
        </Show>
        <Show when={props.done}>
            <path d="M12 18.5l4 4 8-9" fill="none" stroke="var(--color-primary-content)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </Show>
    </svg>
);

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''));

const HabitRow: Component<HabitRowProps> = (props) => {
    const [editing, setEditing] = createSignal(false);
    const [pending, setPending] = createSignal<HabitLog | undefined>();
    createEffect(on(() => props.log, () => setPending(undefined), { defer: true }));
    const current = () => pending() ?? props.log;
    const step = () => (props.habit.increment && props.habit.increment > 0 ? props.habit.increment : 1);
    const quantity = () => props.habit.mode === 'quantifiable';
    const done = () => isLogDone(props.habit, current());
    const value = () => Math.max(0, Number(current()?.value) || 0);
    const progress = () => {
        if (!quantity()) return done() ? 1 : 0;
        return props.habit.dailyTarget ? value() / props.habit.dailyTarget : value() > 0 ? 1 : 0;
    };

    const log = (delta: number | 'toggle', exact = false) => {
        if (props.readOnly) return;
        navigator.vibrate?.(8);
        const next = nextLog(props.habit, current(), delta);
        const change = typeof delta === 'number' && !exact ? next.value - value() : undefined;
        setPending(next);
        props.onLog(next, change);
    };

    const setExact = (raw: string) => {
        setEditing(false);
        const n = Number(raw);
        if (raw.trim() === '' || !Number.isFinite(n) || n < 0 || n === value()) return;
        log(n - value(), true);
    };

    return (
        <div class={`flex items-center gap-3 rounded-xl border border-base-300 px-3 py-2.5 transition-colors ${props.restDay ? 'opacity-55' : ''} ${done() ? 'bg-base-200/60' : ''}`}>
            <button
                type="button"
                class="shrink-0 rounded-full disabled:cursor-default transition-transform active:scale-90"
                disabled={props.readOnly}
                onClick={() => log(quantity() ? step() : 'toggle')}
                aria-label={quantity() ? `Add ${fmt(step())} ${props.habit.unit ?? ''} to ${props.habit.name}` : done() ? `Undo ${props.habit.name}` : `Check in ${props.habit.name}`}
                aria-pressed={!quantity() ? done() : undefined}
            >
                <ProgressRing progress={progress()} done={done()} />
            </button>

            <div class="min-w-0 flex-1">
                <div class={`font-medium truncate ${done() ? 'text-base-content/60' : ''}`}>{props.habit.name}</div>
                <div class="text-xs text-base-content/45 flex items-center gap-2 mt-0.5">
                    <span class="truncate">{props.restDay ? 'Rest day' : scheduleLabel(props.habit)}</span>
                    <Show when={(props.streak ?? 0) > 0}>
                        <span class="text-warning font-medium tabular-nums shrink-0" title="Current streak">🔥 {props.streak}</span>
                    </Show>
                </div>
            </div>

            <Show when={quantity()}>
                <div class="flex items-center gap-1 shrink-0">
                    <Show when={!props.readOnly && value() > 0}>
                        <button type="button" class="btn btn-ghost btn-xs btn-square text-base-content/50" onClick={() => log(-step())} aria-label={`Subtract ${fmt(step())}`}>−</button>
                    </Show>
                    <Show when={editing()} fallback={
                        <button
                            type="button"
                            class="text-sm tabular-nums px-1.5 py-1 rounded-md hover:bg-base-200 disabled:hover:bg-transparent"
                            disabled={props.readOnly}
                            title="Set an exact amount"
                            onClick={() => setEditing(true)}
                        >
                            <span class="font-semibold">{fmt(value())}</span>
                            <Show when={props.habit.dailyTarget}><span class="text-base-content/40"> / {fmt(props.habit.dailyTarget!)}</span></Show>
                            <Show when={props.habit.unit}><span class="text-base-content/40"> {props.habit.unit}</span></Show>
                        </button>
                    }>
                        <input
                            ref={(el) => requestAnimationFrame(() => el.select())}
                            type="number"
                            inputmode="decimal"
                            min="0"
                            step="any"
                            class="input input-xs w-20 tabular-nums"
                            value={value()}
                            aria-label={`Amount for ${props.habit.name}`}
                            onKeyDown={(e) => {
                                if (isCommitEnter(e)) setExact(e.currentTarget.value);
                                if (e.key === 'Escape') setEditing(false);
                            }}
                            onBlur={(e) => setExact(e.currentTarget.value)}
                        />
                    </Show>
                    <Show when={!props.readOnly}>
                        <button type="button" class="btn btn-ghost btn-xs text-primary font-semibold tabular-nums" onClick={() => log(step())}>+{fmt(step())}</button>
                    </Show>
                </div>
            </Show>
        </div>
    );
};

export default HabitRow;

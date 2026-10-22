import { type Component, Index, Show, createEffect, on } from 'solid-js';
import { newId, type Task } from '../lib/model';

export const isCommitEnter = (e: KeyboardEvent) => e.key === 'Enter' && !e.isComposing && e.keyCode !== 229;

const VARIANTS = {
    large: {
        row: 'py-2',
        text: 'text-lg md:text-xl font-medium',
        box: 'w-5 h-5',
    },
    compact: {
        row: 'py-1.5',
        text: 'text-[15px]',
        box: 'w-[18px] h-[18px]',
    },
} as const;

interface ChecklistProps {
    items: Task[];
    onChange: (items: Task[]) => void;
    onComplete?: (task: Task, el: HTMLElement) => void;
    readOnly?: boolean;
    limit?: number;
    variant?: keyof typeof VARIANTS;
    placeholder: string;
    addPlaceholder: string;
    emptyText?: string;
}

const Checklist: Component<ChecklistProps> = (props) => {
    const v = () => VARIANTS[props.variant ?? 'compact'];

    let pending: Task[] | null = null;
    createEffect(on(() => props.items, () => { pending = null; }));
    const current = () => pending ?? props.items;
    const commit = (next: Task[]) => {
        pending = next;
        props.onChange(next);
    };

    const toggle = (id: string, el: HTMLElement) => {
        const task = current().find(t => t.id === id);
        if (!task) return;
        commit(current().map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        if (!task.completed) props.onComplete?.(task, el);
    };

    const commitText = (id: string, raw: string) => {
        const text = raw.trim();
        const task = current().find(t => t.id === id);
        if (!task) return;
        if (!text) commit(current().filter(t => t.id !== id));
        else if (text !== task.text) commit(current().map(t => t.id === id ? { ...t, text } : t));
    };

    const remove = (id: string) => commit(current().filter(t => t.id !== id));

    const add = (input: HTMLInputElement) => {
        const text = input.value.trim();
        if (!text) return;
        if (props.limit && current().length >= props.limit) return;
        commit([...current(), { id: newId(), text, completed: false }]);
        input.value = '';
    };

    const inputClass = 'flex-1 min-w-0 bg-transparent border-0 outline-none p-0 placeholder:text-base-content/30 disabled:cursor-default';

    return (
        <div>
            <Index each={props.items}>
                {(task) => (
                    <div class={`group flex items-center gap-3 px-2 -mx-2 rounded-lg hover:bg-base-200/70 transition-colors ${v().row}`}>
                        <input
                            type="checkbox"
                            class={`checkbox checkbox-primary rounded-full border-base-content/25 shrink-0 ${v().box}`}
                            checked={task().completed}
                            disabled={props.readOnly}
                            aria-label={task().completed ? `Mark "${task().text}" as not done` : `Mark "${task().text}" as done`}
                            onChange={(e) => toggle(task().id, e.currentTarget)}
                        />
                        <input
                            type="text"
                            maxLength={300}
                            class={`${inputClass} ${v().text} ${task().completed ? 'line-through text-base-content/40' : ''}`}
                            value={task().text}
                            placeholder={props.readOnly ? '' : props.placeholder}
                            disabled={task().completed || props.readOnly}
                            onKeyDown={(e) => {
                                if (isCommitEnter(e)) e.currentTarget.blur();
                                if (e.key === 'Escape') {
                                    e.currentTarget.value = task().text;
                                    e.currentTarget.blur();
                                }
                            }}
                            onBlur={(e) => !props.readOnly && commitText(task().id, e.currentTarget.value)}
                        />
                        <Show when={!task().completed && !props.readOnly}>
                            <button
                                type="button"
                                onClick={() => remove(task().id)}
                                aria-label={`Delete "${task().text}"`}
                                class="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-base-content/30 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            >
                                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </Show>
                    </div>
                )}
            </Index>

            <Show when={props.readOnly && props.items.length === 0 && props.emptyText}>
                <p class="text-sm text-base-content/35 py-1.5">{props.emptyText}</p>
            </Show>

            <Show when={!props.readOnly && (!props.limit || props.items.length < props.limit)}>
                <div class={`flex items-center gap-3 px-2 -mx-2 rounded-lg ${v().row}`}>
                    <div class={`rounded-full border border-dashed border-base-content/25 shrink-0 flex items-center justify-center text-base-content/30 ${v().box}`}>
                        <svg class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true"><path stroke-linecap="round" d="M12 5v14m7-7H5" /></svg>
                    </div>
                    <input
                        type="text"
                        maxLength={300}
                        class={`${inputClass} ${v().text}`}
                        placeholder={props.addPlaceholder}
                        onKeyDown={(e) => isCommitEnter(e) && add(e.currentTarget)}
                        onBlur={(e) => add(e.currentTarget)}
                    />
                    <Show when={props.limit}>
                        <span class="text-xs tabular-nums text-base-content/30 shrink-0">{props.items.length}/{props.limit}</span>
                    </Show>
                </div>
            </Show>
        </div>
    );
};

export default Checklist;

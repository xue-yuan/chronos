import { type Component, createEffect, createMemo, createSignal, For, on, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { habitsStore, type HabitInput } from '../store/habits';
import { daysStore } from '../store/days';
import { today } from '../store/clock';
import { reportError, toast } from '../store/toast';
import TopBar from '../components/timeline/TopBar';
import Page from '../components/timeline/Page';
import Heatmap from '../components/viz/Heatmap';
import { ProgressRing } from '../components/habits/HabitRow';
import { parseDateKey, shiftDateKey, toDateKey, WEEKDAY_SHORT } from '../lib/date';
import type { Habit, HabitLog, HabitMode } from '../lib/model';
import { habitIntensity, habitStreak, isDueOn, isLogDone, nextLog, scheduleLabel } from '../lib/progress';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];
// Monday-first order for the day picker.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const Habits: Component = () => {
    const { habits, addHabit, updateHabit, removeHabit } = habitsStore;

    const [isModalOpen, setIsModalOpen] = createSignal(false);
    const [editId, setEditId] = createSignal<string | null>(null);
    const [confirmDelete, setConfirmDelete] = createSignal<string | null>(null);

    const [name, setName] = createSignal("");
    const [mode, setMode] = createSignal<HabitMode>('checkbox');
    const [unit, setUnit] = createSignal("");
    const [dailyTarget, setDailyTarget] = createSignal<number | null>(null);
    const [increment, setIncrement] = createSignal(1);
    const [frequency, setFrequency] = createSignal<number[]>(ALL_DAYS);

    let nameInput: HTMLInputElement | undefined;

    const todayPlan = () => daysStore.get(today());
    const heatmapFrom = () => shiftDateKey(today(), -7 * 52 - parseDateKey(today()).getDay());

    const stats = createMemo(() => {
        const plans = daysStore.plans();
        const from = daysStore.windowStart();
        return new Map((habits() ?? []).map(h => [h.id, habitStreak(h, plans, today(), from)]));
    });

    const openModal = (habit?: Habit) => {
        setEditId(habit?.id ?? null);
        setName(habit?.name ?? "");
        setMode(habit?.mode ?? 'checkbox');
        setUnit(habit?.unit ?? "");
        setDailyTarget(habit?.dailyTarget ?? null);
        setIncrement(habit?.increment && habit.increment > 0 ? habit.increment : 1);
        setFrequency(habit?.frequency?.length ? [...habit.frequency] : ALL_DAYS);
        setIsModalOpen(true);
        setTimeout(() => nameInput?.focus(), 50);
    };

    const closeModal = () => setIsModalOpen(false);

    const toggleDay = (day: number) => {
        const next = frequency().includes(day) ? frequency().filter(d => d !== day) : [...frequency(), day];
        if (next.length) setFrequency(next.sort((a, b) => a - b));
    };

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        const trimmed = name().trim();
        if (!trimmed) return;
        const quantifiable = mode() === 'quantifiable';
        const habitData: HabitInput = {
            name: trimmed.slice(0, 100),
            mode: mode(),
            dailyTarget: quantifiable && dailyTarget() && dailyTarget()! > 0 ? dailyTarget() : null,
            unit: quantifiable ? unit().trim().slice(0, 20) : "",
            increment: quantifiable && increment() > 0 ? increment() : 1,
            frequency: frequency().length === 7 ? [] : frequency(),
            color: "primary",
        };

        const id = editId();
        (id ? updateHabit(id, habitData) : addHabit(habitData)).catch(reportError(id ? 'Saving habit' : 'Creating habit'));
        closeModal();
    };

    const handleDelete = (habit: Habit) => {
        if (confirmDelete() !== habit.id) {
            setConfirmDelete(habit.id);
            setTimeout(() => setConfirmDelete(c => (c === habit.id ? null : c)), 4000);
            return;
        }
        setConfirmDelete(null);
        removeHabit(habit.id)
            .then(() => toast(`Deleted "${habit.name}"`))
            .catch(reportError('Deleting habit'));
    };

    const [pending, setPending] = createSignal<Record<string, HabitLog>>({});
    createEffect(on(todayPlan, () => setPending({}), { defer: true }));
    const currentLog = (habit: Habit) => pending()[habit.id] ?? todayPlan()?.habitLogs[habit.id];

    const checkIn = (habit: Habit) => {
        const quantity = habit.mode === 'quantifiable';
        const step = habit.increment && habit.increment > 0 ? habit.increment : 1;
        const next = nextLog(habit, currentLog(habit), quantity ? step : 'toggle');
        navigator.vibrate?.(8);
        setPending(p => ({ ...p, [habit.id]: next }));
        daysStore.setHabitLog(today(), habit.id, next, quantity ? step : undefined);
    };

    const fieldLabel = 'text-xs font-medium text-base-content/60 mb-1.5 block';

    return (
        <>
            <TopBar crumbs={[{ label: 'Habits' }]} current={{ href: '/', label: 'Today', active: false }} />
            <Page>
                <div class="flex items-end justify-between gap-4 pt-8 pb-6">
                    <div>
                        <h1 class="text-2xl font-semibold tracking-tight">Habits</h1>
                        <p class="text-sm text-base-content/55 mt-1">Small things, done often. Days a habit isn't scheduled never break its streak.</p>
                    </div>
                    <button onClick={() => openModal()} class="btn btn-neutral btn-sm shrink-0">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" d="M12 5v14m7-7H5" /></svg>
                        New habit
                    </button>
                </div>

                <Show when={habits() !== undefined} fallback={<span class="loading loading-spinner loading-sm text-base-content/30"></span>}>
                    <Show when={habits()!.length > 0} fallback={
                        <div class="rounded-xl border border-dashed border-base-300 py-16 px-6 text-center">
                            <p class="font-medium">No habits yet</p>
                            <p class="text-sm text-base-content/55 mt-1 mb-5">Start with one you can do in under two minutes, every day.</p>
                            <button onClick={() => openModal()} class="btn btn-neutral btn-sm">Create your first habit</button>
                        </div>
                    }>
                        <div class="space-y-3">
                            <For each={habits()}>
                                {(habit) => {
                                    const log = () => currentLog(habit);
                                    const done = () => isLogDone(habit, log());
                                    const value = () => Number(log()?.value) || 0;
                                    const streak = () => stats().get(habit.id) ?? { current: 0, best: 0 };
                                    const created = toDateKey(new Date(habit.createdAt || 0));
                                    return (
                                        <div class="rounded-xl border border-base-300 p-4">
                                            <div class="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    class="shrink-0 rounded-full transition-transform active:scale-90"
                                                    onClick={() => checkIn(habit)}
                                                    aria-label={habit.mode === 'checkbox' ? (done() ? `Undo ${habit.name}` : `Check in ${habit.name}`) : `Add ${habit.increment || 1} to ${habit.name}`}
                                                >
                                                    <ProgressRing
                                                        done={done()}
                                                        progress={habit.mode === 'quantifiable' && habit.dailyTarget ? value() / habit.dailyTarget : done() ? 1 : 0}
                                                    />
                                                </button>
                                                <div class="min-w-0 flex-1">
                                                    <div class="font-medium truncate">{habit.name}</div>
                                                    <div class="text-xs text-base-content/50 mt-0.5 truncate">
                                                        {scheduleLabel(habit)}
                                                        <Show when={habit.mode === 'quantifiable'}>
                                                            {' · '}{habit.dailyTarget ? `${value()} / ${habit.dailyTarget} ${habit.unit || ''} today` : `${value()} ${habit.unit || ''} today`}
                                                        </Show>
                                                        <Show when={!isDueOn(habit, today())}>{' · rest day'}</Show>
                                                    </div>
                                                </div>
                                                <div class="hidden sm:flex items-center gap-5 shrink-0 mr-2 tabular-nums">
                                                    <div class="text-right">
                                                        <div class="font-semibold text-warning">{streak().current}</div>
                                                        <div class="text-[11px] text-base-content/45">streak</div>
                                                    </div>
                                                    <div class="text-right">
                                                        <div class="font-semibold">{streak().best}</div>
                                                        <div class="text-[11px] text-base-content/45">best</div>
                                                    </div>
                                                </div>
                                                <div class="flex items-center shrink-0">
                                                    <button onClick={() => openModal(habit)} class="btn btn-ghost btn-xs">Edit</button>
                                                    <button
                                                        onClick={() => handleDelete(habit)}
                                                        class={`btn btn-xs ${confirmDelete() === habit.id ? 'btn-error' : 'btn-ghost text-error/80'}`}
                                                    >
                                                        {confirmDelete() === habit.id ? 'Confirm' : 'Delete'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="sm:hidden flex gap-4 text-xs text-base-content/55 mt-3 tabular-nums">
                                                <span><span class="font-semibold text-warning">{streak().current}</span> streak</span>
                                                <span><span class="font-semibold text-base-content">{streak().best}</span> best</span>
                                            </div>
                                            <div class="mt-4 overflow-x-auto scrollbar-thin">
                                                <Heatmap
                                                    from={heatmapFrom()}
                                                    to={today()}
                                                    today={today()}
                                                    scrollTo={today()}
                                                    cellSize={12}
                                                    value={(key) => {
                                                        const v = habitIntensity(habit, daysStore.get(key)?.habitLogs[habit.id]);
                                                        if (v > 0) return v;
                                                        return isDueOn(habit, key) && key < today() && key >= created ? 0 : null;
                                                    }}
                                                    title={(key) => {
                                                        const l = daysStore.get(key)?.habitLogs[habit.id];
                                                        const label = parseDateKey(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                                        if (habit.mode === 'quantifiable') return `${label}: ${Number(l?.value) || 0}${habit.unit ? ' ' + habit.unit : ''}`;
                                                        return `${label}: ${isLogDone(habit, l) ? 'Done' : 'Not done'}`;
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                    </Show>
                </Show>
            </Page>

            <Portal>
                <div class={`modal ${isModalOpen() ? 'modal-open' : ''}`} role="dialog" aria-modal="true" aria-label={editId() ? 'Edit habit' : 'New habit'} onKeyDown={(e) => e.key === 'Escape' && closeModal()}>
                    <div class="modal-box bg-base-100 border border-base-300 shadow-xl max-w-lg p-0 overflow-hidden">
                        <div class="px-6 py-4 border-b border-base-300 flex justify-between items-center">
                            <h3 class="font-semibold text-lg">{editId() ? 'Edit habit' : 'New habit'}</h3>
                            <button onClick={closeModal} class="btn btn-sm btn-square btn-ghost text-base-content/50" aria-label="Close">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} class="px-6 py-5 space-y-6">
                            <div>
                                <label class={fieldLabel} for="habit-name">Name</label>
                                <input
                                    id="habit-name"
                                    ref={nameInput}
                                    type="text"
                                    maxLength={100}
                                    class="input w-full"
                                    placeholder="e.g. Read, Meditate, Drink water"
                                    value={name()}
                                    onInput={(e) => setName(e.currentTarget.value)}
                                    required
                                />
                            </div>

                            <div>
                                <span class={fieldLabel}>Schedule</span>
                                <div class="flex flex-wrap gap-1.5">
                                    <For each={DAY_ORDER}>
                                        {(day) => (
                                            <button
                                                type="button"
                                                aria-pressed={frequency().includes(day)}
                                                onClick={() => toggleDay(day)}
                                                class={`btn btn-sm w-12 font-medium ${frequency().includes(day) ? 'btn-neutral' : 'btn-ghost border border-base-300 text-base-content/50'}`}
                                            >
                                                {WEEKDAY_SHORT[day]}
                                            </button>
                                        )}
                                    </For>
                                </div>
                                <div class="flex gap-1 mt-2">
                                    <button type="button" class="btn btn-xs btn-ghost text-base-content/60" onClick={() => setFrequency(ALL_DAYS)}>Every day</button>
                                    <button type="button" class="btn btn-xs btn-ghost text-base-content/60" onClick={() => setFrequency(WEEKDAYS)}>Weekdays</button>
                                </div>
                            </div>

                            <label class="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    class="toggle toggle-sm toggle-primary mt-0.5"
                                    checked={mode() === 'quantifiable'}
                                    onChange={(e) => setMode(e.currentTarget.checked ? 'quantifiable' : 'checkbox')}
                                />
                                <span>
                                    <span class="text-sm font-medium block">Track an amount</span>
                                    <span class="text-xs text-base-content/50">Pages read, glasses of water, minutes... instead of just done / not done.</span>
                                </span>
                            </label>

                            <Show when={mode() === 'quantifiable'}>
                                <div class="grid grid-cols-3 gap-3">
                                    <div>
                                        <label class={fieldLabel} for="habit-target">Daily target</label>
                                        <input id="habit-target" type="number" inputmode="decimal" class="input w-full" placeholder="10" value={dailyTarget() ?? ''}
                                            onInput={(e) => setDailyTarget(e.currentTarget.value ? Number(e.currentTarget.value) : null)} required min="0.01" step="any" />
                                    </div>
                                    <div>
                                        <label class={fieldLabel} for="habit-unit">Unit</label>
                                        <input id="habit-unit" type="text" maxLength={20} class="input w-full" placeholder="pages" value={unit()} onInput={(e) => setUnit(e.currentTarget.value)} />
                                    </div>
                                    <div>
                                        <label class={fieldLabel} for="habit-step">Step</label>
                                        <input id="habit-step" type="number" inputmode="decimal" class="input w-full" value={increment()}
                                            onInput={(e) => setIncrement(Number(e.currentTarget.value) || 1)} min="0.01" step="any" />
                                    </div>
                                </div>
                            </Show>

                            <div class="flex justify-end gap-2 pt-2">
                                <button type="button" class="btn btn-ghost btn-sm" onClick={closeModal}>Cancel</button>
                                <button type="submit" class="btn btn-neutral btn-sm px-5">Save</button>
                            </div>
                        </form>
                    </div>
                    <div class="modal-backdrop bg-base-content/20">
                        <button onClick={closeModal} type="button">close</button>
                    </div>
                </div>
            </Portal>
        </>
    );
};

export default Habits;

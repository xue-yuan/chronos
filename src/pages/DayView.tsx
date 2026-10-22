import { type Component, createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js';
import { A, useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { daysStore } from '../store/days';
import { habitsStore } from '../store/habits';
import { useWeeklyPlan } from '../store/plans';
import { today } from '../store/clock';
import { toast } from '../store/toast';
import TopBar from '../components/timeline/TopBar';
import Horizon from '../components/timeline/Horizon';
import Section from '../components/timeline/Section';
import Page from '../components/timeline/Page';
import { useTimelineKeys } from '../components/timeline/useTimelineKeys';
import Checklist, { isCommitEnter } from '../components/Checklist';
import ContextList from '../components/ContextList';
import HabitRow from '../components/habits/HabitRow';
import { celebrate } from '../lib/celebrate';
import { MONTHS, parseDateKey, shiftDateKey, WEEKDAY_SHORT } from '../lib/date';
import { MEDIUM_LIMIT, SMALL_LIMIT, newId, type Task } from '../lib/model';
import { daysOfWeek, href, isValidDateKey, monthOfDay, sameWeek, weekOfDay } from '../lib/period';
import { dayStatus, habitStreak } from '../lib/progress';

const CARRY_DISMISS_KEY = 'chronos:carry-dismissed';

const DayView: Component = () => {
    const params = useParams<{ date?: string }>();
    const [search] = useSearchParams<{ date?: string }>();
    const navigate = useNavigate();

    onMount(() => {
        if (isValidDateKey(search.date)) navigate(href.day(search.date, today()), { replace: true });
    });

    const viewKey = createMemo(() => (isValidDateKey(params.date) ? params.date : today()));
    const isToday = () => viewKey() === today();
    const isPast = () => viewKey() < today();
    const date = () => parseDateKey(viewKey());

    createEffect(() => daysStore.requireYear(date().getFullYear()));

    const habits = () => habitsStore.habits() ?? [];
    const plan = () => daysStore.get(viewKey());
    const ready = () => daysStore.ready() && habitsStore.habits() !== undefined;
    const status = createMemo(() => dayStatus(plan(), habits(), viewKey()));
    const save = (patch: Parameters<typeof daysStore.save>[1]) => {
        if (!isPast()) daysStore.save(viewKey(), patch);
    };

    const week = createMemo(() => weekOfDay(viewKey()), undefined, { equals: sameWeek });
    const month = () => monthOfDay(viewKey());
    const weekly = useWeeklyPlan(week);

    const streaks = createMemo(() => {
        const plans = daysStore.plans();
        const from = daysStore.windowStart();
        return new Map(habits().map(h => [h.id, habitStreak(h, plans, today(), from).current]));
    });

    const restDayHabits = () => {
        if (!isToday()) return [];
        const due = new Set(status().dueHabits.map(h => h.id));
        return habits().filter(h => !due.has(h.id));
    };

    useTimelineKeys({
        prev: () => href.day(shiftDateKey(viewKey(), -1), today()),
        next: () => href.day(shiftDateKey(viewKey(), 1), today()),
        current: () => '/',
        parent: () => href.week(week()),
    });

    const strip = createMemo(() => daysOfWeek(week()).map(key => {
        const d = parseDateKey(key);
        const p = daysStore.get(key);
        const s = p ? dayStatus(p, habits(), key) : null;
        return {
            key,
            label: WEEKDAY_SHORT[d.getDay()],
            sub: String(d.getDate()),
            href: href.day(key, today()),
            ratio: s && s.total > 0 ? s.ratio : null,
            complete: s?.complete,
            selected: key === viewKey(),
            current: key === today(),
            future: key > today(),
        };
    }));

    let bigThingRef: HTMLTextAreaElement | undefined;
    const autoSize = (el: HTMLTextAreaElement) => {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };
    createEffect(on(() => plan()?.bigThing.text, () => bigThingRef && requestAnimationFrame(() => autoSize(bigThingRef!))));
    onMount(() => {
        const onResize = () => bigThingRef && autoSize(bigThingRef);
        window.addEventListener('resize', onResize);
        onCleanup(() => window.removeEventListener('resize', onResize));
    });

    const commitBigThing = (raw: string) => {
        const text = raw.trim().replace(/\s*\n\s*/g, ' ');
        if (text !== (plan()?.bigThing.text ?? '')) save({ bigThing: { text } });
    };

    const toggleBigThing = (el: HTMLElement) => {
        const done = !plan()?.bigThing.completed;
        save({ bigThing: { completed: done } });
        if (done) celebrate(el);
    };

    createEffect(on(() => [viewKey(), status().complete] as const, ([key, complete], prev) => {
        if (prev && prev[0] === key && !prev[1] && complete && key === today()) celebrate(null, true);
    }, { defer: true }));

    const readDismissed = () => {
        try { return localStorage.getItem(CARRY_DISMISS_KEY); } catch { return null; }
    };
    const [dismissedFor, setDismissedFor] = createSignal(readDismissed());

    const carryOver = createMemo(() => {
        if (!isToday() || !ready() || dismissedFor() === today()) return null;
        const prev = daysStore.get(shiftDateKey(today(), -1));
        if (!prev) return null;
        const current = plan();
        const existing = new Set([...(current?.mediumThings ?? []), ...(current?.smallThings ?? [])].map(t => t.text.trim()));
        const open = (list: Task[]) => list.filter(t => !t.completed && t.text.trim() && !existing.has(t.text.trim()));
        const bigThing = !prev.bigThing.completed && prev.bigThing.text.trim() && !current?.bigThing.text.trim() ? prev.bigThing.text.trim() : null;
        const medium = open(prev.mediumThings);
        const small = open(prev.smallThings);
        const count = (bigThing ? 1 : 0) + medium.length + small.length;
        return count ? { bigThing, medium, small, count } : null;
    });

    const applyCarryOver = () => {
        const c = carryOver();
        if (!c) return;
        const fresh = (t: Task) => ({ id: newId(), text: t.text.trim(), completed: false });
        const medium = [...(plan()?.mediumThings ?? [])];
        const small = [...(plan()?.smallThings ?? [])];
        let dropped = 0;
        for (const t of c.medium) {
            if (medium.length < MEDIUM_LIMIT) medium.push(fresh(t));
            else if (small.length < SMALL_LIMIT) small.push(fresh(t));
            else dropped++;
        }
        for (const t of c.small) {
            if (small.length < SMALL_LIMIT) small.push(fresh(t));
            else dropped++;
        }
        save({
            ...(c.bigThing ? { bigThing: { text: c.bigThing, completed: false } } : {}),
            mediumThings: medium,
            smallThings: small,
        });
        if (dropped) toast(`${dropped} ${dropped === 1 ? "item didn't" : "items didn't"} fit today's 1-3-5 limits`, 'info');
    };

    const dismissCarryOver = () => {
        try { localStorage.setItem(CARRY_DISMISS_KEY, today()); } catch { /* ignore */ }
        setDismissedFor(today());
    };

    let noteRef: HTMLTextAreaElement | undefined;
    let noteTimer: number | undefined;
    let noteFocused = false;
    createEffect(on(() => [viewKey(), plan()?.note] as const, ([, note]) => {
        if (noteRef && !noteFocused) {
            noteRef.value = note ?? '';
            requestAnimationFrame(() => noteRef && autoSize(noteRef));
        }
    }));
    const flushNote = () => {
        clearTimeout(noteTimer);
        if (!noteRef || isPast()) return;
        if (noteRef.value !== (plan()?.note ?? '')) save({ note: noteRef.value });
    };
    onCleanup(flushNote);

    const taskCount = (list: Task[] | undefined) => (list?.length ? `${list.filter(t => t.completed).length}/${list.length}` : undefined);

    return (
        <>
            <TopBar
                crumbs={[
                    { label: String(date().getFullYear()), href: href.year(date().getFullYear()) },
                    { label: MONTHS[month().month], short: MONTHS[month().month].slice(0, 3), href: href.month(month()) },
                    { label: `Week ${week().week}`, short: `W${week().week}`, href: href.week(week()) },
                    { label: date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }), short: `${WEEKDAY_SHORT[date().getDay()]} ${date().getDate()}` },
                ]}
                current={{ href: '/', label: 'Today', active: isToday() }}
            />
            <Page>
                <Horizon
                    items={strip()}
                    prev={{ href: href.day(shiftDateKey(viewKey(), -7), today()), label: 'Previous week' }}
                    next={{ href: href.day(shiftDateKey(viewKey(), 7), today()), label: 'Next week' }}
                />

                <Show when={weekly.ready()}>
                    <ContextList
                        title={`Week ${week().week}`}
                        items={weekly.data()?.goals ?? []}
                        href={href.week(week())}
                        emptyText={isPast() ? 'No goals were set.' : 'No goals for this week yet.'}
                    />
                </Show>

                <Show when={carryOver()}>
                    {(c) => (
                        <div class="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-base-300 bg-base-200/60 px-4 py-3">
                            <p class="flex-1 text-sm">
                                <span class="font-medium">{c().count} unfinished {c().count === 1 ? 'item' : 'items'} from yesterday</span>
                                <Show when={c().bigThing}><span class="text-base-content/55">, including "{c().bigThing}"</span></Show>
                            </p>
                            <div class="flex gap-2">
                                <button class="btn btn-sm btn-neutral" onClick={applyCarryOver}>Bring to today</button>
                                <button class="btn btn-sm btn-ghost" onClick={dismissCarryOver}>Dismiss</button>
                            </div>
                        </div>
                    )}
                </Show>

                <section class="mt-8 mb-12">
                    <div class="flex items-center justify-between mb-2 gap-4">
                        <h2 class="text-xs font-semibold uppercase tracking-wider text-base-content/50">The one thing</h2>
                        <Show when={ready() && status().total > 0}>
                            <Show when={status().complete} fallback={
                                <span class="text-xs tabular-nums text-base-content/50">{status().done} of {status().total} done</span>
                            }>
                                <span class="text-xs font-semibold text-success">Perfect day ✓</span>
                            </Show>
                        </Show>
                    </div>
                    <div class="flex items-start gap-4">
                        <textarea
                            ref={bigThingRef}
                            rows={1}
                            maxLength={300}
                            aria-label="The one thing for this day"
                            placeholder={isPast() ? 'Nothing was set.' : 'What is the one thing that would make today a win?'}
                            class={`flex-1 min-w-0 bg-transparent border-0 outline-none resize-none overflow-hidden p-0 text-2xl md:text-4xl font-semibold tracking-tight leading-tight placeholder:text-base-content/25 disabled:cursor-default ${plan()?.bigThing.completed ? 'line-through text-base-content/40' : ''}`}
                            value={plan()?.bigThing.text ?? ''}
                            disabled={!ready() || plan()?.bigThing.completed || isPast()}
                            onInput={(e) => autoSize(e.currentTarget)}
                            onKeyDown={(e) => {
                                if (isCommitEnter(e)) {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                }
                            }}
                            onBlur={(e) => commitBigThing(e.currentTarget.value)}
                        />
                        <button
                            type="button"
                            class={`shrink-0 mt-0.5 md:mt-1 w-9 h-9 md:w-11 md:h-11 rounded-full border-2 flex items-center justify-center transition-colors disabled:cursor-not-allowed ${plan()?.bigThing.completed ? 'bg-primary border-primary text-primary-content' : 'border-base-content/20 text-base-content/25 hover:border-primary hover:text-primary disabled:hover:border-base-content/20 disabled:hover:text-base-content/25'}`}
                            disabled={!plan()?.bigThing.text.trim() || isPast()}
                            aria-pressed={plan()?.bigThing.completed ?? false}
                            aria-label={plan()?.bigThing.completed ? 'Mark the one thing as not done' : 'Mark the one thing as done'}
                            onClick={(e) => toggleBigThing(e.currentTarget)}
                        >
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </button>
                    </div>
                    <div class="h-1 rounded-full bg-base-300 mt-6 overflow-hidden">
                        <div class={`h-full rounded-full transition-[width] duration-500 ${status().complete ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.round(status().ratio * 100)}%` }}></div>
                    </div>
                </section>

                <div class="grid md:grid-cols-2 gap-x-12 gap-y-10 mb-12">
                    <Section title="Crucial results" meta={taskCount(plan()?.mediumThings)}>
                        <Show when={ready()} fallback={<span class="loading loading-spinner loading-sm text-base-content/30"></span>}>
                            <Checklist
                                items={plan()?.mediumThings ?? []}
                                limit={MEDIUM_LIMIT}
                                readOnly={isPast()}
                                placeholder="A crucial result..."
                                addPlaceholder="Add a crucial result"
                                emptyText="Nothing planned."
                                onChange={(mediumThings) => save({ mediumThings })}
                            />
                        </Show>
                    </Section>
                    <Section title="Quick wins" meta={taskCount(plan()?.smallThings)}>
                        <Show when={ready()} fallback={<span class="loading loading-spinner loading-sm text-base-content/30"></span>}>
                            <Checklist
                                items={plan()?.smallThings ?? []}
                                limit={SMALL_LIMIT}
                                readOnly={isPast()}
                                placeholder="A quick win..."
                                addPlaceholder="Add a quick win"
                                emptyText="Nothing planned."
                                onChange={(smallThings) => save({ smallThings })}
                            />
                        </Show>
                    </Section>
                </div>

                <Section
                    title="Habits"
                    meta={status().dueHabits.length ? `${status().habitsDone}/${status().dueHabits.length}` : undefined}
                    action={<A href="/habits" class="text-xs font-medium text-base-content/50 hover:text-base-content">Manage</A>}
                    class="mb-12"
                >
                    <Show when={ready()} fallback={<span class="loading loading-spinner loading-sm text-base-content/30"></span>}>
                        <Show when={habits().length > 0} fallback={
                            <p class="text-sm text-base-content/50 py-1">No habits yet. <A href="/habits" class="link link-primary">Create your first one</A>; something you can do in two minutes.</p>
                        }>
                            <Show when={!(isPast() && !plan())} fallback={<p class="text-sm text-base-content/40 py-1">No records for this day.</p>}>
                                <div class="grid sm:grid-cols-2 gap-2">
                                    <For each={status().dueHabits}>
                                        {(habit) => (
                                            <HabitRow
                                                habit={habit}
                                                log={plan()?.habitLogs[habit.id]}
                                                streak={isToday() ? streaks().get(habit.id) : undefined}
                                                readOnly={!isToday()}
                                                onLog={(log, delta) => isToday() && daysStore.setHabitLog(viewKey(), habit.id, log, delta)}
                                            />
                                        )}
                                    </For>
                                    <For each={restDayHabits()}>
                                        {(habit) => (
                                            <HabitRow
                                                habit={habit}
                                                log={plan()?.habitLogs[habit.id]}
                                                restDay
                                                onLog={(log, delta) => daysStore.setHabitLog(viewKey(), habit.id, log, delta)}
                                            />
                                        )}
                                    </For>
                                </div>
                                <Show when={status().dueHabits.length === 0 && restDayHabits().length === 0}>
                                    <p class="text-sm text-base-content/40 py-1">No habits scheduled for this day.</p>
                                </Show>
                            </Show>
                        </Show>
                    </Show>
                </Section>

                <Section title="Notes">
                    <textarea
                        ref={noteRef}
                        rows={3}
                        maxLength={5000}
                        class="w-full bg-transparent border-0 outline-none resize-none overflow-hidden p-0 text-[15px] leading-relaxed placeholder:text-base-content/30"
                        placeholder={isPast() ? 'No notes for this day.' : 'What went well? What would you change?'}
                        disabled={!ready() || isPast()}
                        onFocus={() => { noteFocused = true; }}
                        onInput={(e) => {
                            autoSize(e.currentTarget);
                            clearTimeout(noteTimer);
                            noteTimer = window.setTimeout(flushNote, 1200);
                        }}
                        onBlur={() => {
                            noteFocused = false;
                            flushNote();
                        }}
                    />
                </Section>
            </Page>
        </>
    );
};

export default DayView;

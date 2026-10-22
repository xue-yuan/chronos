import { type Component, createEffect, createMemo, For, Show } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { deleteField } from 'firebase/firestore';
import { useMonthlyPlan, useWeeklyPlan } from '../store/plans';
import { daysStore } from '../store/days';
import { habitsStore } from '../store/habits';
import { today } from '../store/clock';
import TopBar from '../components/timeline/TopBar';
import Horizon from '../components/timeline/Horizon';
import Section from '../components/timeline/Section';
import Page from '../components/timeline/Page';
import { useTimelineKeys } from '../components/timeline/useTimelineKeys';
import Checklist from '../components/Checklist';
import ContextList from '../components/ContextList';
import Stat from '../components/Stat';
import { compareWeek, MONTHS, parseDateKey, shiftIsoWeek, WEEKDAY_SHORT } from '../lib/date';
import { daysOfWeek, href, monthOfWeek, parseWeekParam, sameWeek, shiftMonth, weekOfDay, weeksOfMonth, type WeekRef } from '../lib/period';
import { dayStatus, rangeSummary } from '../lib/progress';
import type { Task } from '../lib/model';

const shortDate = (key: string) => parseDateKey(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const WeekView: Component = () => {
    const params = useParams<{ week?: string }>();
    const current = () => weekOfDay(today());
    const view = createMemo(() => parseWeekParam(params.week) ?? current(), undefined, { equals: sameWeek });
    const month = () => monthOfWeek(view());
    const isPast = () => compareWeek(view(), current()) < 0;
    const days = createMemo(() => daysOfWeek(view()));
    const habits = () => habitsStore.habits() ?? [];

    createEffect(() => daysStore.requireYear(parseDateKey(days()[0]).getFullYear()));

    const weekly = useWeeklyPlan(view);
    const monthly = useMonthlyPlan(month);

    const summary = (w: WeekRef) => rangeSummary(daysOfWeek(w), daysStore.get, habits(), today());

    useTimelineKeys({
        prev: () => href.week(shiftIsoWeek(view().year, view().week, -1)),
        next: () => href.week(shiftIsoWeek(view().year, view().week, 1)),
        current: () => '/week',
        parent: () => href.month(month()),
    });

    const strip = createMemo(() => weeksOfMonth(month()).map(w => {
        const keys = daysOfWeek(w);
        const s = summary(w);
        return {
            key: `${w.year}-${w.week}`,
            label: `W${w.week}`,
            sub: `${parseDateKey(keys[0]).getDate()}–${parseDateKey(keys[6]).getDate()}`,
            href: href.week(w),
            ratio: s.ratio,
            complete: s.tracked > 0 && s.perfect === s.tracked,
            selected: sameWeek(w, view()),
            current: sameWeek(w, current()),
            future: keys[0] > today(),
        };
    }));

    const stats = createMemo(() => summary(view()));

    const saveGoals = (goals: Task[]) => {
        if (isPast()) return;
        weekly.save({ goals, focus: deleteField() });
    };

    return (
        <>
            <TopBar
                crumbs={[
                    { label: String(month().year), href: href.year(month().year) },
                    { label: MONTHS[month().month], short: MONTHS[month().month].slice(0, 3), href: href.month(month()) },
                    { label: `Week ${view().week} · ${shortDate(days()[0])} – ${shortDate(days()[6])}`, short: `W${view().week}` },
                ]}
                current={{ href: '/week', label: 'This week', active: sameWeek(view(), current()) }}
            />
            <Page>
                <Horizon
                    items={strip()}
                    prev={{ href: href.week(weeksOfMonth(shiftMonth(month(), -1))[0]), label: 'Previous month' }}
                    next={{ href: href.week(weeksOfMonth(shiftMonth(month(), 1))[0]), label: 'Next month' }}
                />

                <Show when={monthly.ready()}>
                    <ContextList title={MONTHS[month().month]} items={monthly.data()?.milestones ?? []} href={href.month(month())} emptyText="No milestones for this month yet." />
                </Show>

                <Section title="Week goals" class="mt-8 mb-12" meta={weekly.data()?.goals.length ? `${weekly.data()!.goals.filter(g => g.completed).length}/${weekly.data()!.goals.length}` : undefined}>
                    <Show when={weekly.ready()} fallback={<span class="loading loading-spinner loading-sm text-base-content/30"></span>}>
                        <Checklist
                            variant="large"
                            items={weekly.data()?.goals ?? []}
                            readOnly={isPast()}
                            placeholder="A goal for this week..."
                            addPlaceholder="Add a goal for this week"
                            emptyText="No goals were set this week."
                            onChange={saveGoals}
                        />
                    </Show>
                </Section>

                <Section title="Days" class="mb-12">
                    <div class="grid grid-cols-1 sm:grid-cols-7 gap-2">
                        <For each={days()}>
                            {(key) => {
                                const plan = () => daysStore.get(key);
                                const status = () => dayStatus(plan(), habits(), key);
                                const isFuture = () => key > today();
                                return (
                                    <A
                                        href={href.day(key, today())}
                                        class={`rounded-xl border p-3 flex sm:flex-col gap-3 sm:gap-2 items-center sm:items-stretch sm:min-h-36 transition-colors hover:bg-base-200/70 ${key === today() ? 'border-primary/50' : 'border-base-300'} ${isFuture() ? 'opacity-60' : ''}`}
                                    >
                                        <div class="flex sm:flex-col items-baseline gap-2 sm:gap-0 w-16 sm:w-auto shrink-0">
                                            <span class={`text-[11px] font-medium uppercase tracking-wide ${key === today() ? 'text-primary' : 'text-base-content/45'}`}>{WEEKDAY_SHORT[parseDateKey(key).getDay()]}</span>
                                            <span class="text-lg font-semibold tabular-nums">{parseDateKey(key).getDate()}</span>
                                        </div>
                                        <p class={`text-sm leading-snug flex-1 min-w-0 truncate sm:whitespace-normal sm:line-clamp-3 ${plan()?.bigThing.completed ? 'line-through text-base-content/40' : 'text-base-content/75'}`}>
                                            {plan()?.bigThing.text || (isFuture() ? '' : '—')}
                                        </p>
                                        <Show when={!isFuture() && status().total > 0}>
                                            <div class="flex items-center gap-2 sm:mt-auto shrink-0 w-20 sm:w-auto">
                                                <div class="h-1 flex-1 bg-base-300 rounded-full overflow-hidden">
                                                    <div class={`h-full rounded-full ${status().complete ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.round(status().ratio * 100)}%` }}></div>
                                                </div>
                                                <span class="text-[11px] tabular-nums text-base-content/45">{status().done}/{status().total}</span>
                                            </div>
                                        </Show>
                                    </A>
                                );
                            }}
                        </For>
                    </div>
                </Section>

                <Show when={stats().tracked > 0}>
                    <div class="grid grid-cols-3 gap-2">
                        <Stat label="Perfect days" value={stats().perfect} />
                        <Stat label="Days tracked" value={stats().tracked} />
                        <Stat label="Avg. completion" value={`${Math.round((stats().ratio ?? 0) * 100)}%`} />
                    </div>
                </Show>
            </Page>
        </>
    );
};

export default WeekView;

import { type Component, createEffect, createMemo, For, Show } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { useAnnualPlan, useMonthlyPlan } from '../store/plans';
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
import { MONTHS, parseDateKey } from '../lib/date';
import { daysOfMonth, href, monthGrid, monthOfDay, parseMonthParam, sameMonth, sameWeek, shiftMonth, weekOfDay, type MonthRef } from '../lib/period';
import { dayStatus, rangeSummary } from '../lib/progress';

const QUARTERS = ['Q1', 'Q1', 'Q1', 'Q2', 'Q2', 'Q2', 'Q3', 'Q3', 'Q3', 'Q4', 'Q4', 'Q4'];

const MonthView: Component = () => {
    const params = useParams<{ month?: string }>();
    const current = () => monthOfDay(today());
    const view = createMemo(() => parseMonthParam(params.month) ?? current(), undefined, { equals: sameMonth });
    const isPast = () => view().year < current().year || (view().year === current().year && view().month < current().month);
    const habits = () => habitsStore.habits() ?? [];

    createEffect(() => daysStore.requireYear(view().year));

    const monthly = useMonthlyPlan(view);
    const annual = useAnnualPlan(() => view().year);

    const summary = (m: MonthRef) => rangeSummary(daysOfMonth(m), daysStore.get, habits(), today());

    useTimelineKeys({
        prev: () => href.month(shiftMonth(view(), -1)),
        next: () => href.month(shiftMonth(view(), 1)),
        current: () => '/month',
        parent: () => href.year(view().year),
    });

    const strip = createMemo(() => MONTHS.map((name, month) => {
        const m = { year: view().year, month };
        const s = summary(m);
        return {
            key: String(month),
            label: QUARTERS[month],
            sub: name.slice(0, 3),
            href: href.month(m),
            ratio: s.ratio,
            complete: s.tracked > 0 && s.perfect === s.tracked,
            selected: month === view().month,
            current: sameMonth(m, current()),
            future: daysOfMonth(m)[0] > today(),
        };
    }));

    const grid = createMemo(() => monthGrid(view()));
    const stats = createMemo(() => summary(view()));

    return (
        <>
            <TopBar
                crumbs={[
                    { label: String(view().year), href: href.year(view().year) },
                    { label: MONTHS[view().month], short: MONTHS[view().month].slice(0, 3) },
                ]}
                current={{ href: '/month', label: 'This month', active: sameMonth(view(), current()) }}
            />
            <Page>
                <Horizon
                    items={strip()}
                    prev={{ href: href.month({ year: view().year - 1, month: view().month }), label: 'Previous year' }}
                    next={{ href: href.month({ year: view().year + 1, month: view().month }), label: 'Next year' }}
                />

                <Show when={annual.ready()}>
                    <ContextList title={String(view().year)} items={annual.data()?.goals ?? []} href={href.year(view().year)} emptyText="No goals for this year yet." />
                </Show>

                <Section title="Milestones" class="mt-8 mb-12" meta={monthly.data()?.milestones.length ? `${monthly.data()!.milestones.filter(m => m.completed).length}/${monthly.data()!.milestones.length}` : undefined}>
                    <Show when={monthly.ready()} fallback={<span class="loading loading-spinner loading-sm text-base-content/30"></span>}>
                        <Checklist
                            variant="large"
                            items={monthly.data()?.milestones ?? []}
                            readOnly={isPast()}
                            placeholder="A milestone..."
                            addPlaceholder="Add a milestone for this month"
                            emptyText="No milestones were set this month."
                            onChange={(milestones) => !isPast() && monthly.save({ milestones })}
                        />
                    </Show>
                </Section>

                <Section title="Calendar" class="mb-12">
                    <div class="grid grid-cols-[2rem_repeat(7,minmax(0,1fr))] gap-1 sm:gap-1.5">
                        <div></div>
                        <For each={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}>
                            {(d) => <div class="text-[11px] font-medium uppercase tracking-wide text-base-content/40 px-1 pb-1">{d}</div>}
                        </For>
                        <For each={grid()}>
                            {(row) => (
                                <>
                                    <A href={href.week(row.week)} title={`Week ${row.week.week}`} class={`text-[11px] tabular-nums rounded-md flex items-center justify-center hover:bg-base-200 ${sameWeek(row.week, weekOfDay(today())) ? 'text-primary font-semibold' : 'text-base-content/35'}`}>
                                        {row.week.week}
                                    </A>
                                    <For each={row.days}>
                                        {(day) => {
                                            const plan = () => daysStore.get(day.key);
                                            const status = () => (plan() ? dayStatus(plan(), habits(), day.key) : null);
                                            const isFuture = day.key > today();
                                            return (
                                                <A
                                                    href={href.day(day.key, today())}
                                                    class={`relative rounded-lg border p-1.5 sm:p-2 h-14 sm:h-24 flex flex-col gap-1 overflow-hidden transition-colors hover:bg-base-200/70 ${day.key === today() ? 'border-primary/60' : 'border-base-300'} ${day.inMonth ? '' : 'opacity-35'} ${status()?.complete ? 'bg-success/10' : ''}`}
                                                >
                                                    <span class={`text-xs sm:text-sm tabular-nums font-medium ${day.key === today() ? 'text-primary' : isFuture ? 'text-base-content/45' : ''}`}>{parseDateKey(day.key).getDate()}</span>
                                                    <span class="hidden sm:block text-[11px] leading-snug text-base-content/55 line-clamp-2">{plan()?.bigThing.text}</span>
                                                    <Show when={status() && status()!.total > 0}>
                                                        <div class="mt-auto h-1 rounded-full bg-base-300 overflow-hidden">
                                                            <div class={`h-full rounded-full ${status()!.complete ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.round(status()!.ratio * 100)}%` }}></div>
                                                        </div>
                                                    </Show>
                                                </A>
                                            );
                                        }}
                                    </For>
                                </>
                            )}
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

export default MonthView;

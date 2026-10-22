import { type Component, createEffect, createMemo, For, Show } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { useAnnualPlan, useMonthlyPlansOfYear } from '../store/plans';
import { daysStore } from '../store/days';
import { habitsStore } from '../store/habits';
import { today } from '../store/clock';
import TopBar from '../components/timeline/TopBar';
import Horizon from '../components/timeline/Horizon';
import Section from '../components/timeline/Section';
import Page from '../components/timeline/Page';
import { useTimelineKeys } from '../components/timeline/useTimelineKeys';
import Checklist from '../components/Checklist';
import Stat from '../components/Stat';
import Heatmap from '../components/viz/Heatmap';
import { celebrate } from '../lib/celebrate';
import { MONTHS, parseDateKey, shiftDateKey } from '../lib/date';
import { daysOfMonth, daysOfYear, href, monthOfDay, parseYearParam, sameMonth } from '../lib/period';
import { dayStatus, rangeSummary } from '../lib/progress';

const YearView: Component = () => {
    const params = useParams<{ year?: string }>();
    const navigate = useNavigate();
    const currentYear = () => parseDateKey(today()).getFullYear();
    const year = createMemo(() => parseYearParam(params.year) ?? currentYear());
    const isPast = () => year() < currentYear();
    const habits = () => habitsStore.habits() ?? [];

    createEffect(() => daysStore.requireYear(year()));

    const annual = useAnnualPlan(year);
    const monthPlans = useMonthlyPlansOfYear(year);

    const statusFor = (key: string) => {
        const plan = daysStore.get(key);
        return plan ? dayStatus(plan, habits(), key) : null;
    };

    useTimelineKeys({
        prev: () => href.year(year() - 1),
        next: () => href.year(year() + 1),
        current: () => '/year',
    });

    const strip = createMemo(() => Array.from({ length: 5 }, (_, i) => year() - 2 + i).map(y => {
        const loaded = `${y}-01-01` >= daysStore.windowStart() || y === year();
        const s = loaded ? rangeSummary(daysOfYear(y), daysStore.get, habits(), today()) : null;
        return {
            key: String(y),
            sub: String(y),
            href: href.year(y),
            ratio: s?.ratio ?? null,
            complete: false,
            selected: y === year(),
            current: y === currentYear(),
            future: y > currentYear(),
        };
    }));

    const yearStats = createMemo(() => {
        const last = year() === currentYear() ? today() : `${year()}-12-31`;
        let perfect = 0;
        let tracked = 0;
        let run = 0;
        let best = 0;
        for (let key = `${year()}-01-01`; key <= last; key = shiftDateKey(key, 1)) {
            const s = statusFor(key);
            if (s && s.total > 0) tracked++;
            if (s?.complete) {
                perfect++;
                run++;
                best = Math.max(best, run);
            } else if (key !== today()) {
                run = 0;
            }
        }
        return { perfect, tracked, best };
    });

    const months = createMemo(() => MONTHS.map((name, month) => {
        const m = { year: year(), month };
        const milestones = monthPlans().get(month)?.milestones ?? [];
        return {
            m,
            name,
            milestones,
            summary: rangeSummary(daysOfMonth(m), daysStore.get, habits(), today()),
            current: sameMonth(m, monthOfDay(today())),
            future: daysOfMonth(m)[0] > today(),
        };
    }));

    return (
        <>
            <TopBar
                crumbs={[{ label: String(year()) }]}
                current={{ href: '/year', label: 'This year', active: year() === currentYear() }}
            />
            <Page>
                <Horizon
                    items={strip()}
                    prev={{ href: href.year(year() - 1), label: 'Previous year' }}
                    next={{ href: href.year(year() + 1), label: 'Next year' }}
                />

                <Section title="Vision" class="mt-6 mb-12" meta={annual.data()?.goals.length ? `${annual.data()!.goals.filter(g => g.completed).length}/${annual.data()!.goals.length}` : undefined}>
                    <Show when={annual.ready()} fallback={<span class="loading loading-spinner loading-sm text-base-content/30"></span>}>
                        <Checklist
                            variant="large"
                            items={annual.data()?.goals ?? []}
                            readOnly={isPast()}
                            placeholder="A goal for the year..."
                            addPlaceholder="Add a goal for the year"
                            emptyText="No goals were set this year."
                            onChange={(goals) => !isPast() && annual.save({ goals })}
                            onComplete={(_, el) => celebrate(el, true)}
                        />
                    </Show>
                </Section>

                <div class="grid grid-cols-3 gap-2 mb-12">
                    <Stat label="Perfect days" value={yearStats().perfect} />
                    <Stat label="Longest streak" value={yearStats().best} />
                    <Stat label="Days tracked" value={yearStats().tracked} />
                </div>

                <Section title="Months" class="mb-12">
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        <For each={months()}>
                            {(item) => (
                                <A
                                    href={href.month(item.m)}
                                    class={`rounded-xl border p-3 flex flex-col gap-2 min-h-32 transition-colors hover:bg-base-200/70 ${item.current ? 'border-primary/50' : 'border-base-300'} ${item.future ? 'opacity-60' : ''}`}
                                >
                                    <div class="flex items-baseline justify-between gap-2">
                                        <span class={`font-semibold ${item.current ? 'text-primary' : ''}`}>{item.name}</span>
                                        <Show when={item.summary.perfect > 0}>
                                            <span class="text-[11px] tabular-nums text-success" title="Perfect days">{item.summary.perfect} ✓</span>
                                        </Show>
                                    </div>
                                    <ul class="space-y-0.5 min-w-0">
                                        <For each={item.milestones.slice(0, 3)}>
                                            {(ms) => <li class={`text-xs truncate ${ms.completed ? 'line-through text-base-content/35' : 'text-base-content/65'}`}>{ms.text}</li>}
                                        </For>
                                        <Show when={item.milestones.length > 3}>
                                            <li class="text-xs text-base-content/40">+{item.milestones.length - 3} more</li>
                                        </Show>
                                    </ul>
                                    <div class="mt-auto h-1 rounded-full bg-base-300 overflow-hidden">
                                        <Show when={item.summary.ratio !== null}>
                                            <div class="h-full rounded-full bg-primary" style={{ width: `${Math.round((item.summary.ratio ?? 0) * 100)}%` }}></div>
                                        </Show>
                                    </div>
                                </A>
                            )}
                        </For>
                    </div>
                </Section>

                <Section title="Consistency">
                    <div class="overflow-x-auto scrollbar-thin">
                        <Show when={daysStore.ready()} fallback={<span class="loading loading-spinner loading-sm text-base-content/30"></span>}>
                            <Heatmap
                                from={`${year()}-01-01`}
                                to={`${year()}-12-31`}
                                today={today()}
                                scrollTo={year() === currentYear() ? today() : undefined}
                                value={(key) => {
                                    if (key > today()) return null;
                                    const s = statusFor(key);
                                    if (!s || s.total === 0) return null;
                                    return s.complete ? 1 : s.ratio * 0.95;
                                }}
                                title={(key) => {
                                    const label = parseDateKey(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                    const s = statusFor(key);
                                    if (!s || s.total === 0) return `${label}: no data`;
                                    return `${label}: ${s.done}/${s.total} done${s.complete ? ' · perfect day' : ''}`;
                                }}
                                onSelect={(key) => key <= today() && navigate(href.day(key, today()))}
                            />
                        </Show>
                    </div>
                </Section>
            </Page>
        </>
    );
};

export default YearView;

import { type Component, createEffect, Show, Index, onMount, createSignal, For } from 'solid-js';
import { plansStore } from '../store/plans';
import { Motion, Presence } from 'solid-motionone';

const WeeklyView: Component = () => {
    const {
        weeklyPlan, ensureWeeklyPlan, updateWeeklyPlan,
        weeklyViewYear, weeklyViewWeek, prevWeek, nextWeek,
        resetWeeklyView, setWeeklyViewYear, setWeeklyViewWeek,
        getWeekNumber
    } = plansStore;

    onMount(() => {
        resetWeeklyView();
    });

    createEffect(() => {
        ensureWeeklyPlan();
    });

    const [isPickerOpen, setIsPickerOpen] = createSignal(false);

    const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

    const togglePicker = () => setIsPickerOpen(!isPickerOpen());

    const selectWeek = (w: number) => {
        setWeeklyViewWeek(w);
        setIsPickerOpen(false);
    };

    const selectYear = (year: number) => {
        setWeeklyViewYear(year);
    };

    const isPastWeek = () => {
        const currentYear = new Date().getFullYear();
        const currentWeek = getWeekNumber(new Date());

        if (weeklyViewYear() < currentYear) return true;
        if (weeklyViewYear() === currentYear && weeklyViewWeek() < currentWeek) return true;
        return false;
    };

    const addGoal = (text: string) => {
        if (isPastWeek() || !text.trim()) return;
        const currentGoals = weeklyPlan()?.goals || [];
        updateWeeklyPlan({
            goals: [...currentGoals, { id: crypto.randomUUID(), text: text.trim(), completed: false }]
        });
    };

    const handleNewGoalKeyDown = (e: KeyboardEvent, text: string) => {
        if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            addGoal(text);
            (e.target as HTMLInputElement).value = '';
            (e.target as HTMLInputElement).blur();
        }
    };

    const handleNewGoalBlur = (e: FocusEvent) => {
        const input = e.target as HTMLInputElement;
        addGoal(input.value);
        input.value = '';
    };

    const updateGoalText = (id: string, text: string) => {
        if (isPastWeek()) return;
        const currentGoals = weeklyPlan()?.goals || [];
        updateWeeklyPlan({
            goals: currentGoals.map(g => g.id === id ? { ...g, text } : g)
        });
    };

    const handleGoalBlur = (id: string, text: string) => {
        if (isPastWeek()) return;
        if (!text.trim()) {
            deleteGoal(id);
        }
    };

    const handleGoalKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.isComposing) {
            (e.currentTarget as HTMLElement).blur();
        }
    };

    const toggleGoal = (id: string) => {
        if (isPastWeek()) return;
        const currentGoals = weeklyPlan()?.goals || [];
        updateWeeklyPlan({
            goals: currentGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
        });
    };

    const deleteGoal = (id: string) => {
        if (isPastWeek()) return;
        const currentGoals = weeklyPlan()?.goals || [];
        const goal = currentGoals.find(g => g.id === id);
        if (goal?.completed) return;

        updateWeeklyPlan({
            goals: currentGoals.filter(g => g.id !== id)
        });
    };

    createEffect(() => {
        const plan = weeklyPlan();
        if (plan && plan.focus && (!plan.goals || plan.goals.length === 0)) {
            updateWeeklyPlan({
                goals: [{ id: crypto.randomUUID(), text: plan.focus, completed: false }],
                focus: ""
            });
        }
    });

    return (
        <div class="animate-fade-in w-full max-w-4xl mx-auto pb-20">
            <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h2 class="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 mb-2 drop-shadow-sm">
                        Weekly Rhythm
                    </h2>
                    <p class="text-white/60 text-xl font-light tracking-wide">
                        Design your week to ensure the most important gets done.
                    </p>
                </div>

                <div class="relative z-50 flex items-center gap-4 bg-[#1a1d24]/60 backdrop-blur-md p-2 rounded-2xl border border-white/5 shadow-xl">
                    <button onClick={prevWeek} class="btn btn-circle btn-ghost btn-sm text-white/50 hover:text-white hover:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    <button onClick={togglePicker} class="text-2xl font-bold text-white px-4 min-w-[200px] text-center tracking-tight hover:text-secondary transition-colors">
                        Week {weeklyViewWeek()} <span class="text-white/40 font-light">{weeklyViewYear()}</span>
                    </button>

                    <button onClick={nextWeek} class="btn btn-circle btn-ghost btn-sm text-white/50 hover:text-white hover:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </button>

                    <Presence>
                        <Show when={isPickerOpen()}>
                            <Motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                class="absolute top-full right-0 mt-4 bg-[#1a1d24]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 w-[360px] z-[60]"
                            >
                                <div class="flex items-center justify-between mb-4">
                                    <button onClick={() => selectYear(weeklyViewYear() - 1)} class="btn btn-circle btn-ghost btn-xs text-white/50 hover:text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <span class="text-white font-bold">{weeklyViewYear()}</span>
                                    <button onClick={() => selectYear(weeklyViewYear() + 1)} class="btn btn-circle btn-ghost btn-xs text-white/50 hover:text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                                <div class="grid grid-cols-8 gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <For each={weeks}>
                                        {(week) => (
                                            <button
                                                onClick={() => selectWeek(week)}
                                                class={`h-8 w-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${week === weeklyViewWeek()
                                                    ? 'bg-secondary text-white shadow-[0_0_10px_theme(colors.secondary.DEFAULT)]'
                                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {week}
                                            </button>
                                        )}
                                    </For>
                                </div>
                            </Motion.div>
                        </Show>
                    </Presence>
                </div>
            </div>

            <Show when={weeklyPlan()} fallback={<div class="flex justify-center py-12"><span class="loading loading-spinner text-primary loading-lg"></span></div>}>
                <div class="space-y-8">
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        class="card bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 shadow-[0_0_30px_-5px_theme(colors.secondary.900)] relative overflow-hidden"
                    >
                        <div class="absolute inset-0 bg-noise opacity-[0.05]"></div>
                        <div class="absolute right-0 top-0 w-64 h-64 bg-secondary/20 rounded-full blur-[80px] pointer-events-none"></div>

                        <div class="card-body p-8 md:p-10 relative z-10">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-xs font-bold text-secondary uppercase tracking-[0.25em] opacity-80 flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-secondary"></span>
                                    Weekly Goals
                                </h3>
                                <Show when={isPastWeek()}>
                                    <div class="badge badge-error gap-1 opacity-80 whitespace-nowrap font-medium text-xs">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-3 h-3 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                        Locked
                                    </div>
                                </Show>
                            </div>
                            <div class="space-y-4">
                                <Index each={weeklyPlan()?.goals}>
                                    {(goal, _) => (
                                        <div class="flex items-center gap-4 group">
                                            <input
                                                type="checkbox"
                                                checked={goal().completed}
                                                onChange={() => toggleGoal(goal().id)}
                                                disabled={isPastWeek() || goal().completed}
                                                class="checkbox checkbox-secondary checkbox-sm md:checkbox-md"
                                            />
                                            <input
                                                type="text"
                                                class={`input input-ghost text-2xl md:text-3xl font-bold w-full h-auto py-1 px-2 placeholder:text-white/10 focus:bg-transparent focus:text-white transition-all leading-tight ${goal().completed ? 'line-through text-white/60' : 'text-white'}`}
                                                placeholder="Set a weekly goal..."
                                                value={goal().text}
                                                onInput={(e) => updateGoalText(goal().id, e.currentTarget.value)}
                                                onBlur={(e) => handleGoalBlur(goal().id, e.currentTarget.value)}
                                                onKeyDown={handleGoalKeyDown}
                                                disabled={isPastWeek() || goal().completed}
                                            />
                                            <Show when={!isPastWeek() && !goal().completed}>
                                                <button onClick={() => deleteGoal(goal().id)} class="btn btn-circle btn-ghost btn-sm opacity-0 group-hover:opacity-100 transition-opacity text-error/50 hover:text-error hover:bg-error/10">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </Show>
                                        </div>
                                    )}
                                </Index>
                                <Show when={!isPastWeek()}>
                                    <div class="flex items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
                                        <div class="w-5 h-5 md:w-6 md:h-6 rounded border-2 border-secondary/30 ml-1"></div>
                                        <input
                                            type="text"
                                            class="input input-ghost text-2xl md:text-3xl font-bold w-full h-auto py-1 px-2 placeholder:text-white/20 focus:bg-transparent focus:text-white transition-all leading-tight"
                                            placeholder="Type to add a new rhythm..."
                                            onKeyDown={(e) => handleNewGoalKeyDown(e, e.currentTarget.value)}
                                            onBlur={handleNewGoalBlur}
                                        />
                                    </div>
                                </Show>
                            </div>
                        </div>
                    </Motion.div>
                </div>
            </Show>
        </div>
    );
};

export default WeeklyView;

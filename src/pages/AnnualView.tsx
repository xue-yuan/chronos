import { type Component, createEffect, Show, Index } from 'solid-js';
import { plansStore } from '../store/plans';
import HabitHeatmap from '../components/viz/HabitHeatmap';
import { Motion } from 'solid-motionone';

const AnnualView: Component = () => {
    const {
        annualPlan, ensureAnnualPlan, updateAnnualPlan,
        viewYear, prevYear, nextYear
    } = plansStore;

    createEffect(() => {
        ensureAnnualPlan();
    });

    const isPastYear = () => {
        return viewYear() < new Date().getFullYear();
    };

    const handleNewGoalKeyDown = (e: KeyboardEvent, text: string) => {
        if (e.target instanceof HTMLInputElement && e.key === 'Enter' && !e.isComposing) {
            if (text.trim()) {
                const plan = annualPlan();
                if (plan) {
                    const newGoals = [...plan.goals, {
                        id: Date.now().toString(),
                        text: text.trim(),
                        completed: false
                    }];
                    updateAnnualPlan({ goals: newGoals });
                    (e.target as HTMLInputElement).value = "";
                }
            }
        }
    };

    const handleNewGoalBlur = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        const text = target.value;
        if (text.trim()) {
            const plan = annualPlan();
            if (plan) {
                const newGoals = [...plan.goals, {
                    id: Date.now().toString(),
                    text: text.trim(),
                    completed: false
                }];
                updateAnnualPlan({ goals: newGoals });
                target.value = "";
            }
        }
    };

    const updateGoalText = (id: string, text: string) => {
        const plan = annualPlan();
        if (plan) {
            const newGoals = plan.goals.map(g => g.id === id ? { ...g, text } : g);
            updateAnnualPlan({ goals: newGoals });
        }
    };

    const handleGoalBlur = (id: string, text: string) => {
        if (!text.trim()) {
            deleteGoal(id);
        } else {
            updateGoalText(id, text.trim());
        }
    };

    const handleGoalKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.isComposing) {
            (e.currentTarget as HTMLInputElement).blur();
        }
    };

    const toggleGoal = (id: string) => {
        const plan = annualPlan();
        if (plan) {
            const newGoals = plan.goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
            updateAnnualPlan({ goals: newGoals });
        }
    };

    const deleteGoal = (id: string) => {
        const plan = annualPlan();
        if (plan) {
            const newGoals = plan.goals.filter(g => g.id !== id);
            updateAnnualPlan({ goals: newGoals });
        }
    };

    return (
        <div class="animate-fade-in w-full max-w-4xl mx-auto pb-20">
            <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h2 class="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 mb-2 drop-shadow-sm">
                        Annual Vision
                    </h2>
                    <p class="text-white/60 text-xl font-light tracking-wide">
                        Define your North Star for the year.
                    </p>
                </div>
                <div class="flex items-center gap-4 bg-[#1a1d24]/60 backdrop-blur-md p-2 rounded-2xl border border-white/5 shadow-xl">
                    <button onClick={prevYear} class="btn btn-circle btn-ghost btn-sm text-white/50 hover:text-white hover:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span class="text-2xl font-bold text-white px-4 min-w-[120px] text-center tracking-tight">
                        {viewYear()}
                    </span>
                    <button onClick={nextYear} class="btn btn-circle btn-ghost btn-sm text-white/50 hover:text-white hover:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
            <div class="space-y-8">
                <Motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    class="card bg-gradient-to-br from-info/10 to-transparent border border-info/20 shadow-[0_0_30px_-5px_theme(colors.info.900)] relative overflow-hidden"
                >
                    <div class="absolute inset-0 bg-noise opacity-[0.05]"></div>
                    <div class="absolute right-0 top-0 w-64 h-64 bg-info/20 rounded-full blur-[80px] pointer-events-none"></div>
                    <div class="card-body p-8 md:p-10 relative z-10">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xs font-bold text-info uppercase tracking-[0.25em] opacity-80 flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-info"></span>
                                Major Goals
                            </h3>
                            <Show when={isPastYear()}>
                                <div class="badge badge-error gap-1 opacity-80 whitespace-nowrap font-medium text-xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-3 h-3 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    Locked
                                </div>
                            </Show>
                        </div>
                        <Show when={annualPlan()} fallback={<div class="flex justify-center py-12"><span class="loading loading-spinner text-info loading-lg"></span></div>}>
                            <div class="space-y-8">
                                <div class="space-y-4">
                                    <Index each={annualPlan()?.goals}>
                                        {(goal, _) => (
                                            <div class="flex items-center gap-4 group">
                                                <input
                                                    type="checkbox"
                                                    class="checkbox checkbox-info checkbox-sm md:checkbox-md"
                                                    checked={goal().completed}
                                                    onChange={() => toggleGoal(goal().id)}
                                                    disabled={isPastYear() || goal().completed}
                                                />
                                                <input
                                                    type="text"
                                                    class={`input input-ghost text-2xl md:text-3xl font-bold w-full h-auto py-1 px-2 placeholder:text-white/10 focus:bg-transparent focus:text-white transition-all leading-tight ${goal().completed ? 'line-through text-white/60' : 'text-white'}`}
                                                    placeholder="Set an annual goal..."
                                                    value={goal().text}
                                                    onInput={(e) => updateGoalText(goal().id, e.currentTarget.value)}
                                                    onBlur={(e) => handleGoalBlur(goal().id, e.currentTarget.value)}
                                                    onKeyDown={handleGoalKeyDown}
                                                    disabled={isPastYear() || goal().completed}
                                                />
                                                <Show when={!isPastYear() && !goal().completed}>
                                                    <button onClick={() => deleteGoal(goal().id)} class="btn btn-circle btn-ghost btn-sm opacity-0 group-hover:opacity-100 transition-opacity text-error/50 hover:text-error hover:bg-error/10 shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </Show>
                                            </div>
                                        )}
                                    </Index>
                                    <Show when={!isPastYear()}>
                                        <div class="flex items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
                                            <div class="w-5 h-5 md:w-6 md:h-6 rounded border-2 border-info/30 ml-1"></div>
                                            <input
                                                type="text"
                                                class="input input-ghost text-2xl md:text-3xl font-bold w-full h-auto py-1 px-2 placeholder:text-white/20 focus:bg-transparent focus:text-white transition-all leading-tight"
                                                placeholder="Type to add a new vision..."
                                                onKeyDown={(e) => handleNewGoalKeyDown(e, e.currentTarget.value)}
                                                onBlur={handleNewGoalBlur}
                                            />
                                        </div>
                                    </Show>
                                </div>
                            </div>
                        </Show>
                    </div>
                </Motion.div>
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    class="card bg-[#1a1d24]/60 backdrop-blur-md border border-white/5 shadow-xl relative overflow-hidden"
                >
                    <div class="absolute inset-0 bg-noise opacity-[0.03]"></div>
                    <div class="card-body p-8 relative z-10">
                        <div class="flex justify-between items-baseline mb-6">
                            <div>
                                <h3 class="text-2xl font-bold text-white mb-1">Consistency Map</h3>
                                <p class="text-xs text-white/50 uppercase tracking-widest font-semibold">Every day counts</p>
                            </div>
                        </div>
                        <div class="bg-black/20 rounded-xl p-4 border border-white/5 overflow-x-auto custom-scrollbar">
                            <HabitHeatmap year={viewYear()} />
                        </div>
                    </div>
                </Motion.div>
            </div>
        </div>
    );
};

export default AnnualView;

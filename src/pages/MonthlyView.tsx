import { type Component, createEffect, Show, Index } from 'solid-js';
import { plansStore } from '../store/plans';
import { Motion } from 'solid-motionone';

const MonthlyView: Component = () => {
    const {
        monthlyPlan, ensureMonthlyPlan, updateMonthlyPlan,
        viewYear, viewMonth, prevMonth, nextMonth
    } = plansStore;

    createEffect(() => {
        ensureMonthlyPlan();
    });

    const isPastMonth = () => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const vYear = viewYear();
        const vMonth = viewMonth();
        return vYear < currentYear || (vYear === currentYear && vMonth < currentMonth);
    };

    const handleNewMilestoneKeyDown = (e: KeyboardEvent, text: string) => {
        if (e.target instanceof HTMLInputElement && e.key === 'Enter' && !e.isComposing) {
            if (text.trim()) {
                const plan = monthlyPlan();
                if (plan) {
                    const newMilestones = [...plan.milestones, {
                        id: Date.now().toString(),
                        text: text.trim(),
                        startDate: "",
                        endDate: "",
                        completed: false
                    }];
                    updateMonthlyPlan({ milestones: newMilestones });
                    (e.target as HTMLInputElement).value = "";
                }
            }
        }
    };

    const handleNewMilestoneBlur = (e: FocusEvent) => {
        const target = e.target as HTMLInputElement;
        const text = target.value;
        if (text.trim()) {
            const plan = monthlyPlan();
            if (plan) {
                const newMilestones = [...plan.milestones, {
                    id: Date.now().toString(),
                    text: text.trim(),
                    startDate: "",
                    endDate: "",
                    completed: false
                }];
                updateMonthlyPlan({ milestones: newMilestones });
                target.value = "";
            }
        }
    };

    const updateMilestoneText = (id: string, text: string) => {
        const plan = monthlyPlan();
        if (plan) {
            const newMilestones = plan.milestones.map(m => m.id === id ? { ...m, text } : m);
            updateMonthlyPlan({ milestones: newMilestones });
        }
    };

    const handleMilestoneBlur = (id: string, text: string) => {
        if (!text.trim()) {
            deleteMilestone(id);
        } else {
            updateMilestoneText(id, text.trim());
        }
    }

    const handleMilestoneKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.isComposing) {
            (e.currentTarget as HTMLInputElement).blur();
        }
    }

    const toggleMilestone = (id: string) => {
        const plan = monthlyPlan();
        if (plan) {
            const newMilestones = plan.milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m);
            updateMonthlyPlan({ milestones: newMilestones });
        }
    };

    const deleteMilestone = (id: string) => {
        const plan = monthlyPlan();
        if (plan) {
            const newMilestones = plan.milestones.filter(m => m.id !== id);
            updateMonthlyPlan({ milestones: newMilestones });
        }
    }

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = () => months[viewMonth()];

    return (
        <div class="animate-fade-in w-full max-w-4xl mx-auto pb-20">
            <div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h2 class="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 mb-2 drop-shadow-sm">
                        Monthly Milestone
                    </h2>
                    <p class="text-white/60 text-xl font-light tracking-wide">
                        Bridge your annual vision with weekly execution.
                    </p>
                </div>

                <div class="flex items-center gap-4 bg-[#1a1d24]/60 backdrop-blur-md p-2 rounded-2xl border border-white/5 shadow-xl">
                    <button onClick={prevMonth} class="btn btn-circle btn-ghost btn-sm text-white/50 hover:text-white hover:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span class="text-2xl font-bold text-white px-4 min-w-[200px] text-center tracking-tight">
                        {currentMonthName()} <span class="text-white/40 font-light">{viewYear()}</span>
                    </span>
                    <button onClick={nextMonth} class="btn btn-circle btn-ghost btn-sm text-white/50 hover:text-white hover:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            <Motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                class="card bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 shadow-[0_0_30px_-5px_theme(colors.accent.900)] relative overflow-hidden"
            >
                <div class="absolute inset-0 bg-noise opacity-[0.05]"></div>
                <div class="absolute right-0 top-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none"></div>

                <div class="card-body p-8 md:p-10 relative z-10">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xs font-bold text-accent uppercase tracking-[0.25em] opacity-80 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-accent"></span>
                            Monthly Goals
                        </h3>
                        <Show when={isPastMonth()}>
                            <div class="badge badge-error gap-1 opacity-80 whitespace-nowrap font-medium text-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-3 h-3 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                Locked
                            </div>
                        </Show>
                    </div>

                    <Show when={monthlyPlan()} fallback={<div class="flex justify-center py-12"><span class="loading loading-spinner text-accent loading-lg"></span></div>}>
                        <div class="space-y-8">
                            <div class="space-y-4">
                                <Index each={monthlyPlan()?.milestones}>
                                    {(ms, _) => (
                                        <div class="flex items-center gap-4 group">
                                            <input
                                                type="checkbox"
                                                class="checkbox checkbox-accent checkbox-sm md:checkbox-md"
                                                checked={ms().completed}
                                                onChange={() => toggleMilestone(ms().id)}
                                                disabled={isPastMonth() || ms().completed}
                                            />
                                            <input
                                                type="text"
                                                class={`input input-ghost text-2xl md:text-3xl font-bold w-full h-auto py-1 px-2 placeholder:text-white/10 focus:bg-transparent focus:text-white transition-all leading-tight ${ms().completed ? 'line-through text-white/60' : 'text-white'}`}
                                                placeholder="Milestone title..."
                                                value={ms().text}
                                                onInput={(e) => updateMilestoneText(ms().id, e.currentTarget.value)}
                                                onBlur={(e) => handleMilestoneBlur(ms().id, e.currentTarget.value)}
                                                onKeyDown={handleMilestoneKeyDown}
                                                disabled={isPastMonth() || ms().completed}
                                            />
                                            <Show when={!isPastMonth() && !ms().completed}>
                                                <button onClick={() => deleteMilestone(ms().id)} class="btn btn-circle btn-ghost btn-sm opacity-0 group-hover:opacity-100 transition-opacity text-error/50 hover:text-error hover:bg-error/10 shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </Show>
                                        </div>
                                    )}
                                </Index>

                                <Show when={!isPastMonth()}>
                                    <div class="flex items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
                                        <div class="w-5 h-5 md:w-6 md:h-6 rounded border-2 border-accent/30 ml-1"></div>
                                        <input
                                            type="text"
                                            class="input input-ghost text-2xl md:text-3xl font-bold w-full h-auto py-1 px-2 placeholder:text-white/20 focus:bg-transparent focus:text-white transition-all leading-tight"
                                            placeholder="Type to add a new milestone..."
                                            onKeyDown={(e) => handleNewMilestoneKeyDown(e, e.currentTarget.value)}
                                            onBlur={handleNewMilestoneBlur}
                                        />
                                    </div>
                                </Show>
                            </div>
                        </div>
                    </Show>
                </div>
            </Motion.div>
        </div>
    );
};

export default MonthlyView;

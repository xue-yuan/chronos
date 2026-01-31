import { type Component, createEffect, Show, For, Index, createSignal, onMount } from 'solid-js';
import { plansStore } from '../store/plans';
import { habitsStore } from '../store/habits';
import HabitItem from '../components/habits/HabitItem';
import ParticleBurst from '../components/viz/ParticleBurst';
import DatePicker from '../components/DatePicker';
import { Motion } from 'solid-motionone';

const DailyDashboard: Component = () => {
    const {
        todayPlan, ensureTodayPlan, updateDailyPlan, toggleHabit,
        viewDate, setViewDate, prevDay, nextDay
    } = plansStore;
    const { habits } = habitsStore;
    const [showCelebration, setShowCelebration] = createSignal(false);

    onMount(() => {
        setViewDate(new Date());
    });


    const isReadOnly = () => {
        const vDate = viewDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(vDate);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    createEffect(() => {
        const currentHabits = habits();
        if (currentHabits) {
            ensureTodayPlan(currentHabits);
        }
    });

    const handleBigThingChange = (text: string) => {
        if (isReadOnly()) return;
        if (todayPlan()) {
            updateDailyPlan(todayPlan()!.id, { bigThing: { ...todayPlan()!.bigThing, text } });
        }
    };

    const toggleBigThing = () => {
        if (isReadOnly()) return;
        if (todayPlan()) {
            const newState = !todayPlan()!.bigThing.completed;
            updateDailyPlan(todayPlan()!.id, { bigThing: { ...todayPlan()!.bigThing, completed: newState } });
            if (newState) {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 2000);
            }
        }
    };


    const allTasksCompleted = () => {
        const plan = todayPlan();
        if (!plan) return false;

        const bigThingDone = plan.bigThing.completed;
        const habitLogs = Object.values(plan.habitLogs || {});
        const allHabitsDone = habitLogs.length > 0
            ? habitLogs.every(h => h.completed || h.value > 0)
            : true;

        return bigThingDone && allHabitsDone;
    };

    return (
        <div class="relative min-h-full w-full pb-20">
            <ParticleBurst active={showCelebration()} />

            <Motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 relative z-50"
            >
                <div>
                    <h2 class="text-6xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 mb-3 drop-shadow-sm">
                        {new Date().toDateString() === viewDate().toDateString() ? "Today's Focus" : "Daily Focus"}
                    </h2>
                    <div class="-ml-4">
                        <DatePicker
                            date={viewDate()}
                            onDateChange={setViewDate}
                            onPrevDay={prevDay}
                            onNextDay={nextDay}
                        />
                    </div>
                </div>

                <Show when={allTasksCompleted()}>
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        class="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] backdrop-blur-md"
                    >
                        <div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-black font-bold" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <span class="font-bold tracking-wide uppercase text-sm">All Tasks Completed</span>
                    </Motion.div>
                </Show>
            </Motion.div>

            <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">
                <div class="xl:col-span-12 flex flex-col gap-8">

                    <Motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.7, easing: [0.22, 1, 0.36, 1] }}
                        class="relative group"
                    >
                        <div class="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div class="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-[2.5rem] blur-3xl opacity-10 group-hover:opacity-30 transition duration-1000 animate-pulse-slow"></div>

                        <div class="card relative bg-[#0f1115]/90 backdrop-blur-2xl border border-white/10 p-2 rounded-[2.2rem] overflow-hidden">
                            <div class="absolute inset-0 overflow-hidden rounded-[2.2rem]">
                                <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shine group-hover:animate-none"></div>
                            </div>

                            <div class="card-body p-8 md:p-12 relative z-10">
                                <div class="flex flex-col md:flex-row gap-8 items-start md:items-center">
                                    <div class="relative shrink-0">
                                        <div class="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary-focus text-primary-content flex items-center justify-center shadow-[0_0_40px_-10px_theme(colors.primary.DEFAULT)] ring-4 ring-white/5 font-black text-6xl animate-float">
                                            1
                                        </div>
                                        <div class="absolute -bottom-2 -right-2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Focus</div>
                                    </div>

                                    <div class="flex-1 w-full">
                                        <h3 class="text-sm font-bold text-primary tracking-[0.2em] uppercase mb-4 opacity-80">The Daily Driver</h3>
                                        <div class="relative">
                                            <input
                                                type="text"
                                                placeholder="What is the ONE thing you must do?"
                                                class={`input input-ghost text-3xl md:text-5xl lg:text-5xl font-bold w-full h-auto py-2 px-0 pr-16 md:pr-24 focus:outline-none focus:bg-transparent focus:border-none placeholder:text-white/10 tracking-tight transition-all duration-500 ${todayPlan()?.bigThing.completed ? 'line-through opacity-30 text-white decoration-4 decoration-primary' : 'text-white'}`}
                                                value={todayPlan()?.bigThing.text || ""}
                                                disabled={todayPlan()?.bigThing.completed || isReadOnly()}
                                                onChange={(e) => handleBigThingChange(e.currentTarget.value)}
                                            />

                                            <div class="absolute top-1/2 -translate-y-1/2 right-0 md:-right-4">
                                                <label class={`swap swap-rotate group/check ${isReadOnly() ? 'cursor-not-allowed opacity-50' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={todayPlan()?.bigThing.completed || false}
                                                        onChange={toggleBigThing}
                                                        disabled={!todayPlan()?.bigThing.text.trim() || todayPlan()?.bigThing.completed || isReadOnly()}
                                                    />
                                                    <div class="swap-on w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_theme(colors.primary.DEFAULT)] text-white">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                                    </div>
                                                    <div class="swap-off w-16 h-16 border-2 border-white/10 rounded-full flex items-center justify-center group-hover/check:border-primary/50 group-hover/check:text-primary transition-colors text-white/20">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Motion.div>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        <Motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            class="h-[320px] flex flex-col"
                        >
                            <div class={`card bg-[#1a1d24]/40 backdrop-blur-md border p-6 rounded-[2rem] hover:bg-[#1a1d24]/60 transition-colors group flex-1 flex flex-col min-h-0 h-full ${(todayPlan()?.mediumThings?.length || 0) > 0 && todayPlan()?.mediumThings?.every(t => t.completed)
                                ? 'border-secondary/50 shadow-[0_0_30px_-5px_theme(colors.secondary.DEFAULT)] bg-[#1a1d24]/60'
                                : 'border-white/5'
                                }`}
                            >
                                <div class="flex items-center justify-between mb-8 flex-none">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-2xl border border-secondary/20">3</div>
                                        <div>
                                            <h3 class="font-bold text-white text-lg">Crucial Results</h3>
                                            <p class="text-xs text-secondary/60 font-semibold uppercase tracking-wider">High Impact</p>
                                        </div>
                                    </div>
                                </div>

                                <Show when={todayPlan()} fallback={<div class="flex-1 flex items-center justify-center"><span class="loading loading-spinner text-secondary"></span></div>}>
                                    <div class="space-y-1 flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                        <Index each={todayPlan()?.mediumThings || []}>
                                            {(task, i) => (
                                                <div class="group/item relative transition-all duration-300">
                                                    <div class={`absolute inset-0 bg-gradient-to-r from-secondary/20 to-transparent rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity ${task().completed ? 'opacity-0' : ''}`}></div>
                                                    <div class="relative flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-white/5">
                                                        <input
                                                            type="checkbox"
                                                            class="checkbox checkbox-secondary checkbox-md rounded-lg border-2 border-white/20"
                                                            checked={task().completed}
                                                            disabled={task().completed || isReadOnly()}
                                                            onChange={(e) => {
                                                                if (isReadOnly()) return;
                                                                const plan = todayPlan();
                                                                if (plan) {
                                                                    const newTasks = [...plan.mediumThings];
                                                                    newTasks[i] = { ...task(), completed: e.currentTarget.checked };
                                                                    updateDailyPlan(plan.id, { mediumThings: newTasks });
                                                                }
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            class={`input input-ghost w-full focus:outline-none focus:bg-transparent placeholder:text-white/20 text-white/80 font-medium transition-all ${task().completed ? 'line-through opacity-40' : ''}`}
                                                            value={task().text}
                                                            placeholder={isReadOnly() ? "" : "Add a crucial result..."}
                                                            disabled={task().completed || isReadOnly()}
                                                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                                            onBlur={(e) => {
                                                                if (isReadOnly()) return;
                                                                const plan = todayPlan();
                                                                if (plan) {
                                                                    const val = e.currentTarget.value.trim();
                                                                    if (!val) {
                                                                        const newTasks = [...plan.mediumThings];
                                                                        newTasks.splice(i, 1);
                                                                        updateDailyPlan(plan.id, { mediumThings: newTasks });
                                                                    } else if (val !== task().text) {
                                                                        const newTasks = [...plan.mediumThings];
                                                                        newTasks[i] = { ...task(), text: val };
                                                                        updateDailyPlan(plan.id, { mediumThings: newTasks });
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <Show when={!task().completed && !isReadOnly()}>
                                                            <button
                                                                onClick={() => {
                                                                    const plan = todayPlan();
                                                                    if (plan) {
                                                                        const newTasks = [...plan.mediumThings];
                                                                        newTasks.splice(i, 1);
                                                                        updateDailyPlan(plan.id, { mediumThings: newTasks });
                                                                    }
                                                                }}
                                                                class="btn btn-circle btn-ghost btn-sm opacity-0 group-hover/item:opacity-100 transition-opacity text-error/50 hover:text-error hover:bg-error/10 shrink-0"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </Show>
                                                    </div>
                                                </div>
                                            )}
                                        </Index>
                                        <Show when={(todayPlan()?.mediumThings?.length || 0) < 3 && !isReadOnly()}>
                                            <div class="relative flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/5 transition-colors hover:bg-white/10 group/new">
                                                <div class="w-5 h-5 rounded-lg border-2 border-white/10 flex items-center justify-center text-white/20 group-hover/new:text-white/50 group-hover/new:border-white/30 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    class="input input-ghost w-full focus:outline-none focus:bg-transparent placeholder:text-white/20 text-white font-medium p-0 h-auto"
                                                    placeholder="Type to add result..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const plan = todayPlan();
                                                            if (plan) {
                                                                const val = (e.currentTarget as HTMLInputElement).value.trim();
                                                                if (val) {
                                                                    const newTasks = [...plan.mediumThings, { id: Date.now().toString(), text: val, completed: false }];
                                                                    updateDailyPlan(plan.id, { mediumThings: newTasks });
                                                                    (e.currentTarget as HTMLInputElement).value = "";
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const plan = todayPlan();
                                                        if (plan) {
                                                            const val = e.currentTarget.value.trim();
                                                            if (val) {
                                                                const newTasks = [...plan.mediumThings, { id: Date.now().toString(), text: val, completed: false }];
                                                                updateDailyPlan(plan.id, { mediumThings: newTasks });
                                                                e.currentTarget.value = "";
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </Show>
                                    </div>
                                </Show>
                            </div>
                        </Motion.div>

                        <Motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            class="h-[320px] flex flex-col"
                        >
                            <div class={`card bg-[#1a1d24]/40 backdrop-blur-md border p-6 rounded-[2rem] hover:bg-[#1a1d24]/60 transition-colors flex-1 flex flex-col min-h-0 h-full ${(todayPlan()?.smallThings?.length || 0) > 0 && todayPlan()?.smallThings?.every(t => t.completed)
                                ? 'border-accent/50 shadow-[0_0_30px_-5px_theme(colors.accent.DEFAULT)] bg-[#1a1d24]/60'
                                : 'border-white/5'
                                }`}
                            >
                                <div class="flex items-center justify-between mb-8 flex-none">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-black text-2xl border border-accent/20">5</div>
                                        <div>
                                            <h3 class="font-bold text-white text-lg">Quick Wins</h3>
                                            <p class="text-xs text-accent/60 font-semibold uppercase tracking-wider">Momentum Builders</p>
                                        </div>
                                    </div>
                                </div>

                                <Show when={todayPlan()} fallback={<div class="flex-1 flex items-center justify-center"><span class="loading loading-spinner text-accent"></span></div>}>
                                    <div class="space-y-1 flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                        <Index each={todayPlan()?.smallThings || []}>
                                            {(task, i) => (
                                                <div class="group/item relative transition-all duration-300">
                                                    <div class={`absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity ${task().completed ? 'opacity-0' : ''}`}></div>
                                                    <div class="relative flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-white/5">
                                                        <input
                                                            type="checkbox"
                                                            class="checkbox checkbox-accent checkbox-md rounded-lg border-2 border-white/20"
                                                            checked={task().completed}
                                                            disabled={task().completed || isReadOnly()}
                                                            onChange={(e) => {
                                                                if (isReadOnly()) return;
                                                                const plan = todayPlan();
                                                                if (plan) {
                                                                    const newTasks = [...plan.smallThings];
                                                                    newTasks[i] = { ...task(), completed: e.currentTarget.checked };
                                                                    updateDailyPlan(plan.id, { smallThings: newTasks });
                                                                }
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            class={`input input-ghost w-full focus:outline-none focus:bg-transparent placeholder:text-white/20 text-white/80 font-medium transition-all ${task().completed ? 'line-through opacity-40' : ''}`}
                                                            value={task().text}
                                                            placeholder={isReadOnly() ? "" : "Add a quick win..."}
                                                            disabled={task().completed || isReadOnly()}
                                                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                                            onBlur={(e) => {
                                                                if (isReadOnly()) return;
                                                                const plan = todayPlan();
                                                                if (plan) {
                                                                    const val = e.currentTarget.value.trim();
                                                                    if (!val) {
                                                                        const newTasks = [...plan.smallThings];
                                                                        newTasks.splice(i, 1);
                                                                        updateDailyPlan(plan.id, { smallThings: newTasks });
                                                                    } else if (val !== task().text) {
                                                                        const newTasks = [...plan.smallThings];
                                                                        newTasks[i] = { ...task(), text: val };
                                                                        updateDailyPlan(plan.id, { smallThings: newTasks });
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <Show when={!task().completed && !isReadOnly()}>
                                                            <button
                                                                onClick={() => {
                                                                    const plan = todayPlan();
                                                                    if (plan) {
                                                                        const newTasks = [...plan.smallThings];
                                                                        newTasks.splice(i, 1);
                                                                        updateDailyPlan(plan.id, { smallThings: newTasks });
                                                                    }
                                                                }}
                                                                class="btn btn-circle btn-ghost btn-sm opacity-0 group-hover/item:opacity-100 transition-opacity text-error/50 hover:text-error hover:bg-error/10 shrink-0"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </Show>
                                                    </div>
                                                </div>
                                            )}
                                        </Index>
                                        <Show when={(todayPlan()?.smallThings?.length || 0) < 5 && !isReadOnly()}>
                                            <div class="relative flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/5 transition-colors hover:bg-white/10 group/new">
                                                <div class="w-5 h-5 rounded-lg border-2 border-white/10 flex items-center justify-center text-white/20 group-hover/new:text-white/50 group-hover/new:border-white/30 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    class="input input-ghost w-full focus:outline-none focus:bg-transparent placeholder:text-white/20 text-white font-medium p-0 h-auto"
                                                    placeholder="Type to add win..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const plan = todayPlan();
                                                            if (plan) {
                                                                const val = (e.currentTarget as HTMLInputElement).value.trim();
                                                                if (val) {
                                                                    const newTasks = [...plan.smallThings, { id: Date.now().toString(), text: val, completed: false }];
                                                                    updateDailyPlan(plan.id, { smallThings: newTasks });
                                                                    (e.currentTarget as HTMLInputElement).value = "";
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const plan = todayPlan();
                                                        if (plan) {
                                                            const val = e.currentTarget.value.trim();
                                                            if (val) {
                                                                const newTasks = [...plan.smallThings, { id: Date.now().toString(), text: val, completed: false }];
                                                                updateDailyPlan(plan.id, { smallThings: newTasks });
                                                                e.currentTarget.value = "";
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </Show>
                                    </div>
                                </Show>
                            </div>
                        </Motion.div>

                    </div>
                </div>
            </div>

            <div class="w-full mb-12">
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    class="card bg-[#1a1d24]/80 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden rounded-[2rem]"
                >
                    <div class="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>

                    <div class="card-body p-8">
                        <div class="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
                            <div>
                                <h3 class="card-title text-2xl font-bold text-white mb-1">Daily Rituals</h3>
                                <p class="text-xs text-white/60 uppercase tracking-widest font-semibold">Consistency is key</p>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="badge badge-accent badge-outline text-xs py-3 px-4 font-bold rounded-lg bg-accent/5 border-accent/20">Today</div>
                            </div>
                        </div>

                        <Show when={todayPlan()}
                            fallback={
                                isReadOnly() ? (
                                    <div class="flex-1 flex flex-col items-center justify-center h-48 opacity-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p class="text-white/40 font-medium">No records for this day</p>
                                    </div>
                                ) : (
                                    <div class="flex justify-center p-12"><span class="loading loading-spinner text-primary loading-lg"></span></div>
                                )
                            }
                        >
                            <div class="w-full">
                                <Show when={habits()?.filter(h => todayPlan()?.habitLogs[h.id]).length} fallback={
                                    <div class="flex flex-col items-center justify-center py-16 px-6 text-center border-2 border-dashed border-white rounded-3xl bg-white/5 group hover:border-primary/30 transition-colors">
                                        <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 opacity-30 group-hover:opacity-100 group-hover:text-primary transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        </div>
                                        <p class="text-base font-semibold text-white/80 group-hover:text-white transition-colors">No rituals scheduled</p>
                                        <p class="text-xs text-white/50 mt-2 max-w-[220px] leading-relaxed mb-4">Habits set for this day of the week will appear here automatically.</p>
                                        <a href="/habits" class="btn btn-sm btn-outline btn-primary">Manage Habits</a>
                                    </div>
                                }>
                                    <div class="flex overflow-x-auto gap-6 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide">
                                        <For each={habits()
                                            ?.filter(h => todayPlan()?.habitLogs[h.id])
                                            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
                                        }>
                                            {(def) => (
                                                <div class="min-w-[260px] md:min-w-[300px] snap-center">
                                                    <HabitItem
                                                        habit={def}
                                                        completed={todayPlan()!.habitLogs[def.id]?.completed || false}
                                                        value={todayPlan()!.habitLogs[def.id]?.value || 0}
                                                        readOnly={isReadOnly()}
                                                        onLog={(amount) => {
                                                            if (isReadOnly()) return;
                                                            const currentLog = todayPlan()!.habitLogs[def.id];
                                                            toggleHabit(todayPlan()!.id, def.id, currentLog, def.mode, def.dailyTarget || 0, amount);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </div>
                        </Show>
                    </div>
                </Motion.div>
            </div>
        </div>
    );
};

export default DailyDashboard;

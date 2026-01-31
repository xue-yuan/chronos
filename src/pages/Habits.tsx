import { type Component, createSignal, For, Show, createEffect } from 'solid-js';
import { habitsStore } from '../store/habits';
import { plansStore } from '../store/plans';
import HabitHeatmap from '../components/viz/HabitHeatmap';
import { Motion } from 'solid-motionone';

const Habits: Component = () => {
    const { habits, addHabit, updateHabit, removeHabit } = habitsStore;
    const { todayPlan, toggleHabit, ensureTodayPlan } = plansStore;

    const [isModalOpen, setIsModalOpen] = createSignal(false);
    const [editMode, setEditMode] = createSignal<string | null>(null);

    const [name, setName] = createSignal("");
    const [mode, setMode] = createSignal<'checkbox' | 'quantifiable'>('checkbox');
    const [unit, setUnit] = createSignal("");
    const [dailyTarget, setDailyTarget] = createSignal<number | null>(null);
    const [_, setIncrement] = createSignal(1);

    createEffect(() => {
        ensureTodayPlan(habits());
    });

    const openModal = (id?: string) => {
        if (id) {
            const h = habits()?.find(x => x.id === id);
            if (h) {
                setEditMode(id);
                setName(h.name);
                setMode(h.mode);
                setUnit(h.unit || "");
                setDailyTarget(h.dailyTarget ?? null);
                setIncrement(h.increment || 1);
            }
        } else {
            setEditMode(null);
            setName("");
            setMode('checkbox');
            setUnit("");
            setDailyTarget(null);
            setIncrement(1);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        const habitData = {
            name: name(),
            mode: mode(),
            dailyTarget: dailyTarget() ?? null,
            ...(mode() === 'quantifiable' ? {
                unit: unit(),
            } : {}),
            increment: 1,
            color: "primary"
        };

        try {
            if (editMode()) {
                await updateHabit(editMode()!, habitData);
            } else {
                await addHabit(habitData);
            }
        } catch (err) {
            console.error(err);
        } finally {
            closeModal();
            ensureTodayPlan(habits());
        }
    };

    const handleToggle = async (habitId: string, habitMode: 'checkbox' | 'quantifiable', target: number = 0) => {
        const plan = todayPlan();
        if (plan) {
            const currentLog = plan.habitLogs[habitId];
            await toggleHabit(plan.id, habitId, currentLog, habitMode, target, 1);
        }
    };

    return (
        <div class="animate-fade-in w-full max-w-7xl mx-auto pb-20">
            <div class="flex justify-between items-end mb-12">
                <div>
                    <h2 class="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/50 mb-2 drop-shadow-sm">
                        My Rituals
                    </h2>
                    <p class="text-white/60 text-xl font-light tracking-wide">
                        Shape your identity, one day at a time.
                    </p>
                </div>
                <button onClick={() => openModal()} class="btn btn-primary text-white shadow-lg shadow-primary/20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    New Habit
                </button>
            </div>

            <Show when={habits() && habits()!.length > 0} fallback={
                <div class="flex flex-col items-center justify-center py-24 px-6 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/5 opacity-60">
                    <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">No habits defined yet</h3>
                    <p class="text-white/40 mb-8 max-w-sm">Create your first habit to start tracking your daily rituals.</p>
                    <button onClick={() => openModal()} class="btn btn-primary text-white shadow-lg shadow-primary/20">Create your first habit</button>
                </div>
            }>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 auto-rows-fr">
                    <For each={habits()}>
                        {(habit, i) => {
                            const todayLog = () => todayPlan()?.habitLogs[habit.id] || { completed: false, value: 0 };
                            return (
                                <Motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: i() * 0.05 }}
                                    class="card bg-[#1a1d24]/60 backdrop-blur-md border border-white/5 shadow-xl hover:shadow-2xl hover:border-white/10 group"
                                >
                                    <div class="card-body p-6 relative overflow-hidden">
                                        <div class="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none opacity-0 group-hover:opacity-100"></div>

                                        <div class="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <h3 class="font-bold text-2xl text-white tracking-tight leading-none mb-1">{habit.name}</h3>
                                                <div class="text-[10px] text-white/40 font-mono uppercase tracking-wider flex items-center gap-2">
                                                    <span class={`w-1.5 h-1.5 rounded-full ${todayLog().completed ? 'bg-success shadow-[0_0_10px_rgba(54,211,153,0.5)]' : 'bg-white/20'}`}></span>
                                                    {habit.mode === 'checkbox' ? 'Daily' : `Target: ${habit.dailyTarget} ${habit.unit || ''}`}
                                                </div>
                                            </div>
                                            <div class="dropdown dropdown-end">
                                                <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-circle text-white/20 hover:text-white">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                                </div>
                                                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-xl bg-[#1a1d24] border border-white/10 rounded-box w-32 mt-2">
                                                    <li><button onClick={() => openModal(habit.id)} class="text-white/70 hover:text-white text-xs">Edit</button></li>
                                                    <li><button onClick={() => removeHabit(habit.id)} class="text-error/70 hover:text-error text-xs">Delete</button></li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div class="flex items-center justify-between gap-6 mb-6">
                                            <div class="flex-1 min-w-0">
                                                <HabitHeatmap year={new Date().getFullYear()} habitId={habit.id} mode={habit.mode} dailyTarget={habit.dailyTarget || undefined} />
                                            </div>

                                            <div class="shrink-0 flex flex-col items-center gap-2 min-w-[80px]">
                                                <button
                                                    onClick={() => handleToggle(habit.id, habit.mode, habit.dailyTarget || 0)}
                                                    class={`btn btn-lg transition-all duration-300 border-0 shadow-lg ${todayLog().completed
                                                        ? 'bg-gradient-to-br from-success to-success/50 text-white shadow-success/20 hover:scale-105'
                                                        : 'bg-white/5 hover:bg-white/10 text-white/20 hover:text-white'
                                                        } ${(todayLog().value && todayLog().value!.toString().length > 3) ? 'w-auto px-4 rounded-full min-w-[4rem]' : 'btn-circle'}`}
                                                >
                                                    <Show when={habit.mode === 'checkbox'} fallback={
                                                        <span class={`${(todayLog().value && todayLog().value!.toString().length > 4) ? 'text-sm' : 'text-xl'} font-black`}>{todayLog().value || 0}</span>
                                                    }>
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </Show>
                                                </button>
                                                <span class="text-[10px] font-bold uppercase tracking-wider text-white/30">
                                                    {todayLog().completed ? 'Done' : 'Today'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Motion.div>
                            );
                        }}
                    </For>
                </div>
            </Show>

            <div class={`modal ${isModalOpen() ? 'modal-open backdrop-blur-sm' : ''}`} role="dialog">
                <div class="modal-box bg-[#1a1d24]/95 backdrop-blur-xl border border-white/10 shadow-2xl max-w-2xl p-0 overflow-hidden">
                    <div class="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <h3 class="font-bold text-xl text-white">{editMode() ? 'Edit Habit' : 'Create New Habit'}</h3>
                        <button onClick={closeModal} class="btn btn-sm btn-circle btn-ghost text-white/50 hover:text-white">✕</button>
                    </div>

                    <form onSubmit={handleSubmit} class="p-6 space-y-8">
                        <div class="form-control w-full">
                            <label class="label"><span class="label-text text-xs font-bold text-white/50 uppercase tracking-wider">Habit Name</span></label>
                            <input
                                type="text"
                                class="input bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder-white/20 w-full text-lg"
                                placeholder="What do you want to achieve?"
                                value={name()}
                                onInput={(e) => setName(e.currentTarget.value)}
                                required
                                autofocus
                            />
                        </div>

                        <div class="form-control w-full">
                            <label class="label cursor-pointer justify-start gap-4 p-0">
                                <input
                                    type="checkbox"
                                    class="toggle toggle-primary"
                                    checked={mode() === 'quantifiable'}
                                    onChange={(e) => setMode(e.currentTarget.checked ? 'quantifiable' : 'checkbox')}
                                />
                                <span class="label-text text-white/80 font-medium">Track Amount / Count</span>
                            </label>
                            <p class="text-xs text-white/40 mt-2 pl-14">Enable this if you want to track numbers (e.g., pages read, liters drunk) instead of just completion.</p>
                        </div>

                        <Show when={mode() === 'quantifiable'}>
                            <div class="flex gap-4 pl-14 animate-fade-in">
                                <div class="form-control w-1/2">
                                    <label class="label"><span class="label-text text-xs font-bold text-white/50 uppercase tracking-wider">Unit (Optional)</span></label>
                                    <input
                                        type="text"
                                        class="input bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder-white/20 w-full"
                                        placeholder="e.g. Pages"
                                        value={unit()}
                                        onInput={(e) => setUnit(e.currentTarget.value)}
                                    />
                                </div>
                                <div class="form-control w-1/2">
                                    <label class="label"><span class="label-text text-xs font-bold text-white/50 uppercase tracking-wider">Daily Target</span></label>
                                    <input
                                        type="number"
                                        class="input bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder-white/20 w-full"
                                        placeholder="e.g. 10"
                                        value={dailyTarget() || ''}
                                        onInput={(e) => setDailyTarget(e.currentTarget.value ? Number(e.currentTarget.value) : null)}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>
                        </Show>

                        <div class="modal-action border-t border-white/5 pt-6 mt-6">
                            <button type="button" class="btn btn-ghost hover:bg-white/10 text-white/70" onClick={closeModal}>Cancel</button>
                            <button type="submit" class="btn btn-primary text-white shadow-lg shadow-primary/20 px-8">Save Habit</button>
                        </div>
                    </form>
                </div>
                <div class="modal-backdrop">
                    <button onClick={closeModal} type="button">close</button>
                </div>
            </div>
        </div>
    );
};

export default Habits;

import { type Component, Show, createSignal } from 'solid-js';
import { type Habit } from '../../store/habits';

import confetti from 'canvas-confetti';

interface HabitItemProps {
    habit: Habit;
    completed: boolean;
    value: number;
    onLog: (amount: number) => void;
    readOnly?: boolean;
}

const HabitItem: Component<HabitItemProps> = (props) => {
    const [amount, setAmount] = createSignal(props.habit.increment || 1);

    const progress = () => {
        if (props.habit.mode === 'checkbox') return props.completed ? 100 : 0;
        if (!props.habit.dailyTarget) return props.value > 0 ? 100 : 0;
        const target = props.habit.dailyTarget ?? 1;
        return Math.min(100, (props.value / target) * 100);
    };

    const triggerConfetti = (e: MouseEvent) => {
        if (props.readOnly) return;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { x, y },
            colors: ['#FF865B', '#FD6F9C', '#ffffff'],
            disableForReducedMotion: true,
            zIndex: 9999,
        });
    };

    const handleLog = (e: MouseEvent) => {
        if (props.readOnly) return;
        if (props.completed && props.habit.mode === 'checkbox') return;

        triggerConfetti(e);
        props.onLog(Number(amount()));
    };

    const handleCheckboxLog = (e: MouseEvent) => {
        if (props.readOnly) return;
        triggerConfetti(e);
        props.onLog(1);
    }


    return (
        <div class={`card h-[280px] border shadow-sm mb-3 transition-all duration-300 group rounded-xl overflow-hidden flex flex-col ${props.completed ? 'bg-primary/10 border-primary/30 shadow-[0_0_20px_-5px_theme(colors.primary.DEFAULT)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:shadow-lg hover:-translate-y-1 hover:border-white/10'} ${props.readOnly ? 'opacity-70 pointer-events-none' : ''}`}>
            <div class="card-body p-4 flex flex-col gap-2 flex-1">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class={`font-bold text-lg transition-colors tracking-tight leading-tight ${props.completed ? 'text-primary' : 'text-white group-hover:text-primary'}`}>{props.habit.name}</h4>
                    </div>
                </div>
                <Show when={props.habit.mode === 'checkbox'}>
                    <div class="flex-1 flex items-center justify-center">
                        <div class={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${props.completed ? 'bg-primary text-white shadow-[0_0_30px_theme(colors.primary.DEFAULT)] scale-110' : 'bg-white/5 text-white/10 border-2 border-dashed border-white/10'}`}>
                            <Show when={props.completed} fallback={<div class="w-4 h-4 rounded-full bg-current"></div>}>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                            </Show>
                        </div>
                    </div>
                </Show>
                <Show when={props.habit.mode === 'quantifiable'}>
                    <div class="flex flex-col gap-4 mb-2 flex-1 justify-center items-center">
                        <div class="relative w-full h-2 bg-black/40 rounded-full overflow-hidden">
                            <div
                                class="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary transition-all duration-700 ease-out shadow-[0_0_10px_theme(colors.primary.DEFAULT)]"
                                style={{ width: `${progress()}%` }}
                            ></div>
                        </div>
                        <div class="flex flex-col items-center gap-1 mt-2 mb-2">
                            <span class={`text-5xl font-black tracking-tight ${props.completed ? 'text-primary' : 'text-white'}`}>{props.value}</span>
                            <Show when={props.habit.dailyTarget}>
                                <div class="flex items-center gap-1.5">
                                    <span class="text-xs font-bold text-white/30 lowercase tracking-wide">of</span>
                                    <span class="text-lg font-bold text-white/50">{props.habit.dailyTarget}</span>
                                    <Show when={props.habit.unit}>
                                        <span class="text-xs font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">{props.habit.unit}</span>
                                    </Show>
                                </div>
                            </Show>
                        </div>
                        <div class="flex items-center bg-white/5 rounded-lg border border-white/10 overflow-hidden h-9 w-full max-w-[200px] shadow-lg shadow-black/20">
                            <button
                                class="w-10 h-full flex items-center justify-center hover:bg-white/10 text-white/70 transition-colors active:bg-white/20"
                                onClick={() => !props.readOnly && setAmount(Math.max(1, amount() - (props.habit.increment || 1)))}
                                disabled={props.readOnly}
                            >−</button>
                            <div class="flex-1 h-full flex items-center justify-center border-x border-white/10 bg-black/20 relative">
                                <input
                                    type="number"
                                    class="w-full h-full bg-transparent border-none text-center font-bold text-white p-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-sm"
                                    value={amount()}
                                    disabled={props.readOnly}
                                    onInput={(e) => !props.readOnly && setAmount(Number(e.currentTarget.value))}
                                    onKeyDown={(e) => !props.readOnly && e.key === 'Enter' && handleLog(e as any)}
                                />
                                <Show when={props.habit.unit}>
                                    <span class="absolute right-3 text-[10px] font-bold text-white/50 uppercase pointer-events-none truncate max-w-[50px]">{props.habit.unit}</span>
                                </Show>
                            </div>
                            <button
                                class="w-10 h-full flex items-center justify-center hover:bg-white/10 text-white/70 transition-colors active:bg-white/20"
                                onClick={() => !props.readOnly && setAmount(amount() + (props.habit.increment || 1))}
                                disabled={props.readOnly}
                            >+</button>
                        </div>
                    </div>
                </Show>
                <button
                    disabled={(props.habit.mode === 'checkbox' && props.completed) || props.readOnly}
                    class={`btn w-full shadow-lg transition-all gap-3 mt-auto ${(props.habit.mode === 'checkbox' && props.completed)
                        ? 'btn-outline border-white/10 text-white/40'
                        : 'btn-primary shadow-primary/20 hover:shadow-primary/40'
                        }`}
                    onClick={(e) => {
                        if (props.habit.mode === 'quantifiable') {
                            handleLog(e);
                        } else {
                            if (!props.completed) {
                                handleCheckboxLog(e);
                            }
                        }
                    }}
                >
                    <span class="font-bold tracking-widest">
                        {(props.habit.mode === 'checkbox' && props.completed) ? 'COMPLETED' : 'CHECK-IN'}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default HabitItem;

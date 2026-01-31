import { type Component, createSignal, Show, For } from 'solid-js';
import { Motion, Presence } from 'solid-motionone';

interface DatePickerProps {
    date: Date;
    onDateChange: (date: Date) => void;
    onPrevDay: () => void;
    onNextDay: () => void;
}

const DatePicker: Component<DatePickerProps> = (props) => {
    const [isOpen, setIsOpen] = createSignal(false);
    const [calendarViewDate, setCalendarViewDate] = createSignal(new Date(props.date));

    const toggleCalendar = () => {
        if (!isOpen()) {
            setCalendarViewDate(new Date(props.date));
        }
        setIsOpen(!isOpen());
    };

    const isToday = (d: Date) => {
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const isSameDate = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const generateCalendarDays = () => {
        const year = calendarViewDate().getFullYear();
        const month = calendarViewDate().getMonth();

        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];

        const prevMonthDays = getDaysInMonth(year, month - 1);
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonthDays - i)
            });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }

        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        return days;
    };

    const handleDateSelect = (date: Date) => {
        props.onDateChange(date);
        setIsOpen(false);
    };

    const prevMonth = () => {
        setCalendarViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCalendarViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    };

    const formatDateText = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const weekDayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div class="relative z-50">
            <div class="flex items-center gap-2 md:gap-4">
                <button
                    onClick={props.onPrevDay}
                    class="btn btn-circle btn-ghost btn-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <button
                    onClick={toggleCalendar}
                    class="group relative px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/5 w-72 flex justify-center"
                >
                    <div class="text-white/60 text-lg md:text-xl font-light tracking-wide flex items-center justify-center gap-2 group-hover:text-primary transition-colors w-full">
                        <span class="truncate">{formatDateText(props.date)}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class={`h-4 w-4 transition-transform duration-300 flex-shrink-0 ${isOpen() ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                <button
                    onClick={props.onNextDay}
                    class="btn btn-circle btn-ghost btn-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <Presence>
                <Show when={isOpen()}>
                    <Motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        class="absolute top-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-4 w-80 bg-[#1a1d24]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden"
                    >
                        <div class="flex items-center justify-between mb-6">
                            <button onClick={prevMonth} class="btn btn-circle btn-ghost btn-xs text-white/50 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span class="text-white font-bold text-lg">
                                {calendarViewDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={nextMonth} class="btn btn-circle btn-ghost btn-xs text-white/50 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>

                        <div class="grid grid-cols-7 mb-2">
                            <For each={weekDayNames}>
                                {(day) => (
                                    <div class="text-center text-xs font-bold text-white/30 uppercase tracking-widest">{day}</div>
                                )}
                            </For>
                        </div>

                        <div class="grid grid-cols-7 gap-1">
                            <For each={generateCalendarDays()}>
                                {(item) => (
                                    <button
                                        onClick={() => handleDateSelect(item.date)}
                                        class={`
                                            h-9 w-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200
                                            ${!item.isCurrentMonth ? 'text-white/10' : 'text-white/80 hover:bg-white/10 hover:text-white'}
                                            ${isSameDate(item.date, props.date) ? 'bg-primary text-primary-content shadow-[0_0_15px_theme(colors.primary.DEFAULT)] font-bold hover:bg-primary hover:text-primary-content' : ''}
                                            ${isToday(item.date) && !isSameDate(item.date, props.date) ? 'border border-primary/50 text-primary' : ''}
                                        `}
                                    >
                                        {item.day}
                                    </button>
                                )}
                            </For>
                        </div>

                        <div class="mt-4 pt-4 border-t border-white/5 flex justify-center">
                            <button
                                onClick={() => handleDateSelect(new Date())}
                                class="btn btn-ghost btn-xs text-primary/80 hover:text-primary"
                            >
                                Jump to Today
                            </button>
                        </div>
                    </Motion.div>
                </Show>
            </Presence>
        </div>
    );
};

export default DatePicker;

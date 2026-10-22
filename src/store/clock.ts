import { createSignal } from "solid-js";
import { todayKey } from "../lib/date";

const [today, setToday] = createSignal(todayKey());

const tick = () => {
    const key = todayKey();
    if (key !== today()) setToday(key);
};

setInterval(tick, 60_000);
document.addEventListener('visibilitychange', tick);
window.addEventListener('focus', tick);

export { today };

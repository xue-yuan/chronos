import { type Component, For, createMemo, onMount } from 'solid-js';
import { addDays, parseDateKey, toDateKey } from '../../lib/date';

interface HeatmapProps {
    /** First and last day shown (inclusive), as date keys. */
    from: string;
    to: string;
    /** null = nothing expected that day; 0 = missed; 1 = done (values above 1 render the same). */
    value: (key: string) => number | null;
    title: (key: string) => string;
    today?: string;
    cellSize?: number;
    onSelect?: (key: string) => void;
    /** When the heatmap overflows its scroll container (phones), start scrolled to this day. */
    scrollTo?: string;
}

const GAP = 3;
const LEFT = 26;
const TOP = 14;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Heatmap: Component<HeatmapProps> = (props) => {
    const size = () => props.cellSize ?? 14;
    const step = () => size() + GAP;

    const layout = createMemo(() => {
        const start = parseDateKey(props.from);
        const end = parseDateKey(props.to);
        const gridStart = addDays(start, -start.getDay());
        const cells: { key: string; col: number; row: number }[] = [];
        const months: { label: string; col: number }[] = [];
        for (let d = start; d <= end; d = addDays(d, 1)) {
            const col = Math.floor(Math.round((d.getTime() - gridStart.getTime()) / 86400000) / 7);
            cells.push({ key: toDateKey(d), col, row: d.getDay() });
            if (d.getDate() === 1 || cells.length === 1) months.push({ label: MONTHS[d.getMonth()], col });
        }
        const cols = (cells.at(-1)?.col ?? 0) + 1;
        if (months.length > 1 && months[1].col - months[0].col < 3) months.shift();
        return { cells, months, cols };
    });

    const width = () => LEFT + layout().cols * step();

    let svgRef: SVGSVGElement | undefined;
    onMount(() => {
        const target = props.scrollTo;
        const cell = target ? layout().cells.find(c => c.key === target) : undefined;
        const ratio = cell ? (LEFT + (cell.col + 1) * step()) / width() : 0;
        requestAnimationFrame(() => {
            const container = svgRef?.parentElement;
            if (!svgRef || !container || !cell || container.scrollWidth <= container.clientWidth) return;
            container.scrollLeft = ratio * svgRef.clientWidth - container.clientWidth * 0.85;
        });
    });
    const height = () => TOP + 7 * step();

    const fill = (key: string) => {
        const v = props.value(key);
        if (v === null) return { fill: 'var(--color-base-content)', opacity: 0.04 };
        if (v <= 0) return { fill: 'var(--color-base-content)', opacity: 0.1 };
        return { fill: 'var(--color-primary)', opacity: v >= 1 ? 1 : 0.25 + 0.55 * v };
    };

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${width()} ${height()}`}
            class="block w-full h-auto select-none text-base-content"
            style={{ 'min-width': `${Math.min(width(), layout().cols * 11 + LEFT)}px`, 'max-width': `${width()}px` }}
            role="img"
            aria-label="Activity heatmap"
        >
            <For each={layout().months}>
                {(m) => <text x={LEFT + m.col * step()} y={9} font-size="9" fill="currentColor" fill-opacity="0.45">{m.label}</text>}
            </For>
            <For each={['Mon', 'Wed', 'Fri']}>
                {(label, i) => <text x={0} y={TOP + (i() * 2 + 1) * step() + size() * 0.75} font-size="9" fill="currentColor" fill-opacity="0.35">{label}</text>}
            </For>
            <For each={layout().cells}>
                {(cell) => {
                    const f = createMemo(() => fill(cell.key));
                    return <rect
                        x={LEFT + cell.col * step()}
                        y={TOP + cell.row * step()}
                        width={size()}
                        height={size()}
                        rx={3}
                        fill={f().fill}
                        fill-opacity={f().opacity}
                        stroke={cell.key === props.today ? 'var(--color-base-content)' : 'none'}
                        stroke-opacity="0.6"
                        class={props.onSelect ? 'cursor-pointer hover:opacity-70' : ''}
                        onClick={() => props.onSelect?.(cell.key)}
                    >
                        <title>{props.title(cell.key)}</title>
                    </rect>;
                }}
            </For>
        </svg>
    );
};

export default Heatmap;

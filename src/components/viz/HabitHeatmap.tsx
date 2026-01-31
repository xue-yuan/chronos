import { type Component, createEffect, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import * as d3 from 'd3';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { authStore } from '../../store/auth';
import { habitsStore } from '../../store/habits';

interface HabitHeatmapProps {
    year?: number;
    habitId?: string;
    mode?: 'checkbox' | 'quantifiable';
    dailyTarget?: number;
}

const HabitHeatmap: Component<HabitHeatmapProps> = (props) => {
    let svgRef: SVGSVGElement | undefined;
    let tooltipRef: HTMLDivElement | undefined;

    const renderHeatmap = (data: any[], year: number) => {
        const habitIdProp = props.habitId;
        const cellSize = 20;
        const cellGap = 4;
        const width = 53 * (cellSize + cellGap) + 50;
        const height = 7 * (cellSize + cellGap) + 30;

        if (!svgRef) return;
        const svg = d3.select(svgRef);
        svg.selectAll("*").remove();

        const formatDay = d3.timeFormat("%w");

        const color = d3.scaleLinear<string>()
            .domain([0, 0.2, 0.5, 1, 1.5, 2, 3])
            .range([
                "#ffffff0d", // 0% - Faint
                "#4c1d9533", // 20%
                "#6d28d999", // 50%
                "#8b5cf6",   // 100% - Primary Base
                "#7c3aed",   // 150%
                "#6d28d9",   // 200%
                "#4c1d95"    // 300% - Deepest
            ])
            .clamp(true);

        const dataByDate = new Map(data.map(d => [d.date, d]));

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);
        const days = d3.timeDays(startDate, endDate);

        const g = svg.append("g").attr("transform", "translate(40, 25)");

        g.selectAll(".day")
            .data(days)
            .enter().append("rect")
            .attr("class", "day")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", (d: Date) => {
                const weekNum = d3.timeWeek.count(startDate, d);
                return weekNum * (cellSize + cellGap);
            })
            .attr("y", (d: Date) => parseInt(formatDay(d)) * (cellSize + cellGap))
            .attr("fill", (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                const entry = dataByDate.get(dateStr);

                if (dateStr === '2026-01-24' && habitIdProp) {
                    console.log(`[Heatmap Debug ${habitIdProp}] Date: ${dateStr}, Entry:`, entry);
                }

                if (!entry || (entry.value === 0 && !entry.tasks.includes("Done"))) return "#ffffff08";

                const visValue = Math.max(0.2, entry.value);
                return color(visValue);
            })
            .attr("rx", 4)
            .attr("ry", 4)
            .on("mouseover", (event: MouseEvent, d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const niceDate = d3.timeFormat("%a, %b %d, %Y")(d);

                const entry = dataByDate.get(dateStr);
                if (tooltipRef) {
                    tooltipRef.style.visibility = "visible";
                    tooltipRef.style.opacity = "1";

                    const score = entry ? Math.round(entry.value * 100) : 0;
                    const tasks = entry ? `${entry.tasks}/${Number(entry.total) === 1 ? '1' : entry.total}` : "No data";

                    tooltipRef.innerHTML = `
                        <div class="font-bold text-white mb-1">${niceDate}</div>
                        <div class="flex justify-between gap-4 text-white/70">
                            <span>Score</span>
                            <span class="text-primary font-bold">${score}%</span>
                        </div>
                        <div class="flex justify-between gap-4 text-white/70 text-xs">
                            <span>Value</span>
                            <span>${tasks}</span>
                        </div>
                    `;

                    const target = event.target as SVGRectElement;
                    const rect = target.getBoundingClientRect();

                    tooltipRef.style.left = `${rect.left + rect.width / 2}px`;
                    tooltipRef.style.top = `${rect.top - 10}px`;
                    tooltipRef.style.transform = "translate(-50%, -100%)";
                }
            })
            .on("mouseout", () => {
                if (tooltipRef) {
                    tooltipRef.style.visibility = "hidden";
                    tooltipRef.style.opacity = "0";
                }
            });

        const months = d3.timeMonths(startDate, endDate);
        const monthFormat = d3.timeFormat("%b");

        svg.append("g")
            .attr("transform", "translate(40, 15)")
            .selectAll(".month")
            .data(months)
            .enter().append("text")
            .attr("x", (d: Date) => {
                const weekNum = d3.timeWeek.count(startDate, d);
                return weekNum * (cellSize + cellGap);
            })
            .attr("y", 0)
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("fill", "#ffffff60")
            .text(monthFormat);

        const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
        svg.append("g")
            .attr("transform", "translate(10, 25)")
            .selectAll(".dayLabel")
            .data(dayLabels)
            .enter().append("text")
            .attr("x", 20)
            .attr("y", (_, i) => i * (cellSize + cellGap) + 11)
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("fill", "#ffffff40")
            .text(d => d);

        svg.attr("viewBox", `0 0 ${width + 50} ${height + 20}`);
        svg.attr("width", `${width + 50}px`);
        svg.attr("height", "auto");
    };

    createEffect(() => {
        const uid = authStore.user()?.uid;
        const yearProp = props.year;
        const habitIdProp = props.habitId;
        const modeProp = props.mode;
        const targetProp = props.dailyTarget;
        const activeHabits = habitsStore.habits();

        if (!uid) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const targetYear = yearProp || new Date().getFullYear();
        const startOfYear = new Date(targetYear, 0, 1);

        const offset = startOfYear.getTimezoneOffset();
        const localStart = new Date(startOfYear.getTime() - (offset * 60 * 1000));
        const startDateStr = localStart.toISOString().split('T')[0];

        const q = query(collection(db, "daily_plans"),
            where("uid", "==", uid),
            where("date", ">=", startDateStr)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bestEntries = new Map<string, any>();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!data.date || !data.date.startsWith(`${targetYear}`)) return;

                let value = 0;
                let taskText = "0";
                let totalBase = targetProp || 1;

                if (habitIdProp) {
                    if (data.habitLogs && data.habitLogs[habitIdProp]) {
                        const log = data.habitLogs[habitIdProp];
                        if (modeProp === 'quantifiable') {
                            const target = targetProp || 1;
                            value = (log.value || 0) / target;
                            taskText = `${log.value || 0}`;
                        } else {
                            value = log.completed ? 1 : 0;
                            taskText = log.completed ? "Done" : "Missed";
                        }
                    }
                } else {
                    if (data.habitLogs) {
                        let logs = Object.values(data.habitLogs) as any[];
                        if (data.date === todayStr && activeHabits) {
                            const activeHabitIds = new Set(activeHabits.map(h => h.id));
                            logs = Object.entries(data.habitLogs)
                                .filter(([id, _]) => activeHabitIds.has(id))
                                .map(([_, log]) => log) as any[];
                        }

                        const totalCount = logs.length;
                        const completedCount = logs.filter(l => l.completed).length;

                        if (totalCount > 0) {
                            value = completedCount / totalCount;
                            taskText = `${completedCount}`;
                            totalBase = totalCount;
                        }
                    }
                }

                const vizValue = Math.max(0, value);

                const existing = bestEntries.get(data.date);
                if (!existing || vizValue > existing.value) {
                    bestEntries.set(data.date, {
                        date: data.date,
                        value: vizValue,
                        tasks: taskText,
                        total: totalBase
                    });
                }
            });

            const processedData = Array.from(bestEntries.values());


            if (svgRef) {
                renderHeatmap(processedData, targetYear);
            }
        });

        onCleanup(() => unsubscribe());
    });

    return (
        <div class="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-2">
            <svg ref={svgRef} class="text-white/20 select-none block"></svg>
            <Portal mount={document.body}>
                <div
                    ref={tooltipRef}
                    class="fixed bg-[#1a1d24] border border-white/10 text-white text-xs p-3 rounded-xl pointer-events-none z-[9999] shadow-2xl backdrop-blur-xl transition-opacity duration-200 opacity-0"
                    style="visibility: hidden; top: 0; left: 0;"
                ></div>
            </Portal>
        </div>
    );
};

export default HabitHeatmap;

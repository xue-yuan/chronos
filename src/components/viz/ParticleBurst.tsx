import { type Component, createEffect } from 'solid-js';
import * as d3 from 'd3';

interface ParticleBurstProps {
    active: boolean;
    x?: number;
    y?: number;
}

const ParticleBurst: Component<ParticleBurstProps> = (props) => {
    let containerRef: HTMLDivElement | undefined;

    createEffect(() => {
        if (props.active && containerRef) {
            explode(props.x || window.innerWidth / 2, props.y || window.innerHeight / 2);
        }
    });

    const explode = (x: number, y: number) => {
        if (!containerRef) return;

        let svg = d3.select(containerRef).select<SVGSVGElement>("svg");
        if (svg.empty()) {
            svg = d3.select(containerRef)
                .append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .style("position", "fixed")
                .style("top", "0")
                .style("left", "0")
                .style("pointer-events", "none")
                .style("z-index", "9999");
        }

        const particleCount = 30;
        const colors = ["#FFD700", "#FF6347", "#32CD32", "#1E90FF", "#FF69B4"];

        for (let i = 0; i < particleCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.random() * 2 * Math.PI;
            const velocity = Math.random() * 6 + 2;

            svg.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", Math.random() * 5 + 2)
                .attr("fill", color)
                .transition()
                .duration(1000)
                .ease(d3.easeExpOut)
                .attr("cx", x + Math.cos(angle) * (velocity * 20))
                .attr("cy", y + Math.sin(angle) * (velocity * 20))
                .attr("opacity", 0)
                .remove();
        }
    };

    return <div ref={containerRef}></div>;
};

export default ParticleBurst;

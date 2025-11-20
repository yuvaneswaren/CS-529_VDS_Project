import * as d3 from "d3";

export default function StackedAreaChart() {
  let height = 260;

  // Fix: increased right margin for legend
  let margin = { top: 30, right: 130, bottom: 45, left: 70 };

  function chart(selection, data) {
    selection.each(function () {
      const container = d3.select(this);
      container.selectAll("*").remove();

      const containerWidth = this.clientWidth;
      const width = containerWidth;

      const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      const keys = Object.keys(data[0]).filter((k) => k !== "year");

      const x = d3
        .scaleLinear()
        .domain([2010, 2024])
        .range([0, innerWidth]);

      const stack = d3.stack().keys(keys);
      const series = stack(data);

      const y = d3.scaleLinear()
        .domain([0, d3.max(series, (s) => d3.max(s, (d) => d[1]))])
        .range([innerHeight, 0])
        .nice();

      const colors = {
        contributions: "#4F81BD",
        programServices: "#C0504D",
        investment: "#9BBB59",
        other: "#8064A2"
      }

      const area = d3.area()
        .x((d) => x(d.data.year))
        .y0((d) => y(d[0]))
        .y1((d) => y(d[1]))
        .curve(d3.curveMonotoneX);

      g.append("g")
        .attr("transform", "translate(0," + innerHeight + ")")
        .call(d3.axisBottom(x).tickFormat((d) => d));

      g.append("g")
        .call(d3.axisLeft(y).ticks(5));

      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -55)
        .style("font-size", "12px")
        .style("font-weight", "600")
        .text("Amount ($)");

      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 35)
        .style("font-size", "12px")
        .style("font-weight", "600")
        .text("Year");

      g.selectAll(".layer")
        .data(series)
        .enter()
        .append("path")
        .attr("fill", (d) => colors[d.key])
        .attr("opacity", 0.9)
        .attr("d", area);

      // FIX: Legend positioned inside safe area
      const legendX = margin.left + innerWidth + 10;

      const legend = svg
        .append("g")
        .attr("transform", "translate(" + legendX + "," + margin.top + ")");

      keys.forEach((k, i) => {
        const row = legend.append("g")
          .attr("transform", "translate(0," + i * 22 + ")");

        row.append("rect")
          .attr("width", 14)
          .attr("height", 14)
          .attr("fill", colors[k])
          .attr("stroke", "#222");

        row.append("text")
          .attr("x", 20)
          .attr("y", 12)
          .style("font-size", "12px")
          .text(k);
      });

    });
  }

  return chart;
}

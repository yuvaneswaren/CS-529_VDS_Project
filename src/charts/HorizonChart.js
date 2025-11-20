import * as d3 from "d3";

export default function HorizonChart() {
  let width = 600;
  let height = 260;

  let margin = { top: 40, right: 120, bottom: 40, left: 50 };

  // Reduced bands from 6 to 4 for thicker/taller bands
  let bands = 4;

  let colorsPositive = [
    "#9ec5ff",
    "#6ea8fe",
    "#0a58ca",
    "#084298"
  ];

  let colorsNegative = [
    "#ffb3b8",
    "#ff8fa3",
    "#f03e55",
    "#c62f42"
  ];

  function chart(selection, rawData) {
    selection.each(function () {
      const container = d3.select(this);
      container.selectAll("*").remove();

      const containerWidth = this.clientWidth || width;
      width = containerWidth;

      const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      const g = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const data = rawData.filter((d) => +d.year >= 2010);

      const x = d3
        .scaleBand()
        .domain(data.map((d) => d.year))
        .range([0, innerWidth])
        .padding(0.3);

      const maxAbs = d3.max(data, (d) => Math.abs(d.value)) * 1.2;

      const y = d3
        .scaleLinear()
        .domain([-maxAbs, maxAbs])
        .range([innerHeight, 0]);

      // axes - X axis only
      g.append("g")
        .attr("transform", "translate(0," + innerHeight + ")")
        .call(d3.axisBottom(x));

      svg.append("text")
        .attr("x", margin.left + innerWidth / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .text("Year");

      svg.append("text")
        .attr("x", -(margin.top + innerHeight / 2))
        .attr("y", 15)
        .attr("transform", "rotate(-90)")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .attr("text-anchor", "middle")
        .text("Surplus Margin");

      const bandHeight = maxAbs / bands;

      const area = d3.area()
        .x((d) => x(d.year) + x.bandwidth() / 2)
        .y0(() => y(0))
        .y1((d) => y(d.val))
        .curve(d3.curveMonotoneX);

      for (let i = 0; i < bands; i++) {
        const lower = i * bandHeight;
        const upper = (i + 1) * bandHeight;

        const posLayer = data.map((d) => {
          let v = d.value;
          if (v < lower) v = 0;
          else if (v > upper) v = bandHeight;
          else v = v - lower;
          return { year: d.year, val: v };
        });

        const negLayer = data.map((d) => {
          let v = d.value;
          if (v > -lower) v = 0;
          else if (v < -upper) v = -bandHeight;
          else v = v + lower;
          return { year: d.year, val: v };
        });

        g.append("path")
          .datum(posLayer)
          .attr("fill", colorsPositive[i])
          .attr("opacity", 0.85)
          .attr("d", area);

        g.append("path")
          .datum(negLayer)
          .attr("fill", colorsNegative[i])
          .attr("opacity", 0.85)
          .attr("d", area);
      }

      // Legend on the right
      const legendX = width - margin.right + 10;

      const legend = svg
        .append("g")
        .attr("transform", "translate(" + legendX + "," + margin.top + ")");

      const legendHeight = innerHeight;
      const legendWidth = 18;

      const legendScale = d3
        .scaleLinear()
        .domain([-maxAbs, maxAbs])
        .range([legendHeight, 0]);

      const legendAxis = d3.axisRight(legendScale).ticks(6).tickSize(3);

      const gradient = svg
        .append("defs")
        .append("linearGradient")
        .attr("id", "horizonLegendGradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

      const legendColors = [...colorsNegative].reverse().concat(colorsPositive);

      legendColors.forEach((c, i) => {
        gradient.append("stop")
          .attr("offset", (i / (legendColors.length - 1)) * 100 + "%")
          .attr("stop-color", c);
      });

      legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#horizonLegendGradient)");

      legend.append("g")
        .attr("transform", "translate(" + legendWidth + ",0)")
        .call(legendAxis)
        .selectAll("text")
        .style("font-size", "10px");
    });
  }

  return chart;
}
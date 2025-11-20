import * as d3 from "d3";

export function drawLineChart(orgList, container) {
  container.innerHTML = "";
  container.style.position = "relative";

  const width = container.clientWidth;
  const height = container.clientHeight;

  if (!orgList || orgList.length === 0) return;

  const orgs = orgList.map((o, idx) => {
    const name = o.name || o.metadata?.name || "";
    const years = Object.keys(o.financials)
      .filter(y => o.financials[y].summary && o.financials[y].summary.Revenue)
      .map(y => Number(y))
      .sort((a, b) => a - b);

    return {
      idx,
      ein: o.ein,
      name,
      financials: o.financials,
      years
    };
  });

  let sharedYears = orgs[0].years.slice();
  orgs.slice(1).forEach(o => {
    sharedYears = sharedYears.filter(y => o.years.includes(y));
  });

  sharedYears = sharedYears.slice(-4);
  if (sharedYears.length === 0) return;

  const series = orgs.map(o => ({
    label: "EIN " + (o.idx + 1),
    ein: o.ein,
    name: o.name,
    values: sharedYears.map(yr => ({
      year: yr,
      revenue: o.financials[String(yr)].summary.Revenue || 0
    }))
  }));

  const maxRevenue = d3.max(series, s => d3.max(s.values, v => v.revenue));

  const x = d3.scalePoint()
    .domain(sharedYears)
    .range([80, width - 140])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, maxRevenue])
    .range([height - 60, 40]);

  const color = d3.scaleOrdinal()
    .domain(series.map(s => s.label))
    .range(["#DC267F", "#FE6100", "#5779D0", "#009E73", "#FFB00D"]);

  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("position", "relative");

  // Add chart title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "700")
    .attr("fill", "#333")
    .text("Revenue Trends Over Time");

  svg.append("g")
    .attr("transform", "translate(0," + (height - 60) + ")")
    .call(d3.axisBottom(x));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "600")
    .text("YEAR");

  svg.append("g")
    .attr("transform", "translate(80,0)")
    .call(
      d3.axisLeft(y)
        .tickFormat(() => "")
        .tickSize(0)
    )
    .selectAll("text")
    .remove();

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height / 2))
    .attr("y", 55)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "600")
    .text("REVENUE");

  const lineGen = d3.line()
    .curve(d3.curveMonotoneX)
    .x(d => x(d.year))
    .y(d => y(d.revenue));

  const tooltip = d3.select(container)
    .append("div")
    .style("position", "absolute")
    .style("padding", "8px 12px")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "white")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 1000)
    .style("white-space", "nowrap");

  series.forEach(s => {
    svg.append("path")
      .datum(s.values)
      .attr("fill", "none")
      .attr("stroke", color(s.label))
      .attr("stroke-width", 3)
      .attr("d", lineGen);

    s.values.forEach(v => {
      svg.append("circle")
        .attr("cx", x(v.year))
        .attr("cy", y(v.revenue))
        .attr("r", 5)
        .attr("fill", color(s.label))
        .style("cursor", "pointer")
        .on("mouseover", function () {
          const mil = (v.revenue / 1_000_000).toFixed(2);
          tooltip
            .style("opacity", 1)
            .html(
              "Name: " + s.name + "<br>" +
              "EIN: " + s.ein + "<br>" +
              "Revenue: $" + mil + " M"
            );
        })
        .on("mousemove", function (event) {
          const rect = container.getBoundingClientRect();
          const xPos = event.clientX - rect.left + 15;
          const yPos = event.clientY - rect.top - 35;
          tooltip
            .style("left", xPos + "px")
            .style("top", yPos + "px");
        })
        .on("mouseout", function () {
          tooltip.style("opacity", 0);
        });
    });
  });

  const legend = svg.append("g")
    .attr("transform", "translate(" + (width - 110) + ",40)");

  series.forEach((s, i) => {
    const row = legend.append("g")
      .attr("transform", "translate(0," + i * 22 + ")");

    row.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 6)
      .attr("fill", color(s.label));

    row.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", "12px")
      .text(s.label);
  });
}
import * as d3 from "d3";

export function drawArcDiagram(orgList, container) {
  container.innerHTML = "";
  container.style.position = "relative";

  const width = container.clientWidth;
  const height = container.clientHeight;

  if (!orgList || orgList.length === 0) return;

  function getLatestValidYear(financials) {
    const years = Object.keys(financials)
      .map(y => parseInt(y))
      .sort((a, b) => b - a);
    for (let y of years) {
      const s = financials[String(y)].summary;
      if (s && s.Revenue && s.Expenses) return String(y);
    }
    return null;
  }

  const data = orgList
    .map(org => {
      const y = getLatestValidYear(org.financials);
      if (!y) return null;
      const s = org.financials[y].summary;
      const rev = s.Revenue || 0;
      const exp = s.Expenses || 0;
      const ratio = rev > 0 ? exp / rev : 0;
      return { ein: org.ein, name: org.name, ratio: ratio };
    })
    .filter(d => d !== null);

  if (data.length < 2) return;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Add chart title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "700")
    .attr("fill", "#333")
    .text("Expense-to-Revenue Ratio Comparison");

  const margin = { left: 40, right: 40, top: 100, bottom: 40 };
  const yCenter = height * 0.70;

  const xScale = d3
    .scalePoint()
    .domain(data.map(d => d.ein))
    .range([margin.left, width - margin.right])
    .padding(0.6);

  const diffs = [];
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      diffs.push(Math.abs(data[i].ratio - data[j].ratio));
    }
  }

  const maxDiff = d3.max(diffs);
  const thicknessScale = d3
    .scalePow()
    .exponent(3)
    .domain([0, maxDiff])
    .range([14, 2]);

  const tooltip = d3
    .select(container)
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

  const g = svg.append("g");

  const pairs = [];
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      pairs.push({
        source: data[i],
        target: data[j],
        diff: Math.abs(data[i].ratio - data[j].ratio)
      });
    }
  }

  const nodeColors = ["#DC267F", "#FE6100", "#5779D0", "#009E73", "#FFB00D"];
  const arcColor = "#455A64";

  pairs.forEach(p => {
    const x1 = xScale(p.source.ein);
    const x2 = xScale(p.target.ein);
    const mid = (x1 + x2) / 2;
    const radius = Math.abs(x2 - x1) / 2;

    g.append("path")
      .attr("d", `M ${x1},${yCenter} Q ${mid},${yCenter - radius} ${x2},${yCenter}`)
      .attr("fill", "none")
      .attr("stroke", arcColor)
      .attr("stroke-width", thicknessScale(p.diff))
      .style("cursor", "pointer")
      .on("mouseover", function() {
        tooltip
          .style("opacity", 1)
          .html("Ratio difference: " + p.diff.toFixed(5));
      })
      .on("mousemove", function(event) {
        const rect = container.getBoundingClientRect();
        const xPos = event.clientX - rect.left + 15;
        const yPos = event.clientY - rect.top - 35;
        tooltip
          .style("left", xPos + "px")
          .style("top", yPos + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
      });
  });

  data.forEach((d, i) => {
    const x = xScale(d.ein);
    const nodeColor = nodeColors[i % nodeColors.length];

    g.append("circle")
      .attr("cx", x)
      .attr("cy", yCenter)
      .attr("r", 10)
      .attr("fill", nodeColor)
      .style("cursor", "pointer")
      .on("mouseover", function() {
        tooltip
          .style("opacity", 1)
          .html("Name "  + ": " + d.name + "<br>EIN: " + d.ein);
      })
      .on("mousemove", function(event) {
        const rect = container.getBoundingClientRect();
        const xPos = event.clientX - rect.left + 15;
        const yPos = event.clientY - rect.top - 35;
        tooltip
          .style("left", xPos + "px")
          .style("top", yPos + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
      });

    g.append("text")
      .attr("x", x)
      .attr("y", yCenter + 32)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", "#333")
      .text("EIN " + (i + 1));
  });

  const legendGroup = svg.append("g")
    .attr("transform", `translate(${width / 2}, 50)`);

  const legendItems = [
    { label: "Organizations", type: "node" },
    { label: "Thick = Similar ratios", type: "thick" },
    { label: "Thin = Different ratios", type: "thin" }
  ];

  const itemWidth = 180;
  const startX = -(legendItems.length * itemWidth) / 2;

  legendItems.forEach((item, i) => {
    const gItem = legendGroup.append("g")
      .attr("transform", `translate(${startX + i * itemWidth}, 0)`);

    if (item.type === "node") {
      gItem.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 8)
        .attr("fill", "#455A64");
    } else if (item.type === "thick") {
      gItem.append("rect")
        .attr("x", -10)
        .attr("y", -5)
        .attr("width", 30)
        .attr("height", 10)
        .attr("fill", arcColor);
    } else {
      gItem.append("rect")
        .attr("x", -10)
        .attr("y", -2)
        .attr("width", 30)
        .attr("height", 4)
        .attr("fill", arcColor);
    }

    gItem.append("text")
      .attr("x", 25)
      .attr("y", 4)
      .attr("font-size", 12)
      .attr("fill", "#333")
      .text(item.label);
  });
}
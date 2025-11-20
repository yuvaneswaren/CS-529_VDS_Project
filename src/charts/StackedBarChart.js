import * as d3 from "d3";

export function drawStackedBarChart(orgList, container) {
  if (!container) return;

  container.innerHTML = "";
  container.style.position = "relative";

  const width = container.clientWidth;
  const height = container.clientHeight;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "stacked-bar-svg");

  const margin = { top: 60, right: 160, bottom: 50, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Add chart title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "700")
    .attr("fill", "#333")
    .text("Financial Metrics Comparison");
  
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

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const categories = ["revenue", "expenses", "netIncome", "netAssets"];

  const colorScale = d3.scaleOrdinal()
    .domain(categories)
    .range(["#DC267F", "#FE6100", "#5779D0", "#009E73", "#FFB00D"]);

  const processed = orgList.map((d, i) => {
    const years = Object.keys(d.financials).map(Number);
    const latest = Math.max(...years).toString();
    const fin = d.financials[latest]?.summary || {};

    const revenue = fin.Revenue || fin["Total revenue ($)"] || 0;
    const expenses = fin.Expenses || fin["Total functional expenses ($)"] || 0;
    const netIncome = fin["Net Income"] || fin["Net income ($)"] || 0;
    const netAssets = fin["Net Assets"] || fin["Net assets at end of fiscal year ($)"] || 0;

    const total = revenue + expenses + netIncome + netAssets || 1;

    return {
      label: "EIN " + (i + 1),
      name: d.name,
      ein: d.ein,
      revenuePct: revenue / total,
      expensesPct: expenses / total,
      netIncomePct: netIncome / total,
      netAssetsPct: netAssets / total
    };
  });

  const x = d3.scaleBand()
    .domain(processed.map(d => d.label))
    .range([0, chartWidth])
    .padding(0.35);

  const y = d3.scaleLinear().domain([0, 1]).range([chartHeight, 0]);

  g.append("g")
    .attr("class", "stacked-y-axis")
    .call(
      d3.axisLeft(y)
        .tickFormat(d => Math.round(d * 100) + "%")
        .ticks(5)
    );
    
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -chartHeight / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "600")
    .text("FINANCIAL METRICS");

  g.append("g")
    .attr("class", "stacked-x-axis")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x))
    .selectAll(".tick text")
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      const org = processed.find(p => p.label === d);
      const orgData = orgList[processed.indexOf(org)];
      tooltip
        .style("opacity", 1)
        .html("Name: " + orgData.name + "<br>EIN: " + orgData.ein);
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
    .attr("x", chartWidth / 2)
    .attr("y", chartHeight + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "600")
    .text("ORGANISATIONS");

  processed.forEach((org) => {
    const barX = x(org.label);
    let yStart = chartHeight;

    categories.forEach(cat => {
      const value = org[cat + "Pct"];
      const barHeight = chartHeight - y(value);

      g.append("rect")
        .attr("x", barX)
        .attr("width", x.bandwidth())
        .attr("y", yStart - barHeight)
        .attr("height", barHeight)
        .attr("fill", colorScale(cat))
        .attr("class", "stack-segment")
        .attr("data-category", cat)
        .on("mouseover", function () {
          const pct = Math.round(value * 100) + "%";
          const catName =
            cat === "revenue" ? "Revenue" :
            cat === "expenses" ? "Expenses" :
            cat === "netIncome" ? "Net Income" :
            "Net Assets";

          tooltip
            .style("opacity", 1)
            .html(catName + "<br>" + "Value: " + pct);
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

      yStart -= barHeight;
    });
  });

  processed.forEach((org) => {
    const barX = x(org.label);
    let yStart = chartHeight;

    categories.forEach(cat => {
      const value = org[cat + "Pct"];
      const barHeight = chartHeight - y(value);
      const minHeightForLabel = 20;
      
      const labelY = barHeight >= minHeightForLabel 
        ? yStart - barHeight / 2 
        : yStart - barHeight + 10;

      g.append("text")
        .attr("x", barX + x.bandwidth() / 2)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("fill", "black")
        .attr("class", "stack-label")
        .attr("data-category", cat)
        .style("pointer-events", "none")
        .text(Math.round(value * 100) + "%");

      yStart -= barHeight;
    });
  });

  const legendGroup = svg
    .append("g")
    .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`)
    .attr("class", "stacked-legend");

  let selectedCategory = null;

  categories.forEach((cat, i) => {
    const yPos = i * 22;

    const legendItem = legendGroup.append("g")
      .attr("class", "legend-item")
      .style("cursor", "pointer")
      .on("click", function() {
        selectedCategory = selectedCategory === cat ? null : cat;
        
        g.selectAll(".stack-segment")
          .transition()
          .duration(200)
          .style("opacity", function() {
            const rect = d3.select(this);
            return !selectedCategory || rect.attr("data-category") === selectedCategory ? 1 : 0.3;
          });
        
        g.selectAll(".stack-label")
          .transition()
          .duration(200)
          .style("opacity", function() {
            const text = d3.select(this);
            return !selectedCategory || text.attr("data-category") === selectedCategory ? 1 : 0.3;
          });
        
        legendGroup.selectAll(".legend-item")
          .transition()
          .duration(200)
          .style("opacity", function() {
            const item = d3.select(this);
            return !selectedCategory || item.attr("data-category") === selectedCategory ? 1 : 0.4;
          });
      })
      .attr("data-category", cat);

    legendItem.append("rect")
      .attr("x", 0)
      .attr("y", yPos)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", colorScale(cat));

    legendItem.append("text")
      .attr("x", 22)
      .attr("y", yPos + 11)
      .attr("font-size", "12px")
      .attr("class", "legend-label")
      .text(
        cat === "revenue" ? "Revenue" :
        cat === "expenses" ? "Expenses" :
        cat === "netIncome" ? "Net Income" :
        "Net Assets"
      );
  });
}
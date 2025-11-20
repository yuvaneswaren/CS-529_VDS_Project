import * as d3 from "d3"

export default function DeltaAreaChart() {
  let height = 260
  let margin = { top: 20, right: 25, bottom: 35, left: 70 }

  function chart(selection, data) {
    selection.each(function () {
      const container = d3.select(this)
      container.selectAll("*").remove()

      const containerWidth = this.clientWidth || 500
      const width = containerWidth

      const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height)

      const innerWidth = width - margin.left - margin.right
      const innerHeight = height - margin.top - margin.bottom

      const g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

      const filtered = data.filter(d => +d.year >= 2010)

      const x = d3.scaleLinear()
        .domain([2010, 2024])
        .range([0, innerWidth])

      const y = d3.scaleLinear()
        .domain(d3.extent(filtered, d => d.value))
        .nice()
        .range([innerHeight, 0])

      // SHARP STRAIGHT LINES
      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))

      // POSITIVE AREA (GREEN) - fill to zero baseline
      const areaPos = d3.area()
        .x(d => x(d.year))
        .y0(y(0))
        .y1(d => y(Math.max(0, d.value)))

      // NEGATIVE AREA (RED) - fill to zero baseline
      const areaNeg = d3.area()
        .x(d => x(d.year))
        .y0(y(0))
        .y1(d => y(Math.min(0, d.value)))

      // DRAW POSITIVE AREA
      g.append("path")
        .datum(filtered)
        .attr("d", areaPos)
        .attr("fill", "rgba(0,150,0,0.55)")

      // DRAW NEGATIVE AREA
      g.append("path")
        .datum(filtered)
        .attr("d", areaNeg)
        .attr("fill", "rgba(200,0,0,0.55)")

      // DRAW LINE ON TOP
      g.append("path")
        .datum(filtered)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "#004085")
        .attr("stroke-width", 2)

      // POINT CIRCLES
      g.selectAll(".point")
        .data(filtered)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value))
        .attr("r", 4)
        .attr("fill", d => d.value >= 0 ? "green" : "red")
        .attr("stroke", "#222")

      // TOOLTIP
      const tooltip = container.append("div")
        .style("position", "absolute")
        .style("padding", "6px 10px")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("border-radius", "6px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-size", "13px")
        .style("z-index", "1000")

      svg.on("mousemove", (e) => {
        const [px] = d3.pointer(e)
        const year = Math.round(x.invert(px - margin.left))
        const row = filtered.find(d => d.year === year)
        if (!row) return

        tooltip
          .style("opacity", 1)
          .style("left", e.pageX + 10 + "px")
          .style("top", e.pageY + "px")
          .html(
            "Year: " + row.year +
            "<br>Change: " + row.value.toLocaleString()
          )
      })

      svg.on("mouseleave", () => tooltip.style("opacity", 0))

      // AXES
      g.append("g")
        .attr("transform", "translate(0," + innerHeight + ")")
        .call(d3.axisBottom(x).tickFormat(d => d))
        .selectAll("text")
        .style("font-size", "11px")

      g.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .selectAll("text")
        .style("font-size", "11px")

      // Y AXIS LABEL - moved further left to avoid overlap
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -52)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .text("Net Assets Change ($)")

      // X AXIS LABEL
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 28)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .text("Year")
    })
  }

  chart.height = function (v) {
    height = v
    return chart
  }

  chart.margin = function (v) {
    margin = v
    return chart
  }

  return chart
}
import * as d3 from "d3"

export default function ViolinChart() {
let width = 300
let height = 200
let margin = { top: 20, right: 20, bottom: 30, left: 40 }
let zoomed = false

function chart(selection, values) {
selection.each(function() {
const container = d3.select(this)
container.selectAll("*").remove()

  let currentWidth = width
  let currentHeight = height

  const svg = container.append("svg")
    .attr("width", currentWidth)
    .attr("height", currentHeight)
    .style("cursor", "pointer")

  const tooltip = container.append("div")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("border-radius", "6px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("font-size", "13px")

  const innerWidth = currentWidth - margin.left - margin.right
  const innerHeight = currentHeight - margin.top - margin.bottom

  const g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  const x = d3.scaleLinear()
    .domain([d3.min(values), d3.max(values)])
    .range([0, innerWidth])

  const histogram = d3.bin().domain(x.domain()).thresholds(20)
  const bins = histogram(values)

  const maxCount = d3.max(bins, d => d.length)
  const scale = d3.scaleLinear().domain([0, maxCount]).range([0, innerHeight])

  const area = d3.area()
    .x(d => x((d.x0 + d.x1) / 2))
    .y0(innerHeight)
    .y1(d => innerHeight - scale(d.length))
    .curve(d3.curveCatmullRom)

  g.append("path")
    .datum(bins)
    .attr("d", area)
    .attr("fill", "#95a5a6")
    .attr("opacity", 0.85)
    .on("mousemove", function(e, d) {
      tooltip
        .style("opacity", 1)
        .style("left", e.pageX + 10 + "px")
        .style("top", e.pageY + "px")
        .html("Values: " + values.length)
    })
    .on("mouseleave", function() { tooltip.style("opacity", 0) })

  g.append("g")
    .attr("transform", "translate(0," + innerHeight + ")")
    .call(d3.axisBottom(x).ticks(5))

  svg.on("click", function() {
    zoomed = !zoomed
    const newW = zoomed ? currentWidth * 1.35 : width
    const newH = zoomed ? currentHeight * 1.35 : height

    svg.transition().duration(450)
      .attr("width", newW)
      .attr("height", newH)
  })
})


}

chart.width = function(v) { width = v; return chart }
chart.height = function(v) { height = v; return chart }
chart.margin = function(v) { margin = v; return chart }

return chart
}
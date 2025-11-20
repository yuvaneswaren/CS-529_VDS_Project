import React, { useState, useEffect, useRef } from "react"
import Header from "../components/Header"
import NavBar from "../components/NavBar"
import PageWrapper from "../components/PageWrapper"
import ChartModal from "../components/ChartModal"
import { fetchNonprofitSummary } from "../models/nonprofitModel"
import HorizonChart from "../charts/HorizonChart"
import StackedAreaChart from "../charts/StackedAreaChart"
import ViolinChart from "../charts/ViolinChart"
import DeltaAreaChart from "../charts/DeltaAreaChart"
import * as d3 from "d3"
import "../layout.css"


function SummaryPage() {
const [activeEin, setActiveEin] = useState("")
const [orgSummary, setOrgSummary] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

const [openChart, setOpenChart] = useState(null)

const horizonRef = useRef(null)
const stackedRef = useRef(null)
const violinRef = useRef(null)
const deltaRef = useRef(null)

const handleClear = () => {
setActiveEin("")
setOrgSummary(null)
setError(null)
}

const handleSearchSubmit = (value) => {
setActiveEin(value)
}

useEffect(() => {
async function load() {
if (!activeEin) return

  setLoading(true)
  setError(null)
  setOrgSummary(null)

  try {
    const data = await fetchNonprofitSummary(activeEin)
    setOrgSummary(data)
  } catch (err) {
    setError(err.message || "Failed to load data")
  } finally {
    setLoading(false)
  }
}

load()


}, [activeEin])

useEffect(() => {
if (!orgSummary) return

const surplus = orgSummary.charts.horizon.surplusMargin.map(d => ({
  year: d.year,
  value: d.value === null ? 0 : d.value
}))

const revenueSeries = orgSummary.charts.stackedRevenue.series.map(s => ({
  key: s.key,
  values: s.values
}))

const stackedMerged = orgSummary.charts.stackedRevenue.years.map(year => {
  const row = { year }
  revenueSeries.forEach(s => {
    const found = s.values.find(v => v.year === year)
    row[s.key] = found ? found.value : 0
  })
  return row
})

const violin = orgSummary.charts.violin
const violinValues = violin.length > 0 ? violin[0].values : []

const delta = orgSummary.charts.netAssetsDelta.map(d => ({
  year: d.year,
  value: d.value === null ? 0 : d.value
}))

const horizonChart = HorizonChart()
const stackedChart = StackedAreaChart()
const violinChart = ViolinChart()
const deltaChart = DeltaAreaChart()

if (horizonRef.current) {
  d3.select(horizonRef.current).call(horizonChart, surplus)
}

if (stackedRef.current) {
  d3.select(stackedRef.current).call(stackedChart, stackedMerged)
}

if (violinRef.current) {
  d3.select(violinRef.current).call(violinChart, violinValues)
}

if (deltaRef.current) {
  d3.select(deltaRef.current).call(deltaChart, delta)
}

if (openChart === "horizon" && document.getElementById("modal-horizon-chart")) {
  d3.select("#modal-horizon-chart").call(horizonChart, surplus)
}

if (openChart === "stacked" && document.getElementById("modal-stacked-chart")) {
  d3.select("#modal-stacked-chart").call(stackedChart, stackedMerged)
}

if (openChart === "violin" && document.getElementById("modal-violin-chart")) {
  d3.select("#modal-violin-chart").call(violinChart, violinValues)
}

if (openChart === "delta" && document.getElementById("modal-delta-chart")) {
  d3.select("#modal-delta-chart").call(deltaChart, delta)
}


}, [orgSummary, openChart])

return (
<PageWrapper>
<div className="page-container" data-page="summary">

    <Header />
    <NavBar onSearch={handleSearchSubmit} onClear={handleClear} />

    {!activeEin && !loading && (
      <div className="summary-placeholder-message">
        <p>
          Type an EIN in the search bar to view the organization’s summary.
          You will see charts and details after submitting a valid EIN.
        </p>
      </div>
    )}

    {loading && (
      <div className="summary-loading-msg">
        Loading organization data...
      </div>
    )}

    {error && (
      <div className="summary-error-msg">
        {error}
      </div>
    )}

    {orgSummary && !loading && !error && (
      <div className="summary-layout">

        <div className="summary-left">

          <div className="summary-card" ref={horizonRef} onClick={() => setOpenChart("horizon")}>
              <div className="summary-card-title">Horizon Chart</div>
          </div>

          <div className="summary-card" ref={stackedRef} onClick={() => setOpenChart("stacked")}>
              <div className="summary-card-title">Revenue Mix</div>
          </div>

          <div className="summary-card full-width-row" ref={deltaRef} onClick={() => setOpenChart("delta")}>
              <div className="summary-card-title">Net Assets Change</div>
          </div>

        </div>

        <div className="summary-right">

          <div className="company-header">
            {orgSummary.metadata.name || "Organization Details"}
          </div>

          <div className="company-info">

            <div className="company-info-row">
              <strong>EIN:</strong> {orgSummary.ein}
            </div>

            <div className="company-info-row">
              <strong>Location:</strong> {orgSummary.metadata.location}
            </div>

            <div className="company-info-row">
              <strong>NTEE Category:</strong> {orgSummary.metadata.ntee_category}
            </div>

            <div className="company-info-row">
              <strong>Tax Exempt Since:</strong> {orgSummary.metadata.tax_exempt_since}
            </div>

            <div className="company-info-subheading">Details</div>

            {Object.entries(orgSummary.details).map(([k, v]) => (
              <div className="company-info-row" key={k}>
                <strong>{k}:</strong> {v}
              </div>
            ))}

          </div>
        </div>

      </div>
    )}

    <ChartModal
      open={openChart === "horizon"}
      onClose={() => setOpenChart(null)}
    >
      <div id="modal-horizon-chart" style={{ width: "100%", height: "100%" }}></div>
    </ChartModal>

    <ChartModal
      open={openChart === "stacked"}
      onClose={() => setOpenChart(null)}
    >
      <div id="modal-stacked-chart" style={{ width: "100%", height: "100%" }}></div>
    </ChartModal>

    <ChartModal
      open={openChart === "violin"}
      onClose={() => setOpenChart(null)}
    >
      <div id="modal-violin-chart" style={{ width: "100%", height: "100%" }}></div>
    </ChartModal>

    <ChartModal
      open={openChart === "delta"}
      onClose={() => setOpenChart(null)}
    >
      <div id="modal-delta-chart" style={{ width: "100%", height: "100%" }}></div>
    </ChartModal>

  </div>
</PageWrapper>


)
}

export default SummaryPage
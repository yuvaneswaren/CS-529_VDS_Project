const API_BASE_URL = "https://api-ashen-eight-15.vercel.app"

function toNumber(value) {
if (value === null || value === undefined) return null
if (typeof value === "number") return value

const cleaned = String(value).replace(/[^0-9.-]/g, "")
if (!cleaned) return null

const num = parseFloat(cleaned)
if (Number.isNaN(num)) return null
return num
}

function sortYearKeys(obj) {
if (!obj) return []
return Object.keys(obj)
.filter((key) => /^\d{4}$/.test(key))
.sort((a, b) => Number(a) - Number(b))
}

function findAmountByCategory(items, candidates) {
if (!Array.isArray(items)) return null
const lowerCandidates = candidates.map((c) => c.toLowerCase())
for (const item of items) {
if (!item || !item.category) continue
const label = String(item.category).toLowerCase()
if (lowerCandidates.some((c) => label.includes(c))) {
const amount =
toNumber(item.amount) ||
toNumber(item.value) ||
toNumber(item.total)
if (amount !== null) return amount
}
}
return null
}

function buildFinancialByYear(rawFinancials) {
const years = sortYearKeys(rawFinancials)
return years.map((yearKey) => {
const year = Number(yearKey)
const yearData = rawFinancials[yearKey] || {}
const summary = yearData.summary || {}
const assetsDebt = yearData.assets_debt || {}
const revenueBreakdown = Array.isArray(yearData.revenue_breakdown)
? yearData.revenue_breakdown
: []

const revenue = toNumber(summary.Revenue ?? summary["Total revenue"])
const expenses = toNumber(summary.Expenses ?? summary["Total expenses"])
const netIncome = toNumber(summary["Net Income"])
const netAssets =
  toNumber(summary["Net Assets"]) ||
  toNumber(assetsDebt["Net assets"]) ||
  toNumber(assetsDebt["Net Assets"])

const programRevenue =
  toNumber(summary["Program service revenue"]) ||
  toNumber(summary["Program services"]) ||
  findAmountByCategory(
    revenueBreakdown,
    ["Program service revenue", "Program services"]
  )

return {
  year,
  revenue,
  expenses,
  netIncome,
  netAssets,
  programRevenue,
  revenueBreakdown,
  assetsDebt,
}


})
}

function buildCompensationByYear(rawComp) {
if (!rawComp) return []

const years = sortYearKeys(rawComp)
return years.map((yearKey) => {
const year = Number(yearKey)
const officers = Array.isArray(rawComp[yearKey])
? rawComp[yearKey]
: []

const payValues = officers
  .map((o) => {
    const base = toNumber(o.compensation)
    const other = toNumber(o.other)
    if (base === null && other === null) return null
    const total = (base || 0) + (other || 0)
    return total > 0 ? total : null
  })
  .filter((v) => v !== null)

return {
  year,
  payValues,
}


})
}

function buildHorizonMetrics(financialByYear) {
if (!Array.isArray(financialByYear) || financialByYear.length === 0) {
return {
surplusMargin: [],
netAssetsGrowth: [],
programShareDeviation: [],
}
}

const surplusMargin = financialByYear.map((row) => {
const { year, revenue, expenses } = row
if (!revenue || revenue <= 0 || expenses === null) {
return { year, value: null }
}
const margin = (revenue - expenses) / revenue
return { year, value: margin }
})

const netAssetsGrowth = financialByYear.map((row, index) => {
const { year, netAssets } = row
if (index === 0) return { year, value: null }
const prev = financialByYear[index - 1]
if (
netAssets === null ||
netAssets === undefined ||
prev.netAssets === null ||
prev.netAssets === undefined ||
prev.netAssets === 0
) {
return { year, value: null }
}
const growth = (netAssets - prev.netAssets) / prev.netAssets
return { year, value: growth }
})

const programShares = financialByYear.map((row) => {
const { year, revenue, programRevenue } = row
if (!revenue || revenue <= 0 || programRevenue === null) {
return { year, share: null }
}
return { year, share: programRevenue / revenue }
})

const validShares = programShares
.map((r) => r.share)
.filter((v) => v !== null)

const avgProgramShare =
validShares.length > 0
? validShares.reduce((sum, v) => sum + v, 0) / validShares.length
: null

const programShareDeviation = programShares.map((row) => {
if (row.share === null || avgProgramShare === null) {
return { year: row.year, value: null }
}
return {
year: row.year,
value: row.share - avgProgramShare,
}
})

return {
surplusMargin,
netAssetsGrowth,
programShareDeviation,
}
}

function buildStackedRevenueSeries(financialByYear) {
if (!Array.isArray(financialByYear) || financialByYear.length === 0) {
return {
years: [],
series: [],
}
}

const years = financialByYear.map((row) => row.year)

const seriesRows = financialByYear.map((row) => {
const { revenue, revenueBreakdown } = row

const contributions = findAmountByCategory(
  revenueBreakdown,
  ["Contributions", "Grants", "Gifts"]
) || 0

const programServices =
  row.programRevenue ||
  findAmountByCategory(
    revenueBreakdown,
    ["Program service revenue", "Program services"]
  ) ||
  0

const investment = findAmountByCategory(
  revenueBreakdown,
  ["Investment income", "Investment"]
) || 0

let known = contributions + programServices + investment
if (!revenue || revenue <= 0) {
  known = 0
}

let other = 0
if (revenue && revenue > 0) {
  const diff = revenue - known
  other = diff > 0 ? diff : 0
}

return {
  year: row.year,
  contributions,
  programServices,
  investment,
  other,
  totalRevenue: revenue || 0,
}


})

const contributionsSeries = {
key: "contributions",
values: seriesRows.map((row) => ({
year: row.year,
value: row.contributions,
})),
}

const programServicesSeries = {
key: "programServices",
values: seriesRows.map((row) => ({
year: row.year,
value: row.programServices,
})),
}

const investmentSeries = {
key: "investment",
values: seriesRows.map((row) => ({
year: row.year,
value: row.investment,
})),
}

const otherSeries = {
key: "other",
values: seriesRows.map((row) => ({
year: row.year,
value: row.other,
})),
}

return {
years,
series: [contributionsSeries, programServicesSeries, investmentSeries, otherSeries],
}
}

function buildNetAssetsDeltaSeries(financialByYear) {
if (!Array.isArray(financialByYear) || financialByYear.length === 0) {
return []
}

return financialByYear.map((row, index) => {
const { year, netAssets } = row
if (index === 0) {
return { year, value: null }
}
const prev = financialByYear[index - 1]
if (
netAssets === null ||
netAssets === undefined ||
prev.netAssets === null ||
prev.netAssets === undefined
) {
return { year, value: null }
}
const delta = netAssets - prev.netAssets
return { year, value: delta }
})
}

function buildViolinDistributions(compensationByYear) {
if (!Array.isArray(compensationByYear) || compensationByYear.length === 0) {
return []
}

return compensationByYear
.map((row) => {
const { year, payValues } = row
if (!payValues || payValues.length === 0) {
return null
}
return {
year,
values: payValues.slice().sort((a, b) => a - b),
}
})
.filter((row) => row !== null)
}

export async function fetchNonprofitSummary(ein) {
const trimmedEin = String(ein || "").trim()
if (!trimmedEin) {
throw new Error("EIN is required")
}

const url = `${API_BASE_URL}/nonprofit/${encodeURIComponent(trimmedEin)}`

const response = await fetch(url)

if (!response.ok) {
  throw new Error(`Nonprofit API error ${response.status}`)
}

const raw = await response.json()

const metadata = raw.metadata || {}
const details = raw.details || {}
const financialByYear = buildFinancialByYear(raw.financials || {})
const compensationByYear = buildCompensationByYear(raw.compensation || {})

const horizon = buildHorizonMetrics(financialByYear)
const stackedRevenue = buildStackedRevenueSeries(financialByYear)
const netAssetsDelta = buildNetAssetsDeltaSeries(financialByYear)
const violin = buildViolinDistributions(compensationByYear)

return {
ein: trimmedEin,
metadata,
details,
financialByYear,
compensationByYear,
charts: {
horizon,
stackedRevenue,
netAssetsDelta,
violin,
},
}
}
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import json

app = FastAPI()

# Correct CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_money(text):
    """Convert '$1,234,567' → 1234567 (int)"""
    if not text:
        return None
    text = text.replace("$", "").replace(",", "").strip()
    return int(text) if text.isdigit() else None


def scrape_nonprofit(ein: str):
    url = f"https://projects.propublica.org/nonprofits/organizations/{ein}"
    response = requests.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Organization not found")

    soup = BeautifulSoup(response.text, "html.parser")

    # -------- METADATA --------
    metadata = {}

    name = soup.find("h1", class_="text-hed-900")
    metadata["name"] = name.get_text(strip=True) if name else None

    sort_name = soup.find("div", class_="org-sort-name")
    metadata["sort_name"] = sort_name.get_text(strip=True) if sort_name else None

    meta_list = soup.find("ul", class_="basic-org-metadata")
    if meta_list:
        items = [li.get_text(strip=True) for li in meta_list.find_all("li")]
        metadata["location"] = items[0] if len(items) > 0 else None
        metadata["tax_exempt_since"] = items[1] if len(items) > 1 else None
        metadata["displayed_ein"] = items[2] if len(items) > 2 else None

    metadata["raw_ein"] = ein

    type_tag = soup.find("strong", class_="read-more-wrap")
    metadata["nonprofit_type"] = (
        type_tag.get_text(" ", strip=True) if type_tag else None
    )

    ntee_tag = soup.find("p", class_="ntee-category")
    metadata["ntee_category"] = (
        ntee_tag.get_text(" ", strip=True).replace("Category :", "").strip()
        if ntee_tag else None
    )

    donation_tag = soup.find("p", string=lambda t: t and "tax deductible" in t)
    metadata["donations_tax_deductible"] = True if donation_tag else False

    # -------- DETAILS --------
    details_output = {}
    details_section = soup.find("section", class_="details")

    if details_section:
        for d in details_section.find_all("div", class_="single-detail"):
            label = d.find("div", class_="details-label")
            desc = d.find("div", class_="details-context")
            key = label.get_text(" ", strip=True) if label else "(No title)"
            value = desc.get_text(" ", strip=True) if desc else ""
            details_output[key] = value

    # -------- COMPENSATION AND FINANCIALS --------
    comp_json = {}
    filings = soup.find_all("section", class_="single-filing-period")

    financials = {}

    for filing in filings:
        year_tag = filing.find("div", class_="year-label")
        if not year_tag:
            continue

        year = year_tag.get_text(strip=True)
        financials[year] = {
            "summary": {},
            "revenue_breakdown": [],
            "expenses_breakdown": [],
            "assets_debt": {},
        }

        # JSON-LD financials
        json_script = filing.find("script", type="application/ld+json")
        if json_script:
            try:
                data = json.loads(json_script.string)
                cols = data["mainEntity"]["csvw:tableSchema"]["csvw:columns"]
                for col in cols:
                    name = col["csvw:name"]
                    val = col["csvw:cells"][0]["csvw:value"]
                    financials[year]["summary"][name] = val
            except Exception:
                pass

        # Summary (Revenue, Expenses, Net Income, etc.)
        extract_summary = filing.find("div", class_="extract-summary")
        if extract_summary:
            rows = extract_summary.find_all("div", class_="row-summary__item")
            rev_row = extract_summary.find("div", class_="row-revenue")

            if rev_row:
                rev_val = rev_row.find("div", class_="row-revenue__number")
                financials[year]["summary"]["Revenue"] = parse_money(rev_val.text)

            for r in rows:
                label = r.find("div", class_="row-summary__hed").get_text(strip=True)
                val = r.find("div", class_="row-summary__number").get_text(strip=True)
                financials[year]["summary"][label] = parse_money(val)

        # Revenue breakdown table
        revenue_table = filing.find("table", class_="revenue")
        if revenue_table:
            for row in revenue_table.find("tbody").find_all("tr"):
                cols = row.find_all("td")
                if len(cols) >= 2:
                    item = cols[0].get_text(strip=True)
                    amount = parse_money(cols[1].get_text(strip=True))
                    financials[year]["revenue_breakdown"].append({
                        "category": item,
                        "amount": amount
                    })

        # Expenses breakdown table
        expenses_table = filing.find("table", class_="expenses")
        if expenses_table:
            for row in expenses_table.find("tbody").find_all("tr"):
                cols = row.find_all("td")
                if len(cols) >= 2:
                    item = cols[0].get_text(strip=True)
                    amount = parse_money(cols[1].get_text(strip=True))
                    financials[year]["expenses_breakdown"].append({
                        "category": item,
                        "amount": amount
                    })

        # Assets / Debt table
        assets_table = filing.find("table", class_="assets-debt")
        if assets_table:
            for row in assets_table.find("tbody").find_all("tr"):
                cols = row.find_all("td")
                if len(cols) >= 2:
                    label = cols[0].get_text(strip=True)
                    amount = parse_money(cols[1].get_text(strip=True))
                    financials[year]["assets_debt"][label] = amount

        # Compensation table
        comp_json[year] = []
        comp_header = filing.find("h5", string="Compensation")
        if comp_header:
            table = comp_header.find_parent("div").find_next("table")
            if table:
                rows = table.find("tbody").find_all("tr", class_="employee-row")
                for row in rows:
                    cols = row.find_all("td")
                    if len(cols) >= 4:
                        comp_json[year].append({
                            "name": cols[0].get_text(" ", strip=True),
                            "compensation": cols[1].get_text(strip=True),
                            "related": cols[2].get_text(strip=True),
                            "other": cols[3].get_text(strip=True),
                        })

    return {
        "metadata": metadata,
        "details": details_output,
        "compensation": comp_json,
        "financials": financials
    }


@app.get("/nonprofit/{ein}")
def get_nonprofit(ein: str):
    try:
        return scrape_nonprofit(ein)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid EIN or scraping failed")

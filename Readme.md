# Nonprofit Governance Benchmarks for Chicago (Form 990)

### Project Title  
**Leadership Levers in Nonprofit Governance: Peer Benchmarks for Board Structure & Executive Compensation in Chicago**

---

## Overview

This project builds a **visual analytics tool** that helps nonprofit leaders in Chicago understand how their governance structures compare with peers. Using publicly available IRS Form 990 data, we explore how board size, independence, committee coverage, and executive compensation relate to organizational stability.

The tool turns complex filings into clear visuals that make benchmarking easy and actionable. Users can:

- Explore **peer cohort comparisons** through interactive visualizations.  
- View **organization profile cards** that summarize governance and compensation details.  
- Examine optional **interlock networks** to see shared directors across nonprofits.  
- Export **case briefs** for classroom use or leadership workshops.

Our goal is to make nonprofit governance data more interpretable, trustworthy, and useful for leadership development and research.

---

## Objectives

- Deliver **decision-ready visualizations** for governance benchmarking.  
- Create a **clean data pipeline** that transforms Form 990 filings into analysis-ready tables.  
- Enhance **explainability and trust** with clear rationale for all visual indicators.  
- Support **leadership education** through data-driven insights and case briefs.

---

## Repository Structure

```
./
├── README.md
├── package-lock.json
├── package.json
├── public
└── src
    ├── App.js
    ├── components
    │   ├── AssetRevenueScatter.jsx
    │   ├── CityFinancialGlyphGrid.jsx
    │   ├── Header.jsx
    │   ├── HeatmapBase.jsx
    │   ├── MissionMomentumChart.jsx
    │   ├── NteeTreemap.jsx
    │   ├── OrganizationPopup.jsx
    │   ├── RevenueHeatmap.jsx
    │   └── SectorStackedBarChart.jsx
    ├── index.css
    ├── index.js
    ├── scenes
    │   ├── dashboard
    │   │   └── index.jsx
    │   └── global
    │       └── Topbar.jsx
    └── theme.js
```

**Notes:**
- This repo starts with the **HW01 D3 template**.  
- A **third view** has been added as part of the exercise.  
- The README has been updated to describe the project, team, and credits.

---

## Tech Stack

- **Frontend:** D3.js, JavaScript (ES6), HTML5, CSS3  
- **Data Sources:**  
  - ProPublica Nonprofit Explorer API  
  - IRS Form 990 e-file XMLs (Parts VII and Schedule J)  
- **Tools:** Node.js, React, Git

---

## Team

**Project Manager** - **Yuvaneswaren Ramakrishnan Sureshbabu**  
**Team Members** - **Shrinisha Nirmalkumar, Jegadit Sakthi Saravanan**

**Client / Domain Expert**  
**Prof. John W. Lynch**  
Associate Dean for Professional Leadership Development, Director of iLEAD, UIC Business  
Expertise: Leadership education, organizational governance, and applied benchmarking

---

## Project Timeline (Fall 2025)

| Week | Dates | Key Focus |
|------|--------|-----------|
| **1** | Oct 20–26 | Lock project scope, finalize data access, set up repo |
| **2** | Oct 27–Nov 2 | Build ETL v1 and officer continuity matching |
| **3** | Nov 03–09 | Develop analytics v1 and first visuals |
| **4** | Nov 10–16 | Alpha release + Case Brief A |
| **5** | Nov 17–23 | Add governance change timelines and optional interlock view |
| **6** | Nov 24–30 | Beta → Final release, Case Brief B |
| **7** | Dec 01–04 | Public Release → Video Presentation |

---

## Getting Started

1. Clone the repository:  
   ```bash
   git clone https://github.com/yuvaneswaren/CS-529_VDS_Project.git
   ```
2. install all required packages: `npm install`
3. Start the application: `npm start`

*Now the application will start at localhost:3000 by default*

---

## Acknowledgment

The starter code and visualization template are based on coursework materials originally created by **Andrew Wentzel**.  
We thank him for providing the foundation that helped launch this project.

---

## License

This repository was created for academic use within the Visual Data Science course at the University of Illinois Chicago.  
Please keep attribution intact in any derived work or reuse.

---
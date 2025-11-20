// export function buildTreemapData(csvRows) {
//   const categoryMap = {};

//   csvRows.forEach((row) => {
//     const category = row.ntee_category?.trim();
//     const name = row.name?.trim();
//     const revenue = Number(row.revenue_amount);

//     // Skip entries with missing categories or revenue
//     if (!category || !name || isNaN(revenue)) return;

//     if (!categoryMap[category]) {
//       categoryMap[category] = [];
//     }

//     categoryMap[category].push({
//       name: name,
//       value: revenue,
//       ein: row.ein
//     });
//   });

//   return {
//     name: "root",
//     children: Object.entries(categoryMap).map(([category, items]) => ({
//       name: category,
//       children: items
//     }))
//   };
// }

// src/utils/treemapPrep.js
export function buildTreemapData(csvRows, topN = 30) {
  const categoryMap = {};

  csvRows.forEach((row) => {
    const category = row.ntee_category?.trim();
    const name = row.name?.trim();
    const revenue = Number(row.revenue_amount);

    if (!category || !name || isNaN(revenue)) return;

    if (!categoryMap[category]) categoryMap[category] = [];

    categoryMap[category].push({ name, value: revenue, ein: row.ein });
  });

  // Sort each category by revenue descending and take top N
  const children = Object.entries(categoryMap).map(([category, items]) => {
    const sorted = items.sort((a, b) => b.value - a.value).slice(0, topN);
    return { name: category, children: sorted };
  });

  return { name: "root", children };
}

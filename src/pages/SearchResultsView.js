// import React from "react";
// import Header from "../components/Header";
// import SearchBar from "../components/SearchBar";

// const SearchResultsView = () => {
//   const results = [1, 2, 3, 4, 5, 6];

//   return (
//     <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
//       <Header />
//       <div style={{ background: "#d4f1f4", padding: "10px" }}>
//         <SearchBar />
//       </div>

//       <div
//         style={{
//           flex: 1,
//           padding: "10px",
//           display: "grid",
//           gridTemplateColumns: "repeat(3, 1fr)",
//           gridTemplateRows: "repeat(2, 1fr)",
//           gap: "20px",
//         }}
//       >
//         {results.map((i) => (
//           <div
//             key={i}
//             style={{
//               background: "#f5b7b1",
//               height: "400px",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               fontWeight: "bold",
//             }}
//           >
//             Result {i}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default SearchResultsView;




import React from "react";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";

const SearchResultsView = () => {
  const results = [1, 2, 3, 4]; // Only 4 items now

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <div style={{ background: "#d4f1f4", padding: "10px" }}>
        <SearchBar />
      </div>

      <div
        style={{
          flex: 1,
          padding: "10px",
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)", // 2 columns
          gridTemplateRows: "repeat(2, 1fr)", // 2 rows
          gap: "20px",
        }}
      >
        {results.map((i) => (
          <div
            key={i}
            style={{
              background: "#f5b7b1",
              height: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            Result {i}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResultsView;

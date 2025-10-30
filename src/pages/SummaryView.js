// import React from "react";
// import Header from "../components/Header";
// import SearchBar from "../components/SearchBar";

// const SummaryView = () => {
//   return (
//     <div>
//       <Header />
//       <div style={{ background: "#d4f1f4", padding: "10px" }}>
//         <SearchBar />
//       </div>

//       <div style={{ background: "#f9e79f", height: "250px", margin: "10px" }}>
//         Main Summary Chart Placeholder
//       </div>

//       <div style={{ display: "flex", gap: "10px", margin: "10px" }}>
//         <div style={{ background: "#a3e4d7", flex: 1, height: "120px" }}>
//           Bottom Panel 1
//         </div>
//         <div style={{ background: "#a9cce3", flex: 1, height: "120px" }}>
//           Bottom Panel 2
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SummaryView;

// -----------------------------------------------------------------------------------------------

// import React from "react";
// import Header from "../components/Header";
// import SearchBar from "../components/SearchBar";

// const SummaryView = () => {
//     return (
//         <div>
//       <Header />
      
//       {/* SearchBar Area */}
//       <div style={{ background: "#d4f1f4", padding: "10px" }}>
//         <SearchBar />
//       </div>

//       {/* Main Content Split: Large panel + sidebar */}
//       <div style={{ display: "flex", padding: "10px", gap: "10px" }}>
        
//         {/* Main Chart Panel */}
//         <div style={{ background: "#f9e79f", flex: 3, height: "250px" }}>
//           Main Overview Panel
//         </div>

//         {/* Sidebar Panel */}
//         <div style={{ background: "#a9cce3", flex: 1, height: "250px" }}>
//           Sidebar Panel
//         </div>
//       </div>

//       {/* Bottom 2 Panels */}
//       <div style={{ display: "flex", padding: "10px", gap: "10px" }}>
//         <div style={{ background: "#a3e4d7", flex: 1, height: "120px" }}>
//           Bottom Panel 1
//         </div>
//         <div style={{ background: "#f5b7b1", flex: 1, height: "120px" }}>
//           Bottom Panel 2
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SummaryView;

// -----------------------------------------------------------------------------------------------



import React from "react";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";

const SummaryView = () => {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      {/* SearchBar Area */}
      <div style={{ background: "#d4f1f4", padding: "10px" }}>
        <SearchBar />
      </div>

      {/* Full Page Body Split */}
      <div style={{ flex: 1, display: "flex", gap: "10px", padding: "10px" }}>

        {/* LEFT SECTION (Big area) */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", gap: "10px" }}>
          
          {/* Top Large Panel */}
          <div style={{ background: "#f9e79f", flex: 2 }}>
            Top Large Panel
          </div>

          {/* Bottom two panels */}
          <div style={{ display: "flex", gap: "10px", flex: 1 }}>
            <div style={{ background: "#a3e4d7", flex: 1 }}>
              Bottom Left Panel
            </div>
            <div style={{ background: "#f5b7b1", flex: 1 }}>
              Bottom Right Panel
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR (full height) */}
        <div style={{ background: "#a9cce3", flex: 1 }}>
          Right Sidebar Panel
        </div>
      </div>
    </div>
  );
};

export default SummaryView;

import React from "react";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";

const ComparativeView = () => {
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
          <div style={{ display: "flex", gap: "10px", flex: 1 }}>
            <div style={{ background: "#a3e4d7", flex: 1 }}>
              Top Left Panel
            </div>
            <div style={{ background: "#f5b7b1", flex: 1 }}>
              Top Right Panel
            </div>
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

export default ComparativeView;




// const ComparativeView = () => {
//   return (
//     <div>
//       <Header />
//       <div style={{ background: "#d4f1f4", padding: "10px" }}>
//         <SearchBar />
//       </div>

//       <div style={{ display: "flex", padding: "10px", gap: "10px" }}>
//         <div style={{ background: "#f9e79f", flex: 3, height: "300px" }}>
//           Large Comparison Panel
//         </div>
//         <div style={{ background: "#a9cce3", flex: 1, height: "300px" }}>
//           Side Panel
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComparativeView;
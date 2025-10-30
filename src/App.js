// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;



import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SummaryView from "./pages/SummaryView";
import SearchResultsView from "./pages/SearchResultsView";
import ComparativeView from "./pages/ComparativeView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SummaryView />} />
        <Route path="/search" element={<SearchResultsView />} />
        <Route path="/compare" element={<ComparativeView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactComponent as HomeIcon } from "../assets/home_icon.svg";
import searchIcon from "../assets/search_icon.png";
import LoadingOverlay from "./LoadingOverlay";
import "../layout.css";

function NavBar({ onSearch, onClear }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const path = location.pathname;
  const isHome = path === "/";
  const isSummary = path === "/summary";
  const isCompare = path === "/compare";

  const handleSearch = () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;

    setLoading(true);
    setTimeout(() => {
      if (onSearch && (isSummary || isCompare)) {
        onSearch(trimmed);
      }
      setLoading(false);
    }, 800);
  };

  const handleClear = () => {
    setSearchText("");
    if (onClear) onClear();
  };

  return (
    <>
      <div className="nav-bar">
        <div className="nav-left">
          {(isSummary || isCompare) && (
            <button
              className="home-btn"
              onClick={() => navigate("/", { state: { from: path } })}
            >
              <HomeIcon className="home-icon" />
            </button>
          )}

          {!isHome && (
            <div className="search-area">
              <img src={searchIcon} alt="Search Icon" className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search with EIN"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              {searchText && (
                <span className="clear-icon" onClick={handleClear}>
                  ✕
                </span>
              )}
            </div>
          )}
        </div>

        <div className="view-toggle">
          <div
            className={`toggle-option ${isSummary ? "active" : ""}`}
            onClick={() => navigate("/summary")}
          >
            Summary View
          </div>
          <div
            className={`toggle-option ${isCompare ? "active" : ""}`}
            onClick={() => navigate("/compare")}
          >
            Comparative View
          </div>
        </div>
      </div>

      <LoadingOverlay active={loading} />
    </>
  );
}

export default NavBar;

import React, { useState, useRef, useEffect } from "react";
import "../layout.css";

function DropdownFilter({ label, options, selected, setSelected, closeAll }) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const dropdownRef = useRef(null);

  const handleSelection = (value) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((item) => item !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    const filtered = options.filter((opt) =>
      opt.toLowerCase().includes(searchValue.toLowerCase())
    );
    const allSelected = filtered.every((opt) => selected.includes(opt));
    if (allSelected) {
      setSelected(selected.filter((s) => !filtered.includes(s)));
    } else {
      setSelected([...new Set([...selected, ...filtered])]);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setSelected([]);

    // Add temporary highlight effect
    const btn = e.currentTarget;
    btn.classList.add("active-clear");
    setTimeout(() => btn.classList.remove("active-clear"), 300);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (closeAll) setOpen(false);
  }, [closeAll]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="dropdown-filter" ref={dropdownRef}>
      <div className="filter-header">
        <span className="filter-label">{label}</span>
        <button className="clear-btn" onClick={clearSelection}>
          Clear All
        </button>
      </div>

      <input
        type="text"
        className="filter-search-input"
        placeholder={`Search ${label.toLowerCase()}...`}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <div className="dropdown-menu">
          <label className="dropdown-option select-all">
            <input
              type="checkbox"
              checked={
                filteredOptions.length > 0 &&
                filteredOptions.every((opt) => selected.includes(opt))
              }
              onChange={handleSelectAll}
            />
            Select All
          </label>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <label key={option} className="dropdown-option">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => handleSelection(option)}
                />
                {option}
              </label>
            ))
          ) : (
            <div className="no-results">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterPanel({ cities, zipcodes }) {
  const years = ["2023", "2024"];
  const [citySelection, setCitySelection] = useState([]);
  const [zipcodeSelection, setZipcodeSelection] = useState([]);
  const [yearSelection, setYearSelection] = useState([]);
  const [closeAll, setCloseAll] = useState(false);

  const handleApply = () => {
    console.log("Applied Filters:", {
      cities: citySelection,
      zipcodes: zipcodeSelection,
      years: yearSelection,
    });

    setCloseAll(true);
    setTimeout(() => setCloseAll(false), 100);
  };

  return (
    <div className="filter-panel">
      <h3 className="filter-title">Filters</h3>

      <DropdownFilter
        label="City"
        options={cities}
        selected={citySelection}
        setSelected={setCitySelection}
        closeAll={closeAll}
      />

      <DropdownFilter
        label="Zipcode"
        options={zipcodes}
        selected={zipcodeSelection}
        setSelected={setZipcodeSelection}
        closeAll={closeAll}
      />

      <DropdownFilter
        label="Tax Year"
        options={years}
        selected={yearSelection}
        setSelected={setYearSelection}
        closeAll={closeAll}
      />

      <button className="apply-btn" onClick={handleApply}>
        Apply
      </button>
    </div>
  );
}

export default FilterPanel;

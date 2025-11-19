import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      navigate("/search");
    }
  };

  return (
    <input
      type="text"
      placeholder="🔍 Search"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      style={{ padding: "8px", width: "200px" }}
    />
  );
};

export default SearchBar;

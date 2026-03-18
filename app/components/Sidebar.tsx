import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/reconciliation/rules">Rules</Link>
        </li>
        <li>
          <Link to="/reconciliation/import">Import</Link>
        </li>
        <li>
          <Link to="/reconciliation/results">Results</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;

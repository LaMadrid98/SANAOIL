import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
    return (
      <nav className="Row">
        <div className="Nav-logo">
          <img src="/images/sanaoil-logo.png" alt="SANAOil.io Logo"/>
        </div>

        <div className="Nav-name">
          <span className="sana">SANA</span>
          <span className="oil">Oil</span>
        </div>

        <div className="Nav-buttons">
          <Link to="/control" className="Nav-btn">Control</Link>
          <Link to="/history" className="Nav-btn">History</Link>
        </div>
      </nav>
    );
};

export default Navbar;
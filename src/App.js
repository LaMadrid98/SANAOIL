import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import ControlPage from "./pages/ControlPage";
import HistoryPage from "./pages/HistoryPage";

function Home() {
  return (
    <div className="Home-container">
      <div className="Home-logo">
        <img src="/images/sanaoil-logo.png" alt="SANAOil.io Logo"/>
      </div>
      <div className="Home-header">
          <span className="sana">SANA</span>
          <span className="oil">Oil</span>   
      </div>
      <div className="Home-buttons">
        <Link to="/control" className="Home-btn">MAIN CONTROL</Link>
        <Link to="/history" className="Home-btn">DATA HISTORY</Link>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/control" element={<ControlPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Router>
  );
};

export default App;

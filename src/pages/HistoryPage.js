import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DetectionHistory from "../components/DetectionHistory";
//import "../styles/HistoryPage.css";

const HistoryPage = () => {

  return (
    <div className="history-page">
      <div className="Page-header">
        <Link to="/" className="Link-hm">&larr; Go Back Home</Link>
        <h2>Data History</h2>
      </div>
      <div className="History-container">
        <div className="History-tables">
          <div>
            <DetectionHistory />
          </div>
        </div>
      </div>  
    </div>
  );  
};

export default HistoryPage;

import React, { useState, useEffect } from "react";
import "../styles/OilDetection.css";
import "../styles/OilLevel.css";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://0.0.0.0:8000"; // [NEED TO BE CHANGED!!!!] based on your WiFi IP address

const OilLevel = () => {
  const [oilLevel, setOilLevel] = useState(0);
  const [oilVolume, setOilVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  const getOilColor = () => {
    if (oilLevel === 100) {
      return '#ff3604';
    }
  };

  // Fetch oil level data
  const fetchOilLevel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get_data`);
      const data = await response.json();

      if (data && data.data && data.data.length > 0) {
        const latestData = data.data[0]; // Assuming the first record is the latest
        setOilLevel(latestData.oil_level);
        setOilVolume(latestData.oil_volume);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching oil level:", error);
      setLoading(false);
    }
  };

  // Fetch data initially and every 2 seconds
  useEffect(() => {
    fetchOilLevel();
    const interval = setInterval(fetchOilLevel, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container Oilcontainer">
      <div className="Header">Oil Container</div>
      <div className="Level-text">
        {loading ? "Loading..." : `${oilLevel}%   ${oilVolume > 0 ? `${oilVolume}mL` : ""}`}
      </div>
      <div className="Level-alert">
        {oilLevel >= 90 ? "OIL CONTAINER FULL, DISPOSE OIL" : ""}
      </div>
      <div
        className="Level-height"
        style={{ height: `${oilLevel}px`, backgroundColor: getOilColor() }}
      ></div>
    </div>
  );
};

export default OilLevel;

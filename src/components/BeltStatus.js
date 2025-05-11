import React, { useState, useEffect } from "react";
import ConveyorBelt from "../components/ConveyorBelt";
import "../styles/OilDetection.css";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://192.168.4.142:8000"; // [NEED TO BE CHANGED!!!!] based on your WiFi IP address

const BeltStatus = () => {
  const [beltStatus, setBeltStatus] = useState("Fetching data...");
  const [loading, setLoading] = useState(true);
  
  // Fetch belt status from backend
  const fetchBeltStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get_belt_status`);
      const data = await response.json();
      setBeltStatus(data.beltStatus); 
      setLoading(false);
    } catch (error) {
      console.error("Error fetching belt status:", error);
      setBeltStatus("Error fetching data.");
    }
  };

  // Fetch data initially and every 5 seconds
  useEffect(() => {
    fetchBeltStatus();
    const interval = setInterval(fetchBeltStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <div className="Header">Belt Status</div>
      <div className={`Status ${loading ? "loading" : ""}`}>{beltStatus}</div>
    </div>
  );
};

export default BeltStatus;

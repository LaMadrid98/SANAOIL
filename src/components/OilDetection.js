import React, { useState, useEffect } from "react";
import "../styles/OilDetection.css";

const API_BASE_URL = "http://0.0.0.0:8000"; // [NEED TO BE CHANGED!!!!] based on your WiFi IP address

const OilDetection = () => {
  const [detectionStatus, setDetectionStatus] = useState("Fetching data...");
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/detection_status`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log("API Response:", data);
      setDetectionStatus(data.status);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching status:", error);
      setDetectionStatus("Error fetching data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <div className="Header">Oil Detection</div>
      <div className="Status">{loading ? "Loading..." : detectionStatus}</div>
    </div>
  );
};

export default OilDetection;

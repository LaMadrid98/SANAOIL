import React, { useState, useEffect, useCallback } from "react";
import "../styles/PumpMotor.css";

const API_BASE_URL = "http://0.0.0.0:8000"; // [NEED TO BE CHANGED!!!!] based on your WiFi IP address

const PumpControl = () => {
  const [pumpIn, setPumpIn] = useState(false);
  const [pumpOut, setPumpOut] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastTankLevel, setLastTankLevel] = useState(null);

  const togglePump = useCallback(async (pump, state) => {
    const url = `${API_BASE_URL}/toggle_pump/${pump}/${state ? "on" : "off"}`;
    try {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) throw new Error("Failed to toggle pump");
    } catch (error) {
      console.error("Error toggling pump:", error);
    }
  }, []);

  const toggleMotor = useCallback(async (state) => {
    const url = `${API_BASE_URL}/toggle_conveyor/${state ? "on" : "off"}`;
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        console.log("Motor response:", data);
      } else {
        console.error("Error toggling motor");
      }
    } catch (error) {
      console.error("Error toggling motor:", error);
    }
  }, []);

  const fetchTankLevel = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tank_level`);
      if (!response.ok) throw new Error("Failed to fetch tank level");

      const data = await response.json();
      const currentTankLevel = data.tank_level;

      if (currentTankLevel === "full" && !showNotification) {
        setShowNotification(true);
        toggleMotor(true); // Turn motor ON when tank is full
      }

      if (currentTankLevel !== lastTankLevel) {
        setLastTankLevel(currentTankLevel);
      }
    } catch (error) {
      console.error("Error fetching tank level:", error);
    }
  }, [lastTankLevel, showNotification, toggleMotor]);

  useEffect(() => {
    const interval = setInterval(fetchTankLevel, 5000);
    return () => clearInterval(interval);
  }, [fetchTankLevel]);

  const handleOkayClick = () => {
    toggleMotor(false); // Turn motor OFF when user clicks "Okay"
    setShowNotification(false);
    window.location.reload();
  };

  return (
    <div className="container">
      <div className="Header">Pump Control</div>
      <div className="Pump-control">
        <div className="Pump-in">
          <div className="Control-btns">
            <button
              onClick={() => {
                const newState = !pumpIn;
                setPumpIn(newState);
                togglePump("pump_in", newState);
                fetchTankLevel();
              }}
              className="Control-btn"
            >
              {pumpIn ? "Stop Pump In" : "Start Pump In"}
            </button>
          </div>
        </div>

        <div className="Pump-out">
          <div className="Control-btns">
            <button
              onClick={() => {
                const newState = !pumpOut;
                setPumpOut(newState);
                togglePump("pump_out", newState);
                fetchTankLevel();
              }}
              className="Control-btn"
            >
              {pumpOut ? "Stop Pump Out" : "Start Pump Out"}
            </button>
          </div>
        </div>
      </div>
      {showNotification && (
        <div className="notification">
          <div className="Header1">Water Tank is FULL!</div>
          <div className="Subheader">Running Conveyor Belt</div>
          <div className="warning">
            <img src="/images/warning_sanaoil.png" alt="Warning" />
          </div>
          <button onClick={handleOkayClick} className="Control-btn Okay-btn">
            Okay
          </button>
        </div>
      )}
    </div>
  );
};

export default PumpControl;

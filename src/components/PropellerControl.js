import React from "react";
import "../styles/OilDetection.css";
import "../styles/FeedCam.css";
import "../styles/PropellerControl.css";

const API_BASE_URL = "http://0.0.0.0:8000"; // [NEED TO BE CHANGED!!!!] based on your WiFi IP address

const sendCommand = async (command) => {
  const url = `${API_BASE_URL}/${command.toLowerCase()}`;
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) throw new Error(`Failed to send command: ${command}`);
    const data = await response.json();
    console.log(`Success: ${data.status}`);
  } catch (error) {
    console.error(`Error sending command '${command}':`, error);
  }
};

const PropellerControl = () => {
  return (
    <div className="container">
      <div className="Header">Propeller Control</div>
      <div className="Pump-control Control-btns">
        <div className="Forward">
          <button
            onClick={() => sendCommand("MOVE_FORWARD")}
            className="Control-btn Propeller Frwd"
          >
            &uarr;
          </button>
        </div>
        <div className="Left-Right">
          <button
            onClick={() => sendCommand("MOVE_LEFT")}
            className="Control-btn Propeller Lft"
          >
            &larr;
          </button>
          <button
            onClick={() => sendCommand("MOVE_RIGHT")}
            className="Control-btn Propeller Rgt"
          >
            &rarr;
          </button>
        </div>
        <div className="Reverse">
          <button
            onClick={() => sendCommand("MOVE_REVERSE")}
            className="Control-btn Propeller Rvs"
          >
            &darr;
          </button>
        </div>
        <div className="Stop">
          <button
            onClick={() => sendCommand("STOP")}
            className="Control-btn Stop-btn"
          >
            STOP
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropellerControl;

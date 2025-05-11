import "../styles/OilDetection.css";
import "../styles/FeedCam.css";
import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://0.0.0.0:8000"; // [NEED TO BE CHANGED!!!!] based on your WiFi IP address
const ESP32_CAM_URL = "http://0.0.0.0/cam-hi.jpg"; // ESP32 Camera URL run the ESP32CAMERA.ino and add the given IP in here

const FeedCam = () => {
  const [imageSrc, setImageSrc] = useState(
    `${API_BASE_URL}/video_feed?${new Date().getTime()}`
  );
  const [esp32ImageSrc, setEsp32ImageSrc] = useState(
    `${ESP32_CAM_URL}?${new Date().getTime()}`
  ); // ESP32 CAM feed
  const [detectionEnabled, setDetectionEnabled] = useState(false);

  useEffect(() => {
    // Update image source every 2 seconds to avoid caching for the main camera feed
    const interval = setInterval(() => {
      setImageSrc(`${API_BASE_URL}/video_feed?${new Date().getTime()}`);
    }, 2000);

    // Update the ESP32 camera feed every 2 seconds to avoid caching
    const esp32Interval = setInterval(() => {
      setEsp32ImageSrc(`${ESP32_CAM_URL}?${new Date().getTime()}`);
    }, 2000);

    // Cleanup function to stop detection when component unmounts
    return () => {
      clearInterval(interval);
      clearInterval(esp32Interval); // Clear the ESP32 camera feed interval as well
      stopDetection();
    };
  }, []);

  // Function to turn off detection when navigating away
  const stopDetection = async () => {
    try {
      await fetch(`${API_BASE_URL}/toggle_detection?state=false`, {
        method: "POST",
      });
      setDetectionEnabled(false);
      console.log("Detection disabled on unmount");
    } catch (error) {
      console.error("Error disabling detection:", error);
    }
  };

  // Toggle Detection ON/OFF
  const toggleDetection = async () => {
    const newState = !detectionEnabled;
    setDetectionEnabled(newState);

    try {
      await fetch(`${API_BASE_URL}/toggle_detection?state=${newState}`, {
        method: "POST",
      });
      console.log(`Detection ${newState ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error toggling detection:", error);
    }
  };

  return (
    <div className="container">
      <div className="Header">Live CAM Feed & Watercraft Control</div>
      <div className="Feed-container">
        <div className="Feed">
          <div className="camera-overlay">
            <h3>Oil Detection Camera Feed</h3>
            <img
              src={imageSrc}
              alt="Main Camera Live Feed"
              onError={(e) => console.log("Error loading main live feed", e)}
            />
          </div>
        </div>
        <div className="Feed">
          <div className="camera-overlay">
            <h3>Container Camera Feed</h3>
            <img
              src={esp32ImageSrc}
              alt="ESP32 Camera Live Feed"
              onError={(e) => console.log("Error loading ESP32 live feed", e)}
            />
          </div>
        </div>
      </div>
      <div className="Feed-controls">
        <button onClick={toggleDetection} className="toggle-btn">
          {detectionEnabled ? "Stop Detection" : "Start Detection"}
        </button>
      </div>
    </div>
  );
};

export default FeedCam;

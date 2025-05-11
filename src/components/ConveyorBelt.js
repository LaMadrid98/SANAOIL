import { useState, useEffect } from "react";

const API_BASE_URL = "http://0.0.0.0:8000"; // [NEED TO BE CHANGED!!!!] based on your WiFi IP address

export default function ConveyorBeltControl() {
  const [motorRunning, setMotorRunning] = useState(false);

  // Function to toggle the motor state (ON/OFF)
  const toggleMotor = async (state) => {
    const url = `${API_BASE_URL}/toggle_conveyor/${state ? "on" : "off"}`;

    try {
      const response = await fetch(url, { method: "GET" });

      if (response.ok) {
        const data = await response.json();
        console.log("Motor response:", data);
        console.log(`Conveyor belt is ${state ? "ON" : "OFF"}`);
      } else {
        console.error("Error toggling motor");
      }
    } catch (error) {
      console.error("Error toggling motor:", error);
    }
  };

  // Function to upload the current conveyor belt status to the backend database
  const uploadStatusToDatabase = async (status) => {
    const url = `${API_BASE_URL}/upload_belt_status`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: status }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result.message);
      } else {
        console.error("Failed to upload status");
      }
    } catch (error) {
      console.error("Error uploading status:", error);
    }
  };

  // Function to handle the button press, toggling the motor and uploading the new status
  const handleBeltStatusToggle = async () => {
    const newState = !motorRunning;
    setMotorRunning(newState);
    toggleMotor(newState);
    await uploadStatusToDatabase(newState ? "Running" : "Stopped");
  };

  // Function to get the initial conveyor belt status from the backend
  const getConveyorStatus = async () => {
    const url = `${API_BASE_URL}/get_conveyor_status`;

    try {
      const response = await fetch(url, { method: "GET" });

      if (response.ok) {
        const data = await response.json();
        console.log("Conveyor status:", data);
        setMotorRunning(data.status === "Running");
      } else {
        console.error("Error fetching conveyor status");
      }
    } catch (error) {
      console.error("Error fetching conveyor status:", error);
    }
  };

  useEffect(() => {
    getConveyorStatus();
  }, []);

  return (
    <div className="ConveyorBelt-control container">
      <div className="Header">Belt Control</div>
      <button
        onClick={handleBeltStatusToggle}
        className="Control-btn BeltControl-btn"
      >
        {motorRunning ? "Stop Belt" : "Start Belt"}
      </button>
    </div>
  );
}

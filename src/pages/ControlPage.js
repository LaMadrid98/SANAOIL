import React from "react";
import { Link } from "react-router-dom";
import OilDetection from "../components/OilDetection";
import BeltStatus from "../components/BeltStatus";
import OilLevel from "../components/OilLevel";
import FeedCam from "../components/FeedCam";
import PumpMotor from "../components/PumpMotor";
import ConveyorBelt from "../components/ConveyorBelt"; 
import PropellerControl from "../components/PropellerControl";
import "../styles/ControlPage.css";

const ControlPage = () => {
  return (
    <div className="Control-page">
      <div className="Page-header">
        <Link to="/" className="Link-hm">&larr; Go Back Home</Link>
        <h2>Main Control</h2>
      </div>
      <div className="Control-container">
        <div className="Main-info">
          <div className="Info-messages">
            <div>
              <OilDetection />
            </div>
            <div>
              <PumpMotor />
            </div>
            <div>
              <ConveyorBelt />
            </div>
          </div>

          <div className="Info-level">
            <div>
              <OilLevel />
            </div>
          </div>
        </div>
        <div className="Feed-control">  
            <div>
              <FeedCam />
            </div>
            <div>
              <PropellerControl />
            </div>
          </div>
      </div>
    </div>
  );
};

export default ControlPage;

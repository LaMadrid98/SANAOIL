import React, { useState, useEffect, useCallback } from "react";
import "../styles/DetectionHistory.css";

const DetectionHistory = () => {
    const [detections, setDetections] = useState([]);
    const [oilData, setOilData] = useState([]);
    const [beltData, setBeltData] = useState([]);
    const [detectionPage, setDetectionPage] = useState(1);
    const [oilPage, setOilPage] = useState(1);
    const [beltPage, setBeltPage] = useState(1);
    const [totalDetections, setTotalDetections] = useState(0);
    const [totalOilData, setTotalOilData] = useState(0);
    const [totalBeltData, setTotalBeltData] = useState(0);
    const [showOilTable, setShowOilTable] = useState(false);
    const [showBeltTable, setShowBeltTable] = useState(false);
    const [loading, setLoading] = useState(false); 
    const limit = 10;
    const API_BASE_URL = "http://0.0.0.0:8000"; // [NEED TO BE CHANGED!!!!] based on your WiFi IP address

    // Fetch detection data
    const fetchDetectionData = useCallback(() => {
        if (!showOilTable && !showBeltTable) {
            setLoading(true); // Set loading to true before fetching
            fetch(`${API_BASE_URL}/get_detections?page=${detectionPage}&limit=${limit}`)
                .then(res => res.json())
                .then(data => {
                    setDetections(data.detections || []); // Ensure it's an array
                    setTotalDetections(data.total);
                    setLoading(false); // Set loading to false after fetching
                })
                .catch(err => {
                    console.error("Error fetching detections:", err);
                    setLoading(false); // Set loading to false on error
                });
        }
    }, [detectionPage, showOilTable, showBeltTable]);

    // Fetch oil data
    const fetchOilData = useCallback(() => {
        if (showOilTable) {
            setLoading(true);
            fetch(`${API_BASE_URL}/get_data?page=${oilPage}&limit=${limit}`)
                .then(res => res.json())
                .then(data => {
                    setOilData(data.data || []); // Ensure it's an array
                    setTotalOilData(data.total);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching oil data:", err);
                    setLoading(false);
                });
        }
    }, [oilPage, showOilTable]);

    // Fetch belt running periods data
    const fetchBeltData = useCallback(() => {
        if (showBeltTable) {
            setLoading(true);
            fetch(`${API_BASE_URL}/get_belt_running_periods?page=${beltPage}&limit=${limit}`)
                .then(res => res.json())
                .then(data => {
                    setBeltData(data.data || []); // Ensure it's an array
                    setTotalBeltData(data.total);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching belt data:", err);
                    setLoading(false);
                });
        }
    }, [beltPage, showBeltTable]);

    // Effect to fetch detection data when page or table view changes
    useEffect(() => {
        fetchDetectionData();
    }, [detectionPage, showOilTable, showBeltTable, fetchDetectionData]);

    // Effect to fetch oil data when page or table view changes
    useEffect(() => {
        fetchOilData();
    }, [oilPage, showOilTable, fetchOilData]);

    // Effect to fetch belt data when page or table view changes
    useEffect(() => {
        fetchBeltData();
    }, [beltPage, showBeltTable, fetchBeltData]);

    // Automatically refresh data every 2 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (showOilTable) {
                fetchOilData(); // Refresh oil data
            } else if (showBeltTable) {
                fetchBeltData(); // Refresh belt data
            } else {
                fetchDetectionData(); // Refresh detection data
            }
        }, 2000); // 2000 ms = 2 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, [showOilTable, showBeltTable, fetchDetectionData, fetchOilData, fetchBeltData]);

    // Toggle oil table
    const toggleOilTable = () => {
        setShowOilTable(!showOilTable);
        setShowBeltTable(false); // Ensure only one table is visible at a time
        setDetectionPage(1); // Reset page on table switch
        setOilPage(1);
        setBeltPage(1);
    };

    // Toggle belt table
    const toggleBeltTable = () => {
        setShowBeltTable(!showBeltTable);
        setShowOilTable(false); // Ensure only one table is visible at a time
        setDetectionPage(1); // Reset page on table switch
        setOilPage(1);
        setBeltPage(1);
    };

    return (
        <div className="history-page">
            {/* Buttons */}
            <div className="pagination">
                <button
                    className="prev-button"
                    onClick={toggleOilTable}
                >
                    {showOilTable ? "⬅ Show Detection History" : "Show Oil Tank Status ➡"}
                </button>
                <button
                    className="next-button"
                    onClick={toggleBeltTable}
                >
                    {showBeltTable ? "⬅ Show Detection History" : "Show Belt Running Periods ➡"}
                </button>
            </div>

            
            {/* Detection Table */}
            {!showOilTable && !showBeltTable && (
                <div className="table-container">
                    <h2>Oil Detected</h2>
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Object Name</th>
                                <th>Confidence</th>
                                <th>Image</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detections && detections.map((detection, index) => (
                                <tr key={index}>
                                    <td>{detection.id}</td>
                                    <td>{detection.object_name}</td>
                                    <td>{(detection.confidence * 100).toFixed(2)}%</td>
                                    <td>
                                        <img
                                            src={`data:image/jpeg;base64,${detection.image}`}
                                            alt="Detected Object"
                                            className="detection-image"
                                        />
                                    </td>
                                    <td>{new Date(detection.timestamp).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pagination">
                        <button
                            className="prev-button"
                            onClick={() => setDetectionPage(detectionPage - 1)}
                            disabled={detectionPage === 1}
                        >
                            ⬅ Previous
                        </button>

                        <span> Page {detectionPage} of {Math.ceil(totalDetections / limit)} </span>

                        <button
                            className="next-button"
                            onClick={() => setDetectionPage(detectionPage + 1)}
                            disabled={detectionPage >= Math.ceil(totalDetections / limit)}
                        >
                            Next ➡
                        </button>
                    </div>
                </div>
            )}

            {/* Oil Tank Table */}
            {showOilTable && (
                <div className="table-container">
                    <h2>Oil Tank Status</h2>
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Timestamp</th>
                                <th>Oil Level</th>
                                <th>Oil Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {oilData && oilData.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.timestamp}</td>
                                    <td>{item.oil_level}%</td>
                                    <td>{item.oil_status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pagination">
                        <button
                            className="prev-button"
                            onClick={() => setOilPage(oilPage - 1)}
                            disabled={oilPage === 1}
                        >
                            ⬅ Previous
                        </button>

                        <span> Page {oilPage} of {Math.ceil(totalOilData / limit)} </span>

                        <button
                            className="next-button"
                            onClick={() => setOilPage(oilPage + 1)}
                            disabled={oilPage >= Math.ceil(totalOilData / limit)}
                        >
                            Next ➡
                        </button>
                    </div>
                </div>
            )}

            {/* Belt Running Periods Table */}
            {showBeltTable && (
                <div className="table-container">
                    <h2>Belt Running Periods</h2>
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Running Time</th>
                                <th>Stopped Time</th>
                                <th>Running Duration (seconds)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {beltData && beltData.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.running_time}</td>
                                    <td>{item.stopped_time}</td>
                                    <td>{item.running_duration_seconds}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pagination">
                        <button
                            className="prev-button"
                            onClick={() => setBeltPage(beltPage - 1)}
                            disabled={beltPage === 1}
                        >
                            ⬅ Previous
                        </button>

                        <span> Page {beltPage} of {Math.ceil(totalBeltData / limit)} </span>

                        <button
                            className="next-button"
                            onClick={() => setBeltPage(beltPage + 1)}
                            disabled={beltPage >= Math.ceil(totalBeltData / limit)}
                        >
                            Next ➡
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetectionHistory;
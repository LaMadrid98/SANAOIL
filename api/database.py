import mysql.connector
import cv2
import base64
import requests
import threading

# SANAOIL XAMPP MySQL Database Configuration
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "oil_detection_db"
}

# Machine learning YOLO database
def save_detection_to_db(class_name, confidence, frame):
    """Save detected object and image to the database, then control the pump based on oil detection."""
    try:
        detected = class_name is not None and "oil" in class_name.lower()  # Detect oil presence

        if detected:
            _, buffer = cv2.imencode('.jpg', frame)
            image_data = buffer.tobytes()

            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor()
            sql = "INSERT INTO detections (object_name, confidence, image) VALUES (%s, %s, %s)"
            values = (str(class_name), float(confidence), image_data)
            cursor.execute(sql, values)
            conn.commit()
            cursor.close()
            conn.close()

            print("Oil detected! Image & Detection saved successfully!")

        else:
            print("No oil detected, skipping database save.")

        def turn_off_pump():
            pump_url_off = "http://0.0.0.0:8000/toggle_pump/pump_in/off" # [NEED TO BE CHANGED!!!!] Change this to your ESP32's IP 
            response = requests.get(pump_url_off, headers={"Accept": "application/json", "Content-Type": "application/json"})
            if response.ok:
                print("Pump In turned OFF successfully after 5 seconds!")
            else:
                print(f"Failed to turn off Pump In, Status Code: {response.status_code}, Response: {response.text}")

        if detected:
            pump_url_on = "http://0.0.0.0:8000/toggle_pump/pump_in/on" # [NEED TO BE CHANGED!!!!] Change this to your ESP32's IP
            response = requests.get(pump_url_on, headers={"Accept": "application/json", "Content-Type": "application/json"})

            if response.ok:
                print("Pump In turned ON successfully!")
                threading.Timer(5, turn_off_pump).start()
            else:
                print(f"Failed to turn ON Pump In, Status Code: {response.status_code}, Response: {response.text}")

    except requests.exceptions.RequestException as req_err:
        print(f"Request Error: {req_err}")

    except Exception as e:
        print(f"Database Error: {e}")


# Fetch Database
def fetch_detections():
    """Retrieve all detection records from the database and convert images/timestamps to JSON-friendly format."""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT id, object_name, confidence, image, timestamp FROM detections ORDER BY timestamp DESC"
        cursor.execute(sql)
        results = cursor.fetchall()

        # Convert image bytes to Base64 and format timestamps as strings
        for detection in results:
            if detection["image"]:
                detection["image"] = base64.b64encode(detection["image"]).decode("utf-8")
            if detection["timestamp"]:
                detection["timestamp"] = detection["timestamp"].isoformat()  # Convert datetime to string

        cursor.close()
        conn.close()
        return results
    except Exception as e:
        print(f"Database Error: {e}")
        return []

# ESP32 Database
def insert_sensor_data(ph: float, turbidity: int):
    """Insert sensor data into the esp32 table."""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        sql = "INSERT INTO esp32 (ph, turbidity) VALUES (%s, %s)"
        cursor.execute(sql, (ph, turbidity))
        conn.commit()
        cursor.close()
        conn.close()

        print("ESP32 Data saved successfully!")
        return {"message": "Data inserted successfully"}

    except Exception as e:
        print(f"Database Error: {e}")
        return {"error": str(e)}

# Fetch ESP32 sensor data
def fetch_sensor_data():
    """Retrieve the latest sensor data from the database."""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT id, ph, turbidity, timestamp FROM esp32 ORDER BY timestamp DESC LIMIT 1"
        cursor.execute(sql)
        results = cursor.fetchall()

        # Convert timestamp to string format
        for entry in results:
            if entry["timestamp"]:
                entry["timestamp"] = entry["timestamp"].isoformat()

        cursor.close()
        conn.close()
        return results
    except Exception as e:
        print(f"Database Error: {e}")
        return []

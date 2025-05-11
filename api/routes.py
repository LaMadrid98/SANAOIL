from fastapi import APIRouter, Query, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
import mysql.connector
from datetime import datetime
from api.detection import generate_frames
from api.database import fetch_detections
import httpx

router = APIRouter()

# Global variables
detection_enabled = False
detection_message = {"status": "No Oil Detected..."}
ESP32_IP1 = "http://0.0.0.0"  # [NEED TO BE CHANGED!!!!] Change this to your ESP32's IP, run the MAIN_ESP32.ino and copy the given IP of the code
ESP32_IP2 = "http://0.0.0.0"  # [NEED TO BE CHANGED!!!!] Change this to your ESP32's IP  run the SAMPLE.ino and copy the given IP of the code

# MySQL Connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",  # Change if needed
    database="oil_detection_db" # Database name
)

# Route for ESP32 to send oil level data function
@router.post("/upload")
async def upload_data(request: Request):
    try:
        data = await request.json() # Extracts JSON data from the incoming request
        raw_level = data.get("raw_level") # Extracts the "raw_level" value from the received JSON

        if raw_level is None:
            raise HTTPException(status_code=400, detail="Missing raw_level data") # Raises an HTTP 400 error if the key is missing

        cursor = db.cursor() # Creates a cursor to interact with the database
        cursor.execute("INSERT INTO oil_tank_status (raw_level) VALUES (%s)", (raw_level,)) # Executes SQL query to insert raw_level data into the database
        db.commit() # Commits the transaction to save the data to the database
        cursor.close() 
        return JSONResponse(content={"message": "Data inserted successfully"}, status_code=201)

    except Exception as e:  # Catches any exception that occurs during the operation
        raise HTTPException(status_code=500, detail=str(e))

# New POST route to upload belt status
@router.post("/upload_belt_status")
async def upload_belt_status(request: Request):
    try:
        data = await request.json()  # Extract incoming JSON data
        status = data.get("status")  # Extract the "status" field

        if status not in ['Running', 'Stopped']:
            raise HTTPException(status_code=400, detail="Invalid status. Must be 'Running' or 'Stopped'.")

        cursor = db.cursor()  # Create a cursor to interact with the database
        cursor.execute("INSERT INTO belt_status (status) VALUES (%s)", (status,))  # Insert the status into the database
        db.commit()  # Commit the transaction
        cursor.close()

        return JSONResponse(content={"message": f"Belt status '{status}' inserted successfully"}, status_code=201)

    except Exception as e:  # Handle errors
        raise HTTPException(status_code=500, detail=str(e))


# Route for React to fetch data function
@router.get("/get_data")
def get_data(page: int = Query(1), limit: int = Query(20)): 
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT id, timestamp, oil_level, oil_status FROM oil_tank_status ORDER BY id DESC")  # Executes the SQL query to fetch oil tank status data
        data = cursor.fetchall() # Fetches all the results from the query
        cursor.close()

        # Apply pagination
        start = (page - 1) * limit # Determines the starting point for the current page
        end = start + limit # Determines the ending point for the current page
        paginated_data = data[start:end] # Slices the data to return only the current page's records

        # Convert datetime to string (if any)
        for record in paginated_data:
            if isinstance(record["timestamp"], datetime): # Checks if timestamp is of datetime type
                record["timestamp"] = record["timestamp"].strftime("%Y-%m-%d %H:%M:%S") # Converts datetime to string format

        return JSONResponse(content={
            "data": paginated_data, # The data for the current page
            "total": len(data), # Total number of records in the database
            "page": page, # Current page number
            "limit": limit # Limit of records per page
        }, status_code=200)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# New GET route to fetch belt running periods
@router.get("/get_belt_running_periods")
def get_belt_running_periods(page: int = Query(1), limit: int = Query(20)):
    try:
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT id, running_time, stopped_time, running_duration_seconds FROM belt_running_periods ORDER BY id DESC")  # Query to fetch belt running periods
        data = cursor.fetchall()  # Fetch all the results from the query
        cursor.close()

        # Apply pagination
        start = (page - 1) * limit
        end = start + limit
        paginated_data = data[start:end]  # Slice the data to return only the records for the current page

        # Convert datetime to string (if any)
        for record in paginated_data:
            if "running_time" in record and isinstance(record["running_time"], datetime):  # Check if key exists
                record["running_time"] = record["running_time"].strftime("%Y-%m-%d %H:%M:%S")  # Format it
            if "stopped_time" in record and isinstance(record["stopped_time"], datetime):  # Check if key exists
                record["stopped_time"] = record["stopped_time"].strftime("%Y-%m-%d %H:%M:%S")  # Format it

        return JSONResponse(content={
            "data": paginated_data,  # Return paginated data
            "total": len(data),  # Total number of records
            "page": page,  # Current page number
            "limit": limit  # Limit of records per page
        }, status_code=200)

    except Exception as e:  # Handle errors
        print(f"Error in /get_belt_running_periods: {e}")  # Log the specific error
        raise HTTPException(status_code=500, detail=str(e))


# YOLO Video Feed function
@router.get("/video_feed")
def video_feed():
    return StreamingResponse( # Returns a streaming response for video frames
        generate_frames(detection_enabled, detection_message), # Calls the 'generate_frames' function with the current detection status
        media_type="multipart/x-mixed-replace; boundary=frame" # Specifies the content type for video streaming
    )

# Detection toggle function
@router.post("/toggle_detection")
def toggle_detection(state: bool = Query(...)):
    global detection_enabled # Access and modify the global 'detection_enabled' variable
    detection_enabled = state # Set the detection_enabled flag to the provided state (True/False)
    return JSONResponse(content={"detection_enabled": detection_enabled}) # Return the updated state as JSON response

# Detection Status function
@router.get("/detection_status")
def get_detection_status():
    return JSONResponse(content=detection_message) # Return the current detection status as a JSON response

# Get Detection function
@router.get("/get_detections")
def get_detections(page: int = Query(1), limit: int = Query(20)): # Fetch all detections from the database
    detections = fetch_detections() # Calculate the start index for pagination
    start = (page - 1) * limit # Calculate the start index for pagination
    end = start + limit # Calculate the end index for pagination
    paginated_detections = detections[start:end] # Slice the detections list to get the current page's data
    return JSONResponse(content={ 
        "detections": paginated_detections, # List of detections for the current page
        "total": len(detections), # Total number of detections available
        "page": page, # Current page number
        "limit": limit # Number of items per page
    })

# Toggle pump function to esp32
@router.get("/toggle_pump/{pump}/{state}")
async def toggle_pump(pump: str, state: str):
    if pump not in ["pump_in", "pump_out"] or state not in ["on", "off"]: # Validate pump and state parameters
        raise HTTPException(status_code=400, detail="Invalid parameters")
    
    esp_endpoint = f"{ESP32_IP1}/{pump}_{state}" # Construct the endpoint URL for ESP32 based on pump and state
    async with httpx.AsyncClient(timeout=5.0) as client: # Create an async HTTP client with a 5s timeout
        try:
            response = await client.get(esp_endpoint) # Send GET request to the ESP32 endpoint
            response.raise_for_status() # Raise an error if status code is not 2xx
            return {"message": f"{pump} turned {state}", "esp_response": response.text} # Return success message with ESP32 response
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Failed to reach ESP32: {str(e)}") # Handle HTTP errors and return failure message


# Toggle conveyor motor function to esp32
@router.get("/toggle_conveyor/{state}")
async def toggle_conveyor(state: str):
    if state not in ["on", "off"]: # Validate the 'state' parameter
        raise HTTPException(status_code=400, detail="Invalid state. Use 'on' or 'off'.") # Return error for invalid state
    
    esp_endpoint = f"{ESP32_IP1}/conveyor_{state}" # Construct ESP32 endpoint URL
    async with httpx.AsyncClient(timeout=5.0) as client: # Create an async HTTP client with a 5s timeout
        try:
            response = await client.get(esp_endpoint) # Send GET request to ESP32
            response.raise_for_status() # Check for successful response
            return {"message": f"Conveyor motor turned {state}", "esp_response": response.text} # Return success message
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Failed to reach ESP32: {str(e)}") # Handle connection issues

# Get Tank level status function to esp32
@router.get("/tank_level")
async def get_tank_level():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client: # Asynchronous client with 5s timeout
            response = await client.get(f"{ESP32_IP1}/tank_level") # Send GET request to ESP32
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve tank level from ESP32: {str(e)}")  # Handle HTTP errors
    except ValueError:
        raise HTTPException(status_code=500, detail="Invalid JSON response from ESP32") # Handle invalid JSON responses

# Set of accepted propeller movement commands
VALID_COMMANDS = {"move_forward", "move_reverse", "move_left", "move_right", "stop"}
# API route to send propeller control commands to ESP32
@router.get("/{command}")
async def control_propeller(command: str):
    if command.lower() not in VALID_COMMANDS:
        raise HTTPException(status_code=400, detail="Invalid command")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client: # Create an async HTTP client and send request to ESP32
            response = await client.get(f"{ESP32_IP2}/{command.lower()}")
            response.raise_for_status()  #
            return {
                "message": f"{command} sent",
                "esp_response": response.text  # Return ESP32's response text
            }
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"ESP32 error: {str(e)}") # Handle connection or HTTP errors
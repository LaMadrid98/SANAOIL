import cv2
from ultralytics import YOLO
from ultralytics.utils.plotting import Annotator
from api.database import save_detection_to_db

# Load YOLO model
model = YOLO("ml/YoloV8.pt")

# ESP32 Camera URL (Change accordingly)
camera_url = "http://0.0.0.0/cam-hi.jpg" # Open the ESP32CAMYOLO.ino and run it to your ESP32CAM at copy the IP given by the code in here

def generate_frames(detection_enabled, detection_message):
    """Capture frames from ESP32-CAM and process them for object detection."""
    cap = cv2.VideoCapture(camera_url)

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            print("Failed to read frame from camera.")
            break

        detected_oil = False  # Flag to check if oil is detected

        if detection_enabled:
            results = model.predict(frame, stream=True, verbose=False)
            annotator = Annotator(frame)

            for result in results:
                boxes = result.boxes
                for box in boxes:
                    r = box.xyxy[0]  # Bounding box coordinates
                    c = box.cls  # Class index
                    confidence = box.conf[0].item()  # Confidence score

                    if confidence > 0.5:
                        object_name = model.names[int(c)]
                        print(f"Detected: {object_name} ({confidence * 100:.2f}%)")
                        save_detection_to_db(object_name, confidence, frame)
                        annotator.box_label(r, label=object_name, color=(0, 255, 0))

                        if "oil" in object_name.lower():  # Check if detected object is oil
                            detected_oil = True

        # Update detection message
        detection_message["status"] = "OIL DETECTED!!!" if detected_oil else "No Oil Detected..."

        _, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    cap.release()

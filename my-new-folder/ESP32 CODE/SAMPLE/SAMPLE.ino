#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>

// === Motor Pin Definitions ===
#define PROPELLER1_IN1 16
#define PROPELLER1_IN2 17
#define PROPELLER2_IN3 32
#define PROPELLER2_IN4 33

// === Ultrasonic Sensor Settings ===
#define TRIG_PIN       26
#define ECHO_PIN       27
#define TANK_HEIGHT    14.0  // cm
#define MIN_DISTANCE   2.0
#define MAX_TIMEOUT    30000 // µs

// === WiFi Credentials ===
const char* WIFI_SSID = "";     
const char* WIFI_PASS = "";          

// === Flask Server URL ===
const char* SERVER_URL = "http://0.0.0.0:8000/upload";  // Change this according to your wifi IP 

WebServer server(80);
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 5000; // 5 seconds

// === Motor Control Function ===
void handleMoveCommand(String command) {
    Serial.println("Command Received: " + command);

    if (command == "MOVE_LEFT") {
        digitalWrite(PROPELLER1_IN1, HIGH);
        digitalWrite(PROPELLER1_IN2, LOW);
        digitalWrite(PROPELLER2_IN3, LOW);
        digitalWrite(PROPELLER2_IN4, LOW);
        Serial.println("Turning Left");
    }
    else if (command == "MOVE_RIGHT") {
        digitalWrite(PROPELLER1_IN1, LOW);
        digitalWrite(PROPELLER1_IN2, LOW);
        digitalWrite(PROPELLER2_IN3, LOW);
        digitalWrite(PROPELLER2_IN4, HIGH);
        Serial.println("Turning Right");
    }
    else if (command == "MOVE_FORWARD") {
        digitalWrite(PROPELLER1_IN1, HIGH);
        digitalWrite(PROPELLER1_IN2, LOW);
        digitalWrite(PROPELLER2_IN3, LOW);
        digitalWrite(PROPELLER2_IN4, HIGH);
        Serial.println("Moving Forward");
    }
    else if (command == "MOVE_REVERSE") {
        digitalWrite(PROPELLER1_IN1, LOW);
        digitalWrite(PROPELLER1_IN2, HIGH);
        digitalWrite(PROPELLER2_IN3, HIGH);
        digitalWrite(PROPELLER2_IN4, LOW);
        Serial.println("Reversing");
    }
    else if (command == "STOP") {
        digitalWrite(PROPELLER1_IN1, LOW);
        digitalWrite(PROPELLER1_IN2, LOW);
        digitalWrite(PROPELLER2_IN3, LOW);
        digitalWrite(PROPELLER2_IN4, LOW);
        Serial.println("Motors Stopped");
    }
    else {
        Serial.println("Invalid Command!");
    }
}

// === API Endpoints ===
void handleMoveLeft()     { handleMoveCommand("MOVE_LEFT"); server.send(200, "application/json", "{\"status\": \"Turning Left\"}"); }
void handleMoveRight()    { handleMoveCommand("MOVE_RIGHT"); server.send(200, "application/json", "{\"status\": \"Turning Right\"}"); }
void handleMoveForward()  { handleMoveCommand("MOVE_FORWARD"); server.send(200, "application/json", "{\"status\": \"Moving Forward\"}"); }
void handleMoveReverse()  { handleMoveCommand("MOVE_REVERSE"); server.send(200, "application/json", "{\"status\": \"Reversing\"}"); }
void handleStop()         { handleMoveCommand("STOP"); server.send(200, "application/json", "{\"status\": \"Stopped\"}"); }

// === Ultrasonic Reading ===
float getDistance() {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, MAX_TIMEOUT);
    if (duration == 0) return -1;

    return duration * 0.034 / 2;
}

// === Send Level to Flask ===
void sendToServer(float rawLevel) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(SERVER_URL);
        http.addHeader("Content-Type", "application/json");

        String json = "{\"raw_level\": " + String((int)rawLevel) + "}";
        int httpResponseCode = http.POST(json);

        Serial.print("POST Response: ");
        Serial.println(httpResponseCode);
        http.end();
    } else {
        Serial.println("❌ Not connected to WiFi.");
    }
}

// === Setup ===
void setup() {
    Serial.begin(115200);

    // Motor Pins
    pinMode(PROPELLER1_IN1, OUTPUT);
    pinMode(PROPELLER1_IN2, OUTPUT);
    pinMode(PROPELLER2_IN3, OUTPUT);
    pinMode(PROPELLER2_IN4, OUTPUT);
    digitalWrite(PROPELLER1_IN1, LOW);
    digitalWrite(PROPELLER1_IN2, LOW);
    digitalWrite(PROPELLER2_IN3, LOW);
    digitalWrite(PROPELLER2_IN4, LOW);

    // Ultrasonic Pins
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);

    // WiFi Connect
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\n✅ WiFi Connected!");
    Serial.println(WiFi.localIP());

    // Web Server Routes
    server.on("/move_left", handleMoveLeft);
    server.on("/move_right", handleMoveRight);
    server.on("/move_forward", handleMoveForward);
    server.on("/move_reverse", handleMoveReverse);
    server.on("/stop", handleStop);
    server.begin();

    Serial.println("Server started. Waiting for commands...");
}

// === Loop ===
void loop() {
    server.handleClient();

    // Serial Command Support
    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        command.trim();
        handleMoveCommand(command);
    }

    // Periodic Sensor Read & Send
    if (millis() - lastSendTime > sendInterval) {
        float distance = getDistance();
        float level = -1;

        if (distance == -1) {
            Serial.println("⚠️ No echo received.");
        } else if (distance < MIN_DISTANCE) {
            level = 100;
        } else if (distance > TANK_HEIGHT) {
            level = 0;
        } else {
            level = ((TANK_HEIGHT - distance) / TANK_HEIGHT) * 100.0;
        }

        if (level != -1) {
            Serial.print("Sending Oil Level: ");
            Serial.print(level);
            Serial.println("%");
            sendToServer(level);
        }

        lastSendTime = millis();
    }
}
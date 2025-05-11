#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h> // Include ArduinoJson library

#define PUMP_MOTOR_IN1 16   // Pump In Motor
#define PUMP_MOTOR_IN2 17   // Pump In Motor
#define PUMP_MOTOR_OUT3 33  // Pump Out Motor
#define PUMP_MOTOR_OUT4 32  // Pump Out Motor
#define CONVEYOR_MOTOR_IN1 26    // Conveyor Motor
#define CONVEYOR_MOTOR_IN2 27    // Conveyor Motor
#define FLOAT_SWITCH_PIN 4      // Float Switch

const char* WIFI_SSID = "";
const char* WIFI_PASS = "";



WebServer server(80);
bool pumpInAllowed = true;
bool pumpInRunning = false;
String tankWaterLevel = "not full";

void updateFloatSwitchStatus() {
    int floatSwitch = digitalRead(FLOAT_SWITCH_PIN);
    if (floatSwitch == LOW) {
        tankWaterLevel = "full";
        pumpInAllowed = false;
    } else {
        tankWaterLevel = "not full";
        pumpInAllowed = true;
    }
}

void autoControlPumpIn() {
    if (tankWaterLevel == "full" && pumpInRunning) {
        // Tank is full, stop Pump In Motor
        digitalWrite(PUMP_MOTOR_IN1, LOW);
        digitalWrite(PUMP_MOTOR_IN2, LOW);
        pumpInRunning = false;
        Serial.println("Auto: Pump In Motor OFF (Tank Full)");
        digitalWrite(CONVEYOR_MOTOR_IN1, HIGH);
        digitalWrite(CONVEYOR_MOTOR_IN2, HIGH);
        Serial.println("Auto: Conveyor Motor Start Running...");
    }
}

void handleMotorCommand(String command) {
    Serial.println("Command Received: " + command);

    if (command == "PUMP_IN_ON") {
        updateFloatSwitchStatus();
        if (pumpInAllowed) {
            digitalWrite(PUMP_MOTOR_IN1, HIGH);
            digitalWrite(PUMP_MOTOR_IN2, LOW);
            pumpInRunning = true;
            Serial.println("Pump In Motor ON");
        } else {
            Serial.println("Pump In Motor Blocked by Float Switch");
        }
    }
    else if (command == "PUMP_IN_OFF") {
        digitalWrite(PUMP_MOTOR_IN1, LOW);
        digitalWrite(PUMP_MOTOR_IN2, LOW);
        pumpInRunning = false;
        Serial.println("Pump In Motor OFF");
    }
    else if (command == "PUMP_OUT_ON") {
        digitalWrite(PUMP_MOTOR_OUT3, LOW);
        digitalWrite(PUMP_MOTOR_OUT4, HIGH);
        Serial.println("Pump Out Motor ON");
    }
    else if (command == "PUMP_OUT_OFF") {
        digitalWrite(PUMP_MOTOR_OUT3, LOW);
        digitalWrite(PUMP_MOTOR_OUT4, LOW);
        Serial.println("Pump Out Motor OFF");
    }
    else if (command == "CONVEYOR_ON") {
        digitalWrite(CONVEYOR_MOTOR_IN1, HIGH);
        digitalWrite(CONVEYOR_MOTOR_IN2, LOW);
        Serial.println("Conveyor Motor ON");
    }
    else if (command == "CONVEYOR_OFF") {
        digitalWrite(CONVEYOR_MOTOR_IN1, LOW);
        digitalWrite(CONVEYOR_MOTOR_IN2, LOW);
        Serial.println("Conveyor Motor OFF");
    }
    else {
        Serial.println("Invalid Command!");
    }
}

void handlePumpInOn() { handleMotorCommand("PUMP_IN_ON"); server.send(200, "application/json", "{\"status\": \"Pump In Motor ON\"}"); }
void handlePumpInOff() { handleMotorCommand("PUMP_IN_OFF"); server.send(200, "application/json", "{\"status\": \"Pump In Motor OFF\"}"); }
void handlePumpOutOn() { handleMotorCommand("PUMP_OUT_ON"); server.send(200, "application/json", "{\"status\": \"Pump Out Motor ON\"}"); }
void handlePumpOutOff() { handleMotorCommand("PUMP_OUT_OFF"); server.send(200, "application/json", "{\"status\": \"Pump Out Motor OFF\"}"); }
void handleConveyorOn() { handleMotorCommand("CONVEYOR_ON"); server.send(200, "application/json", "{\"status\": \"Conveyor Motor ON\"}"); }
void handleConveyorOff() { handleMotorCommand("CONVEYOR_OFF"); server.send(200, "application/json", "{\"status\": \"Conveyor Motor OFF\"}"); }

void handleTankLevel() {
  DynamicJsonDocument doc(128); // Adjust size as needed
  doc["tank_level"] = tankWaterLevel;
  String jsonString;
  serializeJson(doc, jsonString);
  server.send(200, "application/json", jsonString);
}

void setup() {
    Serial.begin(115200);
    pinMode(PUMP_MOTOR_IN1, OUTPUT);
    pinMode(PUMP_MOTOR_IN2, OUTPUT);
    pinMode(PUMP_MOTOR_OUT3, OUTPUT);
    pinMode(PUMP_MOTOR_OUT4, OUTPUT);
    pinMode(CONVEYOR_MOTOR_IN1, OUTPUT);
    pinMode(CONVEYOR_MOTOR_IN2, OUTPUT);
    pinMode(FLOAT_SWITCH_PIN, INPUT_PULLUP);

    digitalWrite(PUMP_MOTOR_IN1, LOW);
    digitalWrite(PUMP_MOTOR_IN2, LOW);
    digitalWrite(PUMP_MOTOR_OUT3, LOW);
    digitalWrite(PUMP_MOTOR_OUT4, LOW);
    digitalWrite(CONVEYOR_MOTOR_IN1, LOW);
    digitalWrite(CONVEYOR_MOTOR_IN2, LOW);

    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nWiFi Connected! IP Address: ");
    Serial.println(WiFi.localIP());

    server.on("/pump_in_on", handlePumpInOn);
    server.on("/pump_in_off", handlePumpInOff);
    server.on("/pump_out_on", handlePumpOutOn);
    server.on("/pump_out_off", handlePumpOutOff);
    server.on("/conveyor_on", handleConveyorOn);
    server.on("/conveyor_off", handleConveyorOff);
    server.on("/tank_level", handleTankLevel); 

    server.begin();
    Serial.println("Server started. Waiting for API commands...");
}

void loop() {
    server.handleClient();
    updateFloatSwitchStatus();  // Update water level status
    autoControlPumpIn();    // Auto control Pump In Motor

    if (Serial.available() > 0) {
        String command = Serial.readStringUntil('\n');
        command.trim();
        handleMotorCommand(command);
        Serial.flush();  // Clear the serial buffer after processing the command
    }
}

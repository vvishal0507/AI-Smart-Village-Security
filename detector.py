import random
import time
from datetime import datetime
import requests

BACKEND_URL = "http://localhost:5000/api/detect"
LOCATIONS = [
    "Village Entrance",
    "Farm Path",
    "Water Tank Area",
    "School Gate",
    "Temple Street"
]


def generate_signal_data():
    normal = random.random() > 0.25

    if normal:
        motion_intensity = random.randint(8, 45)
        wifi_variation = random.randint(5, 28)
        device_density = random.randint(1, 4)
        sound_spike = random.randint(3, 22)
    else:
        motion_intensity = random.randint(55, 100)
        wifi_variation = random.randint(35, 90)
        device_density = random.randint(4, 10)
        sound_spike = random.randint(25, 80)

    return {
        "motion_intensity": motion_intensity,
        "wifi_variation": wifi_variation,
        "device_density": device_density,
        "sound_spike": sound_spike,
        "location": random.choice(LOCATIONS),
        "captured_at": datetime.now().isoformat()
    }


def calculate_risk_score(data):
    score = (
        data["motion_intensity"] * 0.35
        + data["wifi_variation"] * 0.30
        + data["device_density"] * 6
        + data["sound_spike"] * 0.20
    )
    return round(score, 2)


def detect_anomaly(data):
    score = calculate_risk_score(data)

    if score >= 55:
        status = "ALERT"
        message = (
            f"Suspicious activity detected near {data['location']}. "
            f"Unusual movement and signal variation observed."
        )
    else:
        status = "SAFE"
        message = (
            f"Normal activity at {data['location']}. "
            f"No threat pattern detected."
        )

    return {
        "status": status,
        "score": score,
        "message": message,
        "location": data["location"],
        "rawData": data
    }


def send_to_backend(event):
    try:
        response = requests.post(BACKEND_URL, json=event, timeout=5)
        print(f"[{response.status_code}] {event['status']} | Score: {event['score']} | {event['message']}")
    except requests.RequestException as exc:
        print("Backend connection failed:", exc)


if __name__ == "__main__":
    print("AI detector started. Press Ctrl+C to stop.")

    while True:
        sensor_data = generate_signal_data()
        event = detect_anomaly(sensor_data)
        send_to_backend(event)
        time.sleep(5)
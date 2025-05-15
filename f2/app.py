from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import pytesseract
import numpy as np

app = Flask(__name__)
CORS(app)

# Ghana Card Verification Keywords
ghana_card_keywords = {
    "front": ["ECOWAS IDENTITY CARD", "Personal ID Number"],
    "back": ["NATIONAL IDENTIFICATION AUTHORITY", "Country Code"]
}

# Sample Police Reference DB
valid_ref_numbers = {
    "GHA/123/9/2023": {
        "firstName": "Kwame",
        "lastName": "Mensah",
        "age": 35,
        "homeLocation": "Accra"
    },
    "POLICEHQ/4567/12/2022": {
        "firstName": "Ama",
        "lastName": "Boateng",
        "age": 29,
        "homeLocation": "Takoradi"
    },
    "CID/1/1/2021": {
        "firstName": "Yaw",
        "lastName": "Owusu",
        "age": 41,
        "homeLocation": "Koforidua"
    },
    "KASOA/99999/3/2024": {
        "firstName": "Akua",
        "lastName": "Asante",
        "age": 32,
        "homeLocation": "Sunyani"
    },
    "ACCRA/800/11/2020": {
        "firstName": "Kojo",
        "lastName": "Adjei",
        "age": 38,
        "homeLocation": "Tamale"
    }
}


# Ghana Card Verification
def process_image(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, threshed = cv2.threshold(gray, 130, 255, cv2.THRESH_TRUNC)
    text = pytesseract.image_to_string(threshed, lang="eng")

    if any(keyword in text for keyword in ghana_card_keywords["front"]):
        return "front"
    elif any(keyword in text for keyword in ghana_card_keywords["back"]):
        return "back"
    else:
        return "unknown"

@app.route("/verify", methods=["POST"])
def verify_image():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    image_np = np.frombuffer(file.read(), np.uint8)
    image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

    result = process_image(image)
    return jsonify({"status": result})


# Police Reference Verification
@app.route("/verify_ref", methods=["POST"])
def verify_ref():
    data = request.get_json()
    ref = data.get("reference", "").strip().upper()

    if ref in valid_ref_numbers:
        return jsonify({
            "valid": True,
            "details": valid_ref_numbers[ref]
        })
    else:
        return jsonify({
            "valid": False,
            "message": "Reference number not found"
        })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")

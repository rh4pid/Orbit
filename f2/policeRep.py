from flask import Flask, request, jsonify

app = Flask(__name__)

# Allow requests from the frontend
from flask_cors import CORS
CORS(app)

# Simulated database of valid police reference numbers
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


@app.route("/verify", methods=["POST"])
def verify_reference():
    # Get the police reference number from the request
    ref_number = request.form.get("reference")

    if not ref_number:
        return jsonify({"error": "No reference number provided"}), 400

    # Check if the reference number exists in our simulated database
    if ref_number in valid_ref_numbers:
        return jsonify({"valid": True, "data": valid_ref_numbers[ref_number]})
    else:
        return jsonify({"valid": False, "error": "Invalid reference number"}), 400

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)

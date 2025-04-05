import pickle
import pandas as pd
from flask import Flask, request, jsonify

app = Flask(__name__)

# 1️⃣ Load your trained model on startup
with open("employee_performance_model.pkl", "rb") as f:
    model = pickle.load(f)

@app.route("/api/predict", methods=["POST", "GET"])
def predict():
    if request.method == "GET":
        return jsonify({"message": "This endpoint accepts POST requests with JSON data."})
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided."}), 400
        df = pd.DataFrame([data])
        prediction = model.predict(df)[0]
        return jsonify({"prediction": float(prediction)})
    except Exception as e:
        print("❌ Error during prediction:", e)
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    # 4️⃣ Start the Flask service (choose a port, e.g. 5001)
    app.run(host="0.0.0.0", port=5001, debug=True)

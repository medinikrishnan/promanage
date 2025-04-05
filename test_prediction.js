// test_prediction.js
// (If you’re using Node.js 18 or later, fetch is built in. Otherwise, install node-fetch: npm install node-fetch)
import fetch from "node-fetch"; // Omit this line if your Node version supports fetch natively

fetch("http://127.0.0.1:5001/api/predict", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    total_assignments: 5,
    completed_assignments: 3,
    completion_ratio: 60.0,
    feedback_count: 2,
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("Prediction:", data))
  .catch((error) => console.error("Error:", error));

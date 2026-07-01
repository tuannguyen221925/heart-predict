#!/usr/bin/env node

// Test script để debug API 401 issue
const API_URL = process.env.NEXT_PUBLIC_API_LOCAL_URL || "http://127.0.0.1:8000";

// Dữ liệu test
const testToken = process.argv[2] || "test-token-here";

const payload = {
  name_prediction: "Test từ script",
  age: 55,
  sex: 1,
  trestbps: 140,
  chol: 240,
  thalch: 150,
  oldpeak: 1.5,
  height: 170,
  weight: 65,
  include_bmi: true,
  cp: "asymptomatic",
  fbs: 0,
  restecg: "normal",
  exang: 0,
  slope: "flat",
  ca: 0,
  thal: "normal"
};

console.log("\n=== Testing Prediction API ===");
console.log("API URL:", API_URL + "/predict");
console.log("Token (first 20 chars):", testToken.substring(0, 20) + "...");
console.log("Payload keys:", Object.keys(payload));

// Test 1: Với Bearer token
console.log("\n[Test 1] Request với Authorization: Bearer <token>");
fetch(`${API_URL}/predict`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${testToken}`
  },
  body: JSON.stringify(payload)
})
.then(res => {
  console.log("Status:", res.status, res.statusText);
  return res.json();
})
.then(data => {
  console.log("Response:", JSON.stringify(data, null, 2));
})
.catch(err => console.error("Error:", err.message));

// Test 2: Không có Bearer
setTimeout(() => {
  console.log("\n[Test 2] Request với Authorization: <token> (không có Bearer)");
  fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": testToken
    },
    body: JSON.stringify(payload)
  })
  .then(res => {
    console.log("Status:", res.status, res.statusText);
    return res.json();
  })
  .then(data => {
    console.log("Response:", JSON.stringify(data, null, 2));
  })
  .catch(err => console.error("Error:", err.message));
}, 1000);

import pandas as pd
import joblib


# -----------------------------
# Load trained model
# -----------------------------

model = joblib.load(
    "model/churn_model.pkl"
)


# -----------------------------
# Create new customer
# -----------------------------

new_customer = pd.DataFrame([
    {
        "Age": 30,
        "Gender": "Female",
        "Tenure": 12,
        "Usage Frequency": 20,
        "Support Calls": 3,
        "Payment Delay": 5,
        "Subscription Type": "Basic",
        "Contract Length": "Monthly",
        "Total Spend": 50000,
        "Last Interaction": 10
    }
])


# -----------------------------
# Make prediction
# -----------------------------

prediction = model.predict(
    new_customer
)


# -----------------------------
# Get probability
# -----------------------------

probability = model.predict_proba(
    new_customer
)


print("Prediction:", prediction[0])

print("Probability of No Churn:", probability[0][0])

print("Probability of Churn:", probability[0][1])


# -----------------------------
# Human-readable result
# -----------------------------

if prediction[0] == 1:
    print("\nResult: Customer is likely to CHURN.")
else:
    print("\nResult: Customer is likely to STAY.")
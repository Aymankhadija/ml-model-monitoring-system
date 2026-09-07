import time
import sqlite3
from datetime import datetime
from pathlib import Path

import pandas as pd
import joblib

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)


# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

# Database
DATABASE_FILE = BASE_DIR / "monitoring.db"

# Model
MODEL_FILE = BASE_DIR.parent / "model" / "churn_model.pkl"


# ============================================================
# SQLITE DATABASE
# ============================================================

def get_connection():
    """
    Create and return a SQLite database connection.
    """
    connection = sqlite3.connect(DATABASE_FILE)
    connection.row_factory = sqlite3.Row
    return connection


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def initialize_database():

    connection = get_connection()
    cursor = connection.cursor()

    # --------------------------------------------------------
    # PREDICTIONS TABLE
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            timestamp TEXT NOT NULL,

            prediction INTEGER NOT NULL,

            churn_probability REAL NOT NULL,

            no_churn_probability REAL NOT NULL,

            latency_ms REAL NOT NULL,

            latency_anomaly INTEGER DEFAULT 0,

            anomaly_type TEXT

        )
    """)

    # --------------------------------------------------------
    # FEEDBACK TABLE
    # --------------------------------------------------------

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            timestamp TEXT NOT NULL,

            prediction INTEGER NOT NULL,

            actual_outcome INTEGER NOT NULL,

            correct INTEGER NOT NULL

        )
    """)

    connection.commit()
    connection.close()

    print("SQLite database initialized successfully.")
    print(f"Database: {DATABASE_FILE}")


# Initialize database when application starts
initialize_database()


# ============================================================
# CREATE FASTAPI APP
# ============================================================

app = FastAPI(
    title="ML Model Monitoring System",
    description="Customer Churn Prediction API",
    version="1.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

model = joblib.load(MODEL_FILE)


# ============================================================
# INPUT DATA STRUCTURE
# ============================================================

class CustomerData(BaseModel):

    Age: int
    Gender: str
    Tenure: int
    Usage_Frequency: int
    Support_Calls: int
    Payment_Delay: int
    Subscription_Type: str
    Contract_Length: str
    Total_Spend: float
    Last_Interaction: int


# ============================================================
# FEEDBACK DATA STRUCTURE
# ============================================================

class FeedbackData(BaseModel):

    prediction: int
    actual_outcome: int


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "ML Monitoring System API is running",
        "database": "SQLite",
        "database_file": str(DATABASE_FILE)
    }


# ============================================================
# SAVE PREDICTION TO SQLITE
# ============================================================

def save_prediction_to_database(
    prediction,
    churn_probability,
    no_churn_probability,
    latency_ms,
    latency_anomaly=False,
    anomaly_type=None
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO predictions (
            timestamp,
            prediction,
            churn_probability,
            no_churn_probability,
            latency_ms,
            latency_anomaly,
            anomaly_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (

        datetime.now().isoformat(),

        int(prediction),

        float(churn_probability),

        float(no_churn_probability),

        float(latency_ms),

        int(bool(latency_anomaly)),

        anomaly_type
    ))

    connection.commit()
    connection.close()


# ============================================================
# SAVE FEEDBACK TO SQLITE
# ============================================================

def save_feedback_to_database(
    prediction,
    actual_outcome,
    correct
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO feedback (
            timestamp,
            prediction,
            actual_outcome,
            correct
        )
        VALUES (?, ?, ?, ?)
    """, (

        datetime.now().isoformat(),

        int(prediction),

        int(actual_outcome),

        int(bool(correct))
    ))

    connection.commit()
    connection.close()


# ============================================================
# PREDICTION ENDPOINT
# ============================================================

@app.post("/predict")
def predict(customer: CustomerData):

    # --------------------------------------------------------
    # START TIMER
    # --------------------------------------------------------

    start_time = time.perf_counter()

    # --------------------------------------------------------
    # CONVERT REQUEST INTO DATAFRAME
    # --------------------------------------------------------

    data = pd.DataFrame([
        {
            "Age": customer.Age,

            "Gender": customer.Gender,

            "Tenure": customer.Tenure,

            "Usage Frequency":
                customer.Usage_Frequency,

            "Support Calls":
                customer.Support_Calls,

            "Payment Delay":
                customer.Payment_Delay,

            "Subscription Type":
                customer.Subscription_Type,

            "Contract Length":
                customer.Contract_Length,

            "Total Spend":
                customer.Total_Spend,

            "Last Interaction":
                customer.Last_Interaction
        }
    ])

    # --------------------------------------------------------
    # MAKE PREDICTION
    # --------------------------------------------------------

    prediction = model.predict(data)[0]

    # --------------------------------------------------------
    # GET PROBABILITIES
    # --------------------------------------------------------

    probability = model.predict_proba(data)[0]

    no_churn_probability = float(
        probability[0]
    )

    churn_probability = float(
        probability[1]
    )

    # --------------------------------------------------------
    # CALCULATE LATENCY
    # --------------------------------------------------------

    latency = (
        time.perf_counter() - start_time
    ) * 1000

    latency = round(latency, 2)

    # --------------------------------------------------------
    # ANOMALY DETECTION
    # --------------------------------------------------------

    LATENCY_THRESHOLD = 100

    if latency > LATENCY_THRESHOLD:

        latency_anomaly = True

        anomaly_type = "High Latency"

    else:

        latency_anomaly = False

        anomaly_type = "Normal"

    # --------------------------------------------------------
    # SAVE PREDICTION TO SQLITE
    # --------------------------------------------------------

    save_prediction_to_database(

        prediction=prediction,

        churn_probability=churn_probability,

        no_churn_probability=no_churn_probability,

        latency_ms=latency,

        latency_anomaly=latency_anomaly,

        anomaly_type=anomaly_type
    )

    # --------------------------------------------------------
    # TERMINAL OUTPUT
    # --------------------------------------------------------

    print("\n===================================")
    print("Customer Prediction")
    print("===================================")

    print("Customer data:")
    print(customer.dict())

    print("Prediction:")

    print({
        "prediction": int(prediction),

        "no_churn_probability":
            no_churn_probability,

        "churn_probability":
            churn_probability,

        "latency_ms":
            latency,

        "latency_anomaly":
            latency_anomaly,

        "anomaly_type":
            anomaly_type
    })

    # --------------------------------------------------------
    # RETURN RESULT
    # --------------------------------------------------------

    return {

        "prediction":
            int(prediction),

        "no_churn_probability":
            no_churn_probability,

        "churn_probability":
            churn_probability,

        "latency_ms":
            latency,

        "latency_anomaly":
            latency_anomaly,

        "anomaly_type":
            anomaly_type
    }


# ============================================================
# FEEDBACK ENDPOINT
# ============================================================

@app.post("/feedback")
def feedback(data: FeedbackData):

    # --------------------------------------------------------
    # VALIDATE PREDICTION
    # --------------------------------------------------------

    if data.prediction not in [0, 1]:

        return {
            "error": "prediction must be 0 or 1"
        }

    # --------------------------------------------------------
    # VALIDATE ACTUAL OUTCOME
    # --------------------------------------------------------

    if data.actual_outcome not in [0, 1]:

        return {
            "error":
                "actual_outcome must be 0 or 1"
        }

    # --------------------------------------------------------
    # DETERMINE CORRECTNESS
    # --------------------------------------------------------

    correct = (
        data.prediction ==
        data.actual_outcome
    )

    # --------------------------------------------------------
    # SAVE FEEDBACK TO SQLITE
    # --------------------------------------------------------

    save_feedback_to_database(

        prediction=data.prediction,

        actual_outcome=data.actual_outcome,

        correct=correct
    )

    # --------------------------------------------------------
    # RETURN RESULT
    # --------------------------------------------------------

    return {

        "message":
            "Feedback recorded successfully",

        "prediction":
            data.prediction,

        "actual_outcome":
            data.actual_outcome,

        "correct":
            correct
    }


# ============================================================
# MODEL PERFORMANCE
# ============================================================

@app.get("/performance")
def performance():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            prediction,
            actual_outcome
        FROM feedback
        ORDER BY id
    """)

    rows = cursor.fetchall()

    connection.close()

    # --------------------------------------------------------
    # NO FEEDBACK
    # --------------------------------------------------------

    if not rows:

        return {

            "total_feedback": 0,

            "accuracy": 0,

            "precision": 0,

            "recall": 0,

            "f1_score": 0
        }

    # --------------------------------------------------------
    # CONVERT DATABASE DATA
    # --------------------------------------------------------

    y_true = [
        row["actual_outcome"]
        for row in rows
    ]

    y_pred = [
        row["prediction"]
        for row in rows
    ]

    # --------------------------------------------------------
    # CALCULATE METRICS
    # --------------------------------------------------------

    accuracy = accuracy_score(
        y_true,
        y_pred
    )

    precision = precision_score(
        y_true,
        y_pred,
        zero_division=0
    )

    recall = recall_score(
        y_true,
        y_pred,
        zero_division=0
    )

    f1 = f1_score(
        y_true,
        y_pred,
        zero_division=0
    )

    # --------------------------------------------------------
    # RETURN PERFORMANCE
    # --------------------------------------------------------

    return {

        "total_feedback":
            len(rows),

        "accuracy":
            round(float(accuracy), 4),

        "precision":
            round(float(precision), 4),

        "recall":
            round(float(recall), 4),

        "f1_score":
            round(float(f1), 4)
    }


# ============================================================
# LATENCY HISTORY
# ============================================================

@app.get("/latency-history")
def latency_history():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            timestamp,
            latency_ms
        FROM predictions
        ORDER BY id
    """)

    rows = cursor.fetchall()

    connection.close()

    return {

        "timestamps": [
            row["timestamp"]
            for row in rows
        ],

        "latencies": [
            row["latency_ms"]
            for row in rows
        ]
    }


# ============================================================
# METRICS
# ============================================================

@app.get("/metrics")
def metrics():

    connection = get_connection()
    cursor = connection.cursor()

    # --------------------------------------------------------
    # TOTAL REQUESTS
    # --------------------------------------------------------

    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM predictions
    """)

    total_requests = cursor.fetchone()["total"]

    # --------------------------------------------------------
    # NO DATA
    # --------------------------------------------------------

    if total_requests == 0:

        connection.close()

        return {

            "total_requests": 0,

            "average_latency_ms": 0,

            "min_latency_ms": 0,

            "max_latency_ms": 0,

            "churn_predictions": 0,

            "stay_predictions": 0,

            "churn_rate": 0,

            "average_churn_probability": 0
        }

    # --------------------------------------------------------
    # LATENCY
    # --------------------------------------------------------

    cursor.execute("""
        SELECT
            AVG(latency_ms) AS average_latency,
            MIN(latency_ms) AS min_latency,
            MAX(latency_ms) AS max_latency
        FROM predictions
    """)

    latency_data = cursor.fetchone()

    # --------------------------------------------------------
    # PREDICTIONS
    # --------------------------------------------------------

    cursor.execute("""
        SELECT COUNT(*)
        FROM predictions
        WHERE prediction = 1
    """)

    churn_predictions = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM predictions
        WHERE prediction = 0
    """)

    stay_predictions = cursor.fetchone()[0]

    # --------------------------------------------------------
    # CHURN PROBABILITY
    # --------------------------------------------------------

    cursor.execute("""
        SELECT AVG(churn_probability)
        FROM predictions
    """)

    average_churn_probability = (
        cursor.fetchone()[0] or 0
    )

    connection.close()

    # --------------------------------------------------------
    # CHURN RATE
    # --------------------------------------------------------

    churn_rate = (
        churn_predictions /
        total_requests
    ) * 100

    # --------------------------------------------------------
    # RETURN METRICS
    # --------------------------------------------------------

    return {

        "total_requests":
            total_requests,

        "average_latency_ms":
            round(
                float(
                    latency_data["average_latency"]
                ),
                2
            ),

        "min_latency_ms":
            round(
                float(
                    latency_data["min_latency"]
                ),
                2
            ),

        "max_latency_ms":
            round(
                float(
                    latency_data["max_latency"]
                ),
                2
            ),

        "churn_predictions":
            churn_predictions,

        "stay_predictions":
            stay_predictions,

        "churn_rate":
            round(
                float(churn_rate),
                2
            ),

        "average_churn_probability":
            round(
                float(
                    average_churn_probability
                ),
                4
            )
    }


# ============================================================
# ANOMALY HISTORY
# ============================================================

@app.get("/anomaly-history")
def anomaly_history():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            id,
            timestamp,
            prediction,
            churn_probability,
            no_churn_probability,
            latency_ms,
            latency_anomaly,
            anomaly_type
        FROM predictions
        WHERE latency_anomaly = 1
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    connection.close()

    # --------------------------------------------------------
    # CONVERT DATABASE ROWS
    # --------------------------------------------------------

    anomalies = []

    for row in rows:

        anomalies.append({

            "id":
                row["id"],

            "timestamp":
                row["timestamp"],

            "prediction":
                row["prediction"],

            "churn_probability":
                row["churn_probability"],

            "no_churn_probability":
                row["no_churn_probability"],

            "latency_ms":
                row["latency_ms"],

            "latency_anomaly":
                bool(row["latency_anomaly"]),

            "anomaly_type":
                row["anomaly_type"]
        })

    return {

        "anomalies":
            anomalies
    }
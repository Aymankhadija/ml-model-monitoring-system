import pandas as pd


LOG_FILE = "backend/prediction_logs.csv"


def get_metrics():

    # Load prediction logs
    df = pd.read_csv(LOG_FILE)


    # If there are no predictions
    if len(df) == 0:

        return {
            "total_requests": 0,
            "churn_predictions": 0,
            "stay_predictions": 0,
            "churn_rate": 0,
            "average_latency_ms": 0,
            "min_latency_ms": 0,
            "max_latency_ms": 0,
            "average_churn_probability": 0
        }


    # Total requests
    total_requests = len(df)


    # Number of churn predictions
    churn_predictions = int(
        (df["prediction"] == 1).sum()
    )


    # Number of stay predictions
    stay_predictions = int(
        (df["prediction"] == 0).sum()
    )


    # Churn rate
    churn_rate = (
        churn_predictions / total_requests
    ) * 100


    # Latency metrics
    average_latency = df["latency_ms"].mean()

    min_latency = df["latency_ms"].min()

    max_latency = df["latency_ms"].max()


    # Average churn probability
    average_churn_probability = (
        df["churn_probability"].mean()
    )


    return {
        "total_requests": total_requests,
        "churn_predictions": churn_predictions,
        "stay_predictions": stay_predictions,
        "churn_rate": round(churn_rate, 2),
        "average_latency_ms": round(average_latency, 2),
        "min_latency_ms": round(min_latency, 2),
        "max_latency_ms": round(max_latency, 2),
        "average_churn_probability": round(
            average_churn_probability, 4
        )
    }
    
if __name__ == "__main__":

    metrics = get_metrics()

    print("\n========== MODEL MONITORING ==========")

    print("Total Requests:", metrics["total_requests"])

    print("Churn Predictions:", metrics["churn_predictions"])

    print("Stay Predictions:", metrics["stay_predictions"])

    print("Churn Rate:", metrics["churn_rate"], "%")

    print(
        "Average Latency:",
        metrics["average_latency_ms"],
        "ms"
    )

    print(
        "Minimum Latency:",
        metrics["min_latency_ms"],
        "ms"
    )

    print(
        "Maximum Latency:",
        metrics["max_latency_ms"],
        "ms"
    )

    print(
        "Average Churn Probability:",
        metrics["average_churn_probability"]
    )
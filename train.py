import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
import joblib

# Load dataset
df = pd.read_csv("data/customer_churn_dataset-testing-master.csv")

# Display first 5 rows
print(df.head())

# Display dataset shape
print("\nDataset shape:")
print(df.shape)

# Display column names
print("\nColumns:")
print(df.columns.tolist())

# Check missing values
print("\nMissing values:")
print(df.isnull().sum())

# Remove CustomerID
df.drop(columns=["CustomerID"], inplace=True)

# Separate features and target
X = df.drop(columns=["Churn"])
y = df["Churn"]

print("\nFeatures (X):")
print(X.head())

print("\nTarget (y):")
print(y.head())

print("\nFeature columns:")
print(X.columns.tolist())

# -----------------------------
# Identify column types
# -----------------------------

categorical_columns = [
    "Gender",
    "Subscription Type",
    "Contract Length"
]

numeric_columns = [
    "Age",
    "Tenure",
    "Usage Frequency",
    "Support Calls",
    "Payment Delay",
    "Total Spend",
    "Last Interaction"
]

print("\nCategorical columns:")
print(categorical_columns)

print("\nNumeric columns:")
print(numeric_columns)


# -----------------------------
# Preprocessing
# -----------------------------

preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            StandardScaler(),
            numeric_columns
        ),
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_columns
        )
    ]
)

print("\nPreprocessing pipeline created successfully.")

# -----------------------------
# Train / Test Split
# -----------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))

# -----------------------------
# Create Logistic Regression
# -----------------------------

model = LogisticRegression(
    max_iter=1000
)

# -----------------------------
# Complete ML Pipeline
# -----------------------------

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ]
)

# -----------------------------
# Train model
# -----------------------------

pipeline.fit(
    X_train,
    y_train
)

print("\nModel training completed!")

# -----------------------------
# Predictions
# -----------------------------

y_pred = pipeline.predict(X_test)

print("\nPredictions generated!")

# -----------------------------
# Model Evaluation
# -----------------------------

accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(y_test, y_pred)

recall = recall_score(y_test, y_pred)

f1 = f1_score(y_test, y_pred)


print("\n========== MODEL PERFORMANCE ==========")

print("Accuracy :", accuracy)
print("Precision:", precision)
print("Recall   :", recall)
print("F1 Score :", f1)

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred
    )
)

# -----------------------------
# Save model
# -----------------------------

joblib.dump(
    pipeline,
    "model/churn_model.pkl"
)

print("\nModel saved successfully!")

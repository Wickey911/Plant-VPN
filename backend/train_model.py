"""Trains PdM models on the 20-year, 10,000-row history and saves them
with joblib for the FastAPI backend to load at startup.

Two models are trained from live sensor + operating features:
  - failure_probability: RandomForestRegressor -> 0..1 risk score
  - rul_days: RandomForestRegressor -> remaining useful life in days

Run with: python train_model.py
"""
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

DATA = Path(__file__).parent / "data"
MODEL_DIR = Path(__file__).parent / "model"
MODEL_DIR.mkdir(exist_ok=True)

df = pd.read_csv(DATA / "PdM_20Y_History.csv")

NUMERIC_FEATURES = [
    "Operating_Hours", "Vibration_mm_s", "Bearing_or_Skin_Temp_C", "Pressure_bar",
    "Flow_m3_hr", "Motor_Current_A", "Energy_kWh", "Corrosion_Rate_mm_yr",
    "Thickness_Loss_mm", "Anomaly_Score", "Atmospheric_Temp_C", "Humidity_pct",
]
CATEGORICAL_FEATURES = ["Equipment_Type", "Asset_Group", "Criticality", "Material_of_Construction"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

data = df.dropna(subset=FEATURES + ["Failure_Probability", "RUL_Days"]).copy()
X = data[FEATURES]

preprocess = ColumnTransformer([
    ("num", "passthrough", NUMERIC_FEATURES),
    ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
])

def build_and_train(target_col, name):
    y = data[target_col]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipe = Pipeline([
        ("prep", preprocess),
        ("model", RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)),
    ])
    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"[{name}] MAE={mae:.3f}  R2={r2:.3f}")
    joblib.dump(pipe, MODEL_DIR / f"{name}.joblib")
    return pipe

build_and_train("Failure_Probability", "failure_probability_model")
build_and_train("RUL_Days", "rul_model")

joblib.dump({"numeric": NUMERIC_FEATURES, "categorical": CATEGORICAL_FEATURES}, MODEL_DIR / "feature_spec.joblib")
print("Saved models to", MODEL_DIR)

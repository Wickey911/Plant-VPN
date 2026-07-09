"""Loads all CSV data and trained models once at process startup."""
import joblib
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
MODEL_DIR = Path(__file__).parent.parent / "model"


class DataStore:
    def __init__(self):
        self.assets = pd.read_csv(DATA_DIR / "Asset_Master.csv")
        self.history = pd.read_csv(DATA_DIR / "PdM_20Y_History.csv", parse_dates=["Event_Date"])
        self.failures = pd.read_csv(DATA_DIR / "Failure_Events.csv")
        self.inspections = pd.read_csv(DATA_DIR / "NDT_Inspection_Plan.csv")
        self.work_orders = pd.read_csv(DATA_DIR / "Maintenance_WorkOrders.csv")
        self.components = pd.read_csv(DATA_DIR / "Component_Register.csv")
        self.instruments = pd.read_csv(DATA_DIR / "Instrument_Index.csv")
        self.pipe_runs = pd.read_csv(DATA_DIR / "Pipe_Run_Register.csv")
        self.asset_types = pd.read_csv(DATA_DIR / "Asset_Type_Catalog.csv")

        self.failure_model = joblib.load(MODEL_DIR / "failure_probability_model.joblib")
        self.rul_model = joblib.load(MODEL_DIR / "rul_model.joblib")
        self.feature_spec = joblib.load(MODEL_DIR / "feature_spec.joblib")


store = DataStore()

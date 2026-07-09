"""One-off script: reads the source Excel workbook and exports clean CSVs
used by the FastAPI backend. Run with: python export_data.py
"""
import pandas as pd
from pathlib import Path

SRC = r"C:\Users\VIGNESH SADHASIVAM\Downloads\Oil_Gas_PdM_AI_Dashboard_Database_20Y_10000_Entries_Final.xlsx"
OUT = Path(__file__).parent / "data"
OUT.mkdir(exist_ok=True)

# sheet_name -> number of rows to skip before the header row
SHEETS = {
    "Asset_Master": 2,
    "PdM_20Y_History": 1,
    "Failure_Events": 2,
    "NDT_Inspection_Plan": 2,
    "Maintenance_WorkOrders": 2,
    "Component_Register": 2,
    "Instrument_Index": 2,
    "Pipe_Run_Register": 2,
    "Asset_Type_Catalog": 2,
}

for sheet, skip in SHEETS.items():
    df = pd.read_excel(SRC, sheet_name=sheet, skiprows=skip)
    df = df.dropna(how="all")
    out_path = OUT / f"{sheet}.csv"
    df.to_csv(out_path, index=False)
    print(f"{sheet}: {len(df)} rows -> {out_path.name}")

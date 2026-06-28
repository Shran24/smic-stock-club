# Starts the FastAPI backend on http://localhost:8000
# First run only: installs dependencies.
Set-Location "$PSScriptRoot\backend"
py -m pip install -r requirements.txt
py -m uvicorn api:app --reload --port 8000

# One-command launcher (production-style, single process).
# Builds the React frontend, then serves the WHOLE app + API from FastAPI
# on http://localhost:8000  ->  open that URL in your browser.
Set-Location "$PSScriptRoot\frontend"
if (-not (Test-Path "node_modules")) { npm install }
npm run build
Set-Location "$PSScriptRoot\backend"
py -m pip install -r requirements.txt
py -m uvicorn api:app --host 127.0.0.1 --port 8000

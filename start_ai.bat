@echo off
cd apps\ai_engine

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Starting AI Engine...
uvicorn main:app --reload --port 8000

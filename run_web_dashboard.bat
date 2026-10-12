@echo off
title University Life Management Survey - Interactive Web Dashboard
color 0A
echo =====================================================================
echo    LAUNCHING INTERACTIVE WEB KPI DASHBOARD (STREAMLIT)
echo =====================================================================
echo.
echo Starting local web server on http://localhost:8501...
echo.

streamlit run app.py

pause

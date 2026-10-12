@echo off
title Survey Data Pipeline - Google Forms to Excel KPI Dashboard
color 0B
echo =====================================================================
echo    SURVEY DATA PIPELINE: GOOGLE FORMS TO EXCEL KPI DASHBOARD
echo =====================================================================
echo.
echo Running ETL pipeline and generating updated KPI Dashboard...
echo.

python pipeline.py --open

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================================
    echo [SUCCESS] Pipeline completed successfully!
    echo Dashboard saved to: output\survey_kpi_dashboard.xlsx
    echo =====================================================================
) else (
    echo.
    echo [ERROR] Pipeline encountered an issue. Please check the logs above.
)

pause

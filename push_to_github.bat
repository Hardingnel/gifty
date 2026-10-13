@echo off
title Push Survey Dashboard to GitHub
color 0B
echo =====================================================================
echo    PUSHING UNIVERSITY LIFE SURVEY DASHBOARD TO GITHUB
echo =====================================================================
echo.
echo Make sure you have created the empty repository at:
echo https://github.com/new (Repository name: university-life-survey)
echo.
pause
echo Pushing code to main branch...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================================
    echo [SUCCESS] Code pushed to GitHub successfully!
    echo Repo URL: https://github.com/Hardingnel/university-life-survey
    echo.
    echo Next step: Go to https://vercel.com/new and click "Import" to deploy!
    echo =====================================================================
) else (
    echo.
    echo [ERROR] Push failed. Please verify that the repository exists on GitHub.
)

pause

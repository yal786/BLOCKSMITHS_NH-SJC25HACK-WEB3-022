@echo off
echo ========================================
echo   Proty Chatbot - Auto Wait and Test
echo ========================================
echo.
echo The API quota was exceeded.
echo Waiting 2 minutes for quota reset...
echo.
echo You can:
echo   1. Wait here (recommended)
echo   2. Get new API key from: https://aistudio.google.com/app/apikey
echo.

timeout /t 120

echo.
echo ========================================
echo   Testing API now...
echo ========================================
echo.

cd backend
node test-gemini-direct.js

echo.
echo ========================================
echo   If test passed, start the servers:
echo ========================================
echo   1. Run: start-backend.bat
echo   2. Run: start-frontend.bat  
echo   3. Open: http://localhost:5173/dashboard
echo   4. Click the chat button
echo.
pause

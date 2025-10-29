@echo off
echo ========================================
echo   Testing Proty FinTech Chatbot
echo ========================================
echo.
echo Make sure backend server is running!
echo (Run start-backend.bat in another window)
echo.
pause
echo.
cd backend
node test-proty.js
pause

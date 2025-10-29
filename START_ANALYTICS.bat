@echo off
echo ========================================
echo   PROTEGO ANALYTICS DASHBOARD
echo   Starting Servers...
echo ========================================
echo.

echo Step 1: Starting Backend Server (Port 4000)...
start "Protego Backend" cmd /k "cd /d C:\Users\yazhini\Protego\backend && npm start"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Step 2: Starting Frontend Server (Port 5173)...
start "Protego Frontend" cmd /k "cd /d C:\Users\yazhini\Protego\frontend && npm run dev"

echo.
echo Waiting 5 seconds for frontend to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   SERVERS STARTED!
echo ========================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173/dashboard
echo.
echo Opening dashboard in browser in 3 seconds...
timeout /t 3 /nobreak >nul

start http://localhost:5173/dashboard

echo.
echo ========================================
echo   INSTRUCTIONS:
echo ========================================
echo.
echo 1. Wait for both server windows to show "running"
echo 2. Browser will open automatically
echo 3. Look for button at TOP of page:
echo    [📈 Show Analytics Dashboard]
echo 4. CLICK that button
echo 5. See 5 beautiful charts! 🎉
echo.
echo Press any key to close this window...
pause >nul

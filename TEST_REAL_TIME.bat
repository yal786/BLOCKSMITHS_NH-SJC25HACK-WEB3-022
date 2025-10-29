@echo off
echo ╔═══════════════════════════════════════════════════════════╗
echo ║     🧪 Testing Protego Real-Time Alerts                  ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo This will:
echo   1. Stop any running backend servers
echo   2. Start the test alert emitter on port 4000
echo   3. Emit test alerts every 5 seconds
echo.
echo INSTRUCTIONS:
echo   1. Open http://localhost:3000/dashboard in your browser
echo   2. Look for "LIVE" status (green) in Live Alerts Feed
echo   3. Watch alerts appear in real-time!
echo   4. Press Ctrl+C here to stop when done
echo.
pause

cd backend
node test-real-time-alert.js

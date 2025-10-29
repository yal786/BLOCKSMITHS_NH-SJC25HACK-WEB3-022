@echo off
echo ========================================
echo   Fixing Port 4000 (EADDRINUSE Error)
echo ========================================
echo.
echo Finding process using port 4000...
netstat -ano | findstr :4000 | findstr LISTENING
echo.
echo Killing process on port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do taskkill /PID %%a /F
echo.
echo ✅ Port 4000 is now free!
echo.
echo You can now run: npm start
echo.
pause

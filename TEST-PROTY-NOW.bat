@echo off
echo ========================================
echo   PROTY PROTEGO ASSISTANT - TEST
echo ========================================
echo.
echo This will run comprehensive tests on:
echo   - Greetings (hi, hello, empty)
echo   - Protego questions
echo   - MEV/Flashbots questions  
echo   - Blockchain questions
echo   - Unrelated questions
echo.
echo Make sure backend is running on port 4000!
echo.
pause
echo.
cd backend
node test-proty-protego.js
echo.
pause

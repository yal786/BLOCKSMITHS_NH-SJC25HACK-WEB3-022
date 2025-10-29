@echo off
echo ====================================
echo UNIQUE TRANSACTIONS - QUICK RUN
echo ====================================
echo.

echo Step 1: Testing Implementation...
cd backend
node test-unique-transactions.js

echo.
echo ====================================
echo Step 2: Starting Backend Server...
echo ====================================
echo.
echo The backend will now start with unique transaction handling.
echo Press Ctrl+C to stop when needed.
echo.

npm start

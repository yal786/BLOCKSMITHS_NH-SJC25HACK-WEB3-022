@echo off
echo ====================================
echo VERIFY UNIQUE TRANSACTIONS
echo ====================================
echo.
echo This will check if unique constraints are working...
echo.

cd backend
node test-unique-transactions.js

echo.
echo ====================================
echo Done! Check results above.
echo ====================================
pause

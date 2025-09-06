@echo off
echo 🚀 Starting Hand Me Up Frontend...
echo.

cd frontend

echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo 🌐 Starting React development server...
echo 📱 Frontend will be available at http://localhost:3000
echo.

call npm start

pause

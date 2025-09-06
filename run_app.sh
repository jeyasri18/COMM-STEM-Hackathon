#!/bin/bash

echo "🚀 Starting Hand Me Up Application..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check if Python 3.11 or 3.12 is available
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
elif command -v python3.12 &> /dev/null; then
    PYTHON_CMD="python3.12"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    echo "❌ Python not found. Please install Python 3.11 or 3.12"
    exit 1
fi

echo "🐍 Using Python: $PYTHON_CMD"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
$PYTHON_CMD -m pip install --upgrade pip
$PYTHON_CMD -m pip install fastapi uvicorn pydantic numpy python-multipart python-dotenv supabase

# Check ports
check_port 8000
check_port 3000

# Start backend in background
echo "🌐 Starting backend server..."
cd backend
$PYTHON_CMD -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "📱 Starting frontend server..."
cd ../frontend

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Start frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 Application is starting!"
echo "📚 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

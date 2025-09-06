#!/usr/bin/env python3
"""
Startup script for the Hand Me Up backend
"""
import subprocess
import sys
import os

def main():
    print("🚀 Starting Hand Me Up Backend...")
    
    # Check if we're in the right directory
    if not os.path.exists('backend/main.py'):
        print("❌ Error: backend/main.py not found. Please run this script from the project root.")
        sys.exit(1)
    
    # Install dependencies if requirements.txt exists
    if os.path.exists('requirements.txt'):
        print("📦 Installing Python dependencies...")
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
        except subprocess.CalledProcessError:
            print("❌ Failed to install dependencies. Please install manually:")
            print("   pip install -r requirements.txt")
            sys.exit(1)
    
    # Start the FastAPI server
    print("🌐 Starting FastAPI server on http://localhost:8000")
    print("📚 API documentation available at http://localhost:8000/docs")
    
    try:
        os.chdir('backend')
        subprocess.run([
            sys.executable, '-m', 'uvicorn', 
            'main:app', 
            '--host', '0.0.0.0', 
            '--port', '8000', 
            '--reload'
        ], check=True)
    except KeyboardInterrupt:
        print("\n👋 Backend server stopped.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start backend server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

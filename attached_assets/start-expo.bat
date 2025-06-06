@echo off
echo Starting SomaliStreamMobile...
cd /d "c:\Users\liiba\Documents\SomaliStreamMobile"
REM Delete node_modules/.cache to ensure clean build
rmdir /s /q "node_modules\.cache" 2>nul
REM Kill any processes that might be using the target port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8087') do (
    taskkill /F /PID %%a 2>nul
)
REM Start Expo with cleared cache on a different port
npx expo start --clear --port 8087
pause

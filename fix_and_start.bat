@echo off
echo ==========================================
echo      TRUCKNET SYSTEM REPAIR TOOL
echo ==========================================
echo.

echo 1. Stopping any lingering Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo 2. Regenerating Database Client...
cd apps/api
call npx --yes prisma@5.22.0 generate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma Client.
    echo Please make sure no other terminals are running the server.
    pause
    exit /b %errorlevel%
)

echo.
echo 2.5. Pushing Schema to DB...
cd apps/api
call npx --yes prisma@5.22.0 db push
if %errorlevel% neq 0 (
    echo [WARNING] Prisma DB Push failed.
)

echo.
echo 3. Creating Admin User...
node create_admin.js
if %errorlevel% neq 0 (
    echo [WARNING] Could not create admin user. It might already exist.
)

echo.
echo.
echo 4. Starting Development Server (Web + API + AI)...
echo.
echo ==========================================
echo   SYSTEM READY! OPENING APP...
echo   Login: admin@trucknet.com / admin123
echo ==========================================
echo.
npm run dev

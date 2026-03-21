@echo off
echo ==========================================
echo Setting up MongoDB Replica Set for TruckNet
echo ==========================================

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Success: Running as Administrator.
) else (
    echo ERROR: Please run this script as Administrator!
    echo Right-click -> Run as Administrator
    pause
    exit
)

:: 1. Create Data Directory
if not exist "C:\data\db" (
    echo Creating C:\data\db...
    mkdir "C:\data\db"
)

:: 2. Stop existing service to free up port 27017
echo Stopping default MongoDB Service...
net stop MongoDB

:: 3. Start MongoDB with Replica Set
echo Starting MongoDB...
start "MongoDB Replica Set" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "C:\data\db" --replSet rs0 --bind_ip 127.0.0.1 --port 27017

echo Waiting for MongoDB to initialize...
timeout /t 10

:: 4. Initiate Replica Set
echo Initiating Replica Set configuration...
"C:\Program Files\MongoDB\Server\8.2\bin\mongosh.exe" --eval "try { rs.initiate() } catch (e) { print(e) }"

echo.
echo ========================================================
echo DONE! MongoDB is running as a Replica Set.
echo IMPORTANT: Keep the new MongoDB window OPEN.
echo You can now run 'npm run dev' in your project.
echo ========================================================
pause

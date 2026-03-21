# TruckNet Setup Guide

Follow these steps to set up and run the application locally.

## Prerequisites
- **Node.js** (Installed)
- **MongoDB Server** (Installed at `C:\Program Files\MongoDB\Server\8.2`)

## Step 1: Start Local Database
The application requires a local MongoDB Replica Set to be running.

1.  Open File Explorer and navigate to the project root: `c:\Users\pbhus\Desktop\Hackathon`
2.  Right-click on **`setup_mongo.bat`** and select **Run as Administrator**.
3.  A new command prompt window will open showing MongoDB logs. **KEEP THIS WINDOW OPEN**.
    *   If you see "Replica Set configuration already initialized" or similar success messages, you are good to go.

## Step 2: Initialize Database Schema
Once the database is running, you need to push the schema to it.

1.  Open a new terminal in VS Code (or Command Prompt) in the project root.
2.  Run the following command:
    ```bash
    npm run prisma:push
    ```
    *   You should see `🚀  Your database is now in sync with your Prisma schema.`

## Step 3: Start the Application
Now you can start the development server.

1.  In the terminal, run:
    ```bash
    npm run dev
    ```
2.  The application will start:
    *   Frontend: [http://localhost:3000](http://localhost:3000)
    *   Backend API: [http://localhost:5000](http://localhost:5000)

## Troubleshooting
- **500 Error on /api/auth/drivers**: This means the API cannot connect to the database. Ensure the MongoDB window from Step 1 is still open and running.
- **Prisma Error P2010**: This usually means the Replica Set is not initialized. Run `setup_mongo.bat` again as Administrator.

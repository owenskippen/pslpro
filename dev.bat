@echo off
echo Starting pslpro dev servers...
echo.
echo Backend server will start on: http://localhost:3000
echo Frontend will start on: http://localhost:5173
echo.
start "pslpro-backend" wsl bash -c "cd '/mnt/c/Users/owens/OneDrive/Documents/Sillyhacks 2026/pslpro' && npm run dev:server"
start "pslpro-frontend" wsl bash -c "cd '/mnt/c/Users/owens/OneDrive/Documents/Sillyhacks 2026/pslpro' && npm run dev:client"

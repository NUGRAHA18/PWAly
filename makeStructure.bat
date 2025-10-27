@echo off
echo ========================================
echo Setup Project Structure
echo ========================================
echo.

REM Create folders
echo Creating folders...
if not exist "src\scripts\data" mkdir "src\scripts\data"
if not exist "src\scripts\models" mkdir "src\scripts\models"
if not exist "src\scripts\presenters" mkdir "src\scripts\presenters"
if not exist "src\scripts\pages\auth" mkdir "src\scripts\pages\auth"
if not exist "src\scripts\pages\add-story" mkdir "src\scripts\pages\add-story"
if not exist "src\scripts\utils" mkdir "src\scripts\utils"
if not exist "src\scripts\components" mkdir "src\scripts\components"

REM Create data files
echo Creating data repository files...
if not exist "src\scripts\data\auth-repository.js" type nul > "src\scripts\data\auth-repository.js"
if not exist "src\scripts\data\story-repository.js" type nul > "src\scripts\data\story-repository.js"

REM Create model files
echo Creating model files...
if not exist "src\scripts\models\auth-model.js" type nul > "src\scripts\models\auth-model.js"
if not exist "src\scripts\models\story-model.js" type nul > "src\scripts\models\story-model.js"

REM Create presenter files
echo Creating presenter files...
if not exist "src\scripts\presenters\auth-presenter.js" type nul > "src\scripts\presenters\auth-presenter.js"
if not exist "src\scripts\presenters\home-presenter.js" type nul > "src\scripts\presenters\home-presenter.js"
if not exist "src\scripts\presenters\add-story-presenter.js" type nul > "src\scripts\presenters\add-story-presenter.js"

REM Create page files
echo Creating page files...
if not exist "src\scripts\pages\auth\login-page.js" type nul > "src\scripts\pages\auth\login-page.js"
if not exist "src\scripts\pages\auth\register-page.js" type nul > "src\scripts\pages\auth\register-page.js"
if not exist "src\scripts\pages\add-story\add-story-page.js" type nul > "src\scripts\pages\add-story\add-story-page.js"

REM Create utility files
echo Creating utility files...
if not exist "src\scripts\utils\camera-handler.js" type nul > "src\scripts\utils\camera-handler.js"
if not exist "src\scripts\utils\map-handler.js" type nul > "src\scripts\utils\map-handler.js"
if not exist "src\scripts\utils\theme-handler.js" type nul > "src\scripts\utils\theme-handler.js"
if not exist "src\scripts\utils\auth-guard.js" type nul > "src\scripts\utils\auth-guard.js"
if not exist "src\scripts\utils\validators.js" type nul > "src\scripts\utils\validators.js"

REM Create component files
echo Creating component files...
if not exist "src\scripts\components\story-card.js" type nul > "src\scripts\components\story-card.js"
if not exist "src\scripts\components\story-list.js" type nul > "src\scripts\components\story-list.js"
if not exist "src\scripts\components\loading-spinner.js" type nul > "src\scripts\components\loading-spinner.js"

REM Create style files
echo Creating style files...
if not exist "src\styles\main.css" type nul > "src\styles\main.css"
if not exist "src\styles\themes.css" type nul > "src\styles\themes.css"
if not exist "src\styles\components.css" type nul > "src\styles\components.css"
if not exist "src\styles\pages.css" type nul > "src\styles\pages.css"
if not exist "src\styles\responsive.css" type nul > "src\styles\responsive.css"

REM Create public files
echo Creating public files...
if not exist "src\public\manifest.json" type nul > "src\public\manifest.json"

REM Create root files
echo Creating root files...
if not exist "STUDENT.txt" type nul > "STUDENT.txt"

echo.
echo ========================================
echo Structure created successfully!
echo ========================================
echo.
echo Next steps:
echo 1. npm install leaflet
echo 2. Run this project with: npm run start-dev
echo.
pause
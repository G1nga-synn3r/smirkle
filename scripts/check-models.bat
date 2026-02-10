@echo off
REM AI Model Diagnostic Script for Smirkle
REM Run this to check if model files are correctly deployed

echo.
echo === AI Model File Check ===
echo.

set "modelsDir=public\models"

if not exist "%modelsDir%" (
    echo ERROR: Models directory not found: %modelsDir%
    exit /b 1
)

echo Checking TinyFaceDetector...
if exist "%modelsDir%\tiny_face_detector_model-weights_manifest.json" (
    for %%I in ("%modelsDir%\tiny_face_detector_model-weights_manifest.json") do if %%~zI GTR 0 (
        echo   OK: tiny_face_detector_model-weights_manifest.json (%%~zI bytes)
    ) else (
        echo   ERROR: tiny_face_detector_model-weights_manifest.json is EMPTY
    )
) else (
    echo   ERROR: tiny_face_detector_model-weights_manifest.json MISSING
)

if exist "%modelsDir%\tiny_face_detector_model-shard1.bin" (
    for %%I in ("%modelsDir%\tiny_face_detector_model-shard1.bin") do if %%~zI GTR 0 (
        echo   OK: tiny_face_detector_model-shard1.bin (%%~zI bytes)
    ) else (
        echo   ERROR: tiny_face_detector_model-shard1.bin is EMPTY
    )
) else (
    echo   ERROR: tiny_face_detector_model-shard1.bin MISSING
)

echo.
echo Checking FaceExpressionNet...
if exist "%modelsDir%\face_expression_model-weights_manifest.json" (
    for %%I in ("%modelsDir%\face_expression_model-weights_manifest.json") do if %%~zI GTR 0 (
        echo   OK: face_expression_model-weights_manifest.json (%%~zI bytes)
    ) else (
        echo   ERROR: face_expression_model-weights_manifest.json is EMPTY
    )
) else (
    echo   ERROR: face_expression_model-weights_manifest.json MISSING
)

if exist "%modelsDir%\face_expression_model-shard1.bin" (
    for %%I in ("%modelsDir%\face_expression_model-shard1.bin") do if %%~zI GTR 0 (
        echo   OK: face_expression_model-shard1.bin (%%~zI bytes)
    ) else (
        echo   ERROR: face_expression_model-shard1.bin is EMPTY
    )
) else (
    echo   ERROR: face_expression_model-shard1.bin MISSING
)

echo.
echo === Model Directory Contents ===
dir /B "%modelsDir%"

echo.
echo === Troubleshooting Tips ===
echo.
echo If models fail to load on Vercel:
echo 1. Ensure public/models/ is committed to git
echo 2. Check .gitignore doesn't exclude models folder
echo 3. Rebuild and redeploy:
echo    npm run build
echo    npx vercel --prod
echo.
echo Open browser console (F12) to see model loading logs.
echo.

pause

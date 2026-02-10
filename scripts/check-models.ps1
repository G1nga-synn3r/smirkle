#!/usr/bin/env pwsh
# AI Model Diagnostic Script for Smirkle
# Run this to check if model files are correctly deployed

$ErrorActionPreference = "Stop"

function Check-ModelFiles {
    Write-Host "`n=== AI Model File Check ===" -ForegroundColor Cyan
    
    $modelsDir = Join-Path (Split-Path -Parent (Get-Location)) "public" "models"
    
    if (-not (Test-Path $modelsDir)) {
        Write-Error "Models directory not found: $modelsDir"
        return
    }
    
    $requiredModels = @(
        @{
            Name = "TinyFaceDetector"
            Files = @(
                "tiny_face_detector_model-weights_manifest.json",
                "tiny_face_detector_model-shard1.bin"
            )
        },
        @{
            Name = "FaceExpressionNet"
            Files = @(
                "face_expression_model-weights_manifest.json",
                "face_expression_model-shard1.bin"
            )
        },
        @{
            Name = "FaceLandmark68Net"
            Files = @(
                "face_landmark_68_model-weights_manifest.json",
                "face_landmark_68_model-shard1.bin"
            )
        }
    )
    
    $allPresent = $true
    
    foreach ($model in $requiredModels) {
        Write-Host "`nChecking $($model.Name)..." -ForegroundColor Yellow
        
        foreach ($file in $model.Files) {
            $filePath = Join-Path $modelsDir $file
            if (Test-Path $filePath) {
                $size = (Get-Item $filePath).Length
                if ($size -gt 0) {
                    Write-Host "  ✓ $file ($size bytes)" -ForegroundColor Green
                } else {
                    Write-Host "  ✗ $file (EMPTY FILE - $size bytes)" -ForegroundColor Red
                    $allPresent = $false
                }
            } else {
                Write-Host "  ✗ $file (MISSING)" -ForegroundColor Red
                $allPresent = $false
            }
        }
    }
    
    Write-Host "`n=== Model Directory Contents ===" -ForegroundColor Cyan
    Get-ChildItem $modelsDir | Format-Table Name, Length
    
    if ($allPresent) {
        Write-Host "`n✓ All model files are present and non-empty" -ForegroundColor Green
    } else {
        Write-Host "`n✗ Some model files are missing or empty" -ForegroundColor Red
    }
    
    return $allPresent
}

function Test-ModelUrls {
    Write-Host "`n=== Testing Model URL Accessibility ===" -ForegroundColor Cyan
    
    $baseUrl = Read-Host "Enter your deployment URL (e.g., https://smirkle.vercel.app)"
    
    if (-not $baseUrl.EndsWith("/")) {
        $baseUrl += "/"
    }
    
    $modelUrls = @(
        "${baseUrl}models/tiny_face_detector_model-weights_manifest.json",
        "${baseUrl}models/tiny_face_detector_model-shard1.bin",
        "${baseUrl}models/face_expression_model-weights_manifest.json",
        "${baseUrl}models/face_expression_model-shard1.bin"
    )
    
    foreach ($url in $modelUrls) {
        try {
            $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10
            Write-Host "✓ $url - Status: $($response.StatusCode)" -ForegroundColor Green
        } catch {
            Write-Host "✗ $url - Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    }
}

function Show-Troubleshooting {
    Write-Host @"

=== Troubleshooting AI Model Loading on Vercel ===

Common Issues:
1. Model files not included in deployment
   - Ensure public/models/ is in your project
   - Check .gitignore doesn't exclude the models folder

2. Large files not deploying
   - Vercel has a 10MB per file limit
   - Models should be under this limit

3. Missing Content-Type headers
   - .bin files need application/octet-stream
   - .json files need application/json

Quick Fix Commands:
```powershell
# Rebuild and redeploy
npm run build
npx vercel --prod

# Or check Vercel configuration
vercel inspect <deployment-url>
```

For more help, check the browser console for specific 404 URLs.

"@ -ForegroundColor White
}

# Main execution
Write-Host "Smirkle AI Model Diagnostic Tool" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$action = Read-Host "`nChoose action:
1. Check local model files
2. Test model URL accessibility
3. Show troubleshooting guide
4. All of the above

Enter choice (1-4)"

switch ($action) {
    "1" { Check-ModelFiles }
    "2" { Test-ModelUrls }
    "3" { Show-Troubleshooting }
    "4" { 
        Check-ModelFiles
        Test-ModelUrls
        Show-Troubleshooting
    }
    default { 
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

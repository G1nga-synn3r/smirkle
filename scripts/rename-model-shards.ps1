<#
.SYNOPSIS
    Renames face-api.js model shard files to include .bin extension and updates manifest JSON files.

.DESCRIPTION
    This script:
    1. Renames shard files from <model>-shard1 to <model>-shard1.bin
    2. Updates the corresponding manifest JSON file's "paths" array to reference the new .bin filename
    3. Verifies the manifest files have been updated correctly

.NOTES
    Run this script from the project root directory.
    PowerShell 5.1 or later required.
#>

$ErrorActionPreference = "Stop"

# Configuration
$ModelsFolder = "public/models"
$Models = @(
    @{
        Name = "face_expression_model"
        Manifest = "face_expression_model-weights_manifest.json"
    },
    @{
        Name = "face_landmark_68_model"
        Manifest = "face_landmark_68_model-weights_manifest.json"
    },
    @{
        Name = "tiny_face_detector_model"
        Manifest = "tiny_face_detector_model-weights_manifest.json"
    }
)

# Color output helper
function Write-ColoredOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColoredOutput "========================================" -Color "Cyan"
Write-ColoredOutput "Model Shard Renaming Script" -Color "Cyan"
Write-ColoredOutput "========================================" -Color "Cyan"
Write-Host ""

# Step 1: Rename shard files
Write-ColoredOutput "Step 1: Renaming shard files..." -Color "Yellow"
Write-Host ""

foreach ($model in $Models) {
    $modelName = $model.Name
    $oldShardName = "$modelName-shard1"
    $newShardName = "$modelName-shard1.bin"
    $oldPath = Join-Path $ModelsFolder $oldShardName
    $newPath = Join-Path $ModelsFolder $newShardName

    # Check if old file exists (without .bin)
    if (Test-Path $oldPath) {
        Write-ColoredOutput "  Renaming: $oldShardName -> $newShardName" -Color "Green"
        Rename-Item -Path $oldPath -NewName $newShardName -ErrorAction Stop
        Write-ColoredOutput "  ✓ Successfully renamed" -Color "Green"
    }
    # Check if new file already exists
    elseif (Test-Path $newPath) {
        Write-ColoredOutput "  $newShardName already has .bin extension (skipped)" -Color "Gray"
    }
    else {
        Write-ColoredOutput "  ⚠ Warning: Neither $oldShardName nor $newShardName found" -Color "DarkYellow"
    }
}

Write-Host ""

# Step 2: Update manifest JSON files
Write-ColoredOutput "Step 2: Updating manifest JSON files..." -Color "Yellow"
Write-Host ""

foreach ($model in $Models) {
    $manifestName = $model.Manifest
    $manifestPath = Join-Path $ModelsFolder $manifestName
    $modelName = $model.Name
    $oldShardReference = "$modelName-shard1"
    $newShardReference = "$modelName-shard1.bin"

    if (Test-Path $manifestPath) {
        Write-ColoredOutput "  Processing: $manifestName" -Color "Green"

        # Read the manifest file
        $jsonContent = Get-Content -Path $manifestPath -Raw -ErrorAction Stop
        $manifestData = $jsonContent | ConvertFrom-Json

        # Update the paths array
        $updated = $false
        for ($i = 0; $i -lt $manifestData.paths.Count; $i++) {
            $currentPath = $manifestData.paths[$i]
            if ($currentPath -eq $oldShardReference) {
                $manifestData.paths[$i] = $newShardReference
                $updated = $true
                Write-ColoredOutput "    Updated path: $oldShardReference -> $newShardReference" -Color "Cyan"
            }
            elseif ($currentPath -eq $newShardReference) {
                Write-ColoredOutput "    Path already correct: $newShardReference" -Color "Gray"
            }
        }

        # Write updated manifest if changes were made
        if ($updated) {
            $manifestData | ConvertTo-Json -Depth 10 | Set-Content -Path $manifestPath -ErrorAction Stop
            Write-ColoredOutput "    ✓ Manifest updated successfully" -Color "Green"
        }
    }
    else {
        Write-ColoredOutput "  ⚠ Warning: Manifest not found: $manifestPath" -Color "DarkYellow"
    }
}

Write-Host ""

# Step 3: Verification
Write-ColoredOutput "Step 3: Verifying manifest updates..." -Color "Yellow"
Write-Host ""

$verificationPassed = $true

foreach ($model in $Models) {
    $manifestName = $model.Manifest
    $manifestPath = Join-Path $ModelsFolder $manifestName
    $modelName = $model.Name
    $expectedShardName = "$modelName-shard1.bin"
    $shardPath = Join-Path $ModelsFolder $expectedShardName

    Write-ColoredOutput "  Verifying: $modelName" -Color "White"

    # Check if shard file exists
    if (Test-Path $shardPath) {
        Write-ColoredOutput "    ✓ Shard file exists: $expectedShardName" -Color "Green"
    }
    else {
        Write-ColoredOutput "    ✗ Shard file missing: $expectedShardName" -Color "Red"
        $verificationPassed = $false
    }

    # Check if manifest exists and has correct reference
    if (Test-Path $manifestPath) {
        $jsonContent = Get-Content -Path $manifestPath -Raw -ErrorAction Stop
        $manifestData = $jsonContent | ConvertFrom-Json

        $foundCorrectPath = $false
        foreach ($path in $manifestData.paths) {
            if ($path -eq $expectedShardName) {
                $foundCorrectPath = $true
                break
            }
        }

        if ($foundCorrectPath) {
            Write-ColoredOutput "    ✓ Manifest references correct shard: $expectedShardName" -Color "Green"
        }
        else {
            Write-ColoredOutput "    ✗ Manifest does NOT reference: $expectedShardName" -Color "Red"
            Write-ColoredOutput "      Current paths: $($manifestData.paths -join ', ')" -Color "DarkYellow"
            $verificationPassed = $false
        }
    }
    else {
        Write-ColoredOutput "    ✗ Manifest file missing: $manifestName" -Color "Red"
        $verificationPassed = $false
    }
}

Write-Host ""
Write-ColoredOutput "========================================" -Color "Cyan"

if ($verificationPassed) {
    Write-ColoredOutput "✓ All verifications passed!" -Color "Green"
    Write-ColoredOutput "Model shard renaming completed successfully." -Color "Green"
}
else {
    Write-ColoredOutput "✗ Some verifications failed!" -Color "Red"
    Write-ColoredOutput "Please review the output above for details." -Color "Red"
    exit 1
}

Write-ColoredOutput "========================================" -Color "Cyan"

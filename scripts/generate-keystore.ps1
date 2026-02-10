# PowerShell helper to generate an Android signing keystore
# Run this command in PowerShell (modify path and alias as needed):
# .\scripts\generate-keystore.ps1 -OutPath C:\path\to\smirkle-release.jks -Alias smirkle_key

param(
  [Parameter(Mandatory=$true)]
  [string]$OutPath,
  [Parameter(Mandatory=$false)]
  [string]$Alias = "smirkle_key"
)

$keytool = "keytool"

Write-Host "Generating keystore at: $OutPath"
& $keytool -genkey -v -keystore $OutPath -alias $Alias -keyalg RSA -keysize 2048 -validity 10000

Write-Host "Keystore generation complete. Keep this file and passwords secure."
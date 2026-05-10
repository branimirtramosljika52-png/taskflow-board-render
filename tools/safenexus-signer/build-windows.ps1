param(
  [string]$ProjectDir = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

Push-Location $ProjectDir
try {
  mvn -q -DskipTests package
  $jar = Get-ChildItem -Path ".\target" -Filter "*.jar" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $jar) {
    throw "JAR nije pronađen u target folderu."
  }

  if (Test-Path ".\dist") {
    Remove-Item -LiteralPath ".\dist" -Recurse -Force
  }
  New-Item -ItemType Directory -Path ".\dist" | Out-Null

  jpackage `
    --type app-image `
    --name SafeNexusSigner `
    --dest ".\dist" `
    --input ".\target" `
    --main-jar $jar.Name

  Write-Host "SafeNexus Signer app image: $ProjectDir\dist\SafeNexusSigner"
} finally {
  Pop-Location
}

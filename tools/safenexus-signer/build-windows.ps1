param(
  [string]$ProjectDir = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

Push-Location $ProjectDir
try {
  mvn -q -DskipTests package
  $jar = Get-ChildItem -Path ".\target" -Filter "*.jar" |
    Where-Object { $_.Name -notlike "original-*" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (-not $jar) {
    throw "JAR nije pronađen u target folderu."
  }

  if (Test-Path ".\dist") {
    Remove-Item -LiteralPath ".\dist" -Recurse -Force
  }
  New-Item -ItemType Directory -Path ".\dist" | Out-Null

  jpackage `
    --type app-image `
    --name PDFSigner `
    --dest ".\dist" `
    --input ".\target" `
    --main-jar $jar.Name `
    --main-class hr.sign.NativeMessagingMain

  Write-Host "SafeNexus PDF Signer app image: $ProjectDir\dist\PDFSigner"
} finally {
  Pop-Location
}

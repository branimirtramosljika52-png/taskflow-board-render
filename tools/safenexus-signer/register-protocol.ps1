param(
  [Parameter(Mandatory = $true)]
  [string]$ExePath
)

$resolvedExe = (Resolve-Path -LiteralPath $ExePath).Path
$protocolRoot = "HKCU:\Software\Classes\safenexus-signer"

New-Item -Path $protocolRoot -Force | Out-Null
New-ItemProperty -Path $protocolRoot -Name "(default)" -Value "URL:SafeNexus Signer" -PropertyType String -Force | Out-Null
New-ItemProperty -Path $protocolRoot -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null

New-Item -Path "$protocolRoot\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "$protocolRoot\shell\open\command" -Name "(default)" -Value "`"$resolvedExe`" `"%1`""

Write-Host "Registered safenexus-signer:// to $resolvedExe"

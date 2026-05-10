# SafeNexus Signer bridge

Lokalni bridge je potreban za kvalificirani FINA/eOI potpis jer Certilia middleware, PKCS#11 driver, kartica/token i PIN postoje na korisnikovom Windows računalu, ne na DigitalOcean serveru.

## Flow

1. SafeNexus web app u modulu `Operations -> Signatures` kreira jednokratni potpisni paket.
2. Browser otvara `safenexus-signer://sign?...`.
3. Windows pokrene lokalni `SafeNexusSigner.exe`.
4. Bridge preuzme PDF-ove iz SafeNexusa u privremenu mapu.
5. Bridge pokrene postojeći `PotpisPDF.exe` s tom mapom kao argumentom.
6. `PotpisPDF.exe` koristi lokalni Certilia/PKCS#11 i pita PIN samo jednom za batch.
7. Bridge pronađe `_Signed.pdf` datoteke i vrati ih u SafeNexus Documents.

DigitalOcean nikada ne dobiva PIN i ne pristupa lokalnom tokenu.

## Lokalna konfiguracija

Prvi start napravi:

`%APPDATA%\SafeNexusSigner\config.properties`

Zadana vrijednost je:

```properties
engine.exe=C:/Users/Branimir/IdeaProjects/PdfSignerDSS/dist/PotpisPDF/PotpisPDF.exe
keep.workdir=false
```

Ako se postojeći signer premjesti, promijeni samo `engine.exe`.

## Build

```powershell
.\build-windows.ps1
```

Nakon builda registriraj custom protocol:

```powershell
.\register-protocol.ps1 -ExePath ".\dist\SafeNexusSigner\SafeNexusSigner.exe"
```

Ako želiš koristiti postojeći ručno buildani app image, registriraj njegov `SafeNexusSigner.exe`, ne `PotpisPDF.exe`. `PotpisPDF.exe` ostaje potpisni engine iza bridgea.

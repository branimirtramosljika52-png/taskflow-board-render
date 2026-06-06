# SafeNexus Android

Prvi mobilni MVP za SafeNexus: login i pregled radnih naloga preko produkcijskog SafeNexus API-ja.

## Sto je unutra

- Native Android aplikacija u Kotlinu i Jetpack Composeu.
- Login preko `POST /api/auth/login`.
- Pregled RN-ova preko `GET /api/bootstrap`.
- Filteri: svi, aktivni, kasne, zatvoreni.
- Pretraga po RN broju, klijentu, lokaciji, statusu, usluzi i opisu.
- Detalj RN-a s klijentom, lokacijom, kontaktom, datumima, opisom i izvrsiteljima.

## Build

```powershell
cd android-app
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat :app:assembleDebug
```

Debug APK:

```text
android-app/app/build/outputs/apk/debug/app-debug.apk
```

## API

Default baza je:

```text
https://taskflow-board-do-cai56.ondigitalocean.app
```

Vrijednost je definirana u `app/build.gradle.kts` kroz `SAFE_NEXUS_BASE_URL`.

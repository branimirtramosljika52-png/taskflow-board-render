# SafeNexus Signer bridge

Lokalni potpisni bridge je potreban za kvalificirani digitalni potpis jer FINA/eOI token i PIN postoje na korisnikovom Windows računalu, ne na DigitalOcean serveru.

## Arhitektura

1. SafeNexus web app pripremi PDF i prikaže ga u modulu `Operations -> Signatures`.
2. Korisnik klikne `Otvori lokalni signer`.
3. Browser otvara custom protocol `safenexus-signer://open?origin=https%3A%2F%2Fsafe-nexus.org`.
4. Windows pokrene lokalni SafeNexus Signer EXE.
5. Signer učita PDF iz SafeNexusa, koristi lokalni PKCS#11 token i PIN, potpiše PDF i vrati novu verziju u Documents.
6. Web app osvježi `Signatures` i `Documents`; status postaje `Potpisano`.

## Zašto ne direktno na DigitalOceanu

DigitalOcean nema pristup lokalnom FINA/eOI tokenu, certifikatu, middlewareu ni PIN dijalogu. Potpisivanje zato mora biti lokalno, a server smije samo pripremiti i spremiti dokument.

## Lokalni endpointi

Predviđeni local bridge radi na:

- `http://127.0.0.1:9137/health`
- `http://127.0.0.1:9137/sign`

Web aplikacija ne šalje PIN serveru. PIN unosi korisnik u lokalnom EXE prozoru.

## Sljedeći build korak

Postojeći Java iText/PKCS#11 kod treba upakirati kao Windows app-image/EXE pomoću `jpackage`, zatim registrirati custom protocol:

```powershell
jpackage --type app-image --name SafeNexusSigner --input target --main-jar safenexus-signer.jar --main-class hr.sign.SafeNexusSigner
```

Nakon toga installer treba dodati registry key za `safenexus-signer://`.

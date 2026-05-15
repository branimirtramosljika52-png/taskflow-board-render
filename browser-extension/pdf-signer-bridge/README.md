# SafeNexus PDF Signer Bridge MVP

Ovo je Chrome Manifest V3 skeleton koji prosljedjuje SafeNexus zahtjev za potpis lokalnom Native Messaging hostu `hr.abeceda.pdfsigner`.

## Instalacija za lokalni test

1. Otvori `chrome://extensions`.
2. Ukljuci Developer mode.
3. Klikni `Load unpacked`.
4. Odaberi folder `browser-extension/pdf-signer-bridge`.
5. Extension ID mora odgovarati vrijednosti u `pdf-signer.config.json`.
6. Ako Chrome dodijeli novi ID, promijeni samo `pdf-signer.config.json` i pokreni `npm run signer:sync-config`.

## Native host

1. U `pdf-signer.config.json` po potrebi promijeni `nativeHostPath`.
2. Pokreni `npm run signer:sync-config`.
3. Pokreni `register-native-host.bat`.

Za MVP mock mozes testirati Java klasu `hr.sign.NativeMessagingMain` prije izrade pravog `.exe`.

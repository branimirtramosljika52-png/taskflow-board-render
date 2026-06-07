# SafeNexus Android - plan prosirenja

## Zakljucak analize

Postojeca Android aplikacija nije Flutter nego native Kotlin + Jetpack Compose aplikacija. Vec ima login, pamcenje sesije, biometrijsku prijavu, prikaz radnih naloga i Leaflet kartu u WebViewu. Zbog toga prosirenje treba nastaviti u postojecoj Android arhitekturi, bez izrade nove aplikacije od nule.

Backend je postojeci SafeNexus Node sustav sa scoped snapshot logikom, autentifikacijom, organizacijskim ovlastima i MySQL/memory repository slojem. Web aplikacija vec ima poslovnu logiku za radne naloge, vozila, rezervacije, zapisnike, periodiku, tvrtke, lokacije, osposobljavanja i klijentski portal.

## Postojeci Android projekt

- Projekt: `android-app`
- UI: Jetpack Compose + Material 3
- Auth: `POST /api/auth/login`
- Mobilni RN endpoint: `GET /api/mobile/work-orders`
- Web snapshot endpoint: `GET /api/bootstrap`
- Session: `mobileAccessToken` + SafeNexus auth cookies
- Trenutni lokalni modeli: `SafeNexusUser`, `BootstrapData`, `WorkOrder`, `CoordinatePoint`
- Trenutni ekrani: login, RN lista, RN detalj, karta radnih naloga

## Postojeci backend API-ji

### Autentifikacija

- `GET /api/auth/session`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/profile/avatar`

### Mobilni API

- `GET /api/mobile/work-orders`
- `GET /api/mobile/android-apk`

### Radni nalozi

- `GET /api/bootstrap`
- `POST /api/work-orders`
- `PATCH /api/work-orders/:id`
- `DELETE /api/work-orders/:id`
- `POST /api/work-orders/batch-update`
- `GET /api/work-orders/:id/activity`
- `POST /api/work-orders/:id/activity`
- `POST /api/work-orders/:id/export-pdf`
- `POST /api/work-orders/:id/save-pdf`
- `GET /api/work-orders/:id/pdf`
- `GET /api/work-orders/:id/documents`
- `POST /api/work-orders/:id/documents`
- `GET /api/work-orders/:id/documents/:documentId/download`
- `PATCH /api/work-orders/:id/documents/:documentId`
- `DELETE /api/work-orders/:id/documents/:documentId`

### Vozila i rezervacije

- `POST /api/vehicles`
- `PATCH /api/vehicles/:id`
- `DELETE /api/vehicles/:id`
- `POST /api/vehicles/:id/reservations`
- `PATCH /api/vehicles/:id/reservations/:reservationId`
- `DELETE /api/vehicles/:id/reservations/:reservationId`
- `POST /api/vehicles/notification-settings`

### Zapisnici i dokumenti

- `GET /api/document-records`
- `POST /api/document-records`
- `POST /api/document-templates`
- `PATCH /api/document-templates/:id`
- `DELETE /api/document-templates/:id`
- `POST /api/document-templates/:id/export-pdf`
- `POST /api/document-templates/export-pdf-batch`
- `POST /api/document-templates/convert-word-html`
- `POST /api/signature-bridge/jobs`
- `GET /api/signature-bridge/jobs/:token`
- `GET /api/signature-bridge/jobs/:token/items/:id/download`
- `POST /api/signature-bridge/jobs/:token/items/:id/signed`

### Osposobljavanja i klijentski portal

- `GET /api/people-training-records/import-template`
- `POST /api/people-training-records/import`
- `POST /api/people-training-records`
- `PATCH /api/people-training-records/:id`
- `DELETE /api/people-training-records/:id`
- `POST /api/people-training-records/:id/generate-documents`
- `GET /api/client-portal/access-import-template`
- `POST /api/client-portal/access-import`
- `POST /api/client-portal-records`
- `PATCH /api/client-portal-records/:id`
- `DELETE /api/client-portal-records/:id`

### Tvrtke, lokacije, periodika i katalog

- `POST /api/companies`
- `PATCH /api/companies/:id`
- `DELETE /api/companies/:id`
- `POST /api/locations`
- `PATCH /api/locations/:id`
- `DELETE /api/locations/:id`
- `POST /api/location-objects`
- `POST /api/periodics/visual-settings`
- `POST /api/service-catalog`
- `PATCH /api/service-catalog/:id`
- `DELETE /api/service-catalog/:id`

## Vazna poslovna napomena

Trenutni backend statusi radnih naloga su:

- `Otvoreni RN`
- `Gotov RN`
- `Ovjeren RN`
- `Fakturiran RN`
- `Storno RN`

Mobilna aplikacija koristi iste statuse i istu poslovnu logiku kao web aplikacija. Ne uvode se novi statusi i ne mijenja se backend status model. U UI-ju se statusi mogu prikazati kompaktnije kroz chipove i boje, ali vrijednosti koje se spremaju ostaju postojece backend vrijednosti.

## Predlozeni novi mobile API sloj

Dodati lagani mobilni bootstrap umjesto da Android vuce cijeli web snapshot:

- `GET /api/mobile/bootstrap`
  - user
  - permissions
  - option lists
  - workOrders
  - companies
  - locations
  - vehicles
  - vehicleReservations
  - documentRecords
  - peopleTrainingRecords
  - clientPortalRecords
  - rulebooks
  - periodics summary

Dodati mobilne akcijske endpointe gdje je bolje imati uzi payload:

- `PATCH /api/mobile/work-orders/:id/status`
- `GET /api/mobile/work-orders/:id`
- `GET /api/mobile/calendar`
- `GET /api/mobile/map/work-orders`
- `POST /api/mobile/push-tokens`
- `DELETE /api/mobile/push-tokens/:id`

Za dokumente, vozila, osposobljavanja i klijentski portal koristiti postojece API-je gdje su vec dovoljno jasni.

## Plan ekrana

### Operativa

- Pocetni dashboard s danasnjim RN-ovima, kasnjenjima, najblizim rokovima i rezervacijama vozila.
- Brze akcije: novi RN, promjena statusa, poziv kontaktu, navigacija, preuzimanje PDF-a.

### Radni nalozi

- Lista RN-ova.
- Napredna pretraga.
- Filteri po statusu, tvrtki, lokaciji, usluzi, izvrsitelju, prioritetu, datumu.
- Grupiranje po statusu, datumu, tvrtki, lokaciji ili izvrsitelju.
- Detalj RN-a sa svim povezanim podacima.
- Promjena statusa iz liste, detalja, karte i kalendara.

### Karta

- Interaktivna karta s markerima po statusu.
- Klik na marker otvara bottom sheet s RN brojem, tvrtkom, lokacijom, statusom i akcijama.
- Akcije: otvori RN, promijeni status, navigacija do lokacije.

### Kalendar

- Dnevni, tjedni i mjesecni prikaz.
- Dogadjaji: RN, rezervacije vozila, periodika, osposobljavanja.
- Klik na dogadjaj otvara detalj i dozvoljene akcije.

### Vozila

- Lista vozila s pretragom i filtrima.
- Detalj vozila: marka, model, registracija, godina, tvrtka, lokacija, kilometraza, status i napomene.
- Kilometraza: unos, povijest i graf.
- Servisi: ulje, gume, klima, registracija, tehnicki, tekucine, ostalo.
- Rezervacije: izrada, uredjivanje, otkazivanje i kalendar zauzetosti.

### Zapisnici

- Pregled, pretraga i filtriranje.
- Izrada i uredjivanje kroz mobilno prilagodjeni obrazac.
- PDF pregled i preuzimanje.
- Potpisivanje preko postojece signature bridge logike.

### Periodika

- Lista periodike, statusi, pretraga i filteri.
- Kalendar periodike.
- Detalj s povezanim RN-ovima, tvrtkom i lokacijom.

### Tvrtke i lokacije

- Popis tvrtki i lokacija.
- Detalj tvrtke: kontakti, lokacije, dokumentacija, povezani RN-ovi.
- Detalj lokacije: RN, periodika, vozila, dokumenti.

### Klijentski portal

- Temeljna dokumentacija.
- Zapisnici.
- Periodika.
- Osposobljavanja.
- PDF dokumenti.
- Obavijesti.
- Upload uvjerenja i dokumenata gdje web vec dopusta unos.

### Osposobljavanja

- Lista po zaposleniku, tvrtki, radnom mjestu, datumu i statusu.
- Detalj zaposlenika/osposobljavanja.
- Uvjerenja, vrijedi do, lijecnicki pregled, pregled vida, psiholoska provjera i povezani dokumenti.

## Navigacija

Telefon:

- Bottom navigation:
  - RN
  - Karta
  - Kalendar
  - Vozila
  - Vise

Tablet:

- NavigationRail ili stalni bocni izbornik.
- Master-detail prikaz za RN, vozila, tvrtke i lokacije.

Vise:

- Zapisnici
- Periodika
- Tvrtke
- Lokacije
- Osposobljavanja
- Klijentski portal
- Obavijesti
- Postavke

## Lokalni modeli i baza

Server ostaje izvor istine. Za mobilni cache preporuka je Room + DataStore:

- `SessionEntity`
- `WorkOrderEntity`
- `CompanyEntity`
- `LocationEntity`
- `VehicleEntity`
- `VehicleReservationEntity`
- `DocumentRecordEntity`
- `TrainingRecordEntity`
- `ClientPortalRecordEntity`
- `NotificationEntity`
- `SyncQueueEntity`

Session token i cookie treba prebaciti iz obicnog SharedPreferences u EncryptedSharedPreferences ili Jetpack Security/DataStore kombinaciju.

## UX poboljsanja

- Material 3 tema s light/dark varijantom.
- Status chipovi u konzistentnim bojama.
- Sticky pretraga i filteri na listama.
- Quick actions na karticama.
- Bottom sheet za promjenu statusa.
- Offline indikator i optimistic update s rollbackom.
- Na karti koristiti bottom sheet umjesto sitnog popupa za mobitel.
- Na tabletu koristiti split view, ne samo uvecani mobitel.
- Svi tekstovi na hrvatskom jeziku i latinici.

## Redoslijed implementacije

### Faza 1 - mobilna osnova

- Dodati `GET /api/mobile/bootstrap`.
- Prosiriti Android modele.
- Dodati centralni repository.
- Uvesti sigurniji session storage.
- Koristiti postojece RN statuse i permission logiku iz web aplikacije.
- Omoguciti promjenu statusa RN-a iz liste, detalja i karte.

### Faza 2 - RN karta i kalendar

- Mobilni map payload sa status bojama.
- Bottom sheet na marker.
- Navigacija prema lokaciji.
- Kalendar dan/tjedan/mjesec.

### Faza 3 - vozila i rezervacije

- Lista i detalj vozila.
- Rezervacije vozila.
- Kilometraza, servisi, napomene.
- Kalendar zauzetosti.

### Faza 4 - zapisnici i dokumenti

- Lista zapisnika.
- PDF pregled i download.
- Mobilno potpisivanje kroz postojeci signature bridge.

### Faza 5 - periodika, osposobljavanja i klijentski portal

- Periodika lista/kalendar.
- Osposobljavanja s uvjerenjima i rokovima.
- Klijentski portal s dokumentacijom i uploadom.

### Faza 6 - push notifikacije i offline

- FCM device token registracija.
- Backend notification queue.
- Push za nove RN-ove, statuse, periodiku, osposobljavanja, registracije, servise i rezervacije.
- Offline cache i sync queue za terenski rad.

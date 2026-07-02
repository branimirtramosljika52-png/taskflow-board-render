# CISTA.xlsm - detaljna mapa usluga i predlozaka

Izvor: `C:\Users\Branimir\Desktop\Ispitivanja\123\Cista velika\CISTA.xlsm`

Workbook sadrzi 78 sheetova. Centralni katalog usluga i perioda nalazi se u sheetu `00`. Dio sheetova je skriven, ali sadrzi korisne predloske i strukture.

## 1. Glavni zakljucak

Ovaj Excel nije jedan predlozak nego cijela biblioteka zapisnika. U Safe Nexus ga treba preslikati kao skup native predlozaka po uslugama.

Predlozi nisu svi istog tipa:

- **Gridline predlosci**: imaju jasne ispitne tablice s kolonama i redovima.
- **Checklist predlosci**: imaju stavke pregleda s DA/NE/Zadovoljava.
- **Rich-text predlosci**: imaju duge opisne blokove, rezultate pregleda i zakljucke.
- **Hybrid predlosci**: kombiniraju osnovne podatke, tekst, checklist i jednu ili vise tablica.

## 2. Katalog usluga iz sheeta `00`

| Sifra | Naziv / znacenje | Tip predloska | Period iz Excela |
|---|---|---|---|
| `EIZ` | Ispitivanje elektricnih instalacija | gridline + checklist + tekst | 48 mj. u ovom primjeru |
| `EMM` | Povezanost metalnih masa | gridline | nema popunjen period |
| `SPR` | Sigurnosna/protupanicna rasvjeta | gridline | 12 mj. |
| `SZOM` | Sustav zastite od djelovanja munje - mjerenje | gridline + tekst | 24 mj. |
| `SZOMV` | Vizualni pregled sustava zastite od djelovanja munje | checklist + tekst | 12 mj. |
| `TZIN` | Tipkalo za isklop elektricne instalacije | gridline | 12 mj. |
| `VS` | Sustav ventilacije | gridline + tekst | 36 mj. |
| `VES` | Vjezba evakuacije i spasavanja | tekst + mala mjerenja | 24 mj. |
| `SVZ` | Stabilni sustav za dojavu pozara | rich-text + checklist | 12 mj. |
| `SP` | Sustav detekcije zapaljivih plinova | rich-text + checklist | nema popunjen period |
| `HM` / `HMU` / `HMV` / `HMUV` | Hidrantska mreza | gridline + checklist | 12 mj. |
| `SGP` | Sustav za gasenje pozara plinom | rich-text + checklist | nema popunjen period |
| `PJENA` | Sustav za gasenje pozara pjenom | rich-text + checklist | nema popunjen period |
| `SS` | Sprinkler sustav | rich-text + checklist | nema popunjen period |
| `PPV` | Protupozarna vrata | gridline + checklist | nema popunjen period |
| `PPZ` | Protupozarne zaklopke | gridline + checklist | nema popunjen period |
| `SO` | Sustav za odvodjenje dima i topline | rich-text + checklist | nema popunjen period |
| `PZ` | Vatrootporne zavjese | rich-text + checklist | nema popunjen period |
| `DS` | Drencher/deluge sustav za hladjenje spremnika vodom | gridline + tekst | nema popunjen period |
| `ExEi` | Elektricne instalacije u Ex podrucju | vise gridline tablica | 36 mj. |
| `ExSe` | Uzemljenje i staticki elektricitet u Ex podrucju | gridline | 6 mj. |
| `ExOv` | Funkcionalno ispitivanje odzracnih ventila | rich-text + checklist | 24 mj. |
| `NPI` | Nepropusnost i ispravnost plinske instalacije | tablice + checklist + tekst | nema popunjen period |
| `UNP` | Nepropusnost i ispravnost UNP instalacije | tablice + checklist + tekst | nema popunjen period |
| `STROJEVI` | Radna oprema / strojevi | poseban model + checklist | vidi radnu opremu |
| `PE` | Plan evakuacije | rich-text dokument | nema standardni period |
| `NNZD` | Negativni nalaz tehnickih ispitivanja | tekstualni dokument | nema standardni period |
| `NNZDPETROL` | Petrol negativni nalaz / pregled nesukladnosti | tekstualni dokument | nema standardni period |
| `EOTP` | Evidencija/ostali tehnicki podaci | tekstualni dokument | nema standardni period |

Napomena: u katalogu se pojavljuju jos `ROG`, `RO`, `EMV` i `Analizator Ulja STP`, ali u workbooku nisu jednako jasno razradjeni kao gore navedeni predlosci.

## 3. Preporuceni Safe Nexus model

Svaki native predlozak treba imati:

| Polje | Opis |
|---|---|
| `serviceCode` | npr. `EIZ`, `SZOMV`, `ExEi` |
| `serviceName` | puni naziv usluge |
| `documentTitle` | naslov zapisnika/uvjerenja |
| `category` | Elektro, Ex, Pozar, Plin, Radni okolis, Radna oprema |
| `defaultValidityMonths` | period ako postoji |
| `signatureArea` | elektro, pozar, plin, strojevi, znr |
| `basicFields` | zajednicka polja zapisnika |
| `technicalFields` | tehnicki podaci sustava/opreme |
| `richTextBlocks` | opis sustava, rezultati, nedostaci, preporuke |
| `measurementTables` | gridline tablice |
| `checklists` | DA/NE/Zadovoljava stavke |
| `assessmentItems` | ocjena rezultata ispitivanja |
| `attachments` | prilozi na kraju zapisnika |

Prioritet povlacenja podataka:

1. Prethodni zapisnik iste sifre usluge i iste lokacije/objekta.
2. Stariji prethodni zapisnik iste sifre usluge.
3. Template/default vrijednosti.
4. Prazno ako nema izvora.

## 4. Zajednicka polja za sve zapisnike

### Osnovni podaci

| Polje | Tip |
|---|---|
| Broj RN | text |
| Broj zapisnika | text |
| Interni broj dokumenta | text |
| Vrsta ispitivanja | select: Periodicno / Prvo / Izvanredno |
| Datum ispitivanja | date |
| Datum izdavanja | date |
| Vrijedi do | date |
| Period vazenja | number/months |

### Tvrtka i lokacija

| Polje | Tip |
|---|---|
| Narucitelj / tvrtka | company reference + text override |
| OIB | text |
| Sjediste | text |
| Korisnik prostora | text |
| Lokacija | location reference |
| Mjesto ispitivanja | text |
| Objekt ispitivanja | object dropdown, default samo objekti lokacije |

### Osobe

| Polje | Tip |
|---|---|
| Ispitivaci | people multi-select |
| Odgovorna osoba / nositelj ovlastenja | people select |
| Odgovorna osoba narucitelja | contact/person |
| Potpisno podrucje | elektro/pozar/plin/znr/strojevi |

### Dokumentacija

| Polje | Tip |
|---|---|
| Primijenjeni propisi | rich-text/list |
| Koristena dokumentacija | rich-text/list |
| Mjerna i ispitna oprema | equipment multi-select |
| Prethodni zapisnik | previous-record reference |
| Prilozi | file list: PDF, JPG, PNG, scan, kamera |

### Zakljucak

| Polje | Tip |
|---|---|
| Nedostaci | rich-text |
| Preporuke | rich-text |
| Ocjena po stavkama | select/checklist |
| Zakljucna ocjena | select: Zadovoljava / Ne zadovoljava / Nije moguce utvrditi |

## 5. Elektro predlosci

### 5.1 `EIZ` - Ispitivanje elektricnih instalacija

Sheetovi: `EIZ1.1`, `EIZ1.2`, `EIZ1.3`, `EIZ1.4`, `EIZ1.5`, `EIZ1.6`, `EIZ1.7`

Tip: hybrid, vise gridline tablica.

#### Tehnicki podaci

| Polje |
|---|
| Sustav mreze |
| Napon/frekvencija |
| Vrsta zastite |
| Zastitni uredaji |
| Jednopolna shema / opis razvoda |
| Projektna dokumentacija |

#### EIZ tablice

**Vizualni pregled instalacije**  
Preporuka: checklist, ne gridline.

| Polje | Tip |
|---|---|
| Stavka pregleda | text |
| Vrijednost | DA/NE/NP |
| Napomena | text |

**ZUDS / RCD**

| Kolona |
|---|
| R.br. |
| Razdjelnik |
| Strujni krug |
| In [A] |
| `/` |
| IΔn [mA] |
| Iisk [mA] |
| tisk [ms] |
| U0 [V] |
| Iisk < IΔn / tisk < tdoz |

**Impedancija petlje kvara**

| Kolona |
|---|
| R.br. |
| Mjerno mjesto |
| Oznaka strujnog kruga |
| Zastitni uredaj diferencijalne struje / nadstrujni zastitni uredaj |
| Tip i karakteristika |
| IΔn / Ia [A] |
| td [s] |
| Z(L-PE) [Ω] |
| Izem [A] |
| Z(L-N) [Ω] |
| Z(L-L) [Ω] |
| U0 [V] |
| Zadovoljava |

**Otpor izolacije**

| Kolona |
|---|
| R.br. |
| Oznaka strujnog kruga |
| Vrsta vodica |
| L1-L2-L3 [MΩ] |
| L1-L2-L3-N [MΩ] |
| L1-L2-L3-PE [MΩ] |
| N-PE [MΩ] |
| Doz. otpor izolacije Rd [MΩ] |
| Riso > Rd |

**Kontinuitet zastitnog vodica**

| Kolona |
|---|
| R.br. |
| Mjerno mjesto 1 |
| Mjerno mjesto 2 |
| Ispitna struja [A] |
| Izmjereni otpor [Ω] |
| Doz. otpor [Ω] |
| Zadovoljava |
| Napomena |

#### Ocjena rezultata

| Stavka |
|---|
| Zastita od direktnog dodira dijelova pod naponom |
| Zastita od indirektnog dodira |
| Otpor izolacije vodova |
| Povezanost metalnih masa |
| Kontinuitet zastitnog vodica |
| Ispitivanje ZUDS nazivnom i rastucom strujom kvara |

### 5.2 `EMM` - Povezanost metalnih masa

Sheetovi: `EMM1.1`, `EMM1.2`, `EMM1.3`

| Kolona |
|---|
| R.br. |
| Ispitno mjesto 1 |
| Ispitno mjesto 2 |
| Iisp [A] |
| Rizm [Ω] |
| R [Ω] |
| Rizm ~ R DA/NE |

### 5.3 `SPR` - Sigurnosna/protupanicna rasvjeta

Sheetovi: `SPR1.1`, `SPR1.2`, `SPR1.3`

| Kolona |
|---|
| R.br. |
| Mjesto ispitivanja |
| Broj lampi |
| Ei [lux] |
| Eimin [lux] |
| Zadovoljava |

### 5.4 `SZOM` - Sustav zastite od djelovanja munje

Sheetovi: `SZOM1.1`, `SZOM1.2`, `SZOM1.3`

Tehnicki podaci:

| Polje |
|---|
| Razina zastite sustava |
| Razdoblje izmedju pregleda |
| Razdoblje izmedju ispitivanja i mjerenja |
| Razdoblje izmedju pregleda kriticnih dijelova |
| Otpor tla |
| Stanje tla |

Gridline:

| Kolona |
|---|
| R.br. |
| Mjerno mjesto |
| Riz |
| Rdop |
| Skriveni spojevi |
| Riz2 |
| Rdop2 |
| Elektricna povezanost metalnih masa |
| Riz3 |
| Rdop3 |
| Zadovoljava |

### 5.5 `SZOMV` - Vizualni pregled sustava zastite od munje

Sheet: `SZOMV1.1`

Tip: checklist.

Stavke:

| Grupa | Stavke |
|---|---|
| Hvataljke | vrsta hvataljki, stanje vodica, stanje spojeva |
| Odvodi | stanje vodica odvoda, mehanicka ostecenja, spoj na uzemljenje |
| Mjerni spojevi | stanje mjernih spojeva, dostupnost, oznake |
| Uzemljenje | vidljivi spojevi, korozija, ostecenja |
| Prenaponska zastita | ostecen/proradio, osigurac proradio |
| Izjednacenje potencijala | stanje spojeva, dostupnost, napomena |

Kolone checklist modela:

| Kolona |
|---|
| Grupa |
| Stavka |
| Odgovor: DA/NE/NP |
| Napomena |
| Zadovoljava |

### 5.6 `TZIN` - Tipkalo za isklop elektricne instalacije

Sheetovi: `TZIN1.1`, `TZIN1.2`, `TZIN1.3`

| Kolona |
|---|
| R.br. |
| Mjesto ispitivanja |
| Broj tipkala |
| Tip tipkala |
| Zadovoljava |

## 6. Ex predlosci

### 6.1 `ExEi` - Elektricne instalacije u eksplozivnoj atmosferi

Sheetovi: `ExEi1.1` do `ExEi1.10`

Tip: vise gridline tablica.

Tablice:

**Impedancija petlje kvara Ex**

| Kolona |
|---|
| Oznaka strujnog kruga / el. uredjaja |
| Zastitni uredjaj |
| Tip i karakteristika |
| Ia |
| td [s] |
| Z(L-PE) [Ω] |
| Izem [A] |
| Z(L-N) [Ω] |
| Ik1min [A] |
| Z(L-L) [Ω] |
| Ik2min [A] |
| U0 |
| Ikmin >= 3/2xIa |
| Zadovoljava |

**Otpor izolacije Ex**

| Kolona |
|---|
| R.br. |
| Oznaka strujnog kruga |
| L1-L2-L3 [MΩ] |
| L1-L2-L3-N [MΩ] |
| L1-L2-L3-PE [MΩ] |
| N-PE [MΩ] |
| Min. doz. otpor Rd [MΩ] |
| Riso > Rd |

**ZUDS Ex**

| Kolona |
|---|
| R.br. |
| Razdjelnik |
| Strujni krug |
| In [A] |
| `/` |
| IΔn [mA] |
| Iisk [mA] |
| tisk [ms] |
| U0 [V] |
| DA/NE |

**Kontinuitet dodatnog PE vodica**

| Kolona |
|---|
| R.br. |
| S [mm2] |
| Ispitno mjesto 1 |
| Ispitno mjesto 2 |
| Iisp [A] |
| Rizm [Ω] |
| Rocek [Ω] |
| Rizm ~ Rocek |

**Ex motori/oprema**

| Kolona |
|---|
| Mjerni uredjaj / tvornički broj agregata |
| Proizvodjac / tip |
| Tvornicki broj motora |
| Vrsta zastite / certifikat |
| In |
| I L1 |
| I L2 |
| I L3 |
| R1 |
| R2 |
| R3 |
| Riso PE-1 |
| Riso PE-2 |
| Riso PE-3 |
| Ocjene DA/NE |

**Bimetal `e` i `d`**

| Kolona |
|---|
| R.br. |
| Broj strujnog kruga |
| Tip i radno podrucje zastitnog uredjaja |
| In |
| Ip |
| IA/In |
| tE |
| Iis [A] |
| tisk |
| Zadovoljava |

### 6.2 `ExSe` - Uzemljenje i staticki elektricitet

Sheetovi: `ExSe1.1`, `ExSe1.2`, `ExSe1.3`, `ExSe1.4`

| Kolona |
|---|
| R.br. |
| Mjerno mjesto |
| Otpor uzemljenja [Ω] |
| Otpor cijevi [kΩ] |
| Elektrostaticko polje [kV/m] |
| Dozvoljeni otpor [Ω/MΩ] |
| Ocjena ispravnosti |
| Napomena |

### 6.3 `ExOv` - Funkcionalno ispitivanje odzracnih ventila

Sheet: `ExOv1.1`

Polja:

| Polje |
|---|
| Goriva / spremnici |
| Mjerna metoda |
| Opis funkcionalnog ispitivanja |
| Vizualni pregled obavili |
| Funkcionalnost odzracnih ventila |
| Nedostaci |
| Preporuke |
| Zakljucna ocjena |

## 7. Ventilacija i radni okolis

### 7.1 `VS`, `PPCAFFE`, `PZP` - Sustav ventilacije

Sheetovi:

- `VS1.1`, `VS1.2`, `VS1.3`
- `PPCAFFE1.1`, `PPCAFFE1.2`, `PPCAFFE1.3`
- `PZP1.1`, `PZP1.2`, `PZP1.3`

Sva tri koriste istu osnovnu gridline strukturu:

| Kolona |
|---|
| Prostor |
| Efektivni volumen |
| Vrsta otvora |
| Povrsina otvora |
| Brzina strujanja |
| Protok |
| Volumni protok |
| Potrebni protok |
| Broj izmjena |
| Trazeni broj izmjena |
| Podtlak/Nadtlak |
| Zadovoljava |

Razlika je u objektu/podrucju primjene:

| Sifra | Primjena |
|---|---|
| `VS` | opci sustav ventilacije |
| `PPCAFFE` | ventilacija caffe bara |
| `PZP` | ventilacija prostora za pusace |

### 7.2 `RO-F` - Fizikalni cimbenici radnog okolisa

Sheetovi: `RO-F.1`, `RO-F.2`, `RO-F.3`

Osnovna polja:

| Polje |
|---|
| Broj RN |
| Broj internog dokumenta |
| Tvrtka/narucitelj |
| OIB |
| Mjesto ispitivanja |
| Lokacija IS ZNR |
| Vanjska temperatura |
| Relativna vlaznost |
| Brzina strujanja |
| Vrijeme / vanjski uvjeti |
| Mjerna oprema |
| Vrste obavljenih ispitivanja |

Prostori:

| Kolona |
|---|
| Oznaka prostora |
| Naziv |
| Opis prostorija i prostora s opisom namjene |
| Opis radnih procesa |
| Popis i opis radne opreme |
| Zakljucne ocjene po stetnosti |

Mjerenja:

| Kolona |
|---|
| Prostor/prostorija |
| Mjerno mjesto |
| Izmjereno opce osvjetljenje [lx] |
| Propisano osvjetljenje [lx] |
| Ekvivalentna razina buke [dB] |
| Dopustena razina buke [dB] |
| Izmjerena temperatura zraka [°C] |
| Dopustena temperatura zraka [°C] |
| Izmjerena brzina strujanja zraka [m/s] |
| Dopustena brzina strujanja zraka [m/s] |
| Izmjerena relativna vlaznost zraka [%] |
| Preporucena relativna vlaznost zraka [%] |
| DA/NE |

### 7.3 `RO-K` - Kemijski cimbenici radnog okolisa

Sheetovi: `RO-K.1`, `RO-K.2`, `RO-K.3`

Prostori:

| Kolona |
|---|
| Oznaka prostora |
| Naziv |
| Opis prostorija i prostora s opisom namjene |
| Opis radnih procesa |
| Popis i opis radne opreme |

Mjerenja:

| Kolona |
|---|
| Prostor/prostorija |
| Mjerno mjesto |
| Opis MM |
| Stetnost |
| Mjerna jedinica |
| Izmjereno |
| Izracunato u odnosu na 8 sati |
| GVI |
| KGVI |
| Napomena |
| DA/NE |

## 8. Pozarni sustavi

### 8.1 `SVZ` - Stabilni sustav za dojavu pozara

Sheet: `SVZ1.1`

Polja:

| Polje |
|---|
| Predmet zastite / opis prostora |
| Centrala: proizvodjac, tip |
| Detektori: proizvodjac, tip, broj |
| Sirene: proizvodjac, tip |
| Sustavi u sprezi |
| Ukupan broj elemenata |
| Mjerna oprema |
| Rezultati pregleda i ispitivanja |
| Nedostaci |
| Preporuke |
| Stabilni sustav za dojavu pozara - ocjena |

### 8.2 `SP` - Sustav detekcije zapaljivih plinova

Sheet: `SP1.1`

Polja:

| Polje |
|---|
| Centralni uredjaj: proizvodjac, tip, tehnicki podaci |
| Detektori plina |
| Ukupan broj elemenata |
| Rezultati pregleda |
| Nedostaci |
| Preporuke |
| Ocjena sustava |

### 8.3 `HMU`, `HMV`, `HMUV` - Hidrantska mreza

Sheetovi: `HMU1.1`, `HMV1.1`, `HMUV1.1`

Tablica pregleda hidranata:

| Kolona |
|---|
| Redni broj |
| Mjesto ugradnje |
| Br. hidr. |
| Oznacenost |
| Oprema |
| Dostupnost |
| Funkcionalnost |

Tablica mjerenja:

| Kolona |
|---|
| Hidrantska mreza |
| Otvoreno mlaznica |
| Staticki tlak pstat [bar] |
| Dinamicki tlak pdin [bar] |
| Promjer mlaznice [mm] |
| Protok po mlaznici Qm [l/min] |
| Ukupni protok Quk [l/min] |

### 8.4 `SGP`, `SS`, `PJENA`, `SO`, `PZ`

Ovi predlosci su vecinom rich-text + checklist. Treba ih raditi jednim zajednickim modelom "stabilni sustavi zastite od pozara".

Zajednicka polja:

| Polje |
|---|
| Predmet ispitivanja |
| Opis sustava |
| Projektna dokumentacija |
| Prethodni zapisnik |
| Mjerna oprema |
| Rezultati pregleda i ispitivanja |
| Nedostaci |
| Preporuke |
| Ocjena izvedenog stanja prema dokumentaciji |
| Ocjena funkcionalnosti |
| Zakljucak |

Specificne ocjene:

| Sifra | Ocjene |
|---|---|
| `SGP` | Stabilni sustav za gasenje pozara plinom |
| `SS` | Pregled izvedenog stanja, sprinkler sustav |
| `PJENA` | Pregled izvedenog stanja, sustav za gasenje pjenom |
| `SO` | Pregled izvedenog stanja, svi dijelovi sustava ispravno funkcioniraju |
| `PZ` | Pregled izvedenog stanja, svi dijelovi sustava ispravno funkcioniraju |

### 8.5 `PPV` - Protupozarna vrata

Sheet: `PPV1.1`

Gridline:

| Kolona |
|---|
| Broj |
| Tip PP vrata |
| Tv. br. |
| Mjesto ugradnje |
| Zadovoljava |

Ocjene:

| Stavka |
|---|
| Pregled izvedenog stanja prema projektnoj dokumentaciji |
| Svi dijelovi sustava ispravno funkcioniraju |
| Veza sustava vatrootpornih vrata sa sustavom za dojavu pozara |

### 8.6 `PPZ` - Protupozarne zaklopke

Sheet: `PPZ1.1`

Excel ima osnovnu tablicu:

| Kolona |
|---|
| Broj |
| Oznaka |
| Dimenzije |
| Serijski broj |

Za Safe Nexus bih dodao jos:

| Dodatna kolona |
|---|
| Mjesto ugradnje |
| Tip/pogon |
| Funkcionalnost |
| Veza sa sustavom dojave |
| Zadovoljava |
| Napomena |

### 8.7 `DS` - Drencher / hladjenje spremnika vodom

Sheet: `DS1.1`

Tablica:

| Kolona |
|---|
| Sustav za gasenje i hladjenje vodom |
| Otvoreno mlaznica |
| Staticki tlak pstat [bar] |
| Dinamicki tlak pdin [bar] |
| Promjer mlaznice [mm] |
| Protok po mlaznici Qm [l/min] |
| Ukupni protok Quk [l/min] |
| Potreban protok [l/min] |

Ocjene:

| Stavka |
|---|
| Pregled izvedenog stanja prema projektnoj dokumentaciji |
| Drencher sustav - funkcionalnost |

## 9. Plin

### 9.1 `PlinskaKotlovnica`

Sheet: `PlinskaKotlovnica.1`

Tip: veliki checklist za kotlovnicu.

Grupe:

| Grupa |
|---|
| Kotlovnica - gradjevinski objekt |
| Tehnicke mjere zastite |
| Plinska instalacija |
| Kotlovsko postrojenje |
| Uredjaji za ukljucivanje/iskljucivanje/upravljanje |
| Radni i sigurnosni elementi |
| Signalni i mjerni uredjaji |
| Smjestaj i osiguranje prostora |
| Zastita od rotirajucih dijelova |
| Odvodjenje produkata izgaranja |
| Osvijetljenost i buka |
| Ventilacija prostora |
| Oprema za pocetno gasenje pozara |
| Pisane upute, sheme, oznake |
| Promjene nastale uporabom |
| Elektricna instalacija kotlovnice |

Checklist kolone:

| Kolona |
|---|
| Grupa |
| Stavka |
| Odgovor DA/NE/NP |
| Ocjena grupe |
| Napomena |

### 9.2 `NPI` - Nepropusnost i ispravnost plinske instalacije

Sheet: `NPI1.1`

Polja:

| Polje |
|---|
| Proizvodjac plinomjera |
| Tip i velicina plinomjera |
| Tvornicki broj |
| Godina proizvodnje |
| Stanje plinomjera [m3] |
| Plomba na plinomjeru |
| Sustav za daljinsko ocitanje |
| Tlačni razred instalacije |
| Napomena ispitivanja |

Tablica volumena instalacije:

| Kolona |
|---|
| Dim |
| L |
| k |
| Vol. |
| Volumen instalacije [l] |

Tablica tlačne probe:

| Kolona |
|---|
| Ocitanje |
| Vrijeme [hh:mm] |
| Ispitni tlak [mbar] |

Ocjena plinske instalacije:

| Stavka |
|---|
| Vizualni pregled cjelokupne plinske instalacije |
| Provjera nepropusnosti spojeva oko glavnog zapora |
| Provjera nepropusnosti razvodnog cjevovoda |
| Provjera nepropusnosti spojeva oko plinomjera |
| Provjera nepropusnosti oko regulatora |
| Provjera nepropusnosti oko manometara |
| Provjera cjevovoda za plinska trosila |
| Provjera sigurnosnih, zastitnih i regulacijskih uredjaja |

Plinsko trosilo:

| Polje |
|---|
| Proizvodjac |
| Tip |
| Serijski broj trosila |
| Ucin |
| Nacin odvoda produkata izgaranja |
| Vrsta trosila |
| Prikljucak plina |
| Osiguranje od nestasice plina |
| Servisni zapisnik |
| Dimnjacarski nalaz |

Prostor plinskog trosila:

| Polje |
|---|
| Naziv prostorije |
| Lokacija prostorije u gradjevini |
| Vanjska vrata i prozor |
| Volumen prostorije [m3] |
| Broj plinskih trosila |
| Instalirana snaga [kW] |
| Vatrogasni aparat |
| Prisilna ventilacija |
| Zapor za plin ispred prostorije |
| Unutarnja hidrantska mreza |
| Sustav plinodetekcije |

### 9.3 `UNP`

Sheet: `UNP1.1`

Ista struktura kao `NPI`, ali za UNP instalaciju. Treba koristiti isti template engine uz drugaciji naziv i propise.

## 10. Radna oprema / strojevi

Sheetovi: `RadnaOprema`, `STROJEVI.1`, `STROJEVI.2`

Ovo treba biti zaseban modul/predlozak jer je struktura drugacija od klasicnih zapisnika.

### 10.1 Osnovna polja

| Polje |
|---|
| Broj radnog naloga |
| Broj internog dokumenta |
| Tvrtka/narucitelj |
| OIB |
| Mjesto ispitivanja |
| Lokacija IS ZNR |
| ID radne opreme |
| Broj zapisnika |

### 10.2 Podaci o radnoj opremi

| Polje |
|---|
| Naziv radne opreme |
| Proizvodjac |
| Tip/model |
| Serijski broj |
| Inventarni broj |
| Dodatni podaci |
| Tehnicki podaci |
| Namjena radne opreme |
| Pozicija radne opreme |
| Radne tvari i sirovine |
| Dokumentacija |

### 10.3 Podaci o ispitivanju

| Polje |
|---|
| Datum pocetka ispitivanja |
| Datum zavrsetka ispitivanja |
| Vrijedi do |
| Zadovoljava DA/NE |
| Napomena za iduce ispitivanje |
| Utvrdjeni nedostaci |
| Mjere za otklanjanje |
| Ispitivac 1/2/3 |
| Nositelj ovlastenja 1/2 |

### 10.4 Checklist stavke radne opreme

Excel koristi parove `Stavka` + `Zakljucak`. U Safe Nexus to treba biti normalizirana tablica:

| Kolona |
|---|
| Redni broj |
| Kategorija |
| Stavka |
| Nalaz/opis |
| Zakljucak DA/NE/NP |
| Napomena |
| AI uputa |
| Zakljucano |

Primjeri stavki iz workbooka:

| Stavka |
|---|
| Zastita od pokretnih dijelova - pogonski mehanizam |
| Nacin postavljanja / osiguranje stabilnosti |
| Promjene nastale uporabom |
| Ostvarivanje gibanja i djelovanja stroja i uredjaja |
| Djelovanje signalnih uredjaja |
| Djelovanje uredjaja za upravljanje |
| Djelovanje uredjaja za ukljucivanje i iskljucivanje |
| Zastita od povrata napona |
| Zastita od pokretnih dijelova - prijenosnici snage i gibanja |
| Zastita od pokretnih dijelova - radni elementi |
| Otpor izolacije |

### 10.5 Implementacija radne opreme

Preporuka:

- Jedan zapisnik po opremi.
- Mogucnost batch izrade iz RN-a za vise komada opreme.
- Svaka oprema ima svoj tab/blok u Android wizardu.
- Checklist stavke vuku se iz vrste opreme/templatea.
- AI moze popuniti stavke, ali zakljucane stavke se ne mogu mijenjati u zapisniku.

## 11. Ostali dokumenti

### `VES` - Vjezba evakuacije i spasavanja

Polja:

| Polje |
|---|
| Objekt |
| Opis provedbe vjezbe |
| Broj osoba |
| Vrijeme napustanja objekta [s] |
| Zborno mjesto |
| Voditelj/zamjenik |
| Zakljucak |

### `PE` - Plan evakuacije

Tip: rich-text dokument.

Treba imati:

- osnovne podatke objekta,
- popis sustava koji postoje na lokaciji,
- evakuacijske smjerove,
- zborno mjesto,
- osobe zaduzene za evakuaciju,
- priloge/skice.

### `NNZD` i `NNZDPETROL`

Tip: negativni nalaz.

Polja:

| Polje |
|---|
| Mjesto ispitivanja |
| Datum |
| Broj zapisnika |
| Naziv ispitivanja |
| Nesukladnost |
| Sto treba otkloniti |
| Napomena / SAP Fiori prijava |

## 12. Preporuceni redoslijed implementacije

### Faza 1 - vec blizu postojeceg modela

1. `EIZ`
2. `SPR`
3. `SZOM`
4. `SZOMV`
5. `TZIN`
6. `VES`

Razlog: vec imamo slican native dokumentacijski flow, gridline, Android wizard i PDF export.

### Faza 2 - Ex

1. `ExSe`
2. `ExOv`
3. `ExEi`

Razlog: `ExSe` je jednostavan gridline, `ExOv` je tekst/checklist, `ExEi` je najveci i ima vise tablica.

### Faza 3 - Pozarni sustavi

1. `HMU/HMV/HMUV`
2. `SVZ`
3. `PPV`
4. `PPZ`
5. `DS`
6. `SP`, `SGP`, `SS`, `PJENA`, `SO`, `PZ`

Razlog: hidrantska mreza i PPV/PPZ imaju jasne tablice; ostali su vise tekstualni i mogu dijeliti isti model.

### Faza 4 - Plin

1. `NPI`
2. `UNP`
3. `PlinskaKotlovnica`

Razlog: NPI/UNP dijele model; kotlovnica je veliki checklist.

### Faza 5 - Radni okolis i radna oprema

1. `RO-F`
2. `RO-K`
3. `STROJEVI` / `RadnaOprema`

Razlog: ovo zahtijeva posebne entitete: prostori, stetnosti, oprema, IS ZNR polja i batch zapisnici.

## 13. UX preporuka za Safe Nexus

### Web

- U Izradi dokumentacije prikazati usluge kao tabove po RN-u.
- Svaki tab prikazuje izvor podataka: `prethodni zapisnik`, `stariji zapisnik`, `template`.
- Gridline tablice uvijek pune sirinu ekrana.
- Rich-text blokovi moraju podrzati copy/paste iz Worda i slike.
- Svaka gridline tablica ima toggle `Koristi se u zapisniku`.
- Svaka kolona ima:
  - AI uputu,
  - lock,
  - tip podatka,
  - formula/default,
  - vidljivost u PDF-u.

### Android

- Osnovno ostaje prvi tab.
- Svaka usluga ide u svoj tab: `EIZ`, `SPR`, `SZOM`, `SZOMV`, `TZIN`, itd.
- Zajednicki blokovi poput mjerne opreme i osoba ne smiju se duplicirati unutar svake tablice ako vec postoje gore u osnovnom flowu.
- Gridline tablice moraju imati fullscreen landscape mode.
- Prilozi moraju biti izvan kolapsirajuceg headera i imati `+` akciju za kamera/scan/upload.

## 14. Tehnicki kriteriji spremanja templatea

Spremanje templatea mora sacuvati:

- vrijednosti celija,
- formule,
- format broja,
- font,
- boje,
- obrube,
- merge,
- sirine kolona,
- visine redova,
- horizontalno i vertikalno poravnanje,
- hidden/locked kolone,
- AI upute po koloni,
- `usesInReport` toggle,
- redoslijed tablica,
- rich-text s Word paste formatiranjem,
- priloge i pravila priloga.

To mora vrijediti za web i Android runtime.


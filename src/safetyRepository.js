import mysql from "mysql2/promise";

import {
  createCompany,
  createLocation,
  createWorkOrder,
  syncLocationFieldsFromWorkOrder,
  updateCompany,
  updateLocation,
  updateWorkOrder,
} from "./safetyModel.js";
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  createPasswordHash,
  hashStoredToken,
  verifyPassword,
} from "./webAuth.js";

function normalizeTimestamp(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeDateOnly(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function parseMySqlConnectionString(connectionString) {
  const url = new URL(connectionString);
  const rawSslMode = url.searchParams.get("ssl-mode") ?? url.searchParams.get("sslmode") ?? "";
  const sslMode = rawSslMode.toLowerCase();
  const shouldUseSsl = sslMode !== "disable";

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4",
    timezone: "Z",
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
  };
}

function getDatabaseKind() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    return "memory";
  }

  if (connectionString.startsWith("mysql://")) {
    return "mysql";
  }

  return "memory";
}

function normalizeActiveValue(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "" || raw === "aktivno" || raw === "da" || raw === "true" || raw === "1";
}

function activeLabel(value) {
  return value ? "Aktivno" : "Neaktivno";
}

function dbString(value) {
  return String(value ?? "").trim();
}

function parseNullableDecimal(value) {
  const raw = dbString(value).replace(",", ".");

  if (!raw) {
    return null;
  }

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

function locationCompositeKey(oib, name) {
  return `${dbString(oib)}::${dbString(name).toLowerCase()}`;
}

function sanitizeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    username: row.korisnicko_ime,
    fullName: row.ime_prezime ?? row.korisnicko_ime,
    role: row.razina_prava ?? "korisnik",
  };
}

async function fetchSnapshotFromConnection(connection) {
  const [companyRows] = await connection.query(`
    SELECT id, naziv_tvrtke, sjediste, oib, vrsta_ugovora, broj_ugovora, periodika,
           aktivno, predstavnik_korisnika, kontakt_broj, kontakt_email, napomena,
           datum_izmjene, izmjenu_unio
    FROM firme
    ORDER BY naziv_tvrtke ASC
  `);

  const companies = companyRows.map((row) => ({
    id: String(row.id),
    name: row.naziv_tvrtke,
    headquarters: row.sjediste ?? "",
    oib: row.oib ?? "",
    contractType: row.vrsta_ugovora ?? "",
    contractNumber: row.broj_ugovora ?? "",
    period: row.periodika ?? "",
    isActive: normalizeActiveValue(row.aktivno),
    representative: row.predstavnik_korisnika ?? "",
    contactPhone: row.kontakt_broj ?? "",
    contactEmail: row.kontakt_email ?? "",
    note: row.napomena ?? "",
    createdAt: normalizeTimestamp(row.datum_izmjene),
    updatedAt: normalizeTimestamp(row.datum_izmjene),
    updatedBy: row.izmjenu_unio ?? "",
  }));

  const companiesByOib = new Map(companies.map((company) => [company.oib, company]));

  const [locationRows] = await connection.query(`
    SELECT id, firma_oib, lokacija, kontakt_osoba, kontakt_osoba2, kontakt_osoba3,
           kontakt_broj, kontakt_broj2, kontakt_broj3,
           kontakt_email, kontakt_email2, kontakt_email3,
           koordinate, regija, aktivno, vrijeme_promjene, korisnik,
           naziv_tvrtke, sjediste, periodika, predstavnik_korisnika, napomena
    FROM lokacije
    ORDER BY naziv_tvrtke ASC, lokacija ASC
  `);

  const locations = locationRows.map((row) => {
    const company = companiesByOib.get(row.firma_oib ?? "");

    return {
      id: String(row.id),
      companyId: company?.id ?? `oib:${row.firma_oib ?? ""}`,
      name: row.lokacija ?? "",
      isActive: normalizeActiveValue(row.aktivno),
      period: row.periodika ?? "",
      representative: row.predstavnik_korisnika ?? "",
      coordinates: row.koordinate ?? "",
      region: row.regija ?? "",
      note: row.napomena ?? "",
      contactName1: row.kontakt_osoba ?? "",
      contactPhone1: row.kontakt_broj ?? "",
      contactEmail1: row.kontakt_email ?? "",
      contactName2: row.kontakt_osoba2 ?? "",
      contactPhone2: row.kontakt_broj2 ?? "",
      contactEmail2: row.kontakt_email2 ?? "",
      contactName3: row.kontakt_osoba3 ?? "",
      contactPhone3: row.kontakt_broj3 ?? "",
      contactEmail3: row.kontakt_email3 ?? "",
      createdAt: normalizeTimestamp(row.vrijeme_promjene),
      updatedAt: normalizeTimestamp(row.vrijeme_promjene),
      companyOib: row.firma_oib ?? "",
      companyName: row.naziv_tvrtke ?? company?.name ?? "",
      headquarters: row.sjediste ?? company?.headquarters ?? "",
    };
  });

  const locationsByKey = new Map(
    locations.map((location) => [
      locationCompositeKey(location.companyOib, location.name),
      location,
    ]),
  );

  const [workOrderRows] = await connection.query(`
    SELECT id, broj_rn, datum_rn, ime_tvrtke, sjediste, oib, veza_rn, lokacija, prioritet,
           kontakt_osoba, kontakt_broj, kontakt_email, rok_zavrsetka, izvrsitelj_rn1,
           izvrsitelj_rn2, tagovi, status_rn, napomena_faktura, godina_rn, redni_broj,
           odjel, koordinate, usluge, opis, regija, datum_fakturiranja, tezina, rn_zavrsio
    FROM radni_nalozi
    ORDER BY datum_rn DESC, id DESC
  `);

  const workOrders = workOrderRows.map((row) => {
    const company = companiesByOib.get(row.oib ?? "");
    const location = locationsByKey.get(locationCompositeKey(row.oib ?? "", row.lokacija ?? ""));

    return {
      id: String(row.id),
      workOrderNumber: row.broj_rn,
      status: row.status_rn ?? "Otvoreni RN",
      openedDate: normalizeDateOnly(row.datum_rn),
      dueDate: normalizeDateOnly(row.rok_zavrsetka),
      invoiceNote: row.napomena_faktura ?? "",
      invoiceDate: normalizeDateOnly(row.datum_fakturiranja),
      weight: row.tezina === null || row.tezina === undefined ? "" : String(row.tezina),
      completedBy: row.rn_zavrsio ?? "",
      description: row.opis ?? "",
      companyId: company?.id ?? `oib:${row.oib ?? ""}`,
      companyName: row.ime_tvrtke ?? company?.name ?? "",
      companyOib: row.oib ?? "",
      headquarters: row.sjediste ?? company?.headquarters ?? "",
      contractType: company?.contractType ?? "",
      locationId: location?.id ?? "",
      locationName: row.lokacija ?? "",
      linkReference: row.veza_rn ?? "",
      executor1: row.izvrsitelj_rn1 ?? "",
      executor2: row.izvrsitelj_rn2 ?? "",
      priority: row.prioritet ?? "Normal",
      tagText: row.tagovi ?? "",
      coordinates: row.koordinate ?? location?.coordinates ?? "",
      region: row.regija ?? location?.region ?? "",
      contactSlot: null,
      contactName: row.kontakt_osoba ?? "",
      contactPhone: row.kontakt_broj ?? "",
      contactEmail: row.kontakt_email ?? "",
      serviceLine: row.usluge ?? "",
      department: row.odjel ?? "",
      createdAt: normalizeTimestamp(row.datum_rn),
      updatedAt: normalizeTimestamp(row.datum_fakturiranja ?? row.datum_rn),
      year: row.godina_rn ?? null,
      ordinalNumber: row.redni_broj ?? null,
    };
  });

  return {
    companies,
    locations,
    workOrders,
  };
}

async function syncLocationFromWorkOrder(connection, snapshot, workOrder) {
  if (!workOrder.locationId) {
    return;
  }

  const currentLocation = snapshot.locations.find((item) => item.id === workOrder.locationId);

  if (!currentLocation) {
    return;
  }

  const nextLocation = syncLocationFieldsFromWorkOrder(currentLocation, workOrder);

  if (
    nextLocation.coordinates === currentLocation.coordinates
    && nextLocation.region === currentLocation.region
  ) {
    return;
  }

  await connection.query(
    `
      UPDATE lokacije
      SET koordinate = ?, regija = ?, vrijeme_promjene = NOW(), korisnik = ?
      WHERE id = ?
    `,
    [
      nextLocation.coordinates,
      nextLocation.region,
      "SelfDash Web",
      Number(nextLocation.id),
    ],
  );
}

async function allocateWorkOrderNumber(connection, year) {
  const [[existing]] = await connection.query(
    "SELECT zadnji_broj FROM rn_brojevi WHERE godina_rn = ? FOR UPDATE",
    [year],
  );

  let nextNumber = 1;

  if (existing) {
    nextNumber = Number(existing.zadnji_broj || 0) + 1;

    await connection.query(
      "UPDATE rn_brojevi SET zadnji_broj = ? WHERE godina_rn = ?",
      [nextNumber, year],
    );
  } else {
    await connection.query(
      "INSERT INTO rn_brojevi (godina_rn, zadnji_broj) VALUES (?, ?)",
      [year, nextNumber],
    );
  }

  return `${String(year).slice(-2)}-${nextNumber}`;
}

export class InMemorySafetyRepository {
  constructor() {
    this.kind = "memory";
    this.snapshot = {
      companies: [],
      locations: [],
      workOrders: [],
    };
    this.refreshTokens = new Map();
    this.users = [
      {
        id: "1",
        korisnicko_ime: "admin",
        lozinka_hash: "",
        ime_prezime: "Local Admin",
        razina_prava: "admin",
      },
    ];
  }

  async init() {
    this.users[0].lozinka_hash = await createPasswordHash("admin");
  }

  async close() {}

  async authenticateUser(username, password) {
    const userRow = this.users.find((item) => item.korisnicko_ime.toLowerCase() === dbString(username).toLowerCase());

    if (!userRow) {
      return null;
    }

    const verification = await verifyPassword(password, userRow.lozinka_hash);

    if (!verification.ok) {
      return null;
    }

    if (verification.needsUpgrade) {
      userRow.lozinka_hash = await createPasswordHash(password);
    }

    return sanitizeUser(userRow);
  }

  async storeRefreshToken(user, token, metadata = {}) {
    const expiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS)).toISOString();
    this.refreshTokens.set(hashStoredToken(token), {
      userId: user.id,
      expiresAt,
    });

    return {
      user,
      expiresAt,
    };
  }

  async rotateRefreshToken(currentToken, nextToken, metadata = {}) {
    const session = this.refreshTokens.get(hashStoredToken(currentToken));

    if (!session || Date.parse(session.expiresAt) <= Date.now()) {
      return null;
    }

    const userRow = this.users.find((item) => item.id === session.userId);

    if (!userRow || (metadata.expectedUserId && String(userRow.id) !== String(metadata.expectedUserId))) {
      return null;
    }

    this.refreshTokens.delete(hashStoredToken(currentToken));

    const expiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS)).toISOString();
    this.refreshTokens.set(hashStoredToken(nextToken), {
      userId: userRow.id,
      expiresAt,
    });

    return {
      user: sanitizeUser(userRow),
      expiresAt,
    };
  }

  async deleteRefreshToken(token) {
    return this.refreshTokens.delete(hashStoredToken(token));
  }

  async getSnapshot() {
    return {
      companies: [...this.snapshot.companies],
      locations: [...this.snapshot.locations],
      workOrders: [...this.snapshot.workOrders],
    };
  }

  async createCompany(input) {
    const company = createCompany(input, this.snapshot.companies);
    this.snapshot.companies = [...this.snapshot.companies, company];
    return company;
  }

  async updateCompany(id, patch) {
    const current = this.snapshot.companies.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateCompany(current, patch, this.snapshot.companies);
    this.snapshot.companies = this.snapshot.companies.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteCompany(id) {
    const current = this.snapshot.companies.find((item) => item.id === id);

    if (!current) {
      return false;
    }

    const hasLocations = this.snapshot.locations.some((item) => item.companyId === id);
    const hasWorkOrders = this.snapshot.workOrders.some((item) => item.companyId === id);

    if (hasLocations || hasWorkOrders) {
      throw new Error("Tvrtka je vec povezana s lokacijama ili radnim nalozima.");
    }

    this.snapshot.companies = this.snapshot.companies.filter((item) => item.id !== id);
    return true;
  }

  async createLocation(input) {
    const location = createLocation(input, this.snapshot);
    this.snapshot.locations = [...this.snapshot.locations, location];
    return location;
  }

  async updateLocation(id, patch) {
    const current = this.snapshot.locations.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateLocation(current, patch, this.snapshot);
    this.snapshot.locations = this.snapshot.locations.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteLocation(id) {
    const current = this.snapshot.locations.find((item) => item.id === id);

    if (!current) {
      return false;
    }

    const hasWorkOrders = this.snapshot.workOrders.some((item) => item.locationId === id);

    if (hasWorkOrders) {
      throw new Error("Lokacija je vec povezana s radnim nalozima.");
    }

    this.snapshot.locations = this.snapshot.locations.filter((item) => item.id !== id);
    return true;
  }

  async createWorkOrder(input) {
    const now = new Date();
    const generatedNumber = `${String(now.getFullYear()).slice(-2)}-${this.snapshot.workOrders.length + 1}`;
    const workOrder = createWorkOrder(input, this.snapshot, () => crypto.randomUUID(), generatedNumber);
    this.snapshot.workOrders = [workOrder, ...this.snapshot.workOrders];
    return workOrder;
  }

  async updateWorkOrder(id, patch) {
    const current = this.snapshot.workOrders.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const next = updateWorkOrder(current, patch, this.snapshot);
    this.snapshot.workOrders = this.snapshot.workOrders.map((item) => (item.id === id ? next : item));
    return next;
  }

  async deleteWorkOrder(id) {
    const before = this.snapshot.workOrders.length;
    this.snapshot.workOrders = this.snapshot.workOrders.filter((item) => item.id !== id);
    return this.snapshot.workOrders.length !== before;
  }
}

export class MySqlSafetyRepository {
  constructor(connectionString) {
    this.kind = "mysql";
    this.pool = mysql.createPool(parseMySqlConnectionString(connectionString));
  }

  async init() {
    await this.pool.query("SELECT 1");
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS web_refresh_tokens (
        token_hash CHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_agent VARCHAR(255) NOT NULL DEFAULT '',
        ip_address VARCHAR(64) NOT NULL DEFAULT '',
        INDEX idx_web_refresh_tokens_user_id (user_id),
        INDEX idx_web_refresh_tokens_expires_at (expires_at)
      )
    `);
  }

  async close() {
    await this.pool.end();
  }

  async authenticateUser(username, password) {
    const connection = await this.pool.getConnection();

    try {
      const [rows] = await connection.query(
        `
          SELECT id, korisnicko_ime, lozinka_hash, ime_prezime, razina_prava
          FROM korisnici
          WHERE LOWER(korisnicko_ime) = LOWER(?)
          LIMIT 1
        `,
        [dbString(username)],
      );

      const userRow = rows[0];

      if (!userRow) {
        return null;
      }

      const verification = await verifyPassword(password, userRow.lozinka_hash);

      if (!verification.ok) {
        return null;
      }

      if (verification.needsUpgrade) {
        const nextHash = await createPasswordHash(password);

        await connection.query(
          "UPDATE korisnici SET lozinka_hash = ? WHERE id = ?",
          [nextHash, Number(userRow.id)],
        );
      }

      return sanitizeUser(userRow);
    } finally {
      connection.release();
    }
  }

  async storeRefreshToken(user, token, metadata = {}) {
    const connection = await this.pool.getConnection();

    try {
      const tokenHash = hashStoredToken(token);
      const expiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS));

      await connection.query("DELETE FROM web_refresh_tokens WHERE expires_at <= UTC_TIMESTAMP()");
      await connection.query(
        `
          INSERT INTO web_refresh_tokens (token_hash, user_id, expires_at, user_agent, ip_address)
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          tokenHash,
          Number(user.id),
          expiresAt,
          dbString(metadata.userAgent).slice(0, 255),
          dbString(metadata.ipAddress).slice(0, 64),
        ],
      );

      return {
        user,
        expiresAt: expiresAt.toISOString(),
      };
    } finally {
      connection.release();
    }
  }

  async rotateRefreshToken(currentToken, nextToken, metadata = {}) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const currentTokenHash = hashStoredToken(currentToken);
      const [rows] = await connection.query(
        `
          SELECT k.id, k.korisnicko_ime, k.ime_prezime, k.razina_prava
          FROM web_refresh_tokens s
          INNER JOIN korisnici k ON k.id = s.user_id
          WHERE s.token_hash = ?
            AND s.expires_at > UTC_TIMESTAMP()
          LIMIT 1
        `,
        [currentTokenHash],
      );

      if (!rows[0]) {
        await connection.rollback();
        return null;
      }

      if (metadata.expectedUserId && String(rows[0].id) !== String(metadata.expectedUserId)) {
        await connection.rollback();
        return null;
      }

      const nextExpiresAt = new Date(Date.now() + (metadata.maxAgeMs ?? REFRESH_TOKEN_MAX_AGE_MS));

      await connection.query(
        `
          UPDATE web_refresh_tokens
          SET token_hash = ?, expires_at = ?, last_seen_at = CURRENT_TIMESTAMP, user_agent = ?, ip_address = ?
          WHERE token_hash = ?
        `,
        [
          hashStoredToken(nextToken),
          nextExpiresAt,
          dbString(metadata.userAgent).slice(0, 255),
          dbString(metadata.ipAddress).slice(0, 64),
          currentTokenHash,
        ],
      );

      await connection.commit();

      return {
        user: sanitizeUser(rows[0]),
        expiresAt: nextExpiresAt.toISOString(),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteRefreshToken(token) {
    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query(
        "DELETE FROM web_refresh_tokens WHERE token_hash = ?",
        [hashStoredToken(token)],
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async getSnapshot() {
    const connection = await this.pool.getConnection();

    try {
      return await fetchSnapshotFromConnection(connection);
    } finally {
      connection.release();
    }
  }

  async createCompany(input) {
    const connection = await this.pool.getConnection();

    try {
      const snapshot = await fetchSnapshotFromConnection(connection);
      const company = createCompany(input, snapshot.companies);

      const [result] = await connection.query(
        `
          INSERT INTO firme
            (naziv_tvrtke, sjediste, oib, predstavnik_korisnika, periodika, vrsta_ugovora,
             broj_ugovora, napomena, aktivno, kontakt_broj, kontakt_email, datum_izmjene, izmjenu_unio)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `,
        [
          company.name,
          company.headquarters,
          company.oib,
          company.representative,
          company.period,
          company.contractType,
          company.contractNumber,
          company.note,
          activeLabel(company.isActive),
          company.contactPhone,
          company.contactEmail,
          "SelfDash Web",
        ],
      );

      return {
        ...company,
        id: String(result.insertId),
      };
    } finally {
      connection.release();
    }
  }

  async updateCompany(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.companies.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateCompany(current, patch, snapshot.companies);

      await connection.query(
        `
          UPDATE firme
          SET naziv_tvrtke = ?, sjediste = ?, oib = ?, predstavnik_korisnika = ?, periodika = ?,
              vrsta_ugovora = ?, broj_ugovora = ?, napomena = ?, aktivno = ?, kontakt_broj = ?,
              kontakt_email = ?, datum_izmjene = NOW(), izmjenu_unio = ?
          WHERE id = ?
        `,
        [
          next.name,
          next.headquarters,
          next.oib,
          next.representative,
          next.period,
          next.contractType,
          next.contractNumber,
          next.note,
          activeLabel(next.isActive),
          next.contactPhone,
          next.contactEmail,
          "SelfDash Web",
          Number(id),
        ],
      );

      if (current.oib !== next.oib || current.name !== next.name || current.headquarters !== next.headquarters || current.representative !== next.representative || current.period !== next.period) {
        await connection.query(
          `
            UPDATE lokacije
            SET firma_oib = ?, naziv_tvrtke = ?, sjediste = ?, periodika = ?, predstavnik_korisnika = ?,
                vrijeme_promjene = NOW(), korisnik = ?
            WHERE firma_oib = ?
          `,
          [
            next.oib,
            next.name,
            next.headquarters,
            next.period,
            next.representative,
            "SelfDash Web",
            current.oib,
          ],
        );

        await connection.query(
          `
            UPDATE radni_nalozi
            SET ime_tvrtke = ?, sjediste = ?, oib = ?
            WHERE oib = ?
          `,
          [
            next.name,
            next.headquarters,
            next.oib,
            current.oib,
          ],
        );
      }

      await connection.commit();
      return next;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteCompany(id) {
    const connection = await this.pool.getConnection();

    try {
      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.companies.find((item) => item.id === id);

      if (!current) {
        return false;
      }

      const [[locationCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM lokacije WHERE firma_oib = ?",
        [current.oib],
      );
      const [[workOrderCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM radni_nalozi WHERE oib = ?",
        [current.oib],
      );

      if (locationCount.total > 0 || workOrderCount.total > 0) {
        throw new Error("Tvrtka je vec povezana s lokacijama ili radnim nalozima.");
      }

      const [result] = await connection.query("DELETE FROM firme WHERE id = ?", [Number(id)]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async createLocation(input) {
    const connection = await this.pool.getConnection();

    try {
      const snapshot = await fetchSnapshotFromConnection(connection);
      const location = createLocation(input, snapshot);
      const company = snapshot.companies.find((item) => item.id === location.companyId);

      const [result] = await connection.query(
        `
          INSERT INTO lokacije
            (firma_oib, lokacija, kontakt_osoba, kontakt_osoba2, kontakt_osoba3,
             kontakt_broj, kontakt_broj2, kontakt_broj3, kontakt_email, kontakt_email2,
             kontakt_email3, koordinate, regija, aktivno, korisnik, naziv_tvrtke, sjediste,
             periodika, predstavnik_korisnika, napomena)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          company.oib,
          location.name,
          location.contactName1,
          location.contactName2,
          location.contactName3,
          location.contactPhone1,
          location.contactPhone2,
          location.contactPhone3,
          location.contactEmail1,
          location.contactEmail2,
          location.contactEmail3,
          location.coordinates,
          location.region,
          activeLabel(location.isActive),
          "SelfDash Web",
          company.name,
          company.headquarters,
          location.period,
          location.representative,
          location.note,
        ],
      );

      return {
        ...location,
        id: String(result.insertId),
        companyOib: company.oib,
        companyName: company.name,
        headquarters: company.headquarters,
      };
    } finally {
      connection.release();
    }
  }

  async updateLocation(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.locations.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateLocation(current, patch, snapshot);
      const company = snapshot.companies.find((item) => item.id === next.companyId);

      await connection.query(
        `
          UPDATE lokacije
          SET firma_oib = ?, lokacija = ?, kontakt_osoba = ?, kontakt_osoba2 = ?, kontakt_osoba3 = ?,
              kontakt_broj = ?, kontakt_broj2 = ?, kontakt_broj3 = ?, kontakt_email = ?, kontakt_email2 = ?,
              kontakt_email3 = ?, koordinate = ?, regija = ?, aktivno = ?, korisnik = ?, naziv_tvrtke = ?,
              sjediste = ?, periodika = ?, predstavnik_korisnika = ?, napomena = ?
          WHERE id = ?
        `,
        [
          company.oib,
          next.name,
          next.contactName1,
          next.contactName2,
          next.contactName3,
          next.contactPhone1,
          next.contactPhone2,
          next.contactPhone3,
          next.contactEmail1,
          next.contactEmail2,
          next.contactEmail3,
          next.coordinates,
          next.region,
          activeLabel(next.isActive),
          "SelfDash Web",
          company.name,
          company.headquarters,
          next.period,
          next.representative,
          next.note,
          Number(id),
        ],
      );

      await connection.query(
        `
          UPDATE radni_nalozi
          SET lokacija = ?, koordinate = ?, regija = ?
          WHERE oib = ? AND lokacija = ?
        `,
        [
          next.name,
          next.coordinates,
          next.region,
          current.companyOib,
          current.name,
        ],
      );

      await connection.commit();
      return {
        ...next,
        companyOib: company.oib,
        companyName: company.name,
        headquarters: company.headquarters,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteLocation(id) {
    const connection = await this.pool.getConnection();

    try {
      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.locations.find((item) => item.id === id);

      if (!current) {
        return false;
      }

      const [[workOrderCount]] = await connection.query(
        "SELECT COUNT(*) AS total FROM radni_nalozi WHERE oib = ? AND lokacija = ?",
        [current.companyOib, current.name],
      );

      if (workOrderCount.total > 0) {
        throw new Error("Lokacija je vec povezana s radnim nalozima.");
      }

      const [result] = await connection.query("DELETE FROM lokacije WHERE id = ?", [Number(id)]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async createWorkOrder(input) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const draft = createWorkOrder(input, snapshot, () => "pending", null);
      const year = Number((draft.openedDate ?? new Date().toISOString().slice(0, 10)).slice(0, 4));
      const brojRn = await allocateWorkOrderNumber(connection, year);

      const [result] = await connection.query(
        `
          INSERT INTO radni_nalozi
            (broj_rn, datum_rn, ime_tvrtke, sjediste, oib, veza_rn, lokacija, prioritet,
             kontakt_osoba, kontakt_broj, kontakt_email, rok_zavrsetka, izvrsitelj_rn1,
             izvrsitelj_rn2, tagovi, status_rn, napomena_faktura, godina_rn, redni_broj,
             odjel, koordinate, usluge, opis, regija, datum_fakturiranja, tezina, rn_zavrsio)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          brojRn,
          draft.openedDate,
          draft.companyName,
          draft.headquarters,
          draft.companyOib,
          draft.linkReference,
          draft.locationName,
          draft.priority,
          draft.contactName,
          draft.contactPhone,
          draft.contactEmail,
          draft.dueDate,
          draft.executor1,
          draft.executor2,
          draft.tagText,
          draft.status,
          draft.invoiceNote,
          year,
          Number(String(brojRn).split("-")[1]),
          draft.department,
          draft.coordinates,
          draft.serviceLine,
          draft.description,
          draft.region,
          draft.invoiceDate,
          parseNullableDecimal(draft.weight),
          draft.completedBy,
        ],
      );

      const workOrder = {
        ...draft,
        id: String(result.insertId),
        workOrderNumber: brojRn,
        year,
        ordinalNumber: Number(String(brojRn).split("-")[1]),
      };

      await syncLocationFromWorkOrder(connection, snapshot, workOrder);
      await connection.commit();

      return workOrder;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateWorkOrder(id, patch) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      const snapshot = await fetchSnapshotFromConnection(connection);
      const current = snapshot.workOrders.find((item) => item.id === id);

      if (!current) {
        await connection.rollback();
        return null;
      }

      const next = updateWorkOrder(current, patch, snapshot);

      await connection.query(
        `
          UPDATE radni_nalozi
          SET datum_rn = ?, ime_tvrtke = ?, sjediste = ?, oib = ?, veza_rn = ?, lokacija = ?,
              prioritet = ?, kontakt_osoba = ?, kontakt_broj = ?, kontakt_email = ?, rok_zavrsetka = ?,
              izvrsitelj_rn1 = ?, izvrsitelj_rn2 = ?, tagovi = ?, status_rn = ?, napomena_faktura = ?,
              odjel = ?, koordinate = ?, usluge = ?, opis = ?, regija = ?, datum_fakturiranja = ?,
              tezina = ?, rn_zavrsio = ?
          WHERE id = ?
        `,
        [
          next.openedDate,
          next.companyName,
          next.headquarters,
          next.companyOib,
          next.linkReference,
          next.locationName,
          next.priority,
          next.contactName,
          next.contactPhone,
          next.contactEmail,
          next.dueDate,
          next.executor1,
          next.executor2,
          next.tagText,
          next.status,
          next.invoiceNote,
          next.department,
          next.coordinates,
          next.serviceLine,
          next.description,
          next.region,
          next.invoiceDate,
          parseNullableDecimal(next.weight),
          next.completedBy,
          Number(id),
        ],
      );

      await syncLocationFromWorkOrder(connection, snapshot, next);
      await connection.commit();

      return next;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteWorkOrder(id) {
    const connection = await this.pool.getConnection();

    try {
      const [result] = await connection.query("DELETE FROM radni_nalozi WHERE id = ?", [Number(id)]);
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }
}

export async function createSafetyRepository() {
  const kind = getDatabaseKind();

  if (kind === "mysql") {
    const repository = new MySqlSafetyRepository(process.env.DATABASE_URL);
    await repository.init();
    return repository;
  }

  const repository = new InMemorySafetyRepository();
  await repository.init();
  return repository;
}

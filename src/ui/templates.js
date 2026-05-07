import { createBlock } from "../core/registry.js";
import { A4_HEIGHT_PX, A4_WIDTH_PX } from "../utils/math.js";

const HEADER_OFFSET_Y = 151;

function page(children = [], name = "A4 stranica") {
  return createBlock("page", {
    props: { name },
    layout: { width: A4_WIDTH_PX, height: A4_HEIGHT_PX },
    children,
  });
}

function heading(content, layout, styles = {}) {
  return createBlock("heading", {
    props: { content },
    layout,
    styles,
  });
}

function text(content, layout, styles = {}) {
  return createBlock("text", {
    props: { content },
    layout,
    styles,
  });
}

function table(title, layout) {
  return createBlock("table", {
    props: {
      rows: [
        ["Rb.", "Opis", "Rezultat", "Napomena"],
        ["1", "{{MJERENJE_1}}", "{{REZULTAT_1}}", ""],
        ["2", "{{MJERENJE_2}}", "{{REZULTAT_2}}", ""],
      ],
      header: true,
      title,
    },
    layout,
  });
}

export const DOCUMENT_BUILDER_TEMPLATES = [
  {
    id: "zapisnik",
    label: "Zapisnik",
    description: "Osnovni zapisnik s podacima, tablicom i potpisom.",
    createDocument() {
      return [
        page([
          createBlock("logo", { layout: { x: 56, y: HEADER_OFFSET_Y, width: 150, height: 46 } }),
          heading("ZAPISNIK O ISPITIVANJU", { x: 220, y: HEADER_OFFSET_Y + 6, width: 360, height: 46 }, { textAlign: "center", fontSize: "22px" }),
          createBlock("line", { layout: { x: 56, y: HEADER_OFFSET_Y + 68, width: 682, height: 3 }, styles: { backgroundColor: "#006fc0" } }),
          text("Tvrtka: {{TVRTKA}}\nLokacija: {{LOKACIJA}}\nRadni nalog: {{BROJ_RADNOG_NALOGA}}", { x: 56, y: HEADER_OFFSET_Y + 94, width: 330, height: 100 }),
          text("Datum: {{DATUM}}\nIspitivac: {{ISPITIVAC}}\nStatus: {{STATUS}}", { x: 420, y: HEADER_OFFSET_Y + 94, width: 260, height: 100 }),
          table("Mjerenja", { x: 56, y: HEADER_OFFSET_Y + 228, width: 682, height: 260 }),
          createBlock("signature", { layout: { x: 438, y: 910, width: 260, height: 110 } }),
        ]),
      ];
    },
  },
  {
    id: "prazna-a4-mreza",
    label: "Prazna A4 mreza",
    description: "Puna mreza preko A4 stranice unutar margina za rucno spajanje i bojanje celija.",
    createDocument() {
      return [
        page([
          createBlock("grid"),
        ], "A4 mreza"),
      ];
    },
  },
  {
    id: "ex-zona",
    label: "EX zona",
    description: "Struktura za EX dokumentaciju i zone opasnosti.",
    createDocument() {
      return [
        page([
          heading("EX DOKUMENTACIJA", { x: 64, y: HEADER_OFFSET_Y, width: 560, height: 48 }),
          createBlock("badge", { props: { content: "{{OZNAKA_ZONE}}" }, layout: { x: 612, y: HEADER_OFFSET_Y + 4, width: 118, height: 34 } }),
          text("Objekt: {{OBJEKT}}\nZona: {{EX_ZONA}}\nVrsta instalacije: {{VRSTA_INSTALACIJE}}", { x: 64, y: HEADER_OFFSET_Y + 76, width: 640, height: 90 }),
          table("Pregled nalaza", { x: 64, y: HEADER_OFFSET_Y + 196, width: 660, height: 310 }),
          createBlock("stamp", { layout: { x: 90, y: 875, width: 128, height: 128 } }),
          createBlock("signature", { layout: { x: 430, y: 900, width: 260, height: 110 } }),
        ]),
      ];
    },
  },
  {
    id: "gromobran",
    label: "Gromobran",
    description: "Predlozak za sustav zastite od munje.",
    createDocument() {
      return [
        page([
          heading("ISPITIVANJE SUSTAVA ZASTITE OD MUNJE", { x: 58, y: HEADER_OFFSET_Y, width: 640, height: 64 }, { fontSize: "20px" }),
          text("Mjerno mjesto: {{MJERNO_MJESTO}}\nNorma: {{NORMA}}\nVrijedi do: {{VRIJEDI_DO}}", { x: 58, y: HEADER_OFFSET_Y + 82, width: 640, height: 84 }),
          table("Mjerni rezultati", { x: 58, y: HEADER_OFFSET_Y + 194, width: 680, height: 360 }),
          createBlock("qr", { layout: { x: 610, y: 930, width: 96, height: 96 } }),
        ]),
      ];
    },
  },
  {
    id: "uzemljenje",
    label: "Uzemljenje",
    description: "Tablicni izvjestaj za uzemljenje.",
    createDocument() {
      return [
        page([
          heading("IZVJESTAJ O MJERENJU UZEMLJENJA", { x: 64, y: HEADER_OFFSET_Y, width: 600, height: 50 }),
          createBlock("status", { props: { content: "{{STATUS}}" }, layout: { x: 600, y: HEADER_OFFSET_Y + 6, width: 130, height: 32 } }),
          table("Uzemljivaci", { x: 64, y: HEADER_OFFSET_Y + 96, width: 660, height: 440 }),
          text("Napomena: {{NAPOMENA}}", { x: 64, y: HEADER_OFFSET_Y + 576, width: 660, height: 100 }),
        ]),
      ];
    },
  },
  {
    id: "vatrogasni-aparat",
    label: "Vatrogasni aparat",
    description: "Obrazac pregleda vatrogasnih aparata.",
    createDocument() {
      return [
        page([
          heading("PREGLED VATROGASNIH APARATA", { x: 64, y: HEADER_OFFSET_Y, width: 620, height: 48 }),
          table("Popis aparata", { x: 64, y: HEADER_OFFSET_Y + 82, width: 660, height: 500 }),
          createBlock("signature", { layout: { x: 430, y: 910, width: 260, height: 110 } }),
        ]),
      ];
    },
  },
  {
    id: "elektricna-instalacija",
    label: "Elektricna instalacija",
    description: "Predlozak za elektro mjerenja i nalaz.",
    createDocument() {
      return [
        page([
          heading("ELEKTRICNA MJERENJA", { x: 64, y: HEADER_OFFSET_Y, width: 520, height: 48 }),
          createBlock("line", { layout: { x: 64, y: HEADER_OFFSET_Y + 60, width: 660, height: 3 }, styles: { backgroundColor: "#006fc0" } }),
          text("Objekt: {{OBJEKT}}\nRazvod: {{RAZVOD}}\nInstrument: {{INSTRUMENT}}", { x: 64, y: HEADER_OFFSET_Y + 94, width: 640, height: 90 }),
          table("Rezultati mjerenja", { x: 64, y: HEADER_OFFSET_Y + 214, width: 660, height: 430 }),
          createBlock("signature", { layout: { x: 430, y: 914, width: 260, height: 108 } }),
        ]),
      ];
    },
  },
];

export function getTemplateById(templateId = "") {
  return DOCUMENT_BUILDER_TEMPLATES.find((template) => template.id === templateId) || DOCUMENT_BUILDER_TEMPLATES[0];
}

import assert from "node:assert/strict";
import test from "node:test";
import { createMeasurementSheetViewportController } from "../src/features/measurementSheet/viewport.js";

const fakeDocumentRef = {
  createElement(tagName) {
    return {
      tagName,
      className: "",
      style: {},
      append() {},
    };
  },
};

const fakeWindowRef = {
  requestAnimationFrame(callback) {
    callback();
    return 1;
  },
};

function createColumn(index) {
  return {
    id: `c${index}`,
    width: 120,
  };
}

test("measurement viewport virtualizes wide columns even when rows are not virtual", () => {
  const sheet = {
    isOpen: true,
    rows: Array.from({ length: 72 }, (_, index) => ({ id: `r${index}`, cells: {} })),
    columns: Array.from({ length: 40 }, (_, index) => createColumn(index)),
    merges: [],
    viewport: {},
  };
  const gridWrap = {
    scrollLeft: 1800,
    scrollTop: 0,
    clientWidth: 720,
    clientHeight: 480,
  };

  const controller = createMeasurementSheetViewportController({
    getSheet: () => sheet,
    getGridWrap: () => gridWrap,
    getBody: () => null,
    isLightCellRenderEnabled: () => true,
    documentRef: fakeDocumentRef,
    windowRef: fakeWindowRef,
  });
  const windowState = controller.getVirtualWindow();

  assert.equal(windowState.virtual, false);
  assert.equal(windowState.virtualColumns, true);
  assert.ok(windowState.startColumnIndex > 0);
  assert.ok(windowState.endColumnIndex < sheet.columns.length - 1);
  assert.ok(windowState.leftSpacerWidth > 0);
  assert.ok(windowState.rightSpacerWidth > 0);
});

test("measurement viewport schedules rerender for horizontal-only virtual scroll", () => {
  const sheet = {
    isOpen: true,
    rows: Array.from({ length: 72 }, (_, index) => ({ id: `r${index}`, cells: {} })),
    columns: Array.from({ length: 40 }, (_, index) => createColumn(index)),
    merges: [],
    viewport: {},
  };
  const gridWrap = {
    scrollLeft: 0,
    scrollTop: 0,
    clientWidth: 720,
    clientHeight: 480,
  };
  let renderCount = 0;
  const controller = createMeasurementSheetViewportController({
    getSheet: () => sheet,
    getGridWrap: () => gridWrap,
    getBody: () => null,
    isLightCellRenderEnabled: () => true,
    renderSheet: () => {
      renderCount += 1;
    },
    documentRef: fakeDocumentRef,
    windowRef: fakeWindowRef,
  });

  controller.syncVirtualViewport(controller.getVirtualWindow());
  gridWrap.scrollLeft = 1800;
  controller.scheduleVirtualViewportRender();

  assert.equal(renderCount, 1);
});

test("measurement viewport finds distant horizontal windows without walking every column", () => {
  const sheet = {
    isOpen: true,
    rows: Array.from({ length: 120 }, (_, index) => ({ id: `r${index}`, cells: {} })),
    columns: Array.from({ length: 1000 }, (_, index) => createColumn(index)),
    merges: [],
    viewport: {},
  };
  const gridWrap = {
    scrollLeft: 120 * 720 + 17,
    scrollTop: 0,
    clientWidth: 600,
    clientHeight: 480,
  };

  const controller = createMeasurementSheetViewportController({
    getSheet: () => sheet,
    getGridWrap: () => gridWrap,
    getBody: () => null,
    isLightCellRenderEnabled: () => true,
    documentRef: fakeDocumentRef,
    windowRef: fakeWindowRef,
  });
  const windowState = controller.getVirtualWindow();

  assert.equal(windowState.virtualColumns, true);
  assert.equal(windowState.startColumnIndex, 716);
  assert.equal(windowState.endColumnIndex, 729);
  assert.equal(windowState.leftSpacerWidth, 120 * 716);
  assert.ok(windowState.rightSpacerWidth > 0);
});

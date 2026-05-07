import { createBlock } from "./registry.js";
import { deepClone } from "../utils/clone.js";
import { createId } from "../utils/ids.js";
import { A4_HEIGHT_PX, A4_WIDTH_PX, boundsFromRects, rectFromLayout } from "../utils/math.js";

const DEFAULT_STATE = {
  document: [],
  selectedIds: [],
  clipboard: [],
  history: [],
  future: [],
  zoom: 0.78,
  activePage: 1,
  guides: [],
  templates: [],
};

function normalizePage(page = {}, index = 0) {
  return createBlock("page", {
    ...page,
    id: page.id || createId("page"),
    props: { name: `A4 stranica ${index + 1}`, ...(page.props || {}) },
    layout: {
      x: 0,
      y: 0,
      width: A4_WIDTH_PX,
      height: Math.max(A4_HEIGHT_PX, Number(page.layout?.height) || A4_HEIGHT_PX),
      rotation: 0,
      ...(page.layout || {}),
    },
    children: Array.isArray(page.children) ? page.children : [],
  });
}

function normalizeDocument(document = []) {
  const pages = (Array.isArray(document) ? document : [])
    .filter((block) => block?.type === "page")
    .map((page, index) => normalizePage(page, index));
  return pages.length > 0 ? pages : [normalizePage({}, 0)];
}

function walkBlocks(blocks = [], callback, parent = null) {
  blocks.forEach((block, index) => {
    callback(block, parent, index, blocks);
    if (Array.isArray(block.children) && block.children.length > 0) {
      walkBlocks(block.children, callback, block);
    }
  });
}

function findBlockIn(blocks = [], blockId = "") {
  let result = null;
  walkBlocks(blocks, (block, parent, index, siblings) => {
    if (!result && String(block.id) === String(blockId)) {
      result = { block, parent, index, siblings };
    }
  });
  return result;
}

function getActivePage(document = [], activePage = 1) {
  return document[Math.max(0, Math.min(document.length - 1, Number(activePage || 1) - 1))] || document[0];
}

function mergeBlock(block = {}, patch = {}) {
  return {
    ...block,
    ...patch,
    props: { ...(block.props || {}), ...(patch.props || {}) },
    styles: { ...(block.styles || {}), ...(patch.styles || {}) },
    layout: { ...(block.layout || {}), ...(patch.layout || {}) },
    children: Array.isArray(patch.children) ? patch.children : (block.children || []),
  };
}

export function createBuilderState(initialState = {}) {
  let state = {
    ...DEFAULT_STATE,
    ...initialState,
    document: normalizeDocument(initialState.document),
    selectedIds: Array.isArray(initialState.selectedIds) ? initialState.selectedIds : [],
    history: [],
    future: [],
  };
  const subscribers = new Set();
  let pendingHistorySnapshot = null;

  function emit(reason = "change") {
    const snapshot = getState();
    subscribers.forEach((subscriber) => subscriber(snapshot, reason));
  }

  function getState() {
    return deepClone(state);
  }

  function replaceState(nextState, reason = "change") {
    state = {
      ...DEFAULT_STATE,
      ...nextState,
      document: normalizeDocument(nextState.document),
      selectedIds: Array.isArray(nextState.selectedIds) ? nextState.selectedIds : [],
      history: Array.isArray(nextState.history) ? nextState.history : state.history,
      future: Array.isArray(nextState.future) ? nextState.future : state.future,
    };
    emit(reason);
  }

  function snapshotForHistory() {
    return {
      document: deepClone(state.document),
      selectedIds: deepClone(state.selectedIds),
      zoom: state.zoom,
      activePage: state.activePage,
      guides: deepClone(state.guides),
      templates: deepClone(state.templates),
    };
  }

  function remember(options = {}) {
    if (options.history === false) {
      if (!pendingHistorySnapshot) {
        pendingHistorySnapshot = snapshotForHistory();
      }
      return;
    }
    const entry = pendingHistorySnapshot || snapshotForHistory();
    pendingHistorySnapshot = null;
    state.history = [...state.history.slice(-79), entry];
    state.future = [];
  }

  function commitHistory() {
    if (!pendingHistorySnapshot) {
      return;
    }
    state.history = [...state.history.slice(-79), pendingHistorySnapshot];
    state.future = [];
    pendingHistorySnapshot = null;
    emit("history");
  }

  function updateDocument(mutator, options = {}, reason = "document") {
    remember(options);
    const nextDocument = deepClone(state.document);
    mutator(nextDocument);
    state.document = normalizeDocument(nextDocument);
    emit(reason);
  }

  function updateBlock(blockId = "", patch = {}, options = {}) {
    if (!blockId) return;
    updateDocument((document) => {
      const found = findBlockIn(document, blockId);
      if (!found) return;
      found.siblings[found.index] = mergeBlock(found.block, patch);
    }, options, "update-block");
  }

  function addBlock(type = "text", initial = {}, options = {}) {
    let created = null;
    updateDocument((document) => {
      const targetPage = findBlockIn(document, options.pageId)?.block || getActivePage(document, state.activePage);
      const block = createBlock(type, initial);
      if (block.type === "page") {
        document.push(block);
        state.activePage = document.length;
      } else {
        targetPage.children = Array.isArray(targetPage.children) ? targetPage.children : [];
        targetPage.children.push(block);
      }
      created = block;
      state.selectedIds = [block.id];
    }, options, "add-block");
    return deepClone(created);
  }

  function removeBlock(blockIdOrIds = state.selectedIds, options = {}) {
    const ids = new Set((Array.isArray(blockIdOrIds) ? blockIdOrIds : [blockIdOrIds]).map(String));
    if (ids.size === 0) return;
    updateDocument((document) => {
      function prune(children = []) {
        return children
          .filter((block) => block.type === "page" || !ids.has(String(block.id)))
          .map((block) => ({ ...block, children: prune(block.children || []) }));
      }
      const pages = prune(document).filter((block) => block.type === "page");
      document.splice(0, document.length, ...(pages.length > 0 ? pages : [normalizePage({}, 0)]));
      state.selectedIds = state.selectedIds.filter((id) => !ids.has(String(id)));
    }, options, "remove-block");
  }

  function moveBlock(blockId = "", layoutPatch = {}, options = {}) {
    updateBlock(blockId, { layout: layoutPatch }, options);
  }

  function duplicateBlock(blockIdOrIds = state.selectedIds, options = {}) {
    let clones = [];
    updateDocument((document) => {
      const ids = Array.isArray(blockIdOrIds) ? blockIdOrIds : [blockIdOrIds];
      ids.forEach((id) => {
        const found = findBlockIn(document, id);
        if (!found || found.block.type === "page") return;
        const clone = deepClone(found.block);
        const refreshIds = (block) => {
          block.id = createId(block.type || "block");
          block.layout = {
            ...(block.layout || {}),
            x: (Number(block.layout?.x) || 0) + 24,
            y: (Number(block.layout?.y) || 0) + 24,
          };
          (block.children || []).forEach(refreshIds);
        };
        refreshIds(clone);
        found.siblings.splice(found.index + 1, 0, clone);
        clones.push(clone);
      });
      state.selectedIds = clones.map((block) => block.id);
    }, options, "duplicate-block");
    return deepClone(clones);
  }

  function groupBlocks(blockIds = state.selectedIds, options = {}) {
    const ids = new Set((Array.isArray(blockIds) ? blockIds : []).map(String));
    if (ids.size < 2) return null;
    let group = null;
    updateDocument((document) => {
      const page = getActivePage(document, state.activePage);
      const selected = (page.children || []).filter((block) => ids.has(String(block.id)));
      if (selected.length < 2) return;
      const bounds = boundsFromRects(selected.map((block) => rectFromLayout(block.layout)));
      group = createBlock("container", {
        props: { label: "Grupa" },
        styles: { backgroundColor: "transparent", borderColor: "#8b5cf6", borderWidth: "1px", borderRadius: "8px" },
        layout: bounds,
        children: selected.map((block) => ({
          ...block,
          layout: {
            ...(block.layout || {}),
            x: (Number(block.layout?.x) || 0) - bounds.x,
            y: (Number(block.layout?.y) || 0) - bounds.y,
          },
        })),
      });
      page.children = (page.children || []).filter((block) => !ids.has(String(block.id)));
      page.children.push(group);
      state.selectedIds = [group.id];
    }, options, "group-blocks");
    return deepClone(group);
  }

  function ungroupBlocks(blockIdOrIds = state.selectedIds, options = {}) {
    const ids = new Set((Array.isArray(blockIdOrIds) ? blockIdOrIds : [blockIdOrIds]).map(String));
    updateDocument((document) => {
      walkBlocks(document, (block, parent, index, siblings) => {
        if (!ids.has(String(block.id)) || !Array.isArray(block.children) || block.children.length === 0) return;
        const offsetX = Number(block.layout?.x) || 0;
        const offsetY = Number(block.layout?.y) || 0;
        const children = block.children.map((child) => ({
          ...child,
          layout: {
            ...(child.layout || {}),
            x: offsetX + (Number(child.layout?.x) || 0),
            y: offsetY + (Number(child.layout?.y) || 0),
          },
        }));
        siblings.splice(index, 1, ...children);
        state.selectedIds = children.map((child) => child.id);
      });
    }, options, "ungroup-blocks");
  }

  function reorderSelected(mode = "forward", ids = state.selectedIds, options = {}) {
    const selected = new Set((Array.isArray(ids) ? ids : [ids]).map(String));
    updateDocument((document) => {
      const page = getActivePage(document, state.activePage);
      const children = page.children || [];
      if (mode === "front") {
        page.children = [...children.filter((block) => !selected.has(String(block.id))), ...children.filter((block) => selected.has(String(block.id)))];
      } else if (mode === "back") {
        page.children = [...children.filter((block) => selected.has(String(block.id))), ...children.filter((block) => !selected.has(String(block.id)))];
      } else {
        const direction = mode === "backward" ? -1 : 1;
        for (let index = direction > 0 ? children.length - 2 : 1; direction > 0 ? index >= 0 : index < children.length; index -= direction > 0 ? 1 : -1) {
          if (!selected.has(String(children[index].id))) continue;
          const nextIndex = index + direction;
          [children[index], children[nextIndex]] = [children[nextIndex], children[index]];
        }
      }
    }, options, "layers");
  }

  function selectBlock(blockId = "", options = {}) {
    state.selectedIds = blockId ? [String(blockId)] : [];
    if (options.pageIndex) state.activePage = options.pageIndex;
    emit("select");
  }

  function multiSelect(blockId = "") {
    const id = String(blockId || "");
    if (!id) return;
    state.selectedIds = state.selectedIds.includes(id)
      ? state.selectedIds.filter((selectedId) => selectedId !== id)
      : [...state.selectedIds, id];
    emit("select");
  }

  function clearSelection() {
    state.selectedIds = [];
    emit("select");
  }

  function undo() {
    commitHistory();
    const previous = state.history.at(-1);
    if (!previous) return;
    state.future = [snapshotForHistory(), ...state.future.slice(0, 79)];
    state.history = state.history.slice(0, -1);
    state = { ...state, ...deepClone(previous) };
    emit("undo");
  }

  function redo() {
    const next = state.future[0];
    if (!next) return;
    state.history = [...state.history.slice(-79), snapshotForHistory()];
    state.future = state.future.slice(1);
    state = { ...state, ...deepClone(next) };
    emit("redo");
  }

  function saveDocument(storageKey = "safenexus.document.builder") {
    const payload = JSON.stringify(snapshotForHistory());
    window.localStorage?.setItem(storageKey, payload);
    return payload;
  }

  function loadDocument(payloadOrKey = "safenexus.document.builder") {
    const payload = String(payloadOrKey || "").trim().startsWith("{")
      ? payloadOrKey
      : window.localStorage?.getItem(payloadOrKey);
    if (!payload) return false;
    try {
      replaceState({ ...state, ...JSON.parse(payload) }, "load-document");
      return true;
    } catch {
      return false;
    }
  }

  function subscribe(subscriber) {
    subscribers.add(subscriber);
    subscriber(getState(), "init");
    return () => subscribers.delete(subscriber);
  }

  return {
    getState,
    replaceState,
    subscribe,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    duplicateBlock,
    groupBlocks,
    ungroupBlocks,
    bringForward: (ids, options) => reorderSelected("forward", ids, options),
    sendBackward: (ids, options) => reorderSelected("backward", ids, options),
    bringToFront: (ids, options) => reorderSelected("front", ids, options),
    sendToBack: (ids, options) => reorderSelected("back", ids, options),
    selectBlock,
    multiSelect,
    clearSelection,
    undo,
    redo,
    saveDocument,
    loadDocument,
    commitHistory,
    setZoom(value) {
      state.zoom = Math.max(0.35, Math.min(1.8, Number(value) || 1));
      emit("zoom");
    },
    setActivePage(pageIndex = 1) {
      state.activePage = Math.max(1, Math.min(state.document.length, Number(pageIndex) || 1));
      emit("active-page");
    },
    setGuides(guides = []) {
      state.guides = Array.isArray(guides) ? guides : [];
      emit("guides");
    },
    setClipboard(blocks = []) {
      state.clipboard = deepClone(Array.isArray(blocks) ? blocks : []);
      emit("clipboard");
    },
  };
}

export function getBlockById(document = [], blockId = "") {
  return findBlockIn(document, blockId)?.block || null;
}

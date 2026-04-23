import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { brotliCompress, constants as zlibConstants, gzip } from "node:zlib";
import { promisify } from "node:util";

const rootDir = process.cwd();
const distDir = resolve(rootDir, "dist");
const vendorVersion = "20260420j";
const browserSrcDir = resolve(rootDir, "src");
const browserEntryModules = [
  resolve(browserSrcDir, "main.js"),
  resolve(browserSrcDir, "auth-transitions.js"),
  resolve(browserSrcDir, "request-access.js"),
  resolve(browserSrcDir, "learning-test.js"),
];
const relativeBrowserImportPattern = /(?:import|export)\s+(?:[^"'`]*?\s+from\s+)?["'](\.[^"']+)["']/g;
const gzipAsync = promisify(gzip);
const brotliCompressAsync = promisify(brotliCompress);
const compressibleExtensions = new Set([".css", ".html", ".js", ".json", ".svg", ".webmanifest"]);

async function copyBrowserModule(modulePath, copiedModules = new Set()) {
  const absoluteModulePath = resolve(modulePath);
  if (copiedModules.has(absoluteModulePath)) {
    return;
  }

  copiedModules.add(absoluteModulePath);

  const relativeModulePath = relative(rootDir, absoluteModulePath);
  const distModulePath = resolve(distDir, relativeModulePath);
  await mkdir(dirname(distModulePath), { recursive: true });
  await cp(absoluteModulePath, distModulePath);

  const source = await readFile(absoluteModulePath, "utf8");
  for (const match of source.matchAll(relativeBrowserImportPattern)) {
    const relativeImportPath = match[1];
    if (!relativeImportPath) {
      continue;
    }

    const resolvedImportPath = resolve(dirname(absoluteModulePath), relativeImportPath);
    const normalizedImportPath = extname(resolvedImportPath) ? resolvedImportPath : `${resolvedImportPath}.js`;

    if (!normalizedImportPath.startsWith(browserSrcDir) || extname(normalizedImportPath) !== ".js") {
      continue;
    }

    await copyBrowserModule(normalizedImportPath, copiedModules);
  }
}

async function listFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const filePaths = [];

  for (const entry of entries) {
    const entryPath = resolve(directoryPath, entry.name);
    if (entry.isDirectory()) {
      filePaths.push(...await listFiles(entryPath));
    } else if (entry.isFile()) {
      filePaths.push(entryPath);
    }
  }

  return filePaths;
}

async function compressDistAssets() {
  const filePaths = await listFiles(distDir);
  const eligibleFiles = filePaths.filter((filePath) => compressibleExtensions.has(extname(filePath)));

  await Promise.all(eligibleFiles.map(async (filePath) => {
    const sourceBuffer = await readFile(filePath);

    if (sourceBuffer.length < 1024) {
      return;
    }

    const [brotliBuffer, gzipBuffer] = await Promise.all([
      brotliCompressAsync(sourceBuffer, {
        params: {
          [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
        },
      }),
      gzipAsync(sourceBuffer, { level: 9 }),
    ]);

    if (brotliBuffer.length < sourceBuffer.length) {
      await writeFile(`${filePath}.br`, brotliBuffer);
    }

    if (gzipBuffer.length < sourceBuffer.length) {
      await writeFile(`${filePath}.gz`, gzipBuffer);
    }
  }));
}

await rm(distDir, { recursive: true, force: true });
await mkdir(resolve(distDir, "src"), { recursive: true });
await mkdir(resolve(distDir, "assets"), { recursive: true });
await mkdir(resolve(distDir, "assets", "vendor"), { recursive: true });

await cp(resolve(rootDir, "index.html"), resolve(distDir, "index.html"));
await cp(resolve(rootDir, "learning-test.html"), resolve(distDir, "learning-test.html"));
await cp(resolve(rootDir, "request-access.html"), resolve(distDir, "request-access.html"));
await cp(resolve(rootDir, "site.webmanifest"), resolve(distDir, "site.webmanifest"));
await cp(resolve(rootDir, "styles.css"), resolve(distDir, "styles.css"));
await cp(resolve(rootDir, "assets", "safenexus-logo.png"), resolve(distDir, "assets", "safenexus-logo.png"));
await cp(resolve(rootDir, "assets", "safenexus-mark.png"), resolve(distDir, "assets", "safenexus-mark.png"));
const cadviewCoreSource = await readFile(resolve(rootDir, "node_modules", "@cadview", "core", "dist", "index.js"), "utf8");
await writeFile(
  resolve(distDir, "assets", "vendor", "cadview-core.js"),
  cadviewCoreSource.replace("from 'rbush';", `from '/assets/vendor/rbush.js?v=${vendorVersion}';`),
  "utf8",
);
const rbushSource = await readFile(resolve(rootDir, "node_modules", "rbush", "index.js"), "utf8");
await writeFile(
  resolve(distDir, "assets", "vendor", "rbush.js"),
  rbushSource.replace("from 'quickselect';", `from '/assets/vendor/quickselect.js?v=${vendorVersion}';`),
  "utf8",
);
await cp(resolve(rootDir, "node_modules", "@cadview", "dwg", "dist", "index.js"), resolve(distDir, "assets", "vendor", "cadview-dwg.js"));
await cp(resolve(rootDir, "node_modules", "@cadview", "dwg", "dist", "libredwg.js"), resolve(distDir, "assets", "vendor", "libredwg.js"));
await cp(resolve(rootDir, "node_modules", "@cadview", "dwg", "dist", "libredwg.wasm"), resolve(distDir, "assets", "vendor", "libredwg.wasm"));
await cp(resolve(rootDir, "node_modules", "quickselect", "index.js"), resolve(distDir, "assets", "vendor", "quickselect.js"));
const copiedBrowserModules = new Set();
for (const entryModulePath of browserEntryModules) {
  await copyBrowserModule(entryModulePath, copiedBrowserModules);
}

await compressDistAssets();

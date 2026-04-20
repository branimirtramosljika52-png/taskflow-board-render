import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const distDir = resolve(rootDir, "dist");
const vendorVersion = "20260420i";

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
await cp(resolve(rootDir, "src", "main.js"), resolve(distDir, "src", "main.js"));
await cp(resolve(rootDir, "src", "auth-transitions.js"), resolve(distDir, "src", "auth-transitions.js"));
await cp(resolve(rootDir, "src", "measurementFormatting.js"), resolve(distDir, "src", "measurementFormatting.js"));
await cp(resolve(rootDir, "src", "measurementFormula.js"), resolve(distDir, "src", "measurementFormula.js"));
await cp(resolve(rootDir, "src", "request-access.js"), resolve(distDir, "src", "request-access.js"));
await cp(resolve(rootDir, "src", "learning-test.js"), resolve(distDir, "src", "learning-test.js"));
await cp(resolve(rootDir, "src", "safetyModel.js"), resolve(distDir, "src", "safetyModel.js"));

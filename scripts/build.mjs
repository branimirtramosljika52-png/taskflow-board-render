import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const distDir = resolve(rootDir, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(resolve(distDir, "src"), { recursive: true });
await mkdir(resolve(distDir, "assets"), { recursive: true });

await cp(resolve(rootDir, "index.html"), resolve(distDir, "index.html"));
await cp(resolve(rootDir, "learning-test.html"), resolve(distDir, "learning-test.html"));
await cp(resolve(rootDir, "request-access.html"), resolve(distDir, "request-access.html"));
await cp(resolve(rootDir, "styles.css"), resolve(distDir, "styles.css"));
await cp(resolve(rootDir, "assets", "safenexus-logo.png"), resolve(distDir, "assets", "safenexus-logo.png"));
await cp(resolve(rootDir, "assets", "safenexus-mark.png"), resolve(distDir, "assets", "safenexus-mark.png"));
await cp(resolve(rootDir, "src", "main.js"), resolve(distDir, "src", "main.js"));
await cp(resolve(rootDir, "src", "auth-transitions.js"), resolve(distDir, "src", "auth-transitions.js"));
await cp(resolve(rootDir, "src", "measurementFormatting.js"), resolve(distDir, "src", "measurementFormatting.js"));
await cp(resolve(rootDir, "src", "measurementFormula.js"), resolve(distDir, "src", "measurementFormula.js"));
await cp(resolve(rootDir, "src", "request-access.js"), resolve(distDir, "src", "request-access.js"));
await cp(resolve(rootDir, "src", "learning-test.js"), resolve(distDir, "src", "learning-test.js"));
await cp(resolve(rootDir, "src", "safetyModel.js"), resolve(distDir, "src", "safetyModel.js"));

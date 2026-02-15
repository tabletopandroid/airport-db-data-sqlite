import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const srcFile = path.join(rootDir, "src", "index.js");
const distDir = path.join(rootDir, "dist");
const distFile = path.join(distDir, "index.js");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.copyFileSync(srcFile, distFile);
console.log(`Copied ${srcFile} -> ${distFile}`);

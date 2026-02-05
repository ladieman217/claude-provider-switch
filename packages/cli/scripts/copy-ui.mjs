import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const uiDist = path.join(repoRoot, "packages", "ui", "dist");
const target = path.join(repoRoot, "packages", "cli", "dist", "ui");

const copyDir = async (src, dest) => {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
};

try {
  await fs.rm(target, { recursive: true, force: true });
  await copyDir(uiDist, target);
  console.log("Copied UI dist to CLI package.");
} catch (error) {
  console.error("Failed to copy UI dist. Did you run the UI build?", error);
  process.exitCode = 1;
}

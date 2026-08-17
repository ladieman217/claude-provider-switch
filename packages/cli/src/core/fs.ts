import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const readJsonFile = async <T>(filePath: string): Promise<T> => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
};

export const ensureOwnerOnlyFile = async (filePath: string) => {
  try {
    await fs.chmod(filePath, 0o600);
  } catch {
    // Ignore chmod errors on unsupported platforms/filesystems.
  }
};

export const writeFileAtomically = async (filePath: string, content: string) => {
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`
  );

  try {
    await fs.writeFile(tempPath, content, { encoding: "utf8", mode: 0o600 });
    await ensureOwnerOnlyFile(tempPath);
    await fs.rename(tempPath, filePath);
    await ensureOwnerOnlyFile(filePath);
  } finally {
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
  }
};

export const writeJsonFile = async (filePath: string, data: unknown) => {
  await writeFileAtomically(filePath, `${JSON.stringify(data, null, 2)}\n`);
};

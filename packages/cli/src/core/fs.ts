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

export const writeJsonFile = async (filePath: string, data: unknown) => {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${randomUUID()}.tmp`
  );

  try {
    await fs.writeFile(temporaryPath, content, { encoding: "utf8", mode: 0o600 });
    await fs.rename(temporaryPath, filePath);
    await ensureOwnerOnlyFile(filePath);
  } catch (error) {
    await fs.unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
};

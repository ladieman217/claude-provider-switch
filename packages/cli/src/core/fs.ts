import fs from "fs/promises";

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
  await fs.writeFile(filePath, content, { encoding: "utf8", mode: 0o600 });
  await ensureOwnerOnlyFile(filePath);
};

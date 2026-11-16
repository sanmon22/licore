import { db } from "../../../db/index.js";
import { systemConfig, SystemConfig } from "../../../db/schema.js";
import { eq } from "drizzle-orm";

export class SystemConfigService {
  async getAll(): Promise<SystemConfig[]> {
    return db.select().from(systemConfig);
  }

  async get(key: string): Promise<string | null> {
    const [record] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, key));
    return record?.value ?? null;
  }

  async getNumber(key: string, defaultValue = 0): Promise<number> {
    const val = await this.get(key);
    if (val === null) return defaultValue;
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  }

  async getBoolean(key: string, defaultValue = false): Promise<boolean> {
    const val = await this.get(key);
    if (val === null) return defaultValue;
    return val.toLowerCase() === "true" || val === "1";
  }

  async update(key: string, value: string): Promise<SystemConfig> {
    const [existing] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, key));

    if (!existing) {
      throw new Error(`Configuration key '${key}' not found`);
    }

    if (existing.type === "NUMBER" && isNaN(Number(value))) {
      throw new Error(`Configuration key '${key}' expects a numeric value`);
    }
    if (
      existing.type === "BOOLEAN" &&
      !["true", "false", "0", "1"].includes(value.toLowerCase())
    ) {
      throw new Error(`Configuration key '${key}' expects a boolean value ('true' or 'false')`);
    }

    const normalizedValue =
      existing.type === "BOOLEAN"
        ? value.toLowerCase() === "true" || value === "1"
          ? "true"
          : "false"
        : value;

    const now = new Date().toISOString();
    const [updated] = await db
      .update(systemConfig)
      .set({
        value: normalizedValue,
        updatedAt: now,
      })
      .where(eq(systemConfig.key, key))
      .returning();

    return updated;
  }
}

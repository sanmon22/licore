import { Response } from "express";
import { SystemConfigService } from "../services/system-config.service.js";
import { updateConfigSchema } from "../domain/system-config.types.js";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware.js";

const service = new SystemConfigService();

export class SystemConfigController {
  async getAllConfigs(_req: AuthenticatedRequest, res: Response) {
    try {
      const configs = await service.getAll();
      res.json(configs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const key = req.params.key as string;
      const parsed = updateConfigSchema.parse(req.body);
      const updated = await service.update(key, parsed.value);
      res.json(updated);
    } catch (err: any) {
      if (err.message?.includes("not found")) {
        return res.status(404).json({ error: err.message });
      }
      res.status(400).json({ error: err.message });
    }
  }
}

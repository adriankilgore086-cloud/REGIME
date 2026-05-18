import { Router, type IRouter } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validateBody";
import { createPresignedUpload } from "../services/r2";
import type { AuthenticatedRequest } from "../middleware/auth";
import crypto from "crypto";

const router: IRouter = Router();

const PresignBody = z.object({
  filename: z.string().min(1).max(256),
  contentType: z.string().regex(/^(image|video)\//),
});

router.post("/presign", validateBody(PresignBody), async (req, res) => {
  const { authUserId } = req as AuthenticatedRequest;
  const { filename, contentType } = req.body as z.infer<typeof PresignBody>;

  const ext = filename.split(".").pop() ?? "bin";
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const key = `uploads/${authUserId}/${uniqueId}.${ext}`;

  const result = await createPresignedUpload(key, contentType);

  if (!result) {
    res.status(503).json({
      error: "Media storage not configured",
      code: "R2_UNAVAILABLE",
    });
    return;
  }

  res.json(result);
});

export default router;

import { Router, type IRouter } from "express";
import { CreateHealthMetricBody } from "@workspace/api-zod";
import { validateBody } from "../middleware/validateBody";

const router: IRouter = Router();

router.get("/metrics", (_req, res) => {
  res.json({ metrics: [] });
});

router.post("/metrics", validateBody(CreateHealthMetricBody), (req, res) => {
  res.status(201).json(req.body);
});

export default router;

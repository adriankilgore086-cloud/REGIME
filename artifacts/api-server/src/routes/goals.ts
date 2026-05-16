import { Router, type IRouter } from "express";
import { CreateGoalBody, UpdateGoalBody } from "@workspace/api-zod";
import { validateBody } from "../middleware/validateBody";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  res.json({ goals: [] });
});

router.post("/", validateBody(CreateGoalBody), (req, res) => {
  res.status(201).json({
    id: `goal_${Date.now()}`,
    completed: false,
    ...req.body,
  });
});

router.patch("/:id", validateBody(UpdateGoalBody), (req, res) => {
  res.json({
    id: req.params.id,
    title: req.body.title ?? "Goal",
    targetValue: req.body.targetValue ?? 0,
    currentValue: req.body.currentValue ?? 0,
    unit: "units",
    category: "general",
    deadline: req.body.deadline ?? null,
    completed: req.body.completed ?? false,
    description: req.body.description,
    purpose: req.body.purpose,
  });
});

router.delete("/:id", (_req, res) => {
  res.status(204).send();
});

export default router;

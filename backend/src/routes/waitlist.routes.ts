import { Router } from "express";
import {
  createWaitlist,
  getMyWaitlist,
  cancelWaitlist,
} from "../controllers/waitlist.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, createWaitlist);
router.get("/my", authenticate, getMyWaitlist);
router.delete("/:id", authenticate, cancelWaitlist);

export default router;

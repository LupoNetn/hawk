import { Router } from "express";
import { handlerSignIn, handlerSignUp, handlerRefreshToken, handlerLogout, handlerGetMe } from "../controllers/auth.controller.js";
import { authenticateDashboard } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/signup", handlerSignUp);
router.post("/signin", handlerSignIn);
router.post("/refresh-token", handlerRefreshToken);
router.post("/logout", handlerLogout);
router.get("/me", authenticateDashboard, handlerGetMe);

export default router;
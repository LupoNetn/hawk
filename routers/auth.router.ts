import { Router } from "express";
import { handlerSignIn, handlerSignUp, handlerRefreshToken, handlerLogout } from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", handlerSignUp);
router.post("/signin", handlerSignIn);
router.post("/refresh-token", handlerRefreshToken);
router.post("/logout", handlerLogout);




export default router;
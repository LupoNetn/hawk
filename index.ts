import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import eventsRouter from "./routers/events.router.js";
import authRouter from "./routers/auth.router.js"
import webhookRouter from "./routers/webhook.router.js"
import { processDeliveryQueue, processEventsQueue } from "./workers/worker.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], 
    credentials: true
}));

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req: Request, res: Response) => {
    console.log("request bishh")
    res.send("ACTIVE SIR!!");
})


//setup routes
app.use("/events", eventsRouter);
app.use("/auth", authRouter);
app.use("/webhook", webhookRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    processEventsQueue();
    processDeliveryQueue();
})
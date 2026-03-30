import express, { Request, Response } from "express";
import dotenv from "dotenv";
import eventsRouter from "./routers/events.router.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req: Request, res: Response) => {
    console.log("request bishh")
    res.send("ACTIVE SIR!!");
})


//setup routes
app.use("/events", eventsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
import { Queue } from "bullmq";
import {redis} from "./redis.js"


export const EventQueue = new Queue("event-queue", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
})


export const DeliveryQueue = new Queue("delivery-queue", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
    },
})
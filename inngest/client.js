import { Inngest } from "inngest";

// Create a client to send and receive events.
// `id` should be unique for this project.
export const inngest = new Inngest({ id: "vm-store" });

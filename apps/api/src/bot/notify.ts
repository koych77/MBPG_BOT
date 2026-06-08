import { sendAdminNotification } from "./notifications.js";

export async function notifyAdmins(message: string) {
  await sendAdminNotification(message, { type: "admin_event" });
}

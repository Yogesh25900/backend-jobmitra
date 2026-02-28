import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { createNotification } from "../services/notification.service";

const router = Router();
const notificationController = new NotificationController();

router.get("/:userId", (req, res) =>
  notificationController.getUserNotifications(req, res)
);

router.post("/test/send/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('[TestEndpoint] Sending test notification to user:', userId);
    
    await createNotification({
      userId,
      title: "Test Notification",
      message: "This is a test notification from Socket.IO",
      type: "test",
    });
    
    res.status(200).json({
      success: true,
      message: "Test notification sent",
    });
  } catch (error: any) {
    console.error('[TestEndpoint] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

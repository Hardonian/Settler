/**
 * Chatbot Analytics Tracking
 * Tracks chatbot interactions, usage patterns, and user behavior
 */

export interface ChatbotEvent {
  type:
    | "chat_opened"
    | "chat_closed"
    | "message_sent"
    | "message_received"
    | "file_uploaded"
    | "error";
  data?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Track chatbot interaction
 */
export async function trackChatbotInteraction(
  type: ChatbotEvent["type"],
  data?: Record<string, any>
): Promise<void> {
  try {
    // Get device and session info
    const deviceInfo =
      typeof window !== "undefined"
        ? {
            device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "mobile" : "desktop",
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            url: window.location.href,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
          }
        : {};

    // Get or create session ID
    let sessionId =
      typeof window !== "undefined" ? localStorage.getItem("chatbot_session_id") : null;

    if (!sessionId && typeof window !== "undefined") {
      sessionId = `chatbot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("chatbot_session_id", sessionId);
    }

    await fetch("/api/analytics/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        data: {
          ...data,
          ...deviceInfo,
          sessionId,
        },
        timestamp: new Date().toISOString(),
      }),
    }).catch((error) => {
      console.error("Failed to track chatbot interaction:", error);
    });
  } catch (error) {
    console.error("Chatbot tracking error:", error);
  }
}

/**
 * Chat History Service
 * Manages persistent chat sessions per lecture in localStorage.
 * Each user's data is scoped by userId to prevent cross-user leakage.
 */

export interface ChatMessage {
  id: number;
  role: "user" | "ai";
  content: string;
  image?: string;
  timestamp: number;
}

export interface ChatSession {
  lectureId: string;
  lectureTitle: string;
  lectureType: "youtube" | "pdf" | "pptx" | "docx" | "audio" | "video" | "unknown";
  messages: ChatMessage[];
  lastUpdated: number;
  messageCount: number;
}

const ROOT_KEY = "luminary_chat_history";

function getRootKey(userId: string) {
  return `${ROOT_KEY}_${userId}`;
}

function getAllSessions(userId: string): Record<string, ChatSession> {
  try {
    const raw = localStorage.getItem(getRootKey(userId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ChatSession>;
  } catch {
    return {};
  }
}

function saveSessions(userId: string, sessions: Record<string, ChatSession>) {
  try {
    localStorage.setItem(getRootKey(userId), JSON.stringify(sessions));
  } catch (e) {
    console.error("[chatHistoryService] Failed to save sessions:", e);
  }
}

export const chatHistoryService = {
  /**
   * Get a specific lecture's chat session (or create an empty one).
   */
  getSession(userId: string, lectureId: string): ChatSession | null {
    const sessions = getAllSessions(userId);
    return sessions[lectureId] ?? null;
  },

  /**
   * Get ALL sessions for a user, sorted by lastUpdated desc.
   */
  getAllSessions(userId: string): ChatSession[] {
    const sessions = getAllSessions(userId);
    return Object.values(sessions).sort((a, b) => b.lastUpdated - a.lastUpdated);
  },

  /**
   * Save (upsert) messages for a lecture session.
   */
  saveMessages(
    userId: string,
    lectureId: string,
    lectureTitle: string,
    lectureType: ChatSession["lectureType"],
    messages: ChatMessage[]
  ) {
    const sessions = getAllSessions(userId);
    sessions[lectureId] = {
      lectureId,
      lectureTitle,
      lectureType,
      messages,
      lastUpdated: Date.now(),
      messageCount: messages.length,
    };
    saveSessions(userId, sessions);
  },

  /**
   * Clear all messages for a specific lecture session.
   */
  clearSession(userId: string, lectureId: string) {
    const sessions = getAllSessions(userId);
    delete sessions[lectureId];
    saveSessions(userId, sessions);
  },

  /**
   * Clear ALL sessions for a user.
   */
  clearAllSessions(userId: string) {
    localStorage.removeItem(getRootKey(userId));
  },

  /**
   * Get lecture type from Lecture sourceType field or title.
   */
  inferLectureType(sourceType?: string, title?: string): ChatSession["lectureType"] {
    if (sourceType === "pdf") return "pdf";
    if (sourceType === "pptx") return "pptx";
    if (sourceType === "docx") return "docx";
    if (sourceType === "youtube") return "youtube";
    if (sourceType === "audio") return "audio";
    if (sourceType === "video") return "video";
    // Fallback: check title extension
    if (title?.match(/\.pdf$/i)) return "pdf";
    if (title?.match(/\.(pptx?|ppsx)$/i)) return "pptx";
    if (title?.match(/\.(docx?|doc)$/i)) return "docx";
    return "unknown";
  },
};

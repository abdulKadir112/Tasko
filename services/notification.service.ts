import api from "@/config/api";

/* =========================================================
   NOTIFICATION TYPES
========================================================= */

export type NotificationType =
  | "general"
  | "chat"
  | "bid"
  | "job"
  | "booking";

/* =========================================================
   FIREBASE TIMESTAMP
========================================================= */

export type FirebaseTimestampLike = {
  seconds?: number;
  nanoseconds?: number;

  _seconds?: number;
  _nanoseconds?: number;
};

/* =========================================================
   NOTIFICATION
========================================================= */

export type Notification = {
  id: string;

  userId: string;

  title: string;

  body: string;

  type: NotificationType;

  /**
   * Related resources
   */
  jobId?: string | null;

  bidId?: string | null;

  chatId?: string | null;

  bookingId?: string | null;

  serviceId?: string | null;

  /**
   * Read status
   */
  isRead: boolean;

  /**
   * Firebase timestamp
   */
  createdAt?:
    | FirebaseTimestampLike
    | string
    | Date
    | null;

  updatedAt?:
    | FirebaseTimestampLike
    | string
    | Date
    | null;
};

/* =========================================================
   API RESPONSE TYPES
========================================================= */

export type NotificationListResponse = {
  success: boolean;

  message?: string;

  total?: number;

  unreadCount?: number;

  data: Notification[];
};

export type NotificationActionResponse = {
  success: boolean;

  message?: string;

  updatedCount?: number;
};

/* =========================================================
   SAVE / UPDATE FCM TOKEN
   ---------------------------------------------------------
   POST /api/users/fcm-token
========================================================= */

export async function saveFcmToken(
  fcmToken: string
): Promise<NotificationActionResponse> {
  const token = String(fcmToken || "").trim();

  if (!token) {
    throw new Error("FCM Token is required");
  }

  try {
    const response =
      await api.post<NotificationActionResponse>(
        "/users/fcm-token",
        { fcmToken: token }
      );

    return response.data;
  } catch (error: any) {
    console.error(
      "❌ SAVE FCM TOKEN ERROR =",
      error?.response?.data ||
        error?.message ||
        error
    );

    throw error;
  }
}

/* =========================================================
   GET MY NOTIFICATIONS
   ---------------------------------------------------------
   GET /api/notifications
========================================================= */

export async function getNotifications(): Promise<NotificationListResponse> {
  try {
    const response =
      await api.get<NotificationListResponse>(
        "/notifications"
      );

    const data = response.data;

    return {
      ...data,

      data:
        Array.isArray(data?.data)
          ? data.data
          : [],

      total:
        typeof data?.total === "number"
          ? data.total
          : Array.isArray(data?.data)
          ? data.data.length
          : 0,

      unreadCount:
        typeof data?.unreadCount === "number"
          ? data.unreadCount
          : Array.isArray(data?.data)
          ? data.data.filter(
              (notification) =>
                notification.isRead === false
            ).length
          : 0,
    };
  } catch (error: any) {
    console.error(
      "❌ GET NOTIFICATIONS ERROR =",
      error?.response?.data ||
        error?.message ||
        error
    );

    throw error;
  }
}

/* =========================================================
   GET UNREAD NOTIFICATION COUNT
   ---------------------------------------------------------
   Backend currently returns unreadCount from:
   GET /api/notifications
========================================================= */

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response =
      await api.get<NotificationListResponse>(
        "/notifications"
      );

    const data = response.data;

    if (
      typeof data?.unreadCount ===
      "number"
    ) {
      return data.unreadCount;
    }

    /**
     * Fallback:
     * যদি backend unreadCount না পাঠায়,
     * তাহলে frontend নিজে count করবে।
     */
    if (Array.isArray(data?.data)) {
      return data.data.filter(
        (notification) =>
          notification.isRead === false
      ).length;
    }

    return 0;
  } catch (error: any) {
    console.error(
      "❌ GET UNREAD COUNT ERROR =",
      error?.response?.data ||
        error?.message ||
        error
    );

    /**
     * Notification count fail করলে
     * পুরো app crash করা যাবে না।
     */
    return 0;
  }
}

/* =========================================================
   MARK SINGLE NOTIFICATION AS READ
   ---------------------------------------------------------
   PUT /api/notifications/:id/read
========================================================= */

export async function markNotificationAsRead(
  notificationId: string
): Promise<NotificationActionResponse> {
  const id =
    String(notificationId || "").trim();

  if (!id) {
    throw new Error(
      "Notification ID is required"
    );
  }

  try {
    const response =
      await api.put<NotificationActionResponse>(
        `/notifications/${encodeURIComponent(
          id
        )}/read`
      );

    return response.data;
  } catch (error: any) {
    console.error(
      "❌ MARK NOTIFICATION READ ERROR =",
      error?.response?.data ||
        error?.message ||
        error
    );

    throw error;
  }
}

/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
   ---------------------------------------------------------
   PUT /api/notifications/read-all
========================================================= */

export async function markAllNotificationsAsRead(): Promise<NotificationActionResponse> {
  try {
    const response =
      await api.put<NotificationActionResponse>(
        "/notifications/read-all"
      );

    return response.data;
  } catch (error: any) {
    console.error(
      "❌ MARK ALL NOTIFICATIONS READ ERROR =",
      error?.response?.data ||
        error?.message ||
        error
    );

    throw error;
  }
}

/* =========================================================
   DELETE NOTIFICATION
   ---------------------------------------------------------
   DELETE /api/notifications/:id
========================================================= */

export async function deleteNotification(
  notificationId: string
): Promise<NotificationActionResponse> {
  const id =
    String(notificationId || "").trim();

  if (!id) {
    throw new Error(
      "Notification ID is required"
    );
  }

  try {
    const response =
      await api.delete<NotificationActionResponse>(
        `/notifications/${encodeURIComponent(
          id
        )}`
      );

    return response.data;
  } catch (error: any) {
    console.error(
      "❌ DELETE NOTIFICATION ERROR =",
      error?.response?.data ||
        error?.message ||
        error
    );

    throw error;
  }
}

/* =========================================================
   HELPER — GET NOTIFICATION TIME
   ---------------------------------------------------------
   Firebase Timestamp / Date / string
   সব ধরনের createdAt handle করবে।
========================================================= */

export function getNotificationDate(
  createdAt:
    | FirebaseTimestampLike
    | string
    | Date
    | null
    | undefined
): Date | null {
  if (!createdAt) {
    return null;
  }

  /**
   * JS Date
   */
  if (createdAt instanceof Date) {
    return isNaN(createdAt.getTime())
      ? null
      : createdAt;
  }

  /**
   * Firebase Timestamp-like object
   *
   * { seconds, nanoseconds }
   */
  if (
    typeof createdAt === "object"
  ) {
    const seconds =
      createdAt.seconds ??
      createdAt._seconds;

    if (
      typeof seconds === "number"
    ) {
      const nanoseconds =
        createdAt.nanoseconds ??
        createdAt._nanoseconds ??
        0;

      const milliseconds =
        seconds * 1000 +
        Math.floor(
          nanoseconds / 1_000_000
        );

      const date =
        new Date(milliseconds);

      return isNaN(date.getTime())
        ? null
        : date;
    }
  }

  /**
   * String date
   */
  if (
    typeof createdAt === "string"
  ) {
    const date =
      new Date(createdAt);

    return isNaN(date.getTime())
      ? null
      : date;
  }

  return null;
}

/* =========================================================
   HELPER — FORMAT NOTIFICATION TIME
   ---------------------------------------------------------
   Example:
   Just now
   5 min ago
   2 hours ago
   Yesterday
   3 days ago
========================================================= */

export function formatNotificationTime(
  createdAt:
    | FirebaseTimestampLike
    | string
    | Date
    | null
    | undefined
): string {
  const date =
    getNotificationDate(
      createdAt
    );

  if (!date) {
    return "";
  }

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  /**
   * Future date
   */
  if (difference < 0) {
    return "Just now";
  }

  const seconds =
    Math.floor(
      difference / 1000
    );

  /**
   * Less than 1 minute
   */
  if (seconds < 60) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  /**
   * Less than 1 hour
   */
  if (minutes < 60) {
    return `${minutes} ${
      minutes === 1
        ? "min"
        : "mins"
    } ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  /**
   * Less than 24 hours
   */
  if (hours < 24) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    } ago`;
  }

  /**
   * Yesterday
   */
  if (hours < 48) {
    return "Yesterday";
  }

  const days =
    Math.floor(
      hours / 24
    );

  /**
   * Less than 7 days
   */
  if (days < 7) {
    return `${days} ${
      days === 1
        ? "day"
        : "days"
    } ago`;
  }

  /**
   * Older notifications
   */
  return date.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      year:
        date.getFullYear() !==
        now.getFullYear()
          ? "numeric"
          : undefined,
    }
  );
}

/* =========================================================
   HELPER — GET NOTIFICATION ICON
   ---------------------------------------------------------
   Notification type অনুযায়ী icon name।
========================================================= */

export function getNotificationIcon(
  type: NotificationType
): string {
  switch (type) {
    case "bid":
      return "hammer-outline";

    case "booking":
      return "calendar-outline";

    case "chat":
      return "chatbubble-outline";

    case "job":
      return "briefcase-outline";

    case "general":
    default:
      return "notifications-outline";
  }
}

/* =========================================================
   GET NOTIFICATION ICON COLOR
========================================================= */

export function getNotificationIconColor(
  type: NotificationType
): string {
  switch (type) {
    case "bid":
      return "#3B82F6";

    case "booking":
      return "#10B981";

    case "chat":
      return "#8B5CF6";

    case "job":
      return "#F59E0B";

    case "general":
    default:
      return "#64748B";
  }
};
import {
    useCallback,
    useEffect,
    useRef,
    useState,
  } from "react";
  
  import {
    Notification,
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } from "@/services/notification.service";
  
  /* =========================================================
     OPTIONS
  ========================================================= */
  
  type UseNotificationsOptions = {
    /**
     * Automatically load notifications when hook mounts.
     * Default: true
     */
    autoFetch?: boolean;
  
    /**
     * Automatically refresh unread count.
     * Default: true
     */
    enablePolling?: boolean;
  
    /**
     * Polling interval in milliseconds.
     * Default: 15000 = 15 seconds
     */
    pollingInterval?: number;
  };
  
  /* =========================================================
     HOOK
  ========================================================= */
  
  export function useNotifications(
    options: UseNotificationsOptions = {}
  ) {
    const {
      autoFetch = true,
      enablePolling = true,
      pollingInterval = 15000,
    } = options;
  
    /* =======================================================
       STATE
    ======================================================= */
  
    const [
      notifications,
      setNotifications,
    ] = useState<Notification[]>([]);
  
    const [
      unreadCount,
      setUnreadCount,
    ] = useState<number>(0);
  
    const [
      loading,
      setLoading,
    ] = useState<boolean>(false);
  
    const [
      refreshing,
      setRefreshing,
    ] = useState<boolean>(false);
  
    const [
      error,
      setError,
    ] = useState<string | null>(null);
  
    /* =======================================================
       REFS
    ======================================================= */
  
    const isMountedRef =
      useRef(true);
  
    const pollingRef =
      useRef<ReturnType<
        typeof setInterval
      > | null>(null);
  
    /* =======================================================
       CLEANUP
    ======================================================= */
  
    useEffect(() => {
      return () => {
        isMountedRef.current =
          false;
  
        if (pollingRef.current) {
          clearInterval(
            pollingRef.current
          );
  
          pollingRef.current =
            null;
        }
      };
    }, []);
  
    /* =======================================================
       FETCH NOTIFICATIONS
    ======================================================= */
  
    const fetchNotifications =
      useCallback(
        async (
          showLoader = true
        ) => {
          try {
            if (showLoader) {
              setLoading(true);
            }
  
            setError(null);
  
            const response =
              await getNotifications();
  
            if (!isMountedRef.current) {
              return;
            }
  
            const notificationList =
              Array.isArray(
                response?.data
              )
                ? response.data
                : [];
  
            setNotifications(
              notificationList
            );
  
            /**
             * Backend unreadCount থাকলে
             * সেটা ব্যবহার করবে।
             *
             * না থাকলে service fallback
             * count করে দেয়।
             */
            setUnreadCount(
              typeof response?.unreadCount ===
                "number"
                ? response.unreadCount
                : notificationList.filter(
                    (item) =>
                      item.isRead === false
                  ).length
            );
          } catch (err: any) {
            console.error(
              "❌ FETCH NOTIFICATIONS ERROR =",
              err?.response?.data ||
                err?.message ||
                err
            );
  
            if (!isMountedRef.current) {
              return;
            }
  
            setError(
              err?.response?.data?.message ||
                err?.message ||
                "Failed to load notifications"
            );
          } finally {
            if (
              isMountedRef.current &&
              showLoader
            ) {
              setLoading(false);
            }
          }
        },
        []
      );
  
    /* =======================================================
       REFRESH NOTIFICATIONS
    ======================================================= */
  
    const refreshNotifications =
      useCallback(async () => {
        try {
          setRefreshing(true);
          setError(null);
  
          const response =
            await getNotifications();
  
          if (!isMountedRef.current) {
            return;
          }
  
          const notificationList =
            Array.isArray(
              response?.data
            )
              ? response.data
              : [];
  
          setNotifications(
            notificationList
          );
  
          setUnreadCount(
            typeof response?.unreadCount ===
              "number"
              ? response.unreadCount
              : notificationList.filter(
                  (item) =>
                    item.isRead === false
                ).length
          );
        } catch (err: any) {
          console.error(
            "❌ REFRESH NOTIFICATIONS ERROR =",
            err?.response?.data ||
              err?.message ||
              err
          );
  
          if (!isMountedRef.current) {
            return;
          }
  
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to refresh notifications"
          );
        } finally {
          if (isMountedRef.current) {
            setRefreshing(false);
          }
        }
      }, []);
  
    /* =======================================================
       REFRESH ONLY UNREAD COUNT
    ======================================================= */
  
    const refreshUnreadCount =
      useCallback(async () => {
        try {
          const count =
            await getUnreadNotificationCount();
  
          if (!isMountedRef.current) {
            return;
          }
  
          setUnreadCount(
            Math.max(0, count)
          );
        } catch (err: any) {
          console.error(
            "❌ REFRESH UNREAD COUNT ERROR =",
            err?.response?.data ||
              err?.message ||
              err
          );
        }
      }, []);
  
    /* =======================================================
       MARK ONE NOTIFICATION AS READ
    ======================================================= */
  
    const markAsRead =
      useCallback(
        async (
          notificationId: string
        ) => {
          const id =
            String(
              notificationId || ""
            ).trim();
  
          if (!id) {
            return false;
          }
  
          /**
           * Optimistic UI update.
           *
           * User notification click করার সাথে
           * সাথে UI-তে read দেখাবে।
           */
          let wasUnread = false;
  
          setNotifications(
            (current) =>
              current.map(
                (notification) => {
                  if (
                    notification.id === id
                  ) {
                    wasUnread =
                      !notification.isRead;
  
                    return {
                      ...notification,
                      isRead: true,
                    };
                  }
  
                  return notification;
                }
              )
          );
  
          if (wasUnread) {
            setUnreadCount(
              (current) =>
                Math.max(
                  0,
                  current - 1
                )
            );
          }
  
          try {
            await markNotificationAsRead(
              id
            );
  
            return true;
          } catch (err: any) {
            console.error(
              "❌ MARK AS READ ERROR =",
              err?.response?.data ||
                err?.message ||
                err
            );
  
            /**
             * Backend request fail করলে
             * fresh data নিয়ে UI sync করা হবে।
             */
            await fetchNotifications(
              false
            );
  
            return false;
          }
        },
        [fetchNotifications]
      );
  
    /* =======================================================
       MARK ALL AS READ
    ======================================================= */
  
    const markAllAsRead =
      useCallback(async () => {
        /**
         * Optimistic UI
         */
        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                isRead: true,
              })
            )
        );
  
        setUnreadCount(0);
  
        try {
          await markAllNotificationsAsRead();
  
          return true;
        } catch (err: any) {
          console.error(
            "❌ MARK ALL AS READ ERROR =",
            err?.response?.data ||
              err?.message ||
              err
          );
  
          /**
           * Backend fail করলে
           * server state আবার fetch করবে।
           */
          await fetchNotifications(
            false
          );
  
          return false;
        }
      }, [fetchNotifications]);
  
    /* =======================================================
       DELETE NOTIFICATION
    ======================================================= */
  
    const removeNotification =
      useCallback(
        async (
          notificationId: string
        ) => {
          const id =
            String(
              notificationId || ""
            ).trim();
  
          if (!id) {
            return false;
          }
  
          /**
           * Optimistic delete
           */
          let deletedNotification:
            | Notification
            | undefined;
  
          setNotifications(
            (current) => {
              deletedNotification =
                current.find(
                  (notification) =>
                    notification.id === id
                );
  
              return current.filter(
                (notification) =>
                  notification.id !== id
              );
            }
          );
  
          /**
           * যদি notification unread ছিল,
           * unread count 1 কমবে।
           */
          if (
            deletedNotification &&
            !deletedNotification.isRead
          ) {
            setUnreadCount(
              (current) =>
                Math.max(
                  0,
                  current - 1
                )
            );
          }
  
          try {
            await deleteNotification(
              id
            );
  
            return true;
          } catch (err: any) {
            console.error(
              "❌ DELETE NOTIFICATION ERROR =",
              err?.response?.data ||
                err?.message ||
                err
            );
  
            /**
             * Backend delete fail করলে
             * server state restore করতে fetch।
             */
            await fetchNotifications(
              false
            );
  
            return false;
          }
        },
        [fetchNotifications]
      );
  
    /* =======================================================
       CLEAR ERROR
    ======================================================= */
  
    const clearError =
      useCallback(() => {
        setError(null);
      }, []);
  
    /* =======================================================
       AUTO FETCH
    ======================================================= */
  
    useEffect(() => {
      if (!autoFetch) {
        return;
      }
  
      fetchNotifications(true);
    }, [
      autoFetch,
      fetchNotifications,
    ]);
  
    /* =======================================================
       POLLING
       -------------------------------------------------------
       প্রতি 15 sec-এ শুধু unread count update করবে।
       পুরো notification list বারবার reload করবে না।
    ======================================================= */
  
    useEffect(() => {
      if (
        !enablePolling ||
        pollingInterval <= 0
      ) {
        return;
      }
  
      pollingRef.current =
        setInterval(() => {
          refreshUnreadCount();
        }, pollingInterval);
  
      return () => {
        if (pollingRef.current) {
          clearInterval(
            pollingRef.current
          );
  
          pollingRef.current =
            null;
        }
      };
    }, [
      enablePolling,
      pollingInterval,
      refreshUnreadCount,
    ]);
  
    /* =======================================================
       RETURN
    ======================================================= */
  
    return {
      /**
       * Data
       */
      notifications,
  
      unreadCount,
  
      /**
       * Loading states
       */
      loading,
  
      refreshing,
  
      /**
       * Error
       */
      error,
  
      /**
       * Fetch
       */
      fetchNotifications,
  
      refreshNotifications,
  
      refreshUnreadCount,
  
      /**
       * Actions
       */
      markAsRead,
  
      markAllAsRead,
  
      removeNotification,
  
      /**
       * Error helper
       */
      clearError,
  
      /**
       * Useful derived values
       */
      hasNotifications:
        notifications.length > 0,
  
      hasUnreadNotifications:
        unreadCount > 0,
    };
  }
  
  export default useNotifications;
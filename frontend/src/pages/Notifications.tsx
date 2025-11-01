import React, { useEffect, useState } from "react";
import apiClient from "../services/api";
import type { Notification } from "../types";

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get("/notifications");
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleString("ko-KR");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">알림</h1>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {notifications.length === 0 ? (
                  <li className="px-4 py-8 text-center text-gray-500">
                    알림이 없습니다.
                  </li>
                ) : (
                  notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`px-4 py-4 sm:px-6 ${
                        !notification.is_read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              !notification.is_read
                                ? "font-medium text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.message}
                          </p>
                          {notification.classroom_name && (
                            <p className="text-sm text-gray-500 mt-1">
                              {notification.classroom_name}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDateTime(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="ml-4 text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            읽음
                          </button>
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import type { Reservation } from "../../types";

export const ClassroomTimeline: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    if (!id) return;

    const fetchTimeline = async () => {
      try {
        const response = await apiClient.get(`/reservations/classroom/${id}`);
        setReservations(response.data.reservations);
      } catch (error) {
        console.error("Failed to fetch timeline:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    // 강의실 구독
    socket.emit("subscribe:classroom", parseInt(id));

    const handleReservationCreated = (newReservation: Reservation) => {
      setReservations((prev) =>
        [...prev, newReservation].sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
      );
    };

    const handleReservationCancelled = (data: { id: number }) => {
      setReservations((prev) => prev.filter((r) => r.id !== data.id));
    };

    socket.on("reservation:created", handleReservationCreated);
    socket.on("reservation:cancelled", handleReservationCancelled);

    return () => {
      socket.off("reservation:created", handleReservationCreated);
      socket.off("reservation:cancelled", handleReservationCancelled);
      socket.emit("unsubscribe:classroom", parseInt(id));
    };
  }, [socket, id]);

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            강의실 타임라인
          </h1>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {reservations.length === 0 ? (
                  <li className="px-4 py-8 text-center text-gray-500">
                    예약이 없습니다.
                  </li>
                ) : (
                  reservations.map((reservation) => (
                    <li key={reservation.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatTime(reservation.start_time)} -{" "}
                            {formatTime(reservation.end_time)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {reservation.user_name} ({reservation.student_id})
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          예약됨
                        </span>
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

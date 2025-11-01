import React, { useEffect, useState } from "react";
import apiClient from "../services/api";
import type { Reservation } from "../types";

export const MyReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await apiClient.get("/reservations/my");
      setReservations(response.data.reservations);
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("정말 취소하시겠습니까?")) return;

    try {
      await apiClient.delete(`/reservations/${id}`);
      alert("예약이 취소되었습니다.");
      fetchReservations();
    } catch (error: any) {
      console.error("Failed to cancel reservation:", error);
      alert(error.response?.data?.error || "예약 취소에 실패했습니다.");
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">내 예약</h1>

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
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {reservation.classroom_name}
                            </p>
                            <span className="ml-2 text-sm text-gray-500">
                              {reservation.location}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatDateTime(reservation.start_time)} -{" "}
                            {formatDateTime(reservation.end_time)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            예약됨
                          </span>
                          <button
                            onClick={() => handleCancel(reservation.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            취소
                          </button>
                        </div>
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

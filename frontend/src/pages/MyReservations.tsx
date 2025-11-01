import React, { useEffect, useState } from "react";
import apiClient from "../services/api";
import type { Reservation, Waitlist } from "../types";

export const MyReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reservationsRes, waitlistRes] = await Promise.all([
        apiClient.get("/reservations/my"),
        apiClient.get("/waitlist/my"),
      ]);
      setReservations(reservationsRes.data.reservations);
      setWaitlist(waitlistRes.data.waitlist);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id: number) => {
    if (!confirm("정말 취소하시겠습니까?")) return;

    try {
      await apiClient.delete(`/reservations/${id}`);
      alert("예약이 취소되었습니다.");
      fetchData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      console.error("Failed to cancel reservation:", error);
      alert(errorMessage || "예약 취소에 실패했습니다.");
    }
  };

  const handleCancelWaitlist = async (id: number) => {
    if (!confirm("대기 신청을 취소하시겠습니까?")) return;

    try {
      await apiClient.delete(`/waitlist/${id}`);
      alert("대기 신청이 취소되었습니다.");
      fetchData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      console.error("Failed to cancel waitlist:", error);
      alert(errorMessage || "대기 신청 취소에 실패했습니다.");
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
            <>
              {/* 예약 내역 */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">예약 내역</h2>
                </div>
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
                              onClick={() => handleCancelReservation(reservation.id)}
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

              {/* 대기 신청 내역 */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">대기 신청 내역</h2>
                </div>
                <ul className="divide-y divide-gray-200">
                  {waitlist.length === 0 ? (
                    <li className="px-4 py-8 text-center text-gray-500">
                      대기 신청이 없습니다.
                    </li>
                  ) : (
                    waitlist.map((item) => (
                      <li key={item.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900">
                                {item.classroom_name}
                              </p>
                              <span className="ml-2 text-sm text-gray-500">
                                {item.location}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {formatDateTime(item.start_time)} -{" "}
                              {formatDateTime(item.end_time)}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              대기 순위: {item.queue_position}번째
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              대기 중
                            </span>
                            <button
                              onClick={() => handleCancelWaitlist(item.id)}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

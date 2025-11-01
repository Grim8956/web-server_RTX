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
        // active 상태의 예약만 필터링
        const activeReservations = (response.data.reservations || []).filter(
          (r: Reservation) => r.status === 'active'
        );
        setReservations(activeReservations);
      } catch {
        // Error fetching timeline
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
      // 같은 강의실의 예약만 처리
      if (newReservation.classroom_id !== parseInt(id)) return;
      
      // active 상태의 예약만 추가
      if (newReservation.status === 'active' || !newReservation.status) {
        setReservations((prev) => {
          // 이미 존재하는 예약인지 확인 (같은 ID가 있으면 업데이트)
          const existingIndex = prev.findIndex(r => r.id === newReservation.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...newReservation, status: 'active' as const };
            return updated.sort(
              (a, b) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            );
          }
          // 새 예약 추가 (애니메이션을 위한 추가)
          return [...prev, { ...newReservation, status: 'active' as const }].sort(
            (a, b) =>
              new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          );
        });
      }
    };

    const handleReservationCancelled = (data: { id: number; classroom_id?: number; start_time?: string; end_time?: string }) => {
      // 같은 강의실의 예약만 처리
      if (data.classroom_id && data.classroom_id !== parseInt(id)) return;
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-sky-500 p-3 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                  강의실 타임라인
                </h1>
                <p className="text-gray-600 mt-1">강의실 예약 현황을 실시간으로 확인하세요</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500 mt-4">로딩 중...</p>
            </div>
          ) : (
            <div className="glass rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl border border-blue-100">
              <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-100">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-900">
                    예약 현황 ({reservations.length}개)
                  </h2>
                </div>
              </div>
              <ul className="divide-y divide-blue-50">
                {reservations.length === 0 ? (
                  <li className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500">예약이 없습니다.</p>
                  </li>
                ) : (
                  reservations.map((reservation, index) => (
                    <li 
                      key={reservation.id} 
                      className="px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 transition-all duration-200 animate-fadeIn"
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="bg-gradient-to-br from-blue-500 to-sky-500 p-2 rounded-lg">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-base font-semibold text-gray-900">
                                {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <p className="text-sm text-gray-600">
                                  {reservation.user_name} ({reservation.student_id})
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="badge badge-success animate-pulse-once">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
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

import React, { useState, useEffect } from "react";
import apiClient from "../services/api";
import type { Classroom } from "../types";
import { ReservationForm } from "../components/Reservation/ReservationForm";
import { useSocket } from "../context/SocketContext";
import type { Reservation } from "../types";

export const Search: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useState({
    date: "",
    startTime: "14",
    endTime: "15",
    minCapacity: "",
    hasProjector: false,
    hasWhiteboard: false,
  });

  // 0시부터 23시까지 선택 가능
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 선택 가능한 종료 시간 목록 (시작 시간보다 큰 시간만)
  const getAvailableEndHours = () => {
    const startNum = parseInt(searchParams.startTime);
    return hours.filter((hour) => hour > startNum);
  };

  // 시작 시간이 변경되면 종료 시간 유효성 검사
  useEffect(() => {
    const startNum = parseInt(searchParams.startTime);
    const endNum = parseInt(searchParams.endTime);

    // 종료 시간이 시작 시간보다 작거나 같으면 시작 시간 + 1시간으로 설정
    if (endNum <= startNum) {
      setSearchParams({
        ...searchParams,
        endTime: String(Math.min(startNum + 1, 23)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.startTime]);

  // Socket.IO를 통한 실시간 예약 상태 업데이트
  useEffect(() => {
    if (!socket) return;

    const handleReservationCreated = (newReservation: Reservation) => {
      // 예약이 생성되면 해당 강의실의 is_available을 false로 업데이트
      // 검색 조건과 예약 시간이 겹치는지 확인
      if (!searchParams.date || !newReservation.classroom_id) return;

      const reservationStart = new Date(newReservation.start_time);
      const reservationEnd = new Date(newReservation.end_time);
      const searchDate = new Date(searchParams.date);
      // 시간을 두 자리로 포맷팅 (0시 -> 00, 2시 -> 02)
      const formatHour = (hour: string) => String(parseInt(hour)).padStart(2, '0');
      const searchStart = new Date(`${searchParams.date}T${formatHour(searchParams.startTime)}:00:00`);
      const searchEnd = new Date(`${searchParams.date}T${formatHour(searchParams.endTime)}:00:00`);

      // 날짜가 일치하고 시간이 겹치는지 확인
      const isSameDate = 
        reservationStart.toDateString() === searchDate.toDateString();
      const isOverlapping = 
        reservationStart < searchEnd && reservationEnd > searchStart;

      if (isSameDate && isOverlapping) {
        setClassrooms((prev) =>
          prev.map((classroom) =>
            classroom.id === newReservation.classroom_id
              ? { ...classroom, is_available: false }
              : classroom
          )
        );
      }
    };

    const handleReservationCancelled = (data: { id: number; classroom_id: number; start_time: string; end_time: string }) => {
      // 예약이 취소되면 해당 강의실의 상태를 다시 확인해야 함
      // 검색 조건과 취소된 예약 시간이 겹치는지 확인
      if (!searchParams.date || !data.classroom_id) return;

      const cancelledStart = new Date(data.start_time);
      const cancelledEnd = new Date(data.end_time);
      const searchDate = new Date(searchParams.date);
      // 시간을 두 자리로 포맷팅 (0시 -> 00, 2시 -> 02)
      const formatHour = (hour: string) => String(parseInt(hour)).padStart(2, '0');
      const searchStart = new Date(`${searchParams.date}T${formatHour(searchParams.startTime)}:00:00`);
      const searchEnd = new Date(`${searchParams.date}T${formatHour(searchParams.endTime)}:00:00`);

      // 날짜가 일치하고 시간이 겹치는지 확인
      const isSameDate = 
        cancelledStart.toDateString() === searchDate.toDateString();
      const isOverlapping = 
        cancelledStart < searchEnd && cancelledEnd > searchStart;

      if (isSameDate && isOverlapping) {
        // 취소된 예약이 현재 검색 조건과 겹치면 해당 강의실을 다시 사용 가능으로 표시
        setClassrooms((prev) =>
          prev.map((classroom) =>
            classroom.id === data.classroom_id
              ? { ...classroom, is_available: true }
              : classroom
          )
        );
      }
    };

    // 모든 강의실 구독 (Search 페이지에서는 모든 강의실의 예약 상태를 확인해야 함)
    // 또는 검색된 강의실들만 구독할 수도 있지만, 여기서는 간단하게 전역 이벤트로 처리
    socket.on("reservation:created", handleReservationCreated);
    socket.on("reservation:cancelled", handleReservationCancelled);

    return () => {
      socket.off("reservation:created", handleReservationCreated);
      socket.off("reservation:cancelled", handleReservationCancelled);
    };
  }, [socket]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.date) {
      alert("날짜를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 시간을 두 자리로 포맷팅 (0시 -> 00, 2시 -> 02)
      const formatTime = (hour: string) => {
        const hourNum = parseInt(hour);
        return `${String(hourNum).padStart(2, '0')}:00:00`;
      };

      const params = new URLSearchParams({
        date: searchParams.date,
        startTime: formatTime(searchParams.startTime),
        endTime: formatTime(searchParams.endTime),
      });

      if (searchParams.minCapacity) {
        params.append("minCapacity", searchParams.minCapacity);
      }
      if (searchParams.hasProjector) {
        params.append("hasProjector", "true");
      }
      if (searchParams.hasWhiteboard) {
        params.append("hasWhiteboard", "true");
      }

      const response = await apiClient.get(
        `/classrooms/available?${params.toString()}`
      );
      setClassrooms(response.data.classrooms);
    } catch (error) {
      alert("검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const [isWaitlistMode, setIsWaitlistMode] = useState(false);

  const handleReserve = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setIsWaitlistMode(false);
  };

  const handleWaitlist = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setIsWaitlistMode(true);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-sky-500 p-3 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                  빈 강의실 검색
                </h1>
                <p className="text-gray-600 mt-1">원하는 시간과 조건으로 강의실을 검색하세요</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl shadow-xl overflow-hidden mb-6 backdrop-blur-xl border border-blue-100">
            <form onSubmit={handleSearch} className="p-6 bg-gradient-to-br from-white/90 to-blue-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 날짜
                  </label>
                  <input
                    type="date"
                    required
                    value={searchParams.date}
                    onChange={(e) =>
                      setSearchParams({ ...searchParams, date: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    max={
                      new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0]
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    시작 시간
                  </label>
                  <select
                    value={searchParams.startTime}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
                  >
                    {hours.map((hour) => (
                      <option key={hour} value={hour}>
                        {String(hour).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    종료 시간
                  </label>
                  <select
                    value={searchParams.endTime}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
                  >
                    {getAvailableEndHours().map((hour) => (
                      <option key={hour} value={hour}>
                        {String(hour).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    최소 수용인원
                  </label>
                  <input
                    type="number"
                    value={searchParams.minCapacity}
                    onChange={(e) =>
                      setSearchParams({
                        ...searchParams,
                        minCapacity: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
                    placeholder="선택사항"
                  />
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={searchParams.hasProjector}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          hasProjector: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      프로젝터
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={searchParams.hasWhiteboard}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          hasWhiteboard: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                      화이트보드
                    </span>
                  </label>
                </div>
              </div>
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      검색 중...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      검색하기
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {classrooms.length > 0 && (
            <div className="glass rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl border border-blue-100">
              <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-100">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-900">
                    검색 결과 ({classrooms.length}개)
                  </h2>
                </div>
              </div>
              <ul className="divide-y divide-blue-50">
                {classrooms.map((classroom, index) => (
                  <li key={classroom.id} className="animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 transition-all duration-200">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-4 flex-wrap">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              {classroom.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-1 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {classroom.location}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-sm font-medium text-blue-700">
                              {classroom.capacity}명
                            </span>
                          </div>
                          {classroom.is_available === false && (
                            <span className="badge badge-danger">
                              예약됨
                            </span>
                          )}
                          {classroom.has_projector && (
                            <span className="badge badge-primary">
                              프로젝터
                            </span>
                          )}
                          {classroom.has_whiteboard && (
                            <span className="badge badge-success">
                              화이트보드
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {classroom.is_available !== false ? (
                            <button
                              onClick={() => handleReserve(classroom)}
                              className="btn-gradient px-6 py-2 rounded-xl text-sm font-semibold shadow-md"
                            >
                              예약하기
                            </button>
                          ) : (
                            <button
                              onClick={() => handleWaitlist(classroom)}
                              className="px-6 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                            >
                              대기 신청
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedClassroom && (
            <div className="mt-6">
              <ReservationForm
                classroom={selectedClassroom}
                isWaitlist={isWaitlistMode}
                searchDate={searchParams.date}
                searchStartTime={searchParams.startTime}
                searchEndTime={searchParams.endTime}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

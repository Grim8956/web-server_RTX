import React, { useState, useEffect } from "react";
import apiClient from "../../services/api";
import type { Classroom } from "../../types";
import { useNavigate } from "react-router-dom";

interface ReservationFormProps {
  classroom: Classroom | null;
  isWaitlist?: boolean; // 대기 신청 모드 여부
  searchDate?: string; // 검색에서 선택한 날짜 (대기 신청 시)
  searchStartTime?: string; // 검색에서 선택한 시작 시간
  searchEndTime?: string; // 검색에서 선택한 종료 시간
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  classroom,
  isWaitlist = false,
  searchDate,
  searchStartTime,
  searchEndTime,
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(searchDate || "");
  const [startHour, setStartHour] = useState(searchStartTime || "14");
  const [endHour, setEndHour] = useState(searchEndTime || "15");
  const [participants, setParticipants] = useState("");
  const [loading, setLoading] = useState(false);

  // 0시부터 23시까지 선택 가능
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 시작 시간 변경 시 종료 시간 자동 조정
  const handleStartHourChange = (newStartHour: string) => {
    setStartHour(newStartHour);
    const startNum = parseInt(newStartHour);
    const endNum = parseInt(endHour);

    // 종료 시간이 시작 시간보다 작거나 같으면 시작 시간 + 1시간으로 설정
    if (endNum <= startNum) {
      setEndHour(String(Math.min(startNum + 1, 23)));
    }
  };

  // 선택 가능한 종료 시간 목록 (시작 시간보다 큰 시간만)
  const getAvailableEndHours = () => {
    const startNum = parseInt(startHour);
    return hours.filter((hour) => hour > startNum);
  };

  // 시작 시간이 변경되면 종료 시간 유효성 검사
  useEffect(() => {
    const startNum = parseInt(startHour);
    const endNum = parseInt(endHour);

    // 종료 시간이 시작 시간보다 작거나 같으면 시작 시간 + 1시간으로 설정
    if (endNum <= startNum) {
      setEndHour(String(Math.min(startNum + 1, 23)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startHour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classroom) {
      alert("강의실을 선택해주세요.");
      return;
    }

    if (!selectedDate) {
      alert("날짜를 선택해주세요.");
      return;
    }

    // 시간을 두 자리로 포맷팅 (0시 -> 00, 2시 -> 02)
    const formatHour = (hour: string) => {
      const hourNum = parseInt(hour);
      return String(hourNum).padStart(2, '0');
    };

    const startTime = new Date(`${selectedDate}T${formatHour(startHour)}:00:00`);
    const endTime = new Date(`${selectedDate}T${formatHour(endHour)}:00:00`);

    setLoading(true);

    try {
      if (isWaitlist) {
        // 대기 신청
        // 참여자 리스트 파싱
        const participantList = participants
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        await apiClient.post("/waitlist", {
          classroom_id: classroom.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          participants: participantList,
        });

        alert("대기 신청이 완료되었습니다!");
        navigate("/reservations");
      } else {
        // 일반 예약
        // 참여자 리스트 파싱
        const participantList = participants
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        await apiClient.post("/reservations", {
          classroom_id: classroom.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          participants: participantList,
        });

        alert("예약이 완료되었습니다!");
        navigate("/reservations");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      alert(errorMessage || `${isWaitlist ? "대기 신청" : "예약"}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl border border-blue-100 p-6 animate-fadeIn">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className={`p-2 rounded-lg ${isWaitlist ? 'bg-gradient-to-br from-sky-500 to-blue-600' : 'bg-gradient-to-br from-blue-500 to-sky-600'}`}>
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isWaitlist ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
            {isWaitlist ? "대기 신청하기" : "새 예약 만들기"}
          </h2>
        </div>
        {classroom && (
          <p className="text-sm text-gray-600 ml-11">
            {classroom.name} · {classroom.location} · 정원 {classroom.capacity}명
          </p>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            강의실
          </label>
          <input
            type="text"
            value={classroom?.name || ""}
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-blue-50 text-gray-700 font-medium"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            날짜
          </label>
          <input
            type="date"
            required
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            max={
              new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              시작 시간
            </label>
            <select
              required
              value={startHour}
              onChange={(e) => handleStartHourChange(e.target.value)}
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
              required
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
            >
              {getAvailableEndHours().map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            참여자 학번
          </label>
          <input
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder={`예) 2023001, 2023002 (미 입력시 본인만 ${isWaitlist ? "대기 신청" : "예약"})`}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
          />
          <p className="mt-1 text-xs text-gray-500">쉼표(,)로 구분하여 여러 학번을 입력하세요</p>
        </div>
        
        <button
          type="submit"
          disabled={loading || !classroom}
          className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            isWaitlist
              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700"
              : "btn-gradient"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isWaitlist ? "대기 신청 중..." : "예약 중..."}
            </span>
          ) : (
            <span className="flex items-center justify-center">
              {isWaitlist ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  대기 신청하기
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  예약하기
                </>
              )}
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

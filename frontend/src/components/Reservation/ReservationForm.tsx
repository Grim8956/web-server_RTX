import React, { useState } from "react";
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

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

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

    const startTime = new Date(`${selectedDate}T${startHour}:00`);
    const endTime = new Date(`${selectedDate}T${endHour}:00`);

    setLoading(true);

    try {
      if (isWaitlist) {
        // 대기 신청
        await apiClient.post("/waitlist", {
          classroom_id: classroom.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
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
      console.error(`Failed to ${isWaitlist ? "create waitlist" : "create reservation"}:`, error);
      alert(errorMessage || `${isWaitlist ? "대기 신청" : "예약"}에 실패했습니다.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {isWaitlist ? "대기 신청하기" : "새 예약 만들기"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            강의실
          </label>
          <input
            type="text"
            value={classroom?.name || ""}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            날짜
          </label>
          <input
            type="date"
            required
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            max={
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            시작 시간
          </label>
          <select
            required
            value={startHour}
            onChange={(e) => setStartHour(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {hours.map((hour) => (
              <option key={hour} value={hour}>
                {hour}:00
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            종료 시간
          </label>
          <select
            required
            value={endHour}
            onChange={(e) => setEndHour(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {hours.map((hour) => (
              <option key={hour} value={hour}>
                {hour}:00
              </option>
            ))}
          </select>
        </div>
        {!isWaitlist && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              참여자 학번 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="2023001, 2023002"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !classroom}
          className={`w-full px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 ${
            isWaitlist
              ? "bg-orange-600 text-white hover:bg-orange-700"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {loading
            ? isWaitlist
              ? "대기 신청 중..."
              : "예약 중..."
            : isWaitlist
            ? "대기 신청하기"
            : "예약하기"}
        </button>
      </form>
    </div>
  );
};

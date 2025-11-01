import React, { useState } from "react";
import apiClient from "../../services/api";
import type { Classroom } from "../../types";
import { useNavigate } from "react-router-dom";

interface ReservationFormProps {
  classroom: Classroom | null;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  classroom,
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [startHour, setStartHour] = useState("14");
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
    const endTime = new Date(`${selectedDate}T${parseInt(startHour) + 1}:00`);

    // 참여자 리스트 파싱
    const participantList = participants
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    setLoading(true);

    try {
      await apiClient.post("/reservations", {
        classroom_id: classroom.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        participants: participantList,
      });

      alert("예약이 완료되었습니다!");
      navigate("/reservations");
    } catch (error: any) {
      console.error("Failed to create reservation:", error);
      alert(error.response?.data?.error || "예약에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">새 예약 만들기</h2>
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
            시작 시간 (1시간 단위)
          </label>
          <select
            required
            value={startHour}
            onChange={(e) => setStartHour(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {hours.map((hour) => (
              <option key={hour} value={hour}>
                {hour}:00 - {hour + 1}:00
              </option>
            ))}
          </select>
        </div>
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
        <button
          type="submit"
          disabled={loading || !classroom}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "예약 중..." : "예약하기"}
        </button>
      </form>
    </div>
  );
};

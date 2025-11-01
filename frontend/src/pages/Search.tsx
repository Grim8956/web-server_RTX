import React, { useState } from "react";
import apiClient from "../services/api";
import type { Classroom } from "../types";
import { ReservationForm } from "../components/Reservation/ReservationForm";

export const Search: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    date: "",
    startTime: "14",
    endTime: "15",
    minCapacity: "",
    hasProjector: false,
    hasWhiteboard: false,
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.date) {
      alert("날짜를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        date: searchParams.date,
        startTime: `${searchParams.startTime}:00`,
        endTime: `${searchParams.endTime}:00`,
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
      console.error("Failed to search classrooms:", error);
      alert("검색에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            빈 강의실 검색
          </h1>

          <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
            <form onSubmit={handleSearch} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    날짜
                  </label>
                  <input
                    type="date"
                    required
                    value={searchParams.date}
                    onChange={(e) =>
                      setSearchParams({ ...searchParams, date: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {hours.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {hours.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      checked={searchParams.hasProjector}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          hasProjector: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      프로젝터
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      checked={searchParams.hasWhiteboard}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          hasWhiteboard: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      화이트보드
                    </span>
                  </label>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "검색 중..." : "검색"}
                </button>
              </div>
            </form>
          </div>

          {classrooms.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  예약 가능한 강의실 ({classrooms.length}개)
                </h2>
              </div>
              <ul className="divide-y divide-gray-200">
                {classrooms.map((classroom) => (
                  <li key={classroom.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {classroom.name}
                          </p>
                          <p className="ml-2 text-sm text-gray-500">
                            {classroom.location}
                          </p>
                          <span className="ml-4 text-sm text-gray-500">
                            정원: {classroom.capacity}명
                          </span>
                          {classroom.has_projector && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              프로젝터
                            </span>
                          )}
                          {classroom.has_whiteboard && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              화이트보드
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleReserve(classroom)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          예약하기
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedClassroom && (
            <div className="mt-6">
              <ReservationForm classroom={selectedClassroom} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

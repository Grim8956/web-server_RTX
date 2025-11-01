import React, { useEffect, useState } from "react";
import apiClient from "../services/api";

interface TopClassroom {
  id: number;
  name: string;
  location: string;
  reservation_count: number;
}

export const Statistics: React.FC = () => {
  const [topClassrooms, setTopClassrooms] = useState<TopClassroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await apiClient.get("/statistics/top-classrooms");
      setTopClassrooms(response.data.topClassrooms);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxCount =
    topClassrooms.length > 0 ? topClassrooms[0].reservation_count : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">통계</h1>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  인기 강의실 Top 5
                </h2>
              </div>
              <ul className="divide-y divide-gray-200">
                {topClassrooms.length === 0 ? (
                  <li className="px-4 py-8 text-center text-gray-500">
                    데이터가 없습니다.
                  </li>
                ) : (
                  topClassrooms.map((classroom, index) => (
                    <li key={classroom.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-indigo-600 mr-4">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {classroom.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {classroom.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            예약 {classroom.reservation_count}건
                          </span>
                          <div className="w-48 bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-indigo-600 h-4 rounded-full"
                              style={{
                                width: `${
                                  (classroom.reservation_count / maxCount) * 100
                                }%`,
                              }}
                            ></div>
                          </div>
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

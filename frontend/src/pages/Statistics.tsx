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
    } finally {
      setLoading(false);
    }
  };

  const maxCount =
    topClassrooms.length > 0 ? topClassrooms[0].reservation_count : 1;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-sky-500 p-3 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                  통계
                </h1>
                <p className="text-gray-600 mt-1">강의실 예약 통계를 확인하세요</p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-900">인기 강의실 Top 5</h2>
                </div>
              </div>
              <ul className="divide-y divide-blue-50">
                {topClassrooms.length === 0 ? (
                  <li className="px-6 py-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">데이터가 없습니다.</p>
                  </li>
                ) : (
                  topClassrooms.map((classroom, index) => (
                    <li key={classroom.id} className="px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 transition-all duration-200 animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                            'bg-gradient-to-br from-blue-500 to-sky-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              {classroom.name}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {classroom.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <span className="text-sm font-medium text-gray-700">
                            예약 <span className="text-blue-600 font-bold">{classroom.reservation_count}</span>건
                          </span>
                          <div className="w-48 bg-blue-100 rounded-full h-3 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-sky-600 h-3 rounded-full shadow-md transition-all duration-500"
                              style={{
                                width: `${(classroom.reservation_count / maxCount) * 100}%`,
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

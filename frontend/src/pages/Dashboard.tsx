import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/api";
import type { Classroom } from "../types";
import { Link } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await apiClient.get("/classrooms");
        setClassrooms(response.data.classrooms);
      } catch (error) {
        console.error("Failed to fetch classrooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {user?.role === "admin" ? "관리자 대시보드" : "강의실 예약 시스템"}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link
              to="/search"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        빈 강의실 검색
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        강의실 찾기
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/reservations"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        내 예약
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        예약 관리
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <Link
              to="/notifications"
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        알림
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        알림 확인
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">강의실 목록</h2>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {classrooms.map((classroom) => (
                  <li key={classroom.id}>
                    <Link
                      to={`/classrooms/${classroom.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {classroom.name}
                            </p>
                            <p className="ml-2 text-sm text-gray-500">
                              {classroom.location}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                정원:
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {classroom.capacity}명
                              </span>
                            </div>
                            {classroom.has_projector && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                프로젝터
                              </span>
                            )}
                            {classroom.has_whiteboard && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                화이트보드
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

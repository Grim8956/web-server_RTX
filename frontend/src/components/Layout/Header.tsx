import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold text-indigo-600">
              강의실 예약 시스템
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-700">
                  {user.name} ({user.role === "admin" ? "관리자" : "학생"})
                </span>
                {user.role === "admin" && (
                  <>
                    <Link
                      to="/admin/classrooms"
                      className="text-sm text-gray-700 hover:text-indigo-600"
                    >
                      강의실 관리
                    </Link>
                    <Link
                      to="/admin/statistics"
                      className="text-sm text-gray-700 hover:text-indigo-600"
                    >
                      통계
                    </Link>
                  </>
                )}
                <Link
                  to="/reservations"
                  className="text-sm text-gray-700 hover:text-indigo-600"
                >
                  내 예약
                </Link>
                <Link
                  to="/search"
                  className="text-sm text-gray-700 hover:text-indigo-600"
                >
                  빈 강의실 검색
                </Link>
                <Link
                  to="/notifications"
                  className="text-sm text-gray-700 hover:text-indigo-600"
                >
                  알림
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  로그아웃
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

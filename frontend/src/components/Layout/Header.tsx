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
    <header className="glass shadow-lg sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-sky-700 transition-all duration-300 flex items-center space-x-2"
            >
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>강의실 예약 시스템</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm font-medium text-gray-700 px-3 py-1 rounded-full bg-gray-100">
                  {user.name} ({user.role === "admin" ? "관리자" : "학생"})
                </span>
                {user.role === "admin" && (
                  <>
                    <Link
                      to="/admin/classrooms"
                      className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                    >
                      강의실 관리
                    </Link>
                    <Link
                      to="/admin/statistics"
                      className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                    >
                      통계
                    </Link>
                  </>
                )}
                <Link
                  to="/reservations"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                >
                  내 예약
                </Link>
                <Link
                  to="/search"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                >
                  빈 강의실 검색
                </Link>
                <Link
                  to="/notifications"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 transition-all duration-200 relative"
                >
                  알림
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 rounded-lg hover:from-rose-600 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-200"
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

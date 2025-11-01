import React, { useEffect, useState } from "react";
import apiClient from "../../services/api";
import type { Classroom } from "../../types";

export const ClassroomManagement: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity: "",
    has_projector: false,
    has_whiteboard: false,
  });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await apiClient.get("/classrooms");
      setClassrooms(response.data.classrooms);
    } catch (error) {
      console.error("Failed to fetch classrooms:", error);
      alert("강의실 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClassroom) {
        await apiClient.put(`/classrooms/${editingClassroom.id}`, formData);
        alert("강의실이 수정되었습니다.");
      } else {
        await apiClient.post("/classrooms", formData);
        alert("강의실이 생성되었습니다.");
      }
      setShowModal(false);
      resetForm();
      fetchClassrooms();
    } catch (error: any) {
      console.error("Failed to save classroom:", error);
      alert(error.response?.data?.error || "강의실 저장에 실패했습니다.");
    }
  };

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setFormData({
      name: classroom.name,
      location: classroom.location,
      capacity: classroom.capacity.toString(),
      has_projector: classroom.has_projector,
      has_whiteboard: classroom.has_whiteboard,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await apiClient.delete(`/classrooms/${id}`);
      alert("강의실이 삭제되었습니다.");
      fetchClassrooms();
    } catch (error: any) {
      console.error("Failed to delete classroom:", error);
      alert(error.response?.data?.error || "강의실 삭제에 실패했습니다.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      capacity: "",
      has_projector: false,
      has_whiteboard: false,
    });
    setEditingClassroom(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">강의실 관리</h1>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              강의실 추가
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {classrooms.map((classroom) => (
                  <li key={classroom.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {classroom.name}
                          </p>
                          <p className="ml-4 text-sm text-gray-500">
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
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(classroom)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(classroom.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingClassroom ? "강의실 수정" : "강의실 추가"}
                  </h3>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        강의실 이름
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        위치
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        수용인원
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, capacity: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.has_projector}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              has_projector: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          프로젝터
                        </span>
                      </label>
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.has_whiteboard}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              has_whiteboard: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          화이트보드
                        </span>
                      </label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        저장
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

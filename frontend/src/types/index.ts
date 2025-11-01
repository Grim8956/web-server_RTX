export interface User {
  id: number;
  student_id: string;
  name: string;
  role: "student" | "admin";
}

export interface Classroom {
  id: number;
  name: string;
  location: string;
  capacity: number;
  has_projector: boolean;
  has_whiteboard: boolean;
  is_available?: boolean; // 예약 가능 여부 (getAvailableClassrooms에서만 제공)
}

export interface Reservation {
  id: number;
  classroom_id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  status: "active" | "cancelled";
  classroom_name?: string;
  location?: string;
  user_name?: string;
  student_id?: string;
}

export interface Waitlist {
  id: number;
  classroom_id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  queue_position: number;
  status: "waiting" | "assigned" | "cancelled";
  classroom_name?: string;
  location?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  reservation_id: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
  start_time?: string;
  classroom_name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

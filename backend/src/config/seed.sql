-- 강의실 예약 시스템 테스트 데이터

-- 강의실 데이터 삽입
INSERT INTO classrooms (name, location, capacity, has_projector, has_whiteboard) VALUES
('101호', '본관 1층', 30, 1, 1),
('102호', '본관 1층', 50, 1, 1),
('201호', '본관 2층', 40, 1, 0),
('202호', '본관 2층', 60, 1, 1),
('301호', '본관 3층', 20, 0, 1),
('세미나실 A', '별관 B1층', 15, 1, 0),
('세미나실 B', '별관 B1층', 15, 0, 1),
('대강당', '본관 1층', 200, 1, 0),
('멀티미디어실', '본관 2층', 80, 1, 1),
('토의실', '본관 4층', 10, 0, 1);

-- 테스트 학생 계정 (비밀번호: test1234)
-- 모든 학생 계정의 비밀번호가 동일합니다 (test1234)
INSERT INTO users (student_id, password, name, role) VALUES
('2023001', '$2b$10$IxXBy909Fjv4ieEt4o2nge5gzOz9mCK.0uFcNYgVgFT3htZojZbtW', '김학생', 'student'),
('2023002', '$2b$10$IxXBy909Fjv4ieEt4o2nge5gzOz9mCK.0uFcNYgVgFT3htZojZbtW', '이학생', 'student'),
('2023003', '$2b$10$IxXBy909Fjv4ieEt4o2nge5gzOz9mCK.0uFcNYgVgFT3htZojZbtW', '박학생', 'student'),
('2023004', '$2b$10$IxXBy909Fjv4ieEt4o2nge5gzOz9mCK.0uFcNYgVgFT3htZojZbtW', '최학생', 'student'),
('2023005', '$2b$10$IxXBy909Fjv4ieEt4o2nge5gzOz9mCK.0uFcNYgVgFT3htZojZbtW', '정학생', 'student');

-- 오늘 날짜 기준으로 예약 테스트 데이터
-- 예약 데이터 (현재 시간 기준으로 미래 시간으로 설정)
INSERT INTO reservations (classroom_id, user_id, start_time, end_time, status) VALUES
-- 오늘 오후 예약
(1, 1, DATE_FORMAT(CURDATE(), '%Y-%m-%d 14:00:00'), DATE_FORMAT(CURDATE(), '%Y-%m-%d 15:00:00'), 'active'),
(2, 2, DATE_FORMAT(CURDATE(), '%Y-%m-%d 15:00:00'), DATE_FORMAT(CURDATE(), '%Y-%m-%d 16:00:00'), 'active'),
(3, 3, DATE_FORMAT(CURDATE(), '%Y-%m-%d 16:00:00'), DATE_FORMAT(CURDATE(), '%Y-%m-%d 17:00:00'), 'active'),

-- 내일 예약
(1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 10 HOUR, 'active'),
(2, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 10 HOUR, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 11 HOUR, 'active'),
(3, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 11 HOUR, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 12 HOUR, 'active'),
(4, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 13 HOUR, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 14 HOUR, 'active'),
(5, 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 14 HOUR, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 15 HOUR, 'active'),

-- 모레 예약
(6, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 9 HOUR, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 10 HOUR, 'active'),
(7, 2, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 10 HOUR, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 11 HOUR, 'active'),

-- 3일 후 예약
(8, 1, DATE_ADD(CURDATE(), INTERVAL 3 DAY) + INTERVAL 13 HOUR, DATE_ADD(CURDATE(), INTERVAL 3 DAY) + INTERVAL 14 HOUR, 'active'),

-- 취소된 예약 (예시)
(9, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 14 HOUR, DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 15 HOUR, 'cancelled');

-- 그룹 예약 참여자 데이터
INSERT INTO reservation_participants (reservation_id, user_id) VALUES
(1, 2),  -- 2023001의 예약에 2023002 참여
(1, 3),  -- 2023001의 예약에 2023003 참여
(2, 4),  -- 2023002의 예약에 2023004 참여
(4, 5);  -- 2023001의 예약에 2023005 참여

-- 알림 데이터 (테스트용)
INSERT INTO notifications (user_id, reservation_id, message) VALUES
(1, 1, '강의실 예약이 30분 후 시작됩니다.'),
(2, 2, '강의실 예약이 30분 후 시작됩니다.'),
(1, 1, '강의실 예약이 30분 후 시작됩니다. (참여자)'),
(2, 1, '강의실 예약이 30분 후 시작됩니다. (참여자)');

-- 대기열 데이터 (테스트용)
INSERT INTO waitlist (classroom_id, user_id, start_time, end_time, queue_position, status) VALUES
-- 101호 14:00 예약이 꽉 참 - 대기 신청
(1, 4, DATE_FORMAT(CURDATE(), '%Y-%m-%d 14:00:00'), DATE_FORMAT(CURDATE(), '%Y-%m-%d 15:00:00'), 1, 'waiting'),
(1, 5, DATE_FORMAT(CURDATE(), '%Y-%m-%d 14:00:00'), DATE_FORMAT(CURDATE(), '%Y-%m-%d 15:00:00'), 2, 'waiting');

-- 성공적으로 할당된 대기열 (예시)
INSERT INTO waitlist (classroom_id, user_id, start_time, end_time, queue_position, status) VALUES
(2, 3, DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 15 HOUR, DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 16 HOUR, 1, 'assigned');


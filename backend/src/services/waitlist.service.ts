import pool from "../config/database";
import { io } from "../server";

/**
 * 빈 시간 범위를 채울 수 있는 대기 신청 찾기
 */
async function findAvailableWaitlist(
  classroom_id: number,
  available_start: Date,
  available_end: Date
): Promise<any[]> {
  const [waitlistItems] = (await pool.execute(
    `SELECT * FROM waitlist 
     WHERE classroom_id = ? 
     AND status = 'waiting'
     AND start_time >= ? 
     AND end_time <= ?
     ORDER BY created_at ASC, queue_position ASC`,
    [classroom_id, available_start, available_end]
  )) as any;

  return waitlistItems;
}

/**
 * 시간 범위가 겹치는지 확인
 */
function isOverlapping(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * 예약 생성 및 대기 상태 업데이트
 */
async function createReservationFromWaitlist(
  waitlistItem: any,
  reservation_start: Date,
  reservation_end: Date
): Promise<number> {
  // 예약 생성
  const [result] = (await pool.execute(
    "INSERT INTO reservations (classroom_id, user_id, start_time, end_time) VALUES (?, ?, ?, ?)",
    [
      waitlistItem.classroom_id,
      waitlistItem.user_id,
      reservation_start,
      reservation_end,
    ]
  )) as any;

  // 대기열 상태 변경
  await pool.execute("UPDATE waitlist SET status = ? WHERE id = ?", [
    "assigned",
    waitlistItem.id,
  ]);

  // 알림 생성
  await pool.execute(
    "INSERT INTO notifications (user_id, reservation_id, message) VALUES (?, ?, ?)",
    [
      waitlistItem.user_id,
      result.insertId,
      "대기 중이던 예약이 자동으로 할당되었습니다.",
    ]
  );

  // Socket.io로 실시간 브로드캐스트
  io.to(`classroom:${waitlistItem.classroom_id}`).emit("reservation:created", {
    id: result.insertId,
    classroom_id: waitlistItem.classroom_id,
    user_id: waitlistItem.user_id,
    start_time: reservation_start,
    end_time: reservation_end,
  });

  return result.insertId;
}

/**
 * 빈 시간 범위를 대기 신청으로 채우기 (재귀적)
 */
async function fillAvailableTime(
  classroom_id: number,
  available_start: Date,
  available_end: Date
): Promise<number[]> {
  const assignedIds: number[] = [];

  // 빈 시간 범위 내의 모든 대기 신청 조회
  const waitlistItems = await findAvailableWaitlist(
    classroom_id,
    available_start,
    available_end
  );

  if (waitlistItems.length === 0) {
    return assignedIds;
  }

  // 활성 예약 조회하여 실제로 사용 가능한 시간 범위 확인
  const [existingReservations] = (await pool.execute(
    `SELECT start_time, end_time FROM reservations 
     WHERE classroom_id = ? 
     AND status = 'active'
     AND (
       (start_time < ? AND end_time > ?) OR
       (start_time >= ? AND start_time < ?) OR
       (end_time > ? AND end_time <= ?)
     )`,
    [
      classroom_id,
      available_end,
      available_start,
      available_start,
      available_end,
      available_start,
      available_end,
    ]
  )) as any;

  // 각 대기 신청을 순서대로 처리
  for (const waitlistItem of waitlistItems) {
    const wait_start = new Date(waitlistItem.start_time);
    const wait_end = new Date(waitlistItem.end_time);

    // 대기 신청 시간이 현재 빈 시간 범위 내에 완전히 포함되는지 확인
    if (wait_start < available_start || wait_end > available_end) {
      continue;
    }

    // 기존 예약과 겹치는지 확인
    let canAssign = true;
    for (const reservation of existingReservations) {
      const res_start = new Date(reservation.start_time);
      const res_end = new Date(reservation.end_time);
      if (isOverlapping(wait_start, wait_end, res_start, res_end)) {
        canAssign = false;
        break;
      }
    }

    // 겹치지 않으면 예약 생성
    if (canAssign) {
      const reservationId = await createReservationFromWaitlist(
        waitlistItem,
        wait_start,
        wait_end
      );
      assignedIds.push(reservationId);

      // 새로 생성된 예약을 기존 예약 목록에 추가 (다음 반복에서 겹침 체크용)
      existingReservations.push({
        start_time: wait_start,
        end_time: wait_end,
      });
    }
  }

  return assignedIds;
}

export async function assignWaitlistItem(
  classroom_id: number,
  start_time: Date,
  end_time: Date
) {
  try {
    // 취소된 예약 시간 범위를 채울 수 있는 모든 대기 신청 처리
    const assignedIds = await fillAvailableTime(
      classroom_id,
      start_time,
      end_time
    );

    return assignedIds.length > 0 ? assignedIds[0] : null;
  } catch (error: any) {
    console.error("Assign waitlist error:", error);
    return null;
  }
}

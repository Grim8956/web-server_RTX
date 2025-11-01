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
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 예약 생성 직전에 최종 검증 (동시성 문제 완전 방지)
    const [finalCheck] = (await connection.execute(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE user_id = ? 
       AND status = 'active' 
       AND end_time > NOW()
       FOR UPDATE`,
      [waitlistItem.user_id]
    )) as any;

    if (finalCheck[0].count >= 3) {
      await connection.rollback();
      connection.release();
      throw new Error('User already has 3 active reservations');
    }
    
    // 예약 생성
    const [result] = (await connection.execute(
      "INSERT INTO reservations (classroom_id, user_id, start_time, end_time) VALUES (?, ?, ?, ?)",
      [
        waitlistItem.classroom_id,
        waitlistItem.user_id,
        reservation_start,
        reservation_end,
      ]
    )) as any;

    const reservationId = result.insertId;

    // 참여자 추가 (waitlist의 participants에서 가져옴)
    if (waitlistItem.participants) {
      try {
        const participantList = typeof waitlistItem.participants === 'string'
          ? JSON.parse(waitlistItem.participants)
          : waitlistItem.participants;

        if (Array.isArray(participantList) && participantList.length > 0) {
          for (const studentId of participantList) {
            const [users] = (await connection.execute(
              "SELECT id FROM users WHERE student_id = ?",
              [studentId]
            )) as any;

            if (users.length > 0) {
              const participantUserId = users[0].id;
              
              // 참여자의 활성 예약 개수 확인
              const [participantAsOwner] = (await connection.execute(
                `SELECT COUNT(*) as count FROM reservations 
                 WHERE user_id = ? 
                 AND status = 'active' 
                 AND end_time > NOW()
                 FOR UPDATE`,
                [participantUserId]
              )) as any;

              const ownerCount = participantAsOwner[0].count || 0;

              // 참여자가 참여자로 참여하고 있는 활성 예약 개수 확인
              const [participantAsParticipant] = (await connection.execute(
                `SELECT COUNT(DISTINCT r.id) as count 
                 FROM reservation_participants rp
                 JOIN reservations r ON rp.reservation_id = r.id
                 WHERE rp.user_id = ? 
                 AND r.status = 'active' 
                 AND r.end_time > NOW()
                 FOR UPDATE`,
                [participantUserId]
              )) as any;

              const participantCount = participantAsParticipant[0].count || 0;
              
              // 총 활성 예약 수 (예약자로 + 참여자로) + 현재 추가되는 예약 1개
              const totalActiveReservations = ownerCount + participantCount;
              
              // 현재 추가되는 예약으로 인해 3개를 초과하면 차단
              if (totalActiveReservations >= 3) {
                await connection.rollback();
                connection.release();
                throw new Error(`Participant ${studentId} already has ${totalActiveReservations} active reservations`);
              }
              
              await connection.execute(
                "INSERT INTO reservation_participants (reservation_id, user_id) VALUES (?, ?)",
                [reservationId, participantUserId]
              );
            }
          }
        }
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    }

    // 대기열 상태 변경
    await connection.execute("UPDATE waitlist SET status = ? WHERE id = ?", [
      "assigned",
      waitlistItem.id,
    ]);

    // 알림 생성
    await connection.execute(
      "INSERT INTO notifications (user_id, reservation_id, message) VALUES (?, ?, ?)",
      [
        waitlistItem.user_id,
        reservationId,
        "대기 중이던 예약이 자동으로 할당되었습니다.",
      ]
    );

    await connection.commit();
    connection.release();

    // 예약 정보를 조회하여 완전한 데이터로 브로드캐스트
    const [reservations] = await pool.execute(
      `SELECT r.*, c.name as classroom_name, c.location, u.name as user_name, u.student_id
       FROM reservations r 
       JOIN classrooms c ON r.classroom_id = c.id 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = ?`,
      [reservationId]
    ) as any;

    // Socket.io로 실시간 브로드캐스트
    if (reservations && reservations.length > 0) {
      io.to(`classroom:${waitlistItem.classroom_id}`).emit(
        "reservation:created",
        reservations[0]
      );
    }

    return reservationId;
  } catch (error) {
    await connection.rollback().catch(() => {});
    connection.release();
    throw error;
  }
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

    // 사용자의 현재 활성 예약 개수 확인 (3개 제한 체크) - 트랜잭션 없이 확인만 (실제 검증은 createReservationFromWaitlist에서)
    // 주의: 여기서는 대략적인 확인만 하고, 실제 검증은 createReservationFromWaitlist의 트랜잭션에서 수행
    const [userReservations] = (await pool.execute(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE user_id = ? 
       AND status = 'active' 
       AND end_time > NOW()`,
      [waitlistItem.user_id]
    )) as any;

    const activeReservationCount = userReservations[0].count;

    // 활성 예약이 3개 이상이면 해당 대기 신청 삭제하고 다음 순위로 넘어감
    if (activeReservationCount >= 3) {
      await pool.execute(
        'UPDATE waitlist SET status = ? WHERE id = ?',
        ['cancelled', waitlistItem.id]
      );
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
      try {
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
      } catch (error: any) {
        // 예약 개수 초과 등의 이유로 예약 생성 실패 시 대기 신청 취소
        if (error.message?.includes('active reservations')) {
          await pool.execute(
            'UPDATE waitlist SET status = ? WHERE id = ?',
            ['cancelled', waitlistItem.id]
          );
        }
        // 다른 에러는 무시하고 다음 대기 신청으로 진행
        continue;
      }
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
    return null;
  }
}

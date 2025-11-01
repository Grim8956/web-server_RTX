import pool from '../config/database';

/**
 * 숫자 ID 유효성 검증
 */
export function validateNumericId(id: any): { valid: boolean; error?: string; value?: number } {
  if (id === undefined || id === null || id === '') {
    return { valid: false, error: 'ID is required' };
  }

  const numId = typeof id === 'number' ? id : parseInt(String(id), 10);

  if (isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
    return { valid: false, error: 'Invalid ID format' };
  }

  return { valid: true, value: numId };
}

/**
 * 날짜 유효성 검증
 */
export function validateDate(dateInput: any): { valid: boolean; error?: string; value?: Date } {
  if (!dateInput) {
    return { valid: false, error: 'Date is required' };
  }

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  return { valid: true, value: date };
}

/**
 * 날짜 범위 유효성 검증
 */
export function validateDateRange(
  startInput: any,
  endInput: any
): { valid: boolean; error?: string; start?: Date; end?: Date } {
  const startValidation = validateDate(startInput);
  if (!startValidation.valid) {
    return { valid: false, error: startValidation.error };
  }

  const endValidation = validateDate(endInput);
  if (!endValidation.valid) {
    return { valid: false, error: endValidation.error };
  }

  const start = startValidation.value!;
  const end = endValidation.value!;

  if (end <= start) {
    return { valid: false, error: 'End time must be after start time' };
  }

  return { valid: true, start, end };
}

/**
 * 문자열 입력 검증 (XSS 방지, SQL 인젝션 방지)
 */
export function validateString(
  input: any,
  options?: { minLength?: number; maxLength?: number; pattern?: RegExp; required?: boolean }
): { valid: boolean; error?: string; value?: string } {
  const { minLength = 0, maxLength = 255, pattern, required = true } = options || {};

  if (required && (input === undefined || input === null || input === '')) {
    return { valid: false, error: 'Field is required' };
  }

  if (!required && (input === undefined || input === null || input === '')) {
    return { valid: true, value: '' };
  }

  const str = String(input).trim();

  if (str.length < minLength) {
    return { valid: false, error: `Minimum length is ${minLength} characters` };
  }

  if (str.length > maxLength) {
    return { valid: false, error: `Maximum length is ${maxLength} characters` };
  }

  if (pattern && !pattern.test(str)) {
    return { valid: false, error: 'Invalid format' };
  }

  return { valid: true, value: str };
}

/**
 * 강의실 존재 여부 검증
 */
export async function validateClassroomExists(
  classroom_id: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    const [classrooms] = (await pool.execute(
      'SELECT id FROM classrooms WHERE id = ?',
      [classroom_id]
    )) as any;

    if (classrooms.length === 0) {
      return { valid: false, error: 'Classroom not found' };
    }

    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: 'Failed to validate classroom' };
  }
}

/**
 * 대기 신청 검증
 */
export async function validateWaitlistTime(
  classroom_id: number,
  start_time: Date,
  end_time: Date,
  user_id: number
): Promise<string | null> {
  // 날짜 검증
  const dateError = await validateReservationDate(start_time);
  if (dateError) {
    return dateError;
  }

  // 정시 검증
  const onTheHourError = validateOnTheHour(start_time, end_time);
  if (onTheHourError) {
    return onTheHourError;
  }

  // 강의실 존재 여부 확인
  const classroomValidation = await validateClassroomExists(classroom_id);
  if (!classroomValidation.valid) {
    return classroomValidation.error || 'Classroom validation failed';
  }

  // 같은 사용자가 같은 시간대에 이미 대기 신청한 경우 확인
  const [existingWaitlist] = (await pool.execute(
    `SELECT * FROM waitlist 
     WHERE user_id = ? 
     AND classroom_id = ?
     AND start_time = ?
     AND end_time = ?
     AND status = 'waiting'`,
    [user_id, classroom_id, start_time, end_time]
  )) as any;

  if (existingWaitlist.length > 0) {
    return 'You already have a waiting request for this time slot';
  }

  return null;
}

export async function validateReservationTime(
  classroom_id: number,
  start_time: Date,
  end_time: Date,
  excludeReservationId?: number
): Promise<string | null> {
  // 시간 겹침 검증
  const [overlapping] = await pool.execute(
    `SELECT * FROM reservations 
     WHERE classroom_id = ? 
     AND status = 'active' 
     AND id != ?
     AND (
       (start_time < ? AND end_time > ?) OR
       (start_time >= ? AND start_time < ?) OR
       (end_time > ? AND end_time <= ?)
     )`,
    [classroom_id, excludeReservationId || 0, start_time, start_time, start_time, end_time, start_time, end_time]
  ) as any;

  if (overlapping.length > 0) {
    return 'This time slot is already reserved';
  }

  return null;
}

export async function validateActiveReservationLimit(user_id: number): Promise<string | null> {
  const [reservations] = await pool.execute(
    `SELECT * FROM reservations 
     WHERE user_id = ? 
     AND status = 'active' 
     AND start_time > NOW()`,
    [user_id]
  ) as any;

  if (reservations.length >= 3) {
    return 'Maximum 3 active reservations allowed';
  }

  return null;
}

export async function validateReservationDate(start_time: Date): Promise<string | null> {
  const now = new Date();
  
  // 오늘 날짜 (시간 제외, 00:00:00)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // 오늘+6일 날짜 (시간 제외, 00:00:00)
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 6);

  // 시작 시간 날짜 (시간 제외, 00:00:00)
  const startDate = new Date(start_time.getFullYear(), start_time.getMonth(), start_time.getDate());

  if (start_time <= now) {
    return 'Cannot make reservations in the past';
  }

  // 오늘+6일보다 큰 날짜면 불가능
  if (startDate > maxDate) {
    return 'Reservations can only be made up to 7 days in advance (today + 6 days)';
  }

  return null;
}

/**
 * 정시 검증 (시작/종료 시간이 정각인지 확인)
 */
export function validateOnTheHour(start_time: Date, end_time: Date): string | null {
  const startMinutes = start_time.getMinutes();
  const endMinutes = end_time.getMinutes();
  const startSeconds = start_time.getSeconds();
  const endSeconds = end_time.getSeconds();

  if (startMinutes !== 0 || endMinutes !== 0 || startSeconds !== 0 || endSeconds !== 0) {
    return 'Reservations must start and end on the hour (minutes and seconds must be 0)';
  }

  return null;
}

/**
 * 비밀번호 검증 (필수 필드만 체크)
 */
export function validatePassword(password: any): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  const passwordStr = String(password);

  // 최대 길이 검증 (bcrypt 제한 고려)
  if (passwordStr.length > 72) {
    return { valid: false, error: 'Password must be less than 72 characters' };
  }

  return { valid: true };
}

/**
 * 참여자 목록 검증
 */
export function validateParticipants(participants: any): {
  valid: boolean;
  error?: string;
  value?: string[];
} {
  if (!participants) {
    return { valid: true, value: [] };
  }

  if (typeof participants === 'string') {
    // 쉼표로 구분된 문자열인 경우
    const participantList = participants
      .split(',')
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    if (participantList.length > 10) {
      return { valid: false, error: 'Maximum 10 participants allowed' };
    }

    // 학번 형식 검증 (숫자만 허용)
    for (const participant of participantList) {
      if (!/^\d+$/.test(participant)) {
        return { valid: false, error: 'Invalid student ID format' };
      }
      if (participant.length < 7 || participant.length > 10) {
        return { valid: false, error: 'Student ID must be 7-10 digits' };
      }
    }

    return { valid: true, value: participantList };
  }

  if (Array.isArray(participants)) {
    if (participants.length > 10) {
      return { valid: false, error: 'Maximum 10 participants allowed' };
    }

    for (const participant of participants) {
      const participantStr = String(participant).trim();
      if (!/^\d+$/.test(participantStr)) {
        return { valid: false, error: 'Invalid student ID format' };
      }
      if (participantStr.length < 7 || participantStr.length > 10) {
        return { valid: false, error: 'Student ID must be 7-10 digits' };
      }
    }

    return { valid: true, value: participants.map((p) => String(p).trim()) };
  }

  return { valid: false, error: 'Invalid participants format' };
}


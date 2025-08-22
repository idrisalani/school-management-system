// server/src/services/attendance.service.js
import { withRequestContext } from "../config/database.js";
import logger from "../utils/logger.js";

const attendanceLogger = logger.child({ module: "attendance-service" });

export class AttendanceService {
  constructor(db) {
    this.db = db;
  }

  async markAttendance(classId, teacherId, attendanceData) {
    try {
      // Verify teacher has access to class
      await this.validateTeacherAccess(teacherId, classId);

      const { date, records } = attendanceData;
      const attendanceDate = new Date(date);

      // Validate date is not in the future
      if (attendanceDate > new Date()) {
        throw new Error("ATTENDANCE_DATE_CANNOT_BE_FUTURE");
      }

      const results = [];
      const errors = [];

      // Process each attendance record
      for (const record of records) {
        try {
          const { studentId, status, notes } = record;

          // Verify student is enrolled in class
          await this.validateStudentEnrollment(studentId, classId);

          // Insert or update attendance record
          const result = await this.db.query(
            `
            INSERT INTO attendance (student_id, class_id, date, status, notes, marked_by, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT (student_id, class_id, date)
            DO UPDATE SET 
              status = $4, 
              notes = $5, 
              marked_by = $6, 
              updated_at = CURRENT_TIMESTAMP
            RETURNING *
          `,
            [
              studentId,
              classId,
              attendanceDate,
              status,
              notes || null,
              teacherId,
            ]
          );

          results.push(result.rows[0]);
        } catch (error) {
          errors.push({
            studentId: record.studentId,
            error: error.message,
          });
        }
      }

      attendanceLogger.info("Attendance marked successfully", {
        classId,
        teacherId,
        date,
        successful: results.length,
        errors: errors.length,
      });

      return { results, errors };
    } catch (error) {
      attendanceLogger.error("Failed to mark attendance", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }

  async validateTeacherAccess(teacherId, classId) {
    const result = await this.db.query(
      "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );

    if (result.rows.length === 0) {
      throw new Error("UNAUTHORIZED_CLASS_ACCESS");
    }
  }

  async validateStudentEnrollment(studentId, classId) {
    const result = await this.db.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2 AND status = $3",
      [studentId, classId, "active"]
    );

    if (result.rows.length === 0) {
      throw new Error("STUDENT_NOT_ENROLLED");
    }
  }

  async getClassAttendance(
    classId,
    teacherId,
    startDate = null,
    endDate = null
  ) {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      let sql = `
        SELECT a.*, u.name as student_name, u.email as student_email,
               marker.name as marked_by_name
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        LEFT JOIN users marker ON a.marked_by = marker.id
        WHERE a.class_id = $1
      `;

      const params = [classId];
      let paramCount = 1;

      if (startDate) {
        paramCount++;
        sql += ` AND a.date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        sql += ` AND a.date <= $${paramCount}`;
        params.push(endDate);
      }

      sql += " ORDER BY a.date DESC, u.name";

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      attendanceLogger.error("Failed to get class attendance", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }

  async getStudentAttendance(
    studentId,
    classId = null,
    startDate = null,
    endDate = null
  ) {
    try {
      let sql = `
        SELECT a.*, c.name as class_name, c.code as class_code,
               u.name as teacher_name
        FROM attendance a
        JOIN classes c ON a.class_id = c.id
        JOIN users u ON c.teacher_id = u.id
        WHERE a.student_id = $1
      `;

      const params = [studentId];
      let paramCount = 1;

      if (classId) {
        paramCount++;
        sql += ` AND a.class_id = $${paramCount}`;
        params.push(classId);
      }

      if (startDate) {
        paramCount++;
        sql += ` AND a.date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        sql += ` AND a.date <= $${paramCount}`;
        params.push(endDate);
      }

      sql += " ORDER BY a.date DESC";

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      attendanceLogger.error("Failed to get student attendance", {
        error: error.message,
        studentId,
      });
      throw error;
    }
  }

  async getAttendanceStatistics(
    classId,
    teacherId,
    startDate = null,
    endDate = null
  ) {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      let dateFilter = "";
      const params = [classId];
      let paramCount = 1;

      if (startDate || endDate) {
        if (startDate) {
          paramCount++;
          dateFilter += ` AND a.date >= $${paramCount}`;
          params.push(startDate);
        }
        if (endDate) {
          paramCount++;
          dateFilter += ` AND a.date <= $${paramCount}`;
          params.push(endDate);
        }
      }

      const stats = await this.db.query(
        `
        SELECT 
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as total_late,
          COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as total_excused,
          COUNT(a.id) as total_records,
          COUNT(DISTINCT a.student_id) as total_students,
          COUNT(DISTINCT a.date) as total_days
        FROM attendance a
        WHERE a.class_id = $1 ${dateFilter}
      `,
        params
      );

      const result = stats.rows[0];
      const totalRecords = parseInt(result.total_records);

      return {
        ...result,
        attendance_rate:
          totalRecords > 0
            ? ((parseInt(result.total_present) / totalRecords) * 100).toFixed(2)
            : "0.00",
        absence_rate:
          totalRecords > 0
            ? ((parseInt(result.total_absent) / totalRecords) * 100).toFixed(2)
            : "0.00",
        late_rate:
          totalRecords > 0
            ? ((parseInt(result.total_late) / totalRecords) * 100).toFixed(2)
            : "0.00",
      };
    } catch (error) {
      attendanceLogger.error("Failed to get attendance statistics", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }

  async getStudentAttendanceStats(
    studentId,
    classId = null,
    startDate = null,
    endDate = null
  ) {
    try {
      let sql = `
        SELECT 
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as total_late,
          COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as total_excused,
          COUNT(a.id) as total_records
        FROM attendance a
        WHERE a.student_id = $1
      `;

      const params = [studentId];
      let paramCount = 1;

      if (classId) {
        paramCount++;
        sql += ` AND a.class_id = $${paramCount}`;
        params.push(classId);
      }

      if (startDate) {
        paramCount++;
        sql += ` AND a.date >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        sql += ` AND a.date <= $${paramCount}`;
        params.push(endDate);
      }

      const result = await this.db.query(sql, params);
      const stats = result.rows[0];
      const totalRecords = parseInt(stats.total_records);

      return {
        ...stats,
        attendance_rate:
          totalRecords > 0
            ? ((parseInt(stats.total_present) / totalRecords) * 100).toFixed(2)
            : "0.00",
        absence_rate:
          totalRecords > 0
            ? ((parseInt(stats.total_absent) / totalRecords) * 100).toFixed(2)
            : "0.00",
        late_rate:
          totalRecords > 0
            ? ((parseInt(stats.total_late) / totalRecords) * 100).toFixed(2)
            : "0.00",
      };
    } catch (error) {
      attendanceLogger.error("Failed to get student attendance stats", {
        error: error.message,
        studentId,
      });
      throw error;
    }
  }

  async getAttendanceTrends(classId, teacherId, period = "30 days") {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      const trends = await this.db.query(
        `
        SELECT 
          a.date,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
          COUNT(a.id) as total_count
        FROM attendance a
        WHERE a.class_id = $1 
          AND a.date >= CURRENT_DATE - INTERVAL '${period}'
        GROUP BY a.date
        ORDER BY a.date ASC
      `,
        [classId]
      );

      return trends.rows.map((row) => ({
        ...row,
        attendance_rate:
          row.total_count > 0
            ? ((row.present_count / row.total_count) * 100).toFixed(2)
            : "0.00",
      }));
    } catch (error) {
      attendanceLogger.error("Failed to get attendance trends", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }

  async getAbsentStudents(classId, teacherId, date = null) {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      const targetDate = date || new Date().toISOString().split("T")[0];

      const result = await this.db.query(
        `
        SELECT u.id, u.name, u.email, a.status, a.notes
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        LEFT JOIN attendance a ON u.id = a.student_id AND a.class_id = $1 AND a.date = $2
        WHERE e.class_id = $1 AND e.status = 'active'
          AND (a.status = 'absent' OR a.status IS NULL)
        ORDER BY u.name
      `,
        [classId, targetDate]
      );

      return result.rows.map((row) => ({
        ...row,
        status: row.status || "not_marked",
      }));
    } catch (error) {
      attendanceLogger.error("Failed to get absent students", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }

  async updateAttendance(attendanceId, teacherId, updates) {
    try {
      // Verify teacher access to the attendance record
      const attendanceCheck = await this.db.query(
        `
        SELECT a.*, c.teacher_id
        FROM attendance a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = $1
      `,
        [attendanceId]
      );

      if (attendanceCheck.rows.length === 0) {
        throw new Error("ATTENDANCE_RECORD_NOT_FOUND");
      }

      if (attendanceCheck.rows[0].teacher_id !== teacherId) {
        throw new Error("UNAUTHORIZED_TO_UPDATE_ATTENDANCE");
      }

      const allowedFields = ["status", "notes"];
      const setClause = [];
      const values = [];
      let paramCount = 0;

      for (const [field, value] of Object.entries(updates)) {
        if (allowedFields.includes(field) && value !== undefined) {
          paramCount++;
          setClause.push(`${field} = $${paramCount}`);
          values.push(value);
        }
      }

      if (setClause.length === 0) {
        throw new Error("NO_VALID_FIELDS_TO_UPDATE");
      }

      paramCount++;
      values.push(attendanceId);

      const result = await this.db.query(
        `
        UPDATE attendance SET ${setClause.join(
          ", "
        )}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `,
        values
      );

      attendanceLogger.info("Attendance updated successfully", {
        attendanceId,
        teacherId,
        fields: Object.keys(updates),
      });

      return result.rows[0];
    } catch (error) {
      attendanceLogger.error("Failed to update attendance", {
        error: error.message,
        attendanceId,
        teacherId,
      });
      throw error;
    }
  }

  async deleteAttendance(attendanceId, teacherId) {
    try {
      // Verify teacher access to the attendance record
      const attendanceCheck = await this.db.query(
        `
        SELECT a.*, c.teacher_id
        FROM attendance a
        JOIN classes c ON a.class_id = c.id
        WHERE a.id = $1
      `,
        [attendanceId]
      );

      if (attendanceCheck.rows.length === 0) {
        throw new Error("ATTENDANCE_RECORD_NOT_FOUND");
      }

      if (attendanceCheck.rows[0].teacher_id !== teacherId) {
        throw new Error("UNAUTHORIZED_TO_DELETE_ATTENDANCE");
      }

      await this.db.query("DELETE FROM attendance WHERE id = $1", [
        attendanceId,
      ]);

      attendanceLogger.info("Attendance deleted successfully", {
        attendanceId,
        teacherId,
      });
    } catch (error) {
      attendanceLogger.error("Failed to delete attendance", {
        error: error.message,
        attendanceId,
        teacherId,
      });
      throw error;
    }
  }

  async generateAttendanceReport(classId, teacherId, startDate, endDate) {
    try {
      // Verify teacher access
      await this.validateTeacherAccess(teacherId, classId);

      // Get class information
      const classInfo = await this.db.query(
        `
        SELECT c.name, c.code, u.name as teacher_name
        FROM classes c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.id = $1
      `,
        [classId]
      );

      // Get attendance summary for each student
      const studentSummary = await this.db.query(
        `
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
          COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_days,
          COUNT(a.id) as total_days
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        LEFT JOIN attendance a ON u.id = a.student_id AND a.class_id = $1 
          AND a.date BETWEEN $2 AND $3
        WHERE e.class_id = $1 AND e.status = 'active'
        GROUP BY u.id, u.name, u.email
        ORDER BY u.name
      `,
        [classId, startDate, endDate]
      );

      return {
        class_info: classInfo.rows[0],
        report_period: { start_date: startDate, end_date: endDate },
        students: studentSummary.rows.map((student) => ({
          ...student,
          attendance_rate:
            student.total_days > 0
              ? ((student.present_days / student.total_days) * 100).toFixed(2)
              : "0.00",
        })),
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      attendanceLogger.error("Failed to generate attendance report", {
        error: error.message,
        classId,
        teacherId,
      });
      throw error;
    }
  }
}

// Factory function for dependency injection
export const createAttendanceService = (req) => {
  const db = withRequestContext(req);
  return new AttendanceService(db);
};

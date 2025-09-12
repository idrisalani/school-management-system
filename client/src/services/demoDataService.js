// @ts-nocheck

// client/src/services/demoDataService.js
import { demoData } from "../data/demoData.js";

// Simulate API delay for realistic feel
const simulateDelay = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

class DemoDataService {
  constructor() {
    this.data = { ...demoData };
    this.sessionData = {};
  }

  // Initialize session data (reset demo state)
  initializeSession(sessionId) {
    this.sessionData[sessionId] = {
      lastActivity: Date.now(),
      modifications: {},
      viewHistory: [],
    };
  }

  // Utility method to create consistent API responses
  mockResponse(data, message = "Success") {
    return {
      data,
      message,
      status: "success",
      success: true,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // Dashboard APIs - keeping your existing structure
  async getAdminDashboardData() {
    await simulateDelay();
    return {
      status: "success",
      data: this.data.admin.dashboard,
      timestamp: new Date().toISOString(),
    };
  }

  async getTeacherDashboardData(teacherId) {
    await simulateDelay();
    return {
      status: "success",
      data: this.data.teacher.dashboard,
      timestamp: new Date().toISOString(),
    };
  }

  async getStudentDashboardData(studentId) {
    await simulateDelay();
    return {
      status: "success",
      data: this.data.student.dashboard,
      timestamp: new Date().toISOString(),
    };
  }

  async getParentDashboardData(parentId) {
    await simulateDelay();
    return {
      status: "success",
      data: this.data.parent.dashboard,
      timestamp: new Date().toISOString(),
    };
  }

  // Analytics APIs - keeping your existing methods
  async getWeeklyAttendanceData() {
    await simulateDelay();
    return {
      status: "success",
      data: this.data.analytics.weeklyAttendance,
      timestamp: new Date().toISOString(),
    };
  }

  async getGradeDistributionData() {
    await simulateDelay();
    return {
      status: "success",
      data: this.data.analytics.gradeDistribution,
      total: this.data.analytics.gradeDistribution.reduce(
        (sum, item) => sum + item.count,
        0
      ),
      timestamp: new Date().toISOString(),
    };
  }

  // Activities and Notifications - keeping your existing methods
  async getRecentActivities(limit = 5) {
    await simulateDelay();
    const activities = this.data.activities.recent.slice(0, limit);
    return {
      status: "success",
      data: activities,
      count: activities.length,
      timestamp: new Date().toISOString(),
    };
  }

  async getNotifications(limit = 20, unreadOnly = false) {
    await simulateDelay();
    let notifications = [...this.data.notifications];

    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    return {
      status: "success",
      data: {
        notifications: notifications.slice(0, limit),
        unread_count: notifications.filter((n) => !n.read).length,
        pagination: {
          page: 1,
          limit,
          total: notifications.length,
        },
      },
    };
  }

  // CRUD Operations - keeping your existing methods with enhancements
  async getUsers(role = null) {
    await simulateDelay();
    let users = [...this.data.users];

    if (role) {
      users = users.filter((u) => u.role === role);
    }

    return {
      status: "success",
      data: users,
      count: users.length,
      timestamp: new Date().toISOString(),
    };
  }

  async getAssignments(classId = null) {
    await simulateDelay();
    let assignments = [...this.data.assignments];

    if (classId) {
      assignments = assignments.filter((a) => a.class_id === parseInt(classId));
    }

    return {
      status: "success",
      data: assignments,
      count: assignments.length,
      timestamp: new Date().toISOString(),
    };
  }

  async getGrades(studentId = null, classId = null) {
    await simulateDelay();
    let grades = [...this.data.grades];

    if (studentId) {
      grades = grades.filter((g) => g.student_id === parseInt(studentId));
    }

    if (classId) {
      grades = grades.filter((g) => g.class_id === parseInt(classId));
    }

    return {
      status: "success",
      data: grades,
      count: grades.length,
      timestamp: new Date().toISOString(),
    };
  }

  async getAttendance(studentId = null, classId = null, date = null) {
    await simulateDelay();
    let attendance = [...this.data.attendance];

    if (studentId) {
      attendance = attendance.filter(
        (a) => a.student_id === parseInt(studentId)
      );
    }

    if (classId) {
      attendance = attendance.filter((a) => a.class_id === parseInt(classId));
    }

    if (date) {
      attendance = attendance.filter((a) => a.date === date);
    }

    return {
      status: "success",
      data: attendance,
      count: attendance.length,
      timestamp: new Date().toISOString(),
    };
  }

  // Create operations - keeping your existing methods
  async createAssignment(assignmentData) {
    await simulateDelay();
    const newAssignment = {
      id: Math.max(...this.data.assignments.map((a) => a.id)) + 1,
      ...assignmentData,
      created_at: new Date().toISOString(),
      status: "active",
    };

    // Temporarily add to data for this session
    this.data.assignments.unshift(newAssignment);

    return {
      status: "success",
      data: newAssignment,
      message: "Assignment created successfully (demo mode)",
    };
  }

  async submitAssignment(assignmentId, submissionData) {
    await simulateDelay();
    const newSubmission = {
      id: Math.random().toString(36).substr(2, 9),
      assignment_id: assignmentId,
      student_id: "demo_student",
      content: submissionData.text || "Demo submission content",
      status: "submitted",
      submitted_at: new Date().toISOString(),
    };

    return {
      status: "success",
      data: newSubmission,
      message: "Assignment submitted successfully (demo mode)",
    };
  }

  async gradeSubmission(submissionId, gradeData) {
    await simulateDelay();
    return {
      status: "success",
      data: {
        id: submissionId,
        grade: gradeData.grade,
        feedback: gradeData.feedback,
        graded_at: new Date().toISOString(),
      },
      message: "Submission graded successfully (demo mode)",
    };
  }

  // Enhanced API endpoint structure to match the enhanced api.js
  users = {
    getAll: async (params) => {
      await simulateDelay();
      let users = [...this.data.users];

      if (params?.role) {
        users = users.filter((user) => user.role === params.role);
      }

      return this.mockResponse(users);
    },

    getById: async (id) => {
      await simulateDelay();
      const user = this.data.users.find((u) => u.id === parseInt(id));
      return this.mockResponse(user);
    },

    create: async (data) => {
      await simulateDelay();
      const newUser = {
        id: Math.max(...this.data.users.map((u) => u.id)) + 1,
        ...data,
        status: "active",
        created_at: new Date().toISOString(),
      };
      this.data.users.unshift(newUser);
      return this.mockResponse(
        newUser,
        "User created successfully (demo mode)"
      );
    },

    update: async (id, data) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(id), ...data },
        "User updated successfully (demo mode)"
      );
    },

    delete: async (id) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(id) },
        "User deleted successfully (demo mode)"
      );
    },

    getByRole: async (role, params) => {
      await simulateDelay();
      const users = this.data.users.filter((u) => u.role === role);
      return this.mockResponse(users);
    },

    updateProfile: async (id, profileData) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(id), ...profileData },
        "Profile updated successfully (demo mode)"
      );
    },

    uploadAvatar: async (id, file) => {
      await simulateDelay(1000);
      return this.mockResponse(
        {
          avatarUrl: `https://demo.edu/avatars/${id}.jpg`,
        },
        "Avatar uploaded successfully (demo mode)"
      );
    },
  };

  classes = {
    getAll: async (params) => {
      await simulateDelay();
      return this.mockResponse(this.data.classes || []);
    },

    getById: async (id) => {
      await simulateDelay();
      const classItem = (this.data.classes || []).find(
        (c) => c.id === parseInt(id)
      );
      return this.mockResponse(classItem);
    },

    create: async (data) => {
      await simulateDelay();
      const newClass = {
        id: Date.now(),
        ...data,
        enrolled: 0,
        created_at: new Date().toISOString(),
      };
      return this.mockResponse(
        newClass,
        "Class created successfully (demo mode)"
      );
    },

    update: async (id, data) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(id), ...data },
        "Class updated successfully (demo mode)"
      );
    },

    delete: async (id) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(id) },
        "Class deleted successfully (demo mode)"
      );
    },

    getStudents: async (classId) => {
      await simulateDelay();
      const students = this.data.users
        .filter((u) => u.role === "student")
        .slice(0, 10);
      return this.mockResponse(students);
    },

    addStudent: async (classId, studentId) => {
      await simulateDelay();
      return this.mockResponse(
        { classId: parseInt(classId), studentId: parseInt(studentId) },
        "Student added to class (demo mode)"
      );
    },

    removeStudent: async (classId, studentId) => {
      await simulateDelay();
      return this.mockResponse(
        { classId: parseInt(classId), studentId: parseInt(studentId) },
        "Student removed from class (demo mode)"
      );
    },

    getTeachers: async (classId) => {
      await simulateDelay();
      const teachers = this.data.users
        .filter((u) => u.role === "teacher")
        .slice(0, 2);
      return this.mockResponse(teachers);
    },

    assignTeacher: async (classId, teacherId, subjectId) => {
      await simulateDelay();
      return this.mockResponse(
        {
          classId: parseInt(classId),
          teacherId: parseInt(teacherId),
          subjectId,
        },
        "Teacher assigned successfully (demo mode)"
      );
    },
  };

  assignments = {
    getAll: async (params) => {
      await simulateDelay();
      return this.mockResponse(this.data.assignments);
    },

    getById: async (assignmentId) => {
      await simulateDelay();
      const assignment = this.data.assignments.find(
        (a) => a.id === parseInt(assignmentId)
      );
      return this.mockResponse(assignment);
    },

    create: async (assignmentData) => {
      return this.createAssignment(assignmentData);
    },

    update: async (assignmentId, assignmentData) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(assignmentId), ...assignmentData },
        "Assignment updated successfully (demo mode)"
      );
    },

    delete: async (assignmentId) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(assignmentId) },
        "Assignment deleted successfully (demo mode)"
      );
    },

    getSubmissions: async (assignmentId) => {
      await simulateDelay();
      const submissions = this.data.grades.filter(
        (g) => g.assignment_id === parseInt(assignmentId)
      );
      return this.mockResponse(submissions);
    },

    submitAssignment: async (assignmentId, submissionData) => {
      return this.submitAssignment(assignmentId, submissionData);
    },

    gradeSubmission: async (assignmentId, submissionId, gradeData) => {
      return this.gradeSubmission(submissionId, gradeData);
    },

    uploadAttachment: async (assignmentId, file) => {
      await simulateDelay(1000);
      return this.mockResponse(
        {
          attachmentUrl: `https://demo.edu/assignments/${assignmentId}/attachments/${file.name}`,
        },
        "Attachment uploaded successfully (demo mode)"
      );
    },
  };

  attendance = {
    getByClass: async (classId, date) => {
      await simulateDelay();
      const attendance = this.data.attendance.filter(
        (a) => a.class_id === parseInt(classId) && (!date || a.date === date)
      );
      return this.mockResponse(attendance);
    },

    getByStudent: async (studentId, startDate, endDate) => {
      await simulateDelay();
      let attendance = this.data.attendance.filter(
        (a) => a.student_id === parseInt(studentId)
      );

      if (startDate && endDate) {
        attendance = attendance.filter(
          (a) => a.date >= startDate && a.date <= endDate
        );
      }

      return this.mockResponse(attendance);
    },

    markAttendance: async (classId, date, attendanceData) => {
      await simulateDelay();
      return this.mockResponse(
        attendanceData,
        "Attendance marked successfully (demo mode)"
      );
    },

    updateAttendance: async (attendanceId, updateData) => {
      await simulateDelay();
      return this.mockResponse(
        { id: attendanceId, ...updateData },
        "Attendance updated successfully (demo mode)"
      );
    },

    getReport: async (classId, startDate, endDate) => {
      await simulateDelay();
      const report = {
        classId: parseInt(classId),
        period: { startDate, endDate },
        totalStudents: 25,
        averageAttendance: 92.4,
        details: this.data.attendance.filter(
          (a) => a.class_id === parseInt(classId)
        ),
      };
      return this.mockResponse(report);
    },
  };

  grades = {
    getByClass: async (classId) => {
      await simulateDelay();
      const grades = this.data.grades.filter(
        (g) => g.class_id === parseInt(classId)
      );
      return this.mockResponse(grades);
    },

    getByStudent: async (studentId) => {
      await simulateDelay();
      const grades = this.data.grades.filter(
        (g) => g.student_id === parseInt(studentId)
      );
      return this.mockResponse(grades);
    },

    enterGrades: async (classId, subjectId, gradesData) => {
      await simulateDelay();
      return this.mockResponse(
        gradesData,
        "Grades entered successfully (demo mode)"
      );
    },

    updateGrade: async (gradeId, updateData) => {
      await simulateDelay();
      return this.mockResponse(
        { id: gradeId, ...updateData },
        "Grade updated successfully (demo mode)"
      );
    },

    generateReport: async (studentId, term) => {
      await simulateDelay();
      const student = this.data.users.find((u) => u.id === parseInt(studentId));
      const grades = this.data.grades.filter(
        (g) => g.student_id === parseInt(studentId)
      );

      const report = {
        student,
        term,
        grades,
        gpa:
          grades.length > 0
            ? (
                grades.reduce((sum, g) => sum + g.percentage, 0) /
                grades.length /
                20
              ).toFixed(2)
            : "0.00",
        generatedAt: new Date().toISOString(),
      };

      return this.mockResponse(report);
    },

    downloadReport: async (studentId, term) => {
      await simulateDelay(1000);
      return this.mockResponse(
        {
          downloadUrl: `https://demo.edu/reports/${studentId}-${term}.pdf`,
        },
        "Report ready for download (demo mode)"
      );
    },
  };

  analytics = {
    getAttendanceStats: async (params) => {
      await simulateDelay();
      return this.mockResponse(this.data.analytics.weeklyAttendance);
    },

    getGradeStats: async (params) => {
      await simulateDelay();
      return this.mockResponse(this.data.analytics.gradeDistribution);
    },

    getFinancialStats: async (params) => {
      await simulateDelay();
      const stats = {
        totalRevenue: 245000,
        tuitionCollected: 198000,
        outstandingFees: 47000,
        paymentMethods: {
          "Bank Transfer": 65,
          "Credit Card": 25,
          Cash: 8,
          Cheque: 2,
        },
      };
      return this.mockResponse(stats);
    },

    generateReport: async (reportType, params) => {
      await simulateDelay(2000);
      return this.mockResponse(
        {
          reportId: `report_${Date.now()}`,
          type: reportType,
          status: "generated",
          url: `https://demo.edu/reports/${reportType}-${Date.now()}.pdf`,
        },
        "Report generated successfully (demo mode)"
      );
    },

    downloadReport: async (reportType, params) => {
      await simulateDelay(1000);
      return this.mockResponse(
        {
          downloadUrl: `https://demo.edu/reports/${reportType}-download.pdf`,
        },
        "Report ready for download (demo mode)"
      );
    },
  };

  messages = {
    getAll: async (params) => {
      await simulateDelay();
      return this.mockResponse(this.data.notifications || []);
    },

    getById: async (messageId) => {
      await simulateDelay();
      const message = (this.data.notifications || []).find(
        (n) => n.id === parseInt(messageId)
      );
      return this.mockResponse(message);
    },

    send: async (messageData) => {
      await simulateDelay();
      const message = {
        id: Date.now(),
        ...messageData,
        timestamp: new Date().toISOString(),
        status: "sent",
      };
      return this.mockResponse(
        message,
        "Message sent successfully (demo mode)"
      );
    },

    markAsRead: async (messageId) => {
      await simulateDelay();
      return this.mockResponse(
        { id: messageId, read: true },
        "Message marked as read (demo mode)"
      );
    },

    delete: async (messageId) => {
      await simulateDelay();
      return this.mockResponse(
        { id: messageId },
        "Message deleted successfully (demo mode)"
      );
    },
  };

  events = {
    getAll: async (params) => {
      await simulateDelay();
      const events = [
        {
          id: 1,
          title: "Science Fair",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: "Auditorium",
        },
        {
          id: 2,
          title: "Parent Conference",
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          location: "Classrooms",
        },
      ];
      return this.mockResponse(events);
    },

    getById: async (eventId) => {
      await simulateDelay();
      const event = {
        id: parseInt(eventId),
        title: "Science Fair",
        date: new Date(),
        location: "Auditorium",
      };
      return this.mockResponse(event);
    },

    create: async (eventData) => {
      await simulateDelay();
      const event = {
        id: Date.now(),
        ...eventData,
        createdAt: new Date().toISOString(),
      };
      return this.mockResponse(event, "Event created successfully (demo mode)");
    },

    update: async (eventId, eventData) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(eventId), ...eventData },
        "Event updated successfully (demo mode)"
      );
    },

    delete: async (eventId) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(eventId) },
        "Event deleted successfully (demo mode)"
      );
    },

    getByDate: async (startDate, endDate) => {
      await simulateDelay();
      const events = [
        {
          id: 1,
          title: "Science Fair",
          date: startDate,
          location: "Auditorium",
        },
      ];
      return this.mockResponse(events);
    },
  };

  fees = {
    getAll: async (params) => {
      await simulateDelay();
      return this.mockResponse(this.data.payments || []);
    },

    getById: async (feeId) => {
      await simulateDelay();
      const fee = (this.data.payments || []).find(
        (p) => p.id === parseInt(feeId)
      );
      return this.mockResponse(fee);
    },

    create: async (feeData) => {
      await simulateDelay();
      const fee = {
        id: Date.now(),
        ...feeData,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      return this.mockResponse(fee, "Fee created successfully (demo mode)");
    },

    update: async (feeId, feeData) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(feeId), ...feeData },
        "Fee updated successfully (demo mode)"
      );
    },

    delete: async (feeId) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(feeId) },
        "Fee deleted successfully (demo mode)"
      );
    },

    getStudentFees: async (studentId) => {
      await simulateDelay();
      const fees = (this.data.payments || []).filter(
        (p) => p.student_id === parseInt(studentId)
      );
      return this.mockResponse(fees);
    },

    recordPayment: async (feeId, paymentData) => {
      await simulateDelay();
      const payment = {
        id: Date.now(),
        feeId: parseInt(feeId),
        ...paymentData,
        timestamp: new Date().toISOString(),
      };
      return this.mockResponse(
        payment,
        "Payment recorded successfully (demo mode)"
      );
    },

    generateInvoice: async (feeId) => {
      await simulateDelay();
      return this.mockResponse(
        {
          invoiceId: `invoice_${feeId}`,
          url: `https://demo.edu/invoices/${feeId}.pdf`,
        },
        "Invoice generated successfully (demo mode)"
      );
    },

    downloadInvoice: async (feeId) => {
      await simulateDelay(1000);
      return this.mockResponse(
        { downloadUrl: `https://demo.edu/invoices/download/${feeId}.pdf` },
        "Invoice ready for download (demo mode)"
      );
    },
  };

  schedule = {
    getAll: async (params) => {
      await simulateDelay();
      const schedules = [
        {
          id: 1,
          classId: 1,
          className: "Math 10A",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
          room: "Room 101",
        },
      ];
      return this.mockResponse(schedules);
    },

    getById: async (scheduleId) => {
      await simulateDelay();
      const schedule = {
        id: parseInt(scheduleId),
        classId: 1,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:00",
      };
      return this.mockResponse(schedule);
    },

    create: async (scheduleData) => {
      await simulateDelay();
      const schedule = {
        id: Date.now(),
        ...scheduleData,
        createdAt: new Date().toISOString(),
      };
      return this.mockResponse(
        schedule,
        "Schedule created successfully (demo mode)"
      );
    },

    update: async (scheduleId, scheduleData) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(scheduleId), ...scheduleData },
        "Schedule updated successfully (demo mode)"
      );
    },

    delete: async (scheduleId) => {
      await simulateDelay();
      return this.mockResponse(
        { id: parseInt(scheduleId) },
        "Schedule deleted successfully (demo mode)"
      );
    },

    getByTeacher: async (teacherId) => {
      await simulateDelay();
      const schedules = [
        {
          id: 1,
          classId: 1,
          className: "Math 10A",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
        },
      ];
      return this.mockResponse(schedules);
    },

    getByClass: async (classId) => {
      await simulateDelay();
      const schedules = [
        {
          id: 1,
          teacherId: 2,
          teacherName: "Sarah Johnson",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
        },
      ];
      return this.mockResponse(schedules);
    },

    getByRoom: async (roomId) => {
      await simulateDelay();
      const schedules = [
        {
          id: 1,
          classId: 1,
          className: "Math 10A",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:00",
        },
      ];
      return this.mockResponse(schedules);
    },
  };

  // Dashboard helper - keeping your existing structure but enhanced
  dashboard = {
    getAdminDashboardData: () => this.getAdminDashboardData(),
    getTeacherDashboardData: (teacherId) =>
      this.getTeacherDashboardData(teacherId),
    getStudentDashboardData: (studentId) =>
      this.getStudentDashboardData(studentId),
    getParentDashboardData: (parentId) => this.getParentDashboardData(parentId),
  };

  // Health check - keeping your existing method
  async checkApiHealth() {
    await simulateDelay(200);
    return {
      status: "success",
      message: "Demo API is running perfectly",
      data: {
        status: "healthy",
        uptime: "100%",
        responseTime: "200ms",
        mode: "demo",
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Profile and settings - keeping your existing methods
  async getUserProfile(userId = null) {
    await simulateDelay();
    const user =
      this.data.users.find((u) => u.id === parseInt(userId)) ||
      this.data.users[2]; // Default to student

    const demoProfile = {
      ...user,
      bio: "This is a demo profile for testing purposes.",
      phone: "555-DEMO-123",
      address: "123 Demo Street, Demo City",
      date_of_birth: "2005-01-15",
      is_verified: true,
      profile_completed: true,
    };

    return {
      status: "success",
      data: demoProfile,
    };
  }

  async updateUserProfile(profileData) {
    await simulateDelay();
    return {
      status: "success",
      data: { ...profileData, updated_at: new Date().toISOString() },
      message: "Profile updated successfully (demo mode - changes not saved)",
    };
  }

  async getNotificationPreferences() {
    await simulateDelay();
    return {
      status: "success",
      data: {
        emailNotifications: true,
        pushNotifications: true,
        gradeUpdates: true,
        assignmentReminders: true,
        attendanceAlerts: false,
        systemAnnouncements: true,
      },
    };
  }

  async updateNotificationPreferences(preferences) {
    await simulateDelay();
    return {
      status: "success",
      data: preferences,
      message: "Notification preferences updated (demo mode)",
    };
  }

  // Utility methods - keeping your existing methods
  isDemo() {
    return true;
  }

  getDemoWarning() {
    return "You are in demo mode. All changes are temporary and will be reset.";
  }

  getSampleDataStats() {
    return {
      users: this.data.users.length,
      assignments: this.data.assignments.length,
      grades: this.data.grades.length,
      attendance: this.data.attendance.length,
      announcements: (this.data.announcements || []).length,
    };
  }

  // Enhanced utility method for the enhanced api.js
  simulateDelay = simulateDelay; // Export the function for direct use
  //mockResponse = this.mockResponse.bind(this); // Export the response formatter
}

// Export singleton instance
export const demoDataService = new DemoDataService();
export default demoDataService;

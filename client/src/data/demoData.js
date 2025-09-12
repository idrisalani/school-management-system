// client/src/data/demoData.js
export const demoData = {
  // Dashboard data for different user roles
  admin: {
    dashboard: {
      studentCount: "2,847",
      teacherCount: "156",
      averageAttendance: "92.8%",
      revenue: "$485,200",
      parentCount: "1,924",
      activeUsersToday: 342,
      newRegistrations: 23,
      monthlyRevenue: 42850,
      pendingPayments: 18500,
      systemHealth: "healthy",
    },
  },

  teacher: {
    dashboard: {
      studentCount: 89,
      averageGrade: "B+",
      attendanceRate: "94%",
      pendingAssignments: 12,
      totalAssignments: 45,
      pendingGrading: 23,
      classCount: 6,
      classes: [
        { id: 1, name: "Mathematics 10A", subject: "Mathematics" },
        { id: 2, name: "Algebra II", subject: "Mathematics" },
        { id: 3, name: "Geometry", subject: "Mathematics" },
      ],
    },
  },

  student: {
    dashboard: {
      attendance: "96%",
      averageGrade: "A-",
      assignments: "12/15",
      activities: 5,
      enrolledCourses: 6,
      upcomingAssignments: 3,
      attendanceRate: 96,
      recentGrades: [
        {
          assignment: "Math Quiz 5",
          class: "Algebra II",
          score: "18/20",
          percentage: "90%",
          date: "2025-01-10",
        },
        {
          assignment: "History Essay",
          class: "World History",
          score: "85/100",
          percentage: "85%",
          date: "2025-01-08",
        },
      ],
    },
  },

  parent: {
    dashboard: {
      childrenCount: 2,
      upcomingEvents: 3,
      averageGrade: "B+",
      attendanceRate: "94%",
      children: [
        { id: 1, name: "Emma Smith", status: "active" },
        { id: 2, name: "Liam Smith", status: "active" },
      ],
      detailedChildren: [
        {
          id: 1,
          name: "Emma Smith",
          gradeLevel: "9th Grade",
          averageScore: "89.5",
          attendanceRate: 95,
        },
        {
          id: 2,
          name: "Liam Smith",
          gradeLevel: "7th Grade",
          averageScore: "92.1",
          attendanceRate: 93,
        },
      ],
    },
  },

  // Analytics data
  analytics: {
    weeklyAttendance: [
      { day: "Monday", rate: 95 },
      { day: "Tuesday", rate: 92 },
      { day: "Wednesday", rate: 88 },
      { day: "Thursday", rate: 94 },
      { day: "Friday", rate: 90 },
    ],

    gradeDistribution: [
      { grade: "A", count: 445, color: "green" },
      { grade: "B", count: 332, color: "blue" },
      { grade: "C", count: 218, color: "yellow" },
      { grade: "D", count: 89, color: "orange" },
      { grade: "F", count: 34, color: "red" },
    ],
  },

  // Sample users
  users: [
    {
      id: 1,
      email: "admin@demo.com",
      username: "demo.admin",
      first_name: "Demo",
      last_name: "Administrator",
      role: "admin",
      status: "active",
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: 2,
      email: "sarah.johnson@demo.com",
      username: "sarah.johnson",
      first_name: "Sarah",
      last_name: "Johnson",
      role: "teacher",
      status: "active",
      department: "Mathematics",
      employee_id: "TCH001",
    },
    {
      id: 3,
      email: "alex.chen@demo.com",
      username: "alex.chen",
      first_name: "Alex",
      last_name: "Chen",
      role: "student",
      status: "active",
      grade_level: "10th Grade",
      student_id: "STU001",
    },
    {
      id: 4,
      email: "jennifer.smith@demo.com",
      username: "jennifer.smith",
      first_name: "Jennifer",
      last_name: "Smith",
      role: "parent",
      status: "active",
      occupation: "Marketing Manager",
    },
  ],

  // Sample assignments
  assignments: [
    {
      id: 1,
      title: "Quadratic Equations Practice",
      description: "Solve various quadratic equations using different methods",
      class_id: 1,
      teacher_id: 2,
      due_date: "2025-01-20T23:59:59Z",
      points_possible: 100,
      status: "active",
      type: "homework",
      created_at: "2025-01-10T08:00:00Z",
    },
    {
      id: 2,
      title: "Linear Functions Quiz",
      description: "Assessment on linear functions and graphing",
      class_id: 1,
      teacher_id: 2,
      due_date: "2025-01-18T14:30:00Z",
      points_possible: 50,
      status: "active",
      type: "quiz",
      created_at: "2025-01-08T10:00:00Z",
    },
    {
      id: 3,
      title: "Geometry Proofs Project",
      description: "Create visual proofs for geometric theorems",
      class_id: 2,
      teacher_id: 2,
      due_date: "2025-01-25T23:59:59Z",
      points_possible: 150,
      status: "active",
      type: "project",
      created_at: "2025-01-05T09:00:00Z",
    },
  ],

  // Sample grades
  grades: [
    {
      id: 1,
      student_id: 3,
      assignment_id: 1,
      class_id: 1,
      points_earned: 85,
      points_possible: 100,
      percentage: 85,
      grade_letter: "B",
      feedback: "Good work! Pay attention to sign errors in calculations.",
      created_at: "2025-01-12T15:30:00Z",
    },
    {
      id: 2,
      student_id: 3,
      assignment_id: 2,
      class_id: 1,
      points_earned: 45,
      points_possible: 50,
      percentage: 90,
      grade_letter: "A-",
      feedback: "Excellent understanding of linear functions!",
      created_at: "2025-01-11T11:20:00Z",
    },
  ],

  // Sample attendance
  attendance: [
    {
      id: 1,
      student_id: 3,
      class_id: 1,
      date: "2025-01-10",
      status: "present",
      notes: null,
      created_at: "2025-01-10T08:00:00Z",
    },
    {
      id: 2,
      student_id: 3,
      class_id: 1,
      date: "2025-01-11",
      status: "present",
      notes: null,
      created_at: "2025-01-11T08:00:00Z",
    },
    {
      id: 3,
      student_id: 3,
      class_id: 2,
      date: "2025-01-12",
      status: "absent",
      notes: "Sick leave",
      created_at: "2025-01-12T08:00:00Z",
    },
  ],

  // Recent activities
  activities: {
    recent: [
      {
        id: 1,
        user: "Sarah Johnson",
        action: "Created new assignment",
        subject: "Quadratic Equations Practice",
        time: "2 hours ago",
        type: "assignment",
      },
      {
        id: 2,
        user: "Alex Chen",
        action: "Submitted assignment",
        subject: "Linear Functions Quiz",
        time: "3 hours ago",
        type: "submission",
      },
      {
        id: 3,
        user: "Demo Administrator",
        action: "Added new student",
        subject: "Emma Wilson",
        time: "5 hours ago",
        type: "user_management",
      },
      {
        id: 4,
        user: "Sarah Johnson",
        action: "Graded assignment",
        subject: "Geometry Proofs",
        time: "1 day ago",
        type: "grading",
      },
      {
        id: 5,
        user: "System",
        action: "Generated monthly report",
        subject: "December 2024 Analytics",
        time: "2 days ago",
        type: "system",
      },
    ],
  },

  // Notifications
  notifications: [
    {
      id: 1,
      type: "assignment_due",
      title: "Assignment Due Tomorrow",
      message: "Quadratic Equations Practice is due tomorrow at 11:59 PM",
      created_at: "2025-01-11T09:00:00Z",
      read: false,
    },
    {
      id: 2,
      type: "grade_posted",
      title: "New Grade Posted",
      message: "Your Linear Functions Quiz has been graded - You received 90%",
      created_at: "2025-01-11T11:30:00Z",
      read: false,
    },
    {
      id: 3,
      type: "announcement",
      title: "School Holiday Reminder",
      message: "School will be closed on Monday, January 15th for MLK Day",
      created_at: "2025-01-10T14:00:00Z",
      read: true,
    },
    {
      id: 4,
      type: "parent_meeting",
      title: "Parent-Teacher Conference Scheduled",
      message:
        "Your conference with Ms. Johnson is scheduled for January 20th at 3:00 PM",
      created_at: "2025-01-09T16:00:00Z",
      read: true,
    },
  ],

  // Announcements
  announcements: [
    {
      id: 1,
      title: "Short Break Schedule",
      content:
        "School will be closed from December 23rd to January 6th for short break.",
      priority: "normal",
      target_audience: "all",
      is_published: true,
      published_at: "2024-12-15T10:00:00Z",
      created_at: "2024-12-15T10:00:00Z",
    },
    {
      id: 2,
      title: "New Grading System Update",
      content:
        "The grading system has been updated with new features for better progress tracking.",
      priority: "high",
      target_audience: "teachers",
      is_published: true,
      published_at: "2025-01-08T08:00:00Z",
      created_at: "2025-01-08T08:00:00Z",
    },
  ],

  // Classes/Courses
  classes: [
    {
      id: 1,
      name: "Algebra II",
      code: "MATH-201",
      description: "Advanced algebraic concepts and functions",
      teacher_id: 2,
      department_id: 1,
      credits: 1.0,
      status: "active",
      semester: "Spring 2025",
      capacity: 30,
      enrolled: 28,
    },
    {
      id: 2,
      name: "Geometry",
      code: "MATH-101",
      description: "Basic geometric principles and proofs",
      teacher_id: 2,
      department_id: 1,
      credits: 1.0,
      status: "active",
      semester: "Spring 2025",
      capacity: 25,
      enrolled: 24,
    },
  ],

  // Sample payments/fees
  payments: [
    {
      id: 1,
      student_id: 3,
      amount: 500.0,
      description: "Spring 2025 Tuition",
      status: "paid",
      payment_method: "credit_card",
      transaction_id: "TXN_12345",
      created_at: "2024-12-28T10:00:00Z",
      paid_at: "2024-12-28T10:05:00Z",
    },
    {
      id: 2,
      student_id: 3,
      amount: 75.0,
      description: "Laboratory Fee",
      status: "pending",
      due_date: "2025-02-01",
      created_at: "2025-01-01T00:00:00Z",
    },
  ],
};

export default demoData;

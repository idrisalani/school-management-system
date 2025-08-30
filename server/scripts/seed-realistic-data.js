// School Management System - Realistic Data Seeder
// This script populates your database with realistic educational data

const axios = require("axios");
const { Pool } = require("pg");

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Real-world educational data generators
class SchoolDataGenerator {
  constructor() {
    this.departments = [
      "Mathematics",
      "Science",
      "English Language Arts",
      "Social Studies",
      "Physical Education",
      "Art",
      "Music",
      "Computer Science",
      "Foreign Languages",
      "Special Education",
    ];

    this.courses = {
      Mathematics: [
        "Algebra I",
        "Algebra II",
        "Geometry",
        "Pre-Calculus",
        "Calculus",
        "Statistics",
        "Applied Mathematics",
      ],
      Science: [
        "Biology",
        "Chemistry",
        "Physics",
        "Earth Science",
        "Environmental Science",
        "Anatomy & Physiology",
      ],
      "English Language Arts": [
        "English 9",
        "English 10",
        "English 11",
        "English 12",
        "Creative Writing",
        "Literature Analysis",
        "Public Speaking",
      ],
      "Social Studies": [
        "World History",
        "US History",
        "Government",
        "Economics",
        "Psychology",
        "Sociology",
        "Geography",
      ],
      "Computer Science": [
        "Introduction to Programming",
        "Web Development",
        "Database Design",
        "Mobile App Development",
        "Data Structures",
        "Cybersecurity",
      ],
    };

    this.gradeScales = [
      { name: "Traditional", min: 0, max: 100, passing: 60 },
      { name: "4-Point Scale", min: 0, max: 4, passing: 2 },
      { name: "Letter Grade", min: 0, max: 100, passing: 70 },
    ];

    this.assignmentTypes = [
      "Homework",
      "Quiz",
      "Test",
      "Project",
      "Lab Report",
      "Essay",
      "Presentation",
      "Final Exam",
      "Midterm",
      "Group Work",
    ];
  }

  // Generate realistic student data using Mockaroo API
  async generateStudents(count = 100) {
    try {
      console.log(`🎓 Generating ${count} realistic students...`);

      const response = await axios.get(
        `https://my.api.mockaroo.com/students.json?key=YOUR_API_KEY&count=${count}`
      );

      // If Mockaroo isn't available, use fallback realistic data
      if (!response.data) {
        return this.generateFallbackStudents(count);
      }

      return response.data.map((student) => ({
        ...student,
        role: "student",
        grade_level: Math.floor(Math.random() * 12) + 1, // Grades 1-12
        enrollment_date: this.randomDateInRange(new Date("2023-08-01"), new Date("2024-01-01")),
        is_active: Math.random() > 0.1, // 90% active
      }));
    } catch (error) {
      console.log("📝 Using fallback student data...");
      return this.generateFallbackStudents(count);
    }
  }

  // Fallback realistic student generator
  generateFallbackStudents(count) {
    const firstNames = [
      "Emma",
      "Liam",
      "Olivia",
      "Noah",
      "Ava",
      "Elijah",
      "Sophia",
      "Lucas",
      "Charlotte",
      "Mason",
      "Isabella",
      "Logan",
      "Amelia",
      "Alexander",
      "Mia",
      "Ethan",
      "Harper",
      "Jacob",
      "Evelyn",
      "Michael",
      "Abigail",
      "Daniel",
      "Emily",
      "Henry",
      "Elizabeth",
      "Jackson",
      "Sofia",
      "Sebastian",
      "Avery",
      "Aiden",
      "Ella",
      "Matthew",
      "Madison",
      "Samuel",
      "Scarlett",
      "David",
      "Victoria",
      "Joseph",
      "Aria",
      "Carter",
      "Grace",
      "Owen",
      "Chloe",
      "Luke",
    ];

    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
      "Hernandez",
      "Lopez",
      "Gonzalez",
      "Wilson",
      "Anderson",
      "Thomas",
      "Taylor",
      "Moore",
      "Jackson",
      "Martin",
      "Lee",
      "Perez",
      "Thompson",
      "White",
      "Harris",
      "Sanchez",
      "Clark",
      "Ramirez",
      "Lewis",
      "Robinson",
      "Walker",
      "Young",
      "Allen",
      "King",
    ];

    return Array.from({ length: count }, (_, i) => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const gradeLevel = Math.floor(Math.random() * 12) + 1;

      return {
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@students.school.edu`,
        username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`,
        role: "student",
        grade_level: gradeLevel,
        phone: this.generatePhoneNumber(),
        address: this.generateAddress(),
        enrollment_date: this.randomDateInRange(new Date("2023-08-01"), new Date("2024-01-01")),
        is_active: Math.random() > 0.1,
        parent_email: `parent.${lastName.toLowerCase()}${i}@email.com`,
        emergency_contact: this.generatePhoneNumber(),
      };
    });
  }

  // Generate realistic teacher data
  generateTeachers(count = 20) {
    console.log(`👩‍🏫 Generating ${count} realistic teachers...`);

    const teacherFirstNames = [
      "Sarah",
      "Michael",
      "Jennifer",
      "David",
      "Lisa",
      "Robert",
      "Michelle",
      "James",
      "Amy",
      "Christopher",
      "Karen",
      "Daniel",
      "Ashley",
      "Matthew",
      "Jessica",
      "Anthony",
      "Amanda",
      "Mark",
      "Stephanie",
      "Steven",
    ];

    const teacherLastNames = [
      "Anderson",
      "Thompson",
      "Garcia",
      "Martinez",
      "Robinson",
      "Clark",
      "Rodriguez",
      "Lewis",
      "Walker",
      "Hall",
      "Allen",
      "Young",
      "King",
      "Wright",
      "Lopez",
      "Hill",
      "Scott",
      "Green",
      "Adams",
      "Baker",
    ];

    return Array.from({ length: count }, (_, i) => {
      const firstName = teacherFirstNames[Math.floor(Math.random() * teacherFirstNames.length)];
      const lastName = teacherLastNames[Math.floor(Math.random() * teacherLastNames.length)];
      const department = this.departments[Math.floor(Math.random() * this.departments.length)];

      return {
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
        username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        role: "teacher",
        department,
        phone: this.generatePhoneNumber(),
        hire_date: this.randomDateInRange(new Date("2020-01-01"), new Date("2024-01-01")),
        salary: Math.floor(Math.random() * 30000) + 45000, // $45k-$75k
        qualifications: this.generateQualifications(),
        is_active: Math.random() > 0.05, // 95% active
      };
    });
  }

  // Generate realistic course data
  generateCourses() {
    console.log("📚 Generating realistic courses...");

    const courses = [];
    Object.entries(this.courses).forEach(([department, courseList]) => {
      courseList.forEach((courseName) => {
        courses.push({
          name: courseName,
          code: this.generateCourseCode(courseName),
          department,
          credits: Math.floor(Math.random() * 3) + 1, // 1-3 credits
          description: this.generateCourseDescription(courseName),
          prerequisites: Math.random() > 0.7 ? this.getRandomPrerequisite(courseName) : null,
          grade_level: Math.floor(Math.random() * 4) + 9, // Grades 9-12
          semester: Math.random() > 0.5 ? "Fall" : "Spring",
          max_students: Math.floor(Math.random() * 15) + 20, // 20-35 students
        });
      });
    });

    return courses;
  }

  // Generate realistic assignments
  generateAssignments(classId, count = 15) {
    return Array.from({ length: count }, (_, i) => {
      const assignmentType =
        this.assignmentTypes[Math.floor(Math.random() * this.assignmentTypes.length)];
      const daysFromNow = Math.floor(Math.random() * 180) - 90; // ±90 days from today
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysFromNow);

      return {
        class_id: classId,
        title: `${assignmentType} ${i + 1}`,
        description: this.generateAssignmentDescription(assignmentType),
        assignment_type: assignmentType.toLowerCase(),
        due_date: dueDate,
        max_points: this.getMaxPoints(assignmentType),
        instructions: this.generateInstructions(assignmentType),
        is_published: Math.random() > 0.2, // 80% published
        created_date: this.randomDateInRange(new Date("2024-01-01"), new Date()),
      };
    });
  }

  // Utility functions
  generatePhoneNumber() {
    const areaCode = Math.floor(Math.random() * 800) + 200;
    const exchange = Math.floor(Math.random() * 800) + 200;
    const number = Math.floor(Math.random() * 10000);
    return `(${areaCode}) ${exchange}-${number.toString().padStart(4, "0")}`;
  }

  generateAddress() {
    const streetNumbers = Math.floor(Math.random() * 9999) + 1;
    const streetNames = [
      "Main St",
      "Oak Ave",
      "Park Rd",
      "First St",
      "Second St",
      "Elm St",
      "Washington Ave",
      "Maple St",
      "Cedar Ln",
      "Pine St",
      "Church St",
    ];
    const cities = [
      "Springfield",
      "Franklin",
      "Clinton",
      "Georgetown",
      "Madison",
      "Oakland",
      "Salem",
      "Richmond",
      "Bristol",
      "Manchester",
    ];
    const states = ["CA", "TX", "FL", "NY", "IL", "PA", "OH", "MI", "GA", "NC"];

    const street = streetNames[Math.floor(Math.random() * streetNames.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const zipCode = Math.floor(Math.random() * 90000) + 10000;

    return `${streetNumbers} ${street}, ${city}, ${state} ${zipCode}`;
  }

  generateCourseCode(courseName) {
    const words = courseName.split(" ");
    const prefix = words[0].substring(0, 3).toUpperCase();
    const number = Math.floor(Math.random() * 400) + 100;
    return `${prefix}${number}`;
  }

  generateCourseDescription(courseName) {
    const descriptions = {
      "Algebra I":
        "Introduction to algebraic concepts, linear equations, and problem-solving techniques.",
      Biology: "Study of living organisms, their structure, function, growth, and evolution.",
      "World History":
        "Comprehensive survey of global historical events from ancient to modern times.",
      "English 9": "Foundation course in literature analysis, writing skills, and communication.",
      Chemistry: "Introduction to chemical principles, reactions, and laboratory techniques.",
    };

    return (
      descriptions[courseName] ||
      `Comprehensive study of ${courseName.toLowerCase()} principles and applications.`
    );
  }

  generateAssignmentDescription(type) {
    const descriptions = {
      Homework: "Complete assigned problems and readings to reinforce classroom learning.",
      Quiz: "Short assessment covering recent material to check understanding.",
      Test: "Comprehensive examination covering multiple topics from the unit.",
      Project: "Extended research and creative work demonstrating deep understanding.",
      Essay: "Written analysis and argumentation on assigned topics.",
      "Lab Report": "Detailed documentation of experimental procedures and findings.",
    };

    return descriptions[type] || `${type} assignment to assess student learning and progress.`;
  }

  getMaxPoints(assignmentType) {
    const pointValues = {
      Homework: Math.floor(Math.random() * 20) + 10, // 10-30 points
      Quiz: Math.floor(Math.random() * 30) + 20, // 20-50 points
      Test: Math.floor(Math.random() * 50) + 50, // 50-100 points
      Project: Math.floor(Math.random() * 100) + 100, // 100-200 points
      "Final Exam": Math.floor(Math.random() * 100) + 200, // 200-300 points
    };

    return pointValues[assignmentType] || 50;
  }

  randomDateInRange(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  generateQualifications() {
    const degrees = ["B.A.", "B.S.", "M.A.", "M.S.", "M.Ed.", "Ph.D."];
    const certifications = [
      "State Teaching License",
      "Subject Area Certification",
      "ESL Certification",
    ];

    const degree = degrees[Math.floor(Math.random() * degrees.length)];
    const cert = certifications[Math.floor(Math.random() * certifications.length)];

    return `${degree} in Education, ${cert}`;
  }

  generateInstructions(assignmentType) {
    return `Complete this ${assignmentType.toLowerCase()} by the due date. Show all work and provide detailed explanations. Submit through the online portal.`;
  }

  getRandomPrerequisite(courseName) {
    const prerequisites = {
      "Algebra II": "Algebra I",
      Calculus: "Pre-Calculus",
      Chemistry: "Biology",
      Physics: "Chemistry",
    };

    return prerequisites[courseName] || null;
  }
}

// Database seeding functions
async function seedDatabase() {
  console.log("🌱 Starting database seeding with realistic data...");
  const generator = new SchoolDataGenerator();

  try {
    // Generate realistic data
    const students = await generator.generateStudents(150);
    const teachers = generator.generateTeachers(25);
    const courses = generator.generateCourses();

    // Insert departments
    console.log("🏫 Seeding departments...");
    for (const dept of generator.departments) {
      await pool.query(
        "INSERT INTO departments (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
        [dept, `${dept} Department`]
      );
    }

    // Insert students
    console.log("👨‍🎓 Seeding students...");
    for (const student of students) {
      await pool.query(
        `
        INSERT INTO users (first_name, last_name, email, username, role, phone, address, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING
      `,
        [
          student.first_name,
          student.last_name,
          student.email,
          student.username,
          student.role,
          student.phone,
          student.address,
          student.is_active,
        ]
      );
    }

    // Insert teachers
    console.log("👩‍🏫 Seeding teachers...");
    for (const teacher of teachers) {
      await pool.query(
        `
        INSERT INTO users (first_name, last_name, email, username, role, phone, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO NOTHING
      `,
        [
          teacher.first_name,
          teacher.last_name,
          teacher.email,
          teacher.username,
          teacher.role,
          teacher.phone,
          teacher.is_active,
        ]
      );
    }

    // Insert courses and generate assignments
    console.log("📚 Seeding courses and assignments...");
    for (const course of courses) {
      const courseResult = await pool.query(
        `
        INSERT INTO classes (name, code, description, department_id, max_students)
        SELECT $1, $2, $3, d.id, $4
        FROM departments d WHERE d.name = $5
        RETURNING id
      `,
        [course.name, course.code, course.description, course.max_students, course.department]
      );

      if (courseResult.rows.length > 0) {
        const classId = courseResult.rows[0].id;
        const assignments = generator.generateAssignments(classId, 10);

        for (const assignment of assignments) {
          await pool.query(
            `
            INSERT INTO assignments (class_id, title, description, assignment_type, due_date, max_points, instructions, is_published)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
            [
              assignment.class_id,
              assignment.title,
              assignment.description,
              assignment.assignment_type,
              assignment.due_date,
              assignment.max_points,
              assignment.instructions,
              assignment.is_published,
            ]
          );
        }
      }
    }

    // Generate realistic attendance data
    console.log("📅 Seeding attendance records...");
    await generateAttendanceData();

    // Generate realistic grade data
    console.log("📊 Seeding grade records...");
    await generateGradeData();

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await pool.end();
  }
}

// Generate realistic attendance patterns
async function generateAttendanceData() {
  // Implementation for attendance data generation
  // This would create realistic attendance patterns with some absences
}

// Generate realistic grade data
async function generateGradeData() {
  // Implementation for grade data generation
  // This would create realistic grade distributions
}

// Export for use as module
if (require.main === module) {
  seedDatabase();
}

module.exports = { SchoolDataGenerator, seedDatabase };

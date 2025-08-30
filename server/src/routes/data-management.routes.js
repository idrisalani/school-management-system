const express = require("express");
const { SchoolDataGenerator } = require("../../scripts/seed-realistic-data");
const router = express.Router();

// Endpoint to generate fresh realistic data
router.post("/seed/realistic", async (req, res) => {
  try {
    const { studentCount = 100, teacherCount = 20 } = req.body;
    const generator = new SchoolDataGenerator();

    const students = await generator.generateStudents(studentCount);
    const teachers = generator.generateTeachers(teacherCount);

    // Insert into database using your existing models
    res.json({
      message: "Realistic data generated successfully",
      studentsCreated: students.length,
      teachersCreated: teachers.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

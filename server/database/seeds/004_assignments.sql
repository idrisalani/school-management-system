-- Seed Assignments
USE school_management;

-- CS101 Assignments
INSERT INTO assignments (id, course_id, title, description, due_date, total_points, assignment_type) 
SELECT 
    UUID(),
    c.id,
    'Python Basics',
    'Complete basic Python programming exercises',
    DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY),
    100,
    'homework'
FROM courses c
WHERE c.code = 'CS101';

INSERT INTO assignments (id, course_id, title, description, due_date, total_points, assignment_type)
SELECT 
    UUID(),
    c.id,
    'Midterm Project',
    'Build a simple console application',
    DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY),
    200,
    'project'
FROM courses c
WHERE c.code = 'CS101';

-- MATH101 Assignments
INSERT INTO assignments (id, course_id, title, description, due_date, total_points, assignment_type)
SELECT 
    UUID(),
    c.id,
    'Limits and Continuity',
    'Practice problems on limits and continuity',
    DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY),
    100,
    'homework'
FROM courses c
WHERE c.code = 'MATH101';

INSERT INTO assignments (id, course_id, title, description, due_date, total_points, assignment_type)
SELECT 
    UUID(),
    c.id,
    'Midterm Exam',
    'Comprehensive exam on differential calculus',
    DATE_ADD(CURRENT_DATE(), INTERVAL 45 DAY),
    300,
    'exam'
FROM courses c
WHERE c.code = 'MATH101';
-- Seed Enrollments
USE school_management;

-- Enroll students in CS101
INSERT INTO enrollments (id, student_id, course_id, enrollment_date, status)
SELECT 
    UUID(),
    u.id,
    c.id,
    CURRENT_DATE(),
    'active'
FROM users u, courses c
WHERE u.email LIKE 'student%@school.com'
AND c.code = 'CS101';

-- Enroll students in MATH101
INSERT INTO enrollments (id, student_id, course_id, enrollment_date, status)
SELECT 
    UUID(),
    u.id,
    c.id,
    CURRENT_DATE(),
    'active'
FROM users u, courses c
WHERE u.email LIKE 'student%@school.com'
AND c.code = 'MATH101';

-- Add parent-student relationships
INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type)
SELECT 
    p.id,
    s.id,
    'parent'
FROM users p, users s
WHERE p.email = 'parent1@email.com'
AND s.email = 'student1@school.com';

INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type)
SELECT 
    p.id,
    s.id,
    'parent'
FROM users p, users s
WHERE p.email = 'parent2@email.com'
AND s.email = 'student2@school.com';
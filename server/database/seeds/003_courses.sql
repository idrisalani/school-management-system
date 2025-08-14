-- Seed Courses
USE school_management;

-- Computer Science Courses
INSERT INTO courses (id, code, name, description, department_id, credits, max_students, status) VALUES
(UUID(), 'CS101', 'Introduction to Programming', 'Basic programming concepts using Python', 
    (SELECT id FROM departments WHERE code = 'CS'), 3, 30, 'active'),
(UUID(), 'CS201', 'Data Structures', 'Advanced data structures and algorithms', 
    (SELECT id FROM departments WHERE code = 'CS'), 3, 25, 'active'),
(UUID(), 'CS301', 'Database Systems', 'Introduction to database design and SQL', 
    (SELECT id FROM departments WHERE code = 'CS'), 3, 25, 'active');

-- Mathematics Courses
INSERT INTO courses (id, code, name, description, department_id, credits, max_students, status) VALUES
(UUID(), 'MATH101', 'Calculus I', 'Introduction to differential calculus', 
    (SELECT id FROM departments WHERE code = 'MATH'), 4, 35, 'active'),
(UUID(), 'MATH201', 'Linear Algebra', 'Vectors, matrices, and linear transformations', 
    (SELECT id FROM departments WHERE code = 'MATH'), 3, 30, 'active');

-- Physics Courses
INSERT INTO courses (id, code, name, description, department_id, credits, max_students, status) VALUES
(UUID(), 'PHYS101', 'Physics I', 'Mechanics and thermodynamics', 
    (SELECT id FROM departments WHERE code = 'PHYS'), 4, 30, 'active'),
(UUID(), 'PHYS201', 'Physics II', 'Electricity and magnetism', 
    (SELECT id FROM departments WHERE code = 'PHYS'), 4, 30, 'active');

-- Assign Teachers to Courses
INSERT INTO course_teachers (course_id, teacher_id)
SELECT c.id, u.id
FROM courses c, users u
WHERE c.code = 'CS101' AND u.email = 'smith.john@school.com';

INSERT INTO course_teachers (course_id, teacher_id)
SELECT c.id, u.id
FROM courses c, users u
WHERE c.code = 'MATH101' AND u.email = 'doe.jane@school.com';
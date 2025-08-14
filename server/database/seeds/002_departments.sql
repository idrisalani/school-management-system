-- Seed Departments
USE school_management;

INSERT INTO departments (id, name, code, description) VALUES
(UUID(), 'Computer Science', 'CS', 'Department of Computer Science and Software Engineering'),
(UUID(), 'Mathematics', 'MATH', 'Department of Mathematics and Statistics'),
(UUID(), 'Physics', 'PHYS', 'Department of Physics and Astronomy'),
(UUID(), 'Chemistry', 'CHEM', 'Department of Chemistry and Biochemistry'),
(UUID(), 'Biology', 'BIO', 'Department of Biological Sciences'),
(UUID(), 'English', 'ENG', 'Department of English Language and Literature'),
(UUID(), 'History', 'HIST', 'Department of History and Social Studies');

-- Update department heads
UPDATE departments 
SET head_id = (SELECT id FROM users WHERE email = 'smith.john@school.com')
WHERE code = 'CS';

UPDATE departments 
SET head_id = (SELECT id FROM users WHERE email = 'doe.jane@school.com')
WHERE code = 'MATH';
-- Seed Users
USE school_management;

-- Admin users
INSERT INTO users (id, email, password_hash, name, role, is_active, is_email_verified) VALUES
(UUID(), 'admin@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'System Administrator', 'admin', true, true),
(UUID(), 'principal@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'School Principal', 'admin', true, true);

-- Teachers
INSERT INTO users (id, email, password_hash, name, role, is_active, is_email_verified) VALUES
(UUID(), 'smith.john@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'John Smith', 'teacher', true, true),
(UUID(), 'doe.jane@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'Jane Doe', 'teacher', true, true),
(UUID(), 'wilson.mary@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'Mary Wilson', 'teacher', true, true),
(UUID(), 'brown.robert@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'Robert Brown', 'teacher', true, true);

-- Students
INSERT INTO users (id, email, password_hash, name, role, is_active, is_email_verified) VALUES
(UUID(), 'student1@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'Alice Johnson', 'student', true, true),
(UUID(), 'student2@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'Bob Wilson', 'student', true, true),
(UUID(), 'student3@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'Carol Martinez', 'student', true, true),
(UUID(), 'student4@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'David Chen', 'student', true, true),
(UUID(), 'student5@school.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'Emma Davis', 'student', true, true);

-- Parents
INSERT INTO users (id, email, password_hash, name, role, is_active, is_email_verified) VALUES
(UUID(), 'parent1@email.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'Michael Johnson', 'parent', true, true),
(UUID(), 'parent2@email.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'Sarah Wilson', 'parent', true, true),
(UUID(), 'parent3@email.com', '$2a$10$CJES0z4/1xHoVQxEQX2WUOqyB.qYIC4jqUkVpUz7nU7EvcQlej52u', 'James Martinez', 'parent', true, true);
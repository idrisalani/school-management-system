//teacher\components\assignments\utils\validationRules.js
// Validation rules for teacher assignments
export const assignmentValidationRules = {
    // Title validation
    title: {
      required: "Assignment title is required",
      minLength: {
        value: 3,
        message: "Title must be at least 3 characters long"
      },
      maxLength: {
        value: 100,
        message: "Title cannot exceed 100 characters"
      },
      pattern: {
        value: /^[a-zA-Z0-9\s\-_.(),]+$/,
        message: "Title can only contain letters, numbers, spaces and basic punctuation"
      }
    },
  
    // Description validation
    description: {
      required: "Assignment description is required",
      minLength: {
        value: 10,
        message: "Description must be at least 10 characters long"
      },
      maxLength: {
        value: 2000,
        message: "Description cannot exceed 2000 characters"
      }
    },
  
    // Due date validation
    dueDate: {
      required: "Due date is required",
      validate: {
        futureDate: (value) => {
          const now = new Date();
          const dueDate = new Date(value);
          return dueDate > now || "Due date must be in the future";
        },
        withinSchoolYear: (value) => {
          const dueDate = new Date(value);
          const currentYear = new Date().getFullYear();
          const schoolYearStart = new Date(currentYear, 7, 1); // August 1st
          const schoolYearEnd = new Date(currentYear + 1, 5, 30); // June 30th
          return (dueDate >= schoolYearStart && dueDate <= schoolYearEnd) || 
            "Due date must be within the current school year";
        }
      }
    },
  
    // Subject/Class validation
    subjectId: {
      required: "Subject is required"
    },
  
    classId: {
      required: "Class is required"
    },
  
    // Total points/grade validation
    totalPoints: {
      required: "Total points is required",
      min: {
        value: 1,
        message: "Total points must be at least 1"
      },
      max: {
        value: 1000,
        message: "Total points cannot exceed 1000"
      },
      pattern: {
        value: /^\d+$/,
        message: "Total points must be a whole number"
      }
    },
  
    // Assignment type validation
    assignmentType: {
      required: "Assignment type is required",
      enum: {
        values: ['homework', 'project', 'quiz', 'test', 'essay', 'other'],
        message: "Invalid assignment type selected"
      }
    },
  
    // File upload validation
    attachments: {
      validate: {
        fileSize: (files) => {
          const maxSize = 10 * 1024 * 1024; // 10MB
          return !files || Array.from(files).every(file => file.size <= maxSize) || 
            "Files must be less than 10MB";
        },
        fileType: (files) => {
          const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'text/plain'
          ];
          return !files || Array.from(files).every(file => allowedTypes.includes(file.type)) || 
            "Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, TXT";
        },
        maxFiles: (files) => {
          return !files || files.length <= 5 || "Maximum 5 files allowed";
        }
      }
    },
  
    // Submission type validation
    submissionType: {
      required: "Submission type is required",
      enum: {
        values: ['online', 'physical', 'both'],
        message: "Invalid submission type selected"
      }
    },
  
    // Grade category validation
    gradeCategory: {
      required: "Grade category is required",
      enum: {
        values: ['homework', 'classwork', 'test', 'exam', 'project', 'participation'],
        message: "Invalid grade category selected"
      }
    },
  
    // Instructions validation
    instructions: {
      maxLength: {
        value: 5000,
        message: "Instructions cannot exceed 5000 characters"
      }
    },
  
    // Resubmission settings
    allowResubmission: {
      type: "boolean"
    },
  
    resubmissionDeadline: {
      validate: {
        validDeadline: (value, formValues) => {
          if (!formValues.allowResubmission) return true;
          if (!value) return "Resubmission deadline is required when resubmission is allowed";
          
          const dueDate = new Date(formValues.dueDate);
          const resubmitDate = new Date(value);
          return resubmitDate > dueDate || 
            "Resubmission deadline must be after the original due date";
        }
      }
    }
  };
  
  // Helper functions for validation
  export const validateSubmission = (files, assignmentRules) => {
    const errors = [];
  
    // Validate file size
    if (assignmentRules.maxFileSize) {
      const isValidSize = Array.from(files).every(
        file => file.size <= assignmentRules.maxFileSize
      );
      if (!isValidSize) {
        errors.push(`Files must be smaller than ${assignmentRules.maxFileSize / (1024 * 1024)}MB`);
      }
    }
  
    // Validate file types
    if (assignmentRules.allowedFileTypes?.length) {
      const isValidType = Array.from(files).every(
        file => assignmentRules.allowedFileTypes.includes(file.type)
      );
      if (!isValidType) {
        errors.push(`Allowed file types: ${assignmentRules.allowedFileTypes.join(', ')}`);
      }
    }
  
    return errors;
  };
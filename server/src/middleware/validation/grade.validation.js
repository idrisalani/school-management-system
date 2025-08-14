// server/src/middleware/validation/grade.validation.js
import Joi from "joi";
import { ApiError } from "../../utils/errors";

const gradeSchema = Joi.object({
  student: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid student ID format",
      "any.required": "Student ID is required",
    }),

  course: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid course ID format",
      "any.required": "Course ID is required",
    }),

  value: Joi.number().min(0).max(100).required().messages({
    "number.base": "Grade value must be a number",
    "number.min": "Grade value cannot be less than 0",
    "number.max": "Grade value cannot be more than 100",
    "any.required": "Grade value is required",
  }),

  type: Joi.string()
    .valid("assignment", "quiz", "exam", "project", "other")
    .required()
    .messages({
      "any.only": "Invalid grade type",
      "any.required": "Grade type is required",
    }),

  weight: Joi.number().min(0).max(100).required().messages({
    "number.base": "Weight must be a number",
    "number.min": "Weight cannot be less than 0",
    "number.max": "Weight cannot be more than 100",
    "any.required": "Weight is required",
  }),

  description: Joi.string().max(500).optional().messages({
    "string.max": "Description cannot be longer than 500 characters",
  }),

  comments: Joi.string().max(1000).optional().messages({
    "string.max": "Comments cannot be longer than 1000 characters",
  }),
});

const validateGrade = async (req, res, next) => {
  try {
    if (req.method === "PUT" && req.path === "/bulk") {
      // Validate bulk update payload
      const bulkSchema = Joi.object({
        grades: Joi.array()
          .items(
            Joi.object({
              _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required(),
              value: Joi.number().min(0).max(100).required(),
              comments: Joi.string().max(1000).optional(),
            })
          )
          .min(1)
          .required(),
      });

      await bulkSchema.validateAsync(req.body);
    } else {
      // Validate single grade payload
      await gradeSchema.validateAsync(req.body);
    }
    next();
  } catch (error) {
    next(new ApiError(400, error.details[0].message));
  }
};

export default validateGrade;

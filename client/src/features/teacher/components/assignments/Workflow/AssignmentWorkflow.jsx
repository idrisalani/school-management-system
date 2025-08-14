// @ts-nocheck
// client/src/features/teacher/components/assignments/Workflow/AssignmentWorkflow.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { AlertCircle, Clock, FilePlus, FileText, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { assignmentValidationRules } from "../utils/validationRules";

const AssignmentWorkflow = ({ initialData, onSave, onPublish }) => {
  const [activeStep, setActiveStep] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(""); // Changed from null to empty string

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm({
    defaultValues: initialData || {
      title: "",
      description: "",
      dueDate: "",
      subjectId: "",
      classId: "",
      totalPoints: 100,
      assignmentType: "homework",
      submissionType: "online",
      gradeCategory: "homework",
      instructions: "",
      allowResubmission: false,
      resubmissionDeadline: "",
      attachments: [],
    },
    mode: "onChange",
  });

  // Track form changes
  const formValues = watch();

  // Reset error when form values change
  const resetError = useCallback(() => {
    if (error) setError("");
  }, [error]);

  useEffect(() => {
    resetError();
  }, [formValues, resetError]);

  const workflowSteps = {
    details: {
      label: "Basic Details",
      icon: FileText,
      fields: ["title", "description", "dueDate", "subjectId", "classId"],
    },
    requirements: {
      label: "Requirements",
      icon: FilePlus,
      fields: [
        "totalPoints",
        "assignmentType",
        "submissionType",
        "gradeCategory",
      ],
    },
    instructions: {
      label: "Instructions",
      icon: AlertCircle,
      fields: ["instructions", "attachments"],
    },
    review: {
      label: "Review & Submit",
      icon: Clock,
      fields: [],
    },
  };

  const handleStepChange = (step) => {
    // Validate current step before moving
    const currentStepFields = workflowSteps[activeStep].fields;
    const hasErrors = currentStepFields.some((field) => errors[field]);

    if (!hasErrors) {
      setActiveStep(step);
    }
  };

  const handleSaveDraft = async (data) => {
    try {
      setIsSubmitting(true);
      await onSave({ ...data, status: "draft" });
      setError("");
    } catch (err) {
      setError("Failed to save draft. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (data) => {
    try {
      setIsSubmitting(true);
      await onPublish({ ...data, status: "published" });
      setError("");
    } catch (err) {
      setError("Failed to publish assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to safely display error messages
  const getErrorMessage = (error) => {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (error.message) return error.message;
    return "Invalid input";
  };

  const renderFormFields = () => {
    switch (activeStep) {
      case "details":
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  {...register("title", assignmentValidationRules.title)}
                  className="w-full mt-1 p-2 border rounded"
                />
                {errors.title && (
                  <span className="text-red-500 text-sm">
                    {getErrorMessage(errors.title)}
                  </span>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  {...register(
                    "description",
                    assignmentValidationRules.description
                  )}
                  className="w-full mt-1 p-2 border rounded"
                  rows={4}
                />
                {errors.description && (
                  <span className="text-red-500 text-sm">
                    {getErrorMessage(errors.description)}
                  </span>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Due Date</label>
                <input
                  type="datetime-local"
                  {...register("dueDate", assignmentValidationRules.dueDate)}
                  className="w-full mt-1 p-2 border rounded"
                />
                {errors.dueDate && (
                  <span className="text-red-500 text-sm">
                    {getErrorMessage(errors.dueDate)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <select
                    {...register(
                      "subjectId",
                      assignmentValidationRules.subjectId
                    )}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="">Select Subject</option>
                    <option value="math">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="english">English</option>
                    <option value="history">History</option>
                  </select>
                  {errors.subjectId && (
                    <span className="text-red-500 text-sm">
                      {getErrorMessage(errors.subjectId)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Class</label>
                  <select
                    {...register("classId", assignmentValidationRules.classId)}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="">Select Class</option>
                    <option value="class-1">Grade 1</option>
                    <option value="class-2">Grade 2</option>
                    <option value="class-3">Grade 3</option>
                  </select>
                  {errors.classId && (
                    <span className="text-red-500 text-sm">
                      {getErrorMessage(errors.classId)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "requirements":
        return (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Total Points</label>
                <input
                  type="number"
                  {...register(
                    "totalPoints",
                    assignmentValidationRules.totalPoints
                  )}
                  className="w-full mt-1 p-2 border rounded"
                />
                {errors.totalPoints && (
                  <span className="text-red-500 text-sm">
                    {getErrorMessage(errors.totalPoints)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Assignment Type</label>
                  <select
                    {...register(
                      "assignmentType",
                      assignmentValidationRules.assignmentType
                    )}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="homework">Homework</option>
                    <option value="project">Project</option>
                    <option value="quiz">Quiz</option>
                    <option value="test">Test</option>
                    <option value="essay">Essay</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.assignmentType && (
                    <span className="text-red-500 text-sm">
                      {getErrorMessage(errors.assignmentType)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Submission Type</label>
                  <select
                    {...register(
                      "submissionType",
                      assignmentValidationRules.submissionType
                    )}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="online">Online</option>
                    <option value="physical">Physical</option>
                    <option value="both">Both</option>
                  </select>
                  {errors.submissionType && (
                    <span className="text-red-500 text-sm">
                      {getErrorMessage(errors.submissionType)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Grade Category</label>
                <select
                  {...register(
                    "gradeCategory",
                    assignmentValidationRules.gradeCategory
                  )}
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="homework">Homework</option>
                  <option value="classwork">Classwork</option>
                  <option value="test">Test</option>
                  <option value="exam">Exam</option>
                  <option value="project">Project</option>
                  <option value="participation">Participation</option>
                </select>
                {errors.gradeCategory && (
                  <span className="text-red-500 text-sm">
                    {getErrorMessage(errors.gradeCategory)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case "instructions":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Instructions</label>
              <textarea
                {...register(
                  "instructions",
                  assignmentValidationRules.instructions
                )}
                className="w-full mt-1 p-2 border rounded"
                rows={6}
                placeholder="Provide detailed instructions for students..."
              />
              {errors.instructions && (
                <span className="text-red-500 text-sm">
                  {getErrorMessage(errors.instructions)}
                </span>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Attachments</label>
              <input
                type="file"
                multiple
                {...register(
                  "attachments",
                  assignmentValidationRules.attachments
                )}
                className="w-full mt-1 p-2 border rounded"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
              {errors.attachments && (
                <span className="text-red-500 text-sm">
                  {getErrorMessage(errors.attachments)}
                </span>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG, TXT
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("allowResubmission")}
                id="allowResubmission"
              />
              <label htmlFor="allowResubmission" className="text-sm">
                Allow Resubmission
              </label>
            </div>

            {watch("allowResubmission") && (
              <div>
                <label className="text-sm font-medium">
                  Resubmission Deadline
                </label>
                <input
                  type="datetime-local"
                  {...register(
                    "resubmissionDeadline",
                    assignmentValidationRules.resubmissionDeadline
                  )}
                  className="w-full mt-1 p-2 border rounded"
                />
                {errors.resubmissionDeadline && (
                  <span className="text-red-500 text-sm">
                    {getErrorMessage(errors.resubmissionDeadline)}
                  </span>
                )}
              </div>
            )}
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Assignment Summary</h3>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium">Title</dt>
                    <dd className="col-span-2">
                      {formValues.title || "Not specified"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium">Description</dt>
                    <dd className="col-span-2">
                      {formValues.description || "Not specified"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium">Due Date</dt>
                    <dd className="col-span-2">
                      {formValues.dueDate || "Not specified"}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium">Total Points</dt>
                    <dd className="col-span-2">{formValues.totalPoints}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium">Assignment Type</dt>
                    <dd className="col-span-2 capitalize">
                      {formValues.assignmentType}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium">Submission Type</dt>
                    <dd className="col-span-2 capitalize">
                      {formValues.submissionType}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="font-medium">Grade Category</dt>
                    <dd className="col-span-2 capitalize">
                      {formValues.gradeCategory}
                    </dd>
                  </div>
                  {formValues.allowResubmission && (
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="font-medium">Resubmission Allowed</dt>
                      <dd className="col-span-2">Yes</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeStep} onValueChange={handleStepChange}>
        <TabsList className="grid grid-cols-4 w-full">
          {Object.entries(workflowSteps).map(([key, { label, icon: Icon }]) => (
            <TabsTrigger
              key={key}
              value={key}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(workflowSteps).map((step) => (
          <TabsContent key={step} value={step} className="mt-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">
                  {workflowSteps[step].label}
                </h2>
              </CardHeader>
              <CardContent>{renderFormFields()}</CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleSubmit(handleSaveDraft)}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save as Draft"}
        </Button>

        <div className="space-x-2">
          {activeStep !== "review" ? (
            <Button
              onClick={() => {
                const stepKeys = Object.keys(workflowSteps);
                const currentIndex = stepKeys.indexOf(activeStep);
                const nextStep = stepKeys[currentIndex + 1];
                if (nextStep) {
                  handleStepChange(nextStep);
                }
              }}
              disabled={!isValid || isSubmitting}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit(handlePublish)}
              disabled={!isValid || isSubmitting}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Publishing..." : "Publish Assignment"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentWorkflow;

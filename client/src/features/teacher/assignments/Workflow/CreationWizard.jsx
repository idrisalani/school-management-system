// @ts-nocheck
// client/src/features/teacher/components/assignments/Workflow/CreationWizard.jsx
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  Book,
  Presentation,
  FileText,
  Calculator,
  Users,
  Target,
} from "lucide-react";
import AssignmentWorkflow from "./AssignmentWorkflow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AssignmentTemplates = {
  HOMEWORK: {
    title: "Homework Assignment",
    description:
      "Regular homework assignment with standard submission requirements",
    icon: Book,
    defaults: {
      assignmentType: "homework",
      submissionType: "online",
      gradeCategory: "homework",
      totalPoints: 100,
      allowResubmission: true,
    },
  },
  PROJECT: {
    title: "Project Assignment",
    description: "Long-term project with multiple submission phases",
    icon: Presentation,
    defaults: {
      assignmentType: "project",
      submissionType: "both",
      gradeCategory: "project",
      totalPoints: 200,
      allowResubmission: true,
    },
  },
  QUIZ: {
    title: "Quiz Assignment",
    description: "Short assessment with time limitations",
    icon: Calculator,
    defaults: {
      assignmentType: "quiz",
      submissionType: "online",
      gradeCategory: "test",
      totalPoints: 50,
      allowResubmission: false,
    },
  },
  GROUP_WORK: {
    title: "Group Assignment",
    description: "Collaborative assignment for team projects",
    icon: Users,
    defaults: {
      assignmentType: "project",
      submissionType: "both",
      gradeCategory: "project",
      totalPoints: 150,
      allowResubmission: true,
    },
  },
};

const CreationWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("template");
  const [template, setTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleTemplateSelect = (selectedTemplate) => {
    setTemplate(selectedTemplate);
    setStep("creation");
  };

  const handleBack = () => {
    if (step === "creation") {
      setStep("template");
      setTemplate(null);
    } else {
      navigate("/teacher/assignments");
    }
  };

  const handleSaveDraft = useCallback(
    async (data) => {
      try {
        setIsSaving(true);
        setError(null);

        // Log the data for debugging
        console.log("Saving assignment draft:", data);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // TODO: Replace with actual API call
        // await saveAssignment({ ...data, status: 'draft' });

        navigate("/teacher/assignments", {
          state: { message: "Assignment draft saved successfully" },
        });
      } catch (err) {
        console.error("Save draft error:", err);
        setError("Failed to save assignment draft. Please try again.");
      } finally {
        setIsSaving(false);
      }
    },
    [navigate]
  );

  const handlePublish = useCallback(
    async (data) => {
      try {
        setIsSaving(true);
        setError(null);

        // Log the data for debugging
        console.log("Publishing assignment:", data);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // TODO: Replace with actual API call
        // await publishAssignment({ ...data, status: 'published' });

        navigate("/teacher/assignments", {
          state: { message: "Assignment published successfully" },
        });
      } catch (err) {
        console.error("Publish error:", err);
        setError("Failed to publish assignment. Please try again.");
      } finally {
        setIsSaving(false);
      }
    },
    [navigate]
  );

  const renderTemplateSelection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Create New Assignment
          </CardTitle>
          <CardDescription>
            Choose a template to get started quickly or create a custom
            assignment from scratch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(AssignmentTemplates).map(
              ([key, { title, description, icon: Icon, defaults }]) => (
                <Card
                  key={key}
                  className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                  onClick={() => handleTemplateSelect(defaults)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {description}
                    </p>
                    <div className="mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>Points: {defaults.totalPoints}</span>
                        <span className="capitalize">
                          Type: {defaults.assignmentType}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}

            <Card
              className="cursor-pointer hover:border-green-300 hover:shadow-md transition-all duration-200 group border-dashed border-2"
              onClick={() => handleTemplateSelect({})}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Custom Assignment</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Create a custom assignment from scratch with complete control
                  over all settings
                </p>
                <div className="mt-3 text-xs text-green-600 font-medium">
                  Start from blank template
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Dialog open={showHelp} onOpenChange={setShowHelp}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Need Help?
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Assignment Creation Guide
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <section>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Templates Overview
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Templates provide pre-configured settings for common
                  assignment types. Choose a template to save time or start from
                  scratch with a custom assignment.
                </p>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Book className="h-4 w-4 text-blue-600" />
                    <span>
                      <strong>Homework:</strong> Standard daily/weekly
                      assignments
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <Presentation className="h-4 w-4 text-green-600" />
                    <span>
                      <strong>Project:</strong> Long-term assignments with
                      multiple phases
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                    <Calculator className="h-4 w-4 text-orange-600" />
                    <span>
                      <strong>Quiz:</strong> Quick assessments and evaluations
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>
                      <strong>Group Work:</strong> Collaborative team
                      assignments
                    </span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">Creation Process</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                  <li>Select a template or custom assignment option</li>
                  <li>
                    Fill in basic details like title, description, and due date
                  </li>
                  <li>
                    Configure requirements including points and submission type
                  </li>
                  <li>Add detailed instructions and any file attachments</li>
                  <li>Review all information and publish or save as draft</li>
                </ol>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">Tips for Success</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Use clear and specific titles for easy identification</li>
                  <li>
                    Provide detailed instructions to reduce student confusion
                  </li>
                  <li>Set realistic due dates with adequate completion time</li>
                  <li>
                    Consider enabling resubmission for learning-focused
                    assignments
                  </li>
                </ul>
              </section>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  const renderAssignmentCreation = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              disabled={isSaving}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Create New Assignment
                {isSaving && (
                  <div className="ml-2 flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Saving...</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Fill in the assignment details and requirements below
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSaving && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Processing your assignment...
                  </p>
                  <p className="text-xs text-blue-700">
                    Please wait while we save your work.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className={isSaving ? "opacity-50 pointer-events-none" : ""}>
            <AssignmentWorkflow
              initialData={template}
              onSave={handleSaveDraft}
              onPublish={handlePublish}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {step === "template"
        ? renderTemplateSelection()
        : renderAssignmentCreation()}
    </div>
  );
};

export default CreationWizard;

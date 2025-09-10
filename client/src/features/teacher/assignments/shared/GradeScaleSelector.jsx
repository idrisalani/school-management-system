// @ts-nocheck
// client/src/features/teacher/components/assignments/shared/GradeScaleSelector.jsx
import React, { useState, useEffect } from "react";
import { Plus, Minus, Settings, AlertCircle, Check } from "lucide-react";

const GradeScaleSelector = ({
  initialScale = "percentage",
  initialCustomScale = null,
  onChange,
  maxPoints = 100,
  disabled = false,
}) => {
  const [selectedScale, setSelectedScale] = useState(initialScale);
  const [customScale, setCustomScale] = useState(initialCustomScale || []);
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [error, setError] = useState(null);

  const gradeScales = {
    percentage: {
      name: "Percentage",
      description: "0-100%",
      steps: Array.from({ length: 101 }, (_, i) => ({
        value: i,
        label: `${i}%`,
        grade: getLetterGrade(i),
      })),
    },
    points: {
      name: "Points",
      description: `0-${maxPoints} points`,
      steps: Array.from({ length: maxPoints + 1 }, (_, i) => ({
        value: i,
        label: i.toString(),
        percentage: (i / maxPoints) * 100,
      })),
    },
    letter: {
      name: "Letter Grade",
      description: "A+ to F",
      steps: [
        { value: 97, label: "A+", percentage: 97 },
        { value: 93, label: "A", percentage: 93 },
        { value: 90, label: "A-", percentage: 90 },
        { value: 87, label: "B+", percentage: 87 },
        { value: 83, label: "B", percentage: 83 },
        { value: 80, label: "B-", percentage: 80 },
        { value: 77, label: "C+", percentage: 77 },
        { value: 73, label: "C", percentage: 73 },
        { value: 70, label: "C-", percentage: 70 },
        { value: 67, label: "D+", percentage: 67 },
        { value: 63, label: "D", percentage: 63 },
        { value: 60, label: "D-", percentage: 60 },
        { value: 0, label: "F", percentage: 0 },
      ],
    },
    custom: {
      name: "Custom Scale",
      description: "Create your own scale",
      steps: customScale,
    },
  };

  useEffect(() => {
    if (initialCustomScale) {
      setCustomScale(initialCustomScale);
    }
  }, [initialCustomScale]);

  /**
   * Converts a percentage score to a letter grade
   * @param {number} percentage - The percentage score (0-100)
   * @returns {string} The corresponding letter grade (A+ through F)
   */
  function getLetterGrade(percentage) {
    if (percentage >= 97) return "A+";
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  }

  const handleScaleChange = (scale) => {
    setSelectedScale(scale);
    setError(null);
    onChange?.({
      type: scale,
      scale: gradeScales[scale],
      customScale: scale === "custom" ? customScale : null,
    });
  };

  const addCustomGrade = () => {
    setCustomScale((prev) => [
      ...prev,
      { value: 0, label: "", description: "" },
    ]);
  };

  const removeCustomGrade = (index) => {
    setCustomScale((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Validate after removal
      setTimeout(() => validateAndUpdateCustomScale(updated), 0);
      return updated;
    });
  };

  const updateCustomGrade = (index, field, value) => {
    setCustomScale((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Validate after update
      setTimeout(() => validateAndUpdateCustomScale(updated), 0);
      return updated;
    });
  };

  /**
   * Validates the custom grade scale and sets appropriate error messages
   * @param {Array} scaleToValidate - Optional scale array to validate (defaults to current customScale)
   * @returns {boolean} True if the scale is valid, false otherwise
   */
  const validateCustomScale = (scaleToValidate = customScale) => {
    if (scaleToValidate.length === 0) {
      setError("Custom scale must have at least one grade");
      return false;
    }

    const values = scaleToValidate.map((g) => Number(g.value));
    if (values.some((v) => isNaN(v))) {
      setError("All grade values must be numbers");
      return false;
    }

    if (new Set(values).size !== values.length) {
      setError("Grade values must be unique");
      return false;
    }

    const emptyLabels = scaleToValidate.filter(
      (g) => !g.label || g.label.trim() === ""
    );
    if (emptyLabels.length > 0) {
      setError("All grades must have labels");
      return false;
    }

    setError(null);
    return true;
  };

  /**
   * Validates the custom scale and updates the parent component if valid
   * @param {Array} scaleToValidate - The scale array to validate
   */
  const validateAndUpdateCustomScale = (scaleToValidate) => {
    if (selectedScale === "custom" && validateCustomScale(scaleToValidate)) {
      onChange?.({
        type: "custom",
        scale: { ...gradeScales.custom, steps: scaleToValidate },
        customScale: scaleToValidate,
      });
    }
  };

  const saveCustomScale = () => {
    if (validateCustomScale()) {
      setShowCustomEditor(false);
      if (selectedScale === "custom") {
        onChange?.({
          type: "custom",
          scale: gradeScales.custom,
          customScale: customScale,
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Scale Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Grading Scale
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(gradeScales).map(([key, scale]) => (
            <button
              key={key}
              onClick={() => !disabled && handleScaleChange(key)}
              className={`
                p-4 border rounded-lg text-left transition-colors relative
                ${
                  selectedScale === key
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20"
                    : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {selectedScale === key && (
                <div className="absolute top-2 right-2">
                  <Check size={16} className="text-blue-600" />
                </div>
              )}
              <h3 className="font-medium text-gray-900 pr-6">{scale.name}</h3>
              <p className="text-sm text-gray-500">{scale.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Scale Preview */}
      {selectedScale !== "custom" && (
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Scale Preview</h3>
            <button
              onClick={() => setShowCustomEditor(true)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
              disabled={disabled}
              title="Customize this scale"
            >
              <Settings size={16} />
              <span>Customize</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
            {gradeScales[selectedScale].steps
              .slice(0, 12)
              .map((step, index) => (
                <div
                  key={index}
                  className="p-2 border rounded text-center bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-900">{step.label}</div>
                  <div className="text-xs text-gray-500">
                    {step.percentage !== undefined
                      ? `${step.percentage}%`
                      : step.grade}
                  </div>
                </div>
              ))}
            {gradeScales[selectedScale].steps.length > 12 && (
              <div className="p-2 border rounded text-center bg-gray-100 text-gray-500 text-xs">
                +{gradeScales[selectedScale].steps.length - 12} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Scale Editor */}
      {(selectedScale === "custom" || showCustomEditor) && (
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Custom Scale Editor</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={addCustomGrade}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                disabled={disabled}
                title="Add grade level"
              >
                <Plus size={16} />
                <span>Add Grade</span>
              </button>
              {showCustomEditor && selectedScale !== "custom" && (
                <button
                  onClick={saveCustomScale}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
                  disabled={disabled}
                >
                  <Check size={16} />
                  <span>Save</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4 border border-red-200">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            {customScale.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                <p>No custom grades defined yet.</p>
                <p className="text-sm">
                  Click "Add Grade" to create your first grade level.
                </p>
              </div>
            ) : (
              <>
                {/* Headers */}
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 px-2">
                  <div className="col-span-2">Value</div>
                  <div className="col-span-3">Label</div>
                  <div className="col-span-6">Description</div>
                  <div className="col-span-1">Action</div>
                </div>

                {/* Grade Inputs */}
                {customScale.map((grade, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md bg-gray-50"
                  >
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={grade.value}
                        onChange={(e) =>
                          updateCustomGrade(index, "value", e.target.value)
                        }
                        placeholder="0"
                        min="0"
                        max="100"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        disabled={disabled}
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={grade.label}
                        onChange={(e) =>
                          updateCustomGrade(index, "label", e.target.value)
                        }
                        placeholder="A+"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        disabled={disabled}
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={grade.description || ""}
                        onChange={(e) =>
                          updateCustomGrade(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Excellent work"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        disabled={disabled}
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        onClick={() => removeCustomGrade(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                        disabled={disabled}
                        title="Remove this grade"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeScaleSelector;

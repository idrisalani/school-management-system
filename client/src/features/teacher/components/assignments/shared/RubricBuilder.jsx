// @ts-nocheck
import React from "react";
import PropTypes from "prop-types";
import { GripVertical, Plus, Trash } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import Button from "../../../../../components/ui/button";

/**
 * @typedef {object} CriterionType
 * @property {string} id - Unique identifier for the criterion
 * @property {string} name - Name or title of the criterion
 * @property {string} description - Detailed description of the criterion
 * @property {number} points - Maximum points available for this criterion
 */

/**
 * @typedef {object} RubricType
 * @property {CriterionType[]} criteria - List of grading criteria
 * @property {number} totalPoints - Total points possible for the rubric
 */

/**
 * RubricBuilder component for creating and editing grading rubrics
 * @param {object} props - Component properties
 * @param {RubricType} props.initialRubric - Initial rubric data
 * @param {(rubric: RubricType) => void} props.onChange - Called when rubric changes
 * @param {boolean} [props.readOnly] - Whether the rubric is editable
 * @returns {React.ReactElement} RubricBuilder component
 */
const RubricBuilder = ({ initialRubric, onChange, readOnly = false }) => {
  const [rubric, setRubric] = React.useState(initialRubric);

  const addCriterion = () => {
    const newCriterion = {
      id: Date.now().toString(),
      name: "New Criterion",
      description: "",
      points: 0,
    };

    const updatedRubric = {
      ...rubric,
      criteria: [...rubric.criteria, newCriterion],
    };
    setRubric(updatedRubric);
    onChange(updatedRubric);
  };

  const updateCriterion = (id, updates) => {
    const updatedRubric = {
      ...rubric,
      criteria: rubric.criteria.map((criterion) =>
        criterion.id === id ? { ...criterion, ...updates } : criterion
      ),
    };
    setRubric(updatedRubric);
    onChange(updatedRubric);
  };

  const deleteCriterion = (id) => {
    const updatedRubric = {
      ...rubric,
      criteria: rubric.criteria.filter((criterion) => criterion.id !== id),
    };
    setRubric(updatedRubric);
    onChange(updatedRubric);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Grading Rubric</CardTitle>
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={addCriterion}>
            <Plus className="h-4 w-4 mr-2" />
            Add Criterion
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rubric.criteria.map((criterion) => (
            <div
              key={criterion.id}
              className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"
            >
              <GripVertical className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={criterion.name}
                  onChange={(e) =>
                    updateCriterion(criterion.id, { name: e.target.value })
                  }
                  className="w-full bg-transparent font-medium"
                  placeholder="Criterion Name"
                  disabled={readOnly}
                />
                <textarea
                  value={criterion.description}
                  onChange={(e) =>
                    updateCriterion(criterion.id, {
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-transparent"
                  placeholder="Description"
                  rows={2}
                  disabled={readOnly}
                />
                <input
                  type="number"
                  value={criterion.points}
                  onChange={(e) =>
                    updateCriterion(criterion.id, {
                      points: Number(e.target.value),
                    })
                  }
                  className="w-24 bg-transparent"
                  min="0"
                  disabled={readOnly}
                />
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCriterion(criterion.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

RubricBuilder.propTypes = {
  initialRubric: PropTypes.shape({
    criteria: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        points: PropTypes.number.isRequired,
      })
    ).isRequired,
    totalPoints: PropTypes.number.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

RubricBuilder.defaultProps = {
  readOnly: false,
};

export default RubricBuilder;

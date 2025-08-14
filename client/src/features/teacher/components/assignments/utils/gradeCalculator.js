//teacher/components/assignments/utils/gradeCalculator.js

/**
 * Constants for grade scales and thresholds
 */
export const GRADE_SCALES = {
    standard: {
      'A+': 97,
      'A': 93,
      'A-': 90,
      'B+': 87,
      'B': 83,
      'B-': 80,
      'C+': 77,
      'C': 73,
      'C-': 70,
      'D+': 67,
      'D': 63,
      'D-': 60,
      'F': 0
    }
  };
  
  /**
   * Calculate percentage from points
   * @param {number} points - Points earned
   * @param {number} total - Total possible points
   * @returns {number} Percentage
   */
  export const calculatePercentage = (points, total) => {
    if (total === 0) return 0;
    return (points / total) * 100;
  };
  
  /**
   * Convert percentage to letter grade
   * @param {number} percentage - Grade percentage
   * @param {Object} scale - Custom grade scale (optional)
   * @returns {string} Letter grade
   */
  export const getLetterGrade = (percentage, scale = GRADE_SCALES.standard) => {
    return Object.entries(scale)
      .find(([_, threshold]) => percentage >= threshold)?.[0] || 'F';
  };
  
  /**
   * Calculate GPA points from letter grade
   * @param {string} letterGrade - Letter grade
   * @returns {number} GPA points
   */
  export const calculateGPAPoints = (letterGrade) => {
    const gpaScale = {
      'A+': 4.0,
      'A': 4.0,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'C-': 1.7,
      'D+': 1.3,
      'D': 1.0,
      'D-': 0.7,
      'F': 0.0
    };
  
    return gpaScale[letterGrade] || 0;
  };
  
  /**
   * Calculate weighted grade
   * @param {Array} assignments - Array of assignments with grades and weights
   * @returns {number} Weighted grade percentage
   */
  export const calculateWeightedGrade = (assignments) => {
    if (!assignments.length) return 0;
  
    const totalWeight = assignments.reduce((sum, assignment) => 
      sum + (assignment.weight || 1), 0);
  
    const weightedSum = assignments.reduce((sum, assignment) => {
      const weight = assignment.weight || 1;
      const percentage = calculatePercentage(assignment.points, assignment.total);
      return sum + (percentage * weight);
    }, 0);
  
    return totalWeight === 0 ? 0 : weightedSum / totalWeight;
  };
  
  /**
   * Calculate statistics for a set of grades
   * @param {Array} grades - Array of grade percentages
   * @returns {Object} Grade statistics
   */
  export const calculateGradeStatistics = (grades) => {
    if (!grades.length) {
      return {
        mean: 0,
        median: 0,
        mode: 0,
        standardDeviation: 0,
        highest: 0,
        lowest: 0
      };
    }
  
    const sorted = [...grades].sort((a, b) => a - b);
    const sum = grades.reduce((acc, grade) => acc + grade, 0);
    const mean = sum / grades.length;
    const median = grades.length % 2 === 0 
      ? (sorted[grades.length / 2 - 1] + sorted[grades.length / 2]) / 2
      : sorted[Math.floor(grades.length / 2)];
  
    // Calculate mode
    const frequency = {};
    let mode = grades[0];
    let maxFreq = 1;
    grades.forEach(grade => {
      frequency[grade] = (frequency[grade] || 0) + 1;
      if (frequency[grade] > maxFreq) {
        maxFreq = frequency[grade];
        mode = grade;
      }
    });
  
    // Calculate standard deviation
    const squaredDifferences = grades.map(grade => 
      Math.pow(grade - mean, 2)
    );
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / grades.length;
    const standardDeviation = Math.sqrt(variance);
  
    return {
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      mode: Number(mode.toFixed(2)),
      standardDeviation: Number(standardDeviation.toFixed(2)),
      highest: Math.max(...grades),
      lowest: Math.min(...grades)
    };
  };
  
  /**
   * Calculate grade distribution
   * @param {Array} grades - Array of grade percentages
   * @returns {Object} Grade distribution
   */
  export const calculateGradeDistribution = (grades) => {
    const distribution = {
      'A+': 0, 'A': 0, 'A-': 0,
      'B+': 0, 'B': 0, 'B-': 0,
      'C+': 0, 'C': 0, 'C-': 0,
      'D+': 0, 'D': 0, 'D-': 0,
      'F': 0
    };
  
    grades.forEach(grade => {
      const letterGrade = getLetterGrade(grade);
      distribution[letterGrade]++;
    });
  
    // Convert to percentages
    Object.keys(distribution).forEach(grade => {
      distribution[grade] = Number(
        ((distribution[grade] / grades.length) * 100).toFixed(2)
      );
    });
  
    return distribution;
  };
  
  /**
   * Calculate rubric score
   * @param {Array} criteria - Array of rubric criteria with scores
   * @returns {Object} Rubric calculation results
   */
  export const calculateRubricScore = (criteria) => {
    const totalPossible = criteria.reduce((sum, criterion) => 
      sum + criterion.maxPoints, 0);
  
    const totalEarned = criteria.reduce((sum, criterion) => 
      sum + (criterion.score || 0), 0);
  
    const percentage = calculatePercentage(totalEarned, totalPossible);
    const letterGrade = getLetterGrade(percentage);
  
    return {
      totalEarned,
      totalPossible,
      percentage,
      letterGrade,
      criteriaBreakdown: criteria.map(criterion => ({
        ...criterion,
        percentage: calculatePercentage(criterion.score || 0, criterion.maxPoints)
      }))
    };
  };
  
  /**
   * Format grade display
   * @param {number} grade - Grade value
   * @param {string} format - Display format
   * @returns {string} Formatted grade
   */
  export const formatGrade = (grade, format = 'percentage') => {
    switch (format) {
      case 'percentage':
        return `${grade.toFixed(1)}%`;
      case 'decimal':
        return (grade / 100).toFixed(2);
      case 'letter':
        return getLetterGrade(grade);
      case 'gpa':
        return calculateGPAPoints(getLetterGrade(grade)).toFixed(1);
      default:
        return grade.toString();
    }
  };
  
  export default {
    calculatePercentage,
    getLetterGrade,
    calculateGPAPoints,
    calculateWeightedGrade,
    calculateGradeStatistics,
    calculateGradeDistribution,
    calculateRubricScore,
    formatGrade,
    GRADE_SCALES
  };
// server/src/utils/grade.utils.js
// @ts-nocheck
import Grade from "../models/grade.model.js";

/**
 * Calculate basic statistics from an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {Object} Basic statistics
 */
const calculateBasicStats = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  // Calculate standard deviation
  const squareDiffs = values.map((value) => {
    const diff = value - mean;
    return diff * diff;
  });
  const variance = squareDiffs.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(variance);

  return {
    count,
    mean,
    median:
      count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[Math.floor(count / 2)],
    min: sorted[0],
    max: sorted[count - 1],
    stdDev,
  };
};

/**
 * Calculate grade distribution
 * @param {number[]} grades - Array of grades
 * @returns {Object} Grade distribution
 */
const calculateDistribution = (grades) => {
  const distribution = {
    "A (90-100)": 0,
    "B (80-89)": 0,
    "C (70-79)": 0,
    "D (60-69)": 0,
    "F (0-59)": 0,
  };

  grades.forEach((grade) => {
    if (grade >= 90) distribution["A (90-100)"]++;
    else if (grade >= 80) distribution["B (80-89)"]++;
    else if (grade >= 70) distribution["C (70-79)"]++;
    else if (grade >= 60) distribution["D (60-69)"]++;
    else distribution["F (0-59)"]++;
  });

  // Convert to percentages
  const total = grades.length;
  Object.keys(distribution).forEach((key) => {
    distribution[key] = (distribution[key] / total) * 100;
  });

  return distribution;
};

/**
 * Calculate term-wise performance trends
 * @param {Array} grades - Array of grade documents
 * @returns {Object} Term-wise performance trends
 */
const calculateTermTrends = (grades) => {
  const trends = {};

  // Group by term and calculate averages
  grades.forEach((grade) => {
    const termKey = `${grade.academicYear}-${grade.term}`;
    if (!trends[termKey]) {
      trends[termKey] = {
        sum: 0,
        count: 0,
      };
    }
    trends[termKey].sum += Number(grade.score) || 0;
    trends[termKey].count++;
  });

  // Calculate averages
  Object.keys(trends).forEach((term) => {
    trends[term] = trends[term].sum / trends[term].count;
  });

  return trends;
};

/**
 * Calculate comprehensive grade statistics
 * @param {Array} grades - Array of grade documents
 * @param {Object} options - Statistics options
 * @returns {Promise<Object>} Comprehensive statistics
 */
export const calculateGradeStatistics = async (grades, options = {}) => {
  const scores = grades.map((grade) => Number(grade.score) || 0);
  const basicStats = calculateBasicStats(scores);
  const distribution = calculateDistribution(scores);
  const trends = calculateTermTrends(grades);

  const statistics = {
    overview: {
      ...basicStats,
      passingRate:
        (scores.filter((score) => score >= 60).length / scores.length) * 100,
    },
    distribution,
    trends,
    metadata: {
      totalStudents: new Set(grades.map((g) => g.student?._id?.toString()))
        .size,
      totalCourses: new Set(grades.map((g) => g.course?._id?.toString())).size,
      dateRange: {
        start: new Date(Math.min(...grades.map((g) => g.createdAt))),
        end: new Date(Math.max(...grades.map((g) => g.createdAt))),
      },
    },
  };

  // Add course-specific stats if filtered by course
  if (options.courseId) {
    statistics.courseSpecific = {
      averageByTerm: trends,
      topPerformers: grades
        .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
        .slice(0, 5)
        .map((g) => ({
          student: g.student
            ? `${g.student.firstName} ${g.student.lastName}`
            : "Unknown",
          score: Number(g.score) || 0,
        })),
    };
  }

  return statistics;
};

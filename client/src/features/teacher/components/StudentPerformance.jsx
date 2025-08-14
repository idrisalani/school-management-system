// @ts-check
import React from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

/**
 * @typedef {object} PerformanceData
 * @property {string} month - Month label
 * @property {number} classAverage - Average score for the class
 * @property {number} topScore - Highest score in the class
 * @property {number} lowestScore - Lowest score in the class
 */

const CHART_COLORS = {
  topScore: "#22C55E", // Green
  average: "#3B82F6", // Blue
  lowest: "#EF4444", // Red
};

const CHART_HEIGHT = 300;

/** @type {PerformanceData[]} */
const performanceData = [
  { month: "Jan", classAverage: 82, topScore: 95, lowestScore: 68 },
  { month: "Feb", classAverage: 85, topScore: 98, lowestScore: 70 },
  { month: "Mar", classAverage: 88, topScore: 100, lowestScore: 75 },
  { month: "Apr", classAverage: 84, topScore: 96, lowestScore: 72 },
  { month: "May", classAverage: 86, topScore: 97, lowestScore: 73 },
];

/**
 * Student performance component showing performance trends over time
 * @param {object} props - Component properties
 * @param {boolean} [props.loading] - Loading state of the component
 * @param {string} [props.classId] - Selected class identifier
 * @returns {React.ReactElement} StudentPerformance component
 */
const StudentPerformance = ({ loading = false, classId = "all" }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="bg-gray-100 animate-pulse rounded-lg"
            style={{ height: CHART_HEIGHT }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <span>Student Performance Trends - {classId}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: CHART_HEIGHT }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="topScore"
                stroke={CHART_COLORS.topScore}
                strokeWidth={2}
                name="Top Score"
                dot={{ strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="classAverage"
                stroke={CHART_COLORS.average}
                strokeWidth={2}
                name="Class Average"
                dot={{ strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="lowestScore"
                stroke={CHART_COLORS.lowest}
                strokeWidth={2}
                name="Lowest Score"
                dot={{ strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

StudentPerformance.propTypes = {
  loading: PropTypes.bool,
  classId: PropTypes.string,
};

StudentPerformance.defaultProps = {
  loading: false,
  classId: "all",
};

export default StudentPerformance;

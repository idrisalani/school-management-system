// @ts-check
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select";
import { useAnalytics } from "../hooks/useAnalytics";

/**
 * Performance trend visualization component
 * @returns {React.ReactElement} Performance chart
 */
export function PerformanceChart() {
  const [data, setData] = useState([]);
  const [timeframe, setTimeframe] = useState("month");
  const { calculatePerformanceTrend } = useAnalytics();

  useEffect(() => {
    const fetchPerformanceData = async () => {
      const performanceData = await calculatePerformanceTrend(timeframe);
      setData(performanceData);
    };

    fetchPerformanceData();
  }, [timeframe, calculatePerformanceTrend]);

  const handleValueChange = (value) => {
    setTimeframe(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Performance Trend</CardTitle>

        <Select value={timeframe} onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="semester">Semester</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="w-full h-[400px]">
          <LineChart width={600} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="averageGrade"
              stroke="#8884d8"
              name="Average Grade"
            />
            <Line
              type="monotone"
              dataKey="submissionRate"
              stroke="#82ca9d"
              name="Submission Rate"
            />
          </LineChart>
        </div>
      </CardContent>
    </Card>
  );
}

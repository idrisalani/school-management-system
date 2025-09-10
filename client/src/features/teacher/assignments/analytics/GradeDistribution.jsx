// @ts-check
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
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
} from "../../../../components/ui/card";
import { useAnalytics } from "../hooks/useAnalytics";

/**
 * Grade distribution visualization component
 * @returns {React.ReactElement} Grade distribution chart
 */
export function GradeDistribution() {
  const [data, setData] = useState([]);
  const { calculateGradeDistribution } = useAnalytics();

  useEffect(() => {
    const fetchGradeDistribution = async () => {
      const distribution = await calculateGradeDistribution();
      setData(distribution);
    };

    fetchGradeDistribution();
  }, [calculateGradeDistribution]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Distribution</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full h-[400px]">
          <BarChart width={600} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="grade" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Number of Students" />
          </BarChart>
        </div>
      </CardContent>
    </Card>
  );
}

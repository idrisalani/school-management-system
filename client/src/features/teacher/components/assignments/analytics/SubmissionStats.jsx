// @ts-check
import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { useAnalytics } from "../hooks/useAnalytics";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

/**
 * Submission statistics visualization component
 * @returns {React.ReactElement} Submission stats chart
 */
export function SubmissionStats() {
  const [data, setData] = useState([]);
  const { calculateSubmissionStats } = useAnalytics();

  useEffect(() => {
    const fetchSubmissionStats = async () => {
      const stats = await calculateSubmissionStats();
      setData(stats);
    };

    fetchSubmissionStats();
  }, [calculateSubmissionStats]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Statistics</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full h-[400px] flex justify-center">
          <PieChart width={400} height={400}>
            <Pie
              data={data}
              cx={200}
              cy={200}
              labelLine={true}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </CardContent>
    </Card>
  );
}

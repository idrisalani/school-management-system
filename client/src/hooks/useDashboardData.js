import { useState, useEffect } from "react";
import { useDemo } from "../contexts/DemoContext";
import { demoDataService } from "../services/demoDataService";
import {
  getAdminDashboardData,
  getTeacherDashboardData,
  getStudentDashboardData,
  getParentDashboardData,
} from "../services/dashboardApi";

export const useDashboardData = (userRole, userId) => {
  const { isDemoMode } = useDemo();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let data;

        if (isDemoMode) {
          // Use demo data service
          switch (userRole) {
            case "admin":
              data = await demoDataService.getAdminDashboardData();
              break;
            case "teacher":
              data = await demoDataService.getTeacherDashboardData(userId);
              break;
            case "student":
              data = await demoDataService.getStudentDashboardData(userId);
              break;
            case "parent":
              data = await demoDataService.getParentDashboardData(userId);
              break;
            default:
              throw new Error(`Unknown role: ${userRole}`);
          }
        } else {
          // Use real API calls
          switch (userRole) {
            case "admin":
              data = await getAdminDashboardData();
              break;
            case "teacher":
              data = await getTeacherDashboardData(userId);
              break;
            case "student":
              data = await getStudentDashboardData(userId);
              break;
            case "parent":
              data = await getParentDashboardData(userId);
              break;
            default:
              throw new Error(`Unknown role: ${userRole}`);
          }
        }

        setStats(data.data || data);
      } catch (err) {
        setError(err.message);
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userRole) {
      fetchData();
    }
  }, [userRole, userId, isDemoMode]);

  return { stats, loading, error, isDemoMode };
};

// @ts-nocheck

// client/src/features/teacher/components/assignments/hooks/useAnalytics.js
import { useState, useCallback, useEffect, useMemo } from "react";
import { statisticalAnalysis } from "./useAnalytics/statisticalAnalysis.js";
import { visualizationHelpers } from "./useAnalytics/visualizationHelpers.js";
import { exportHandlers } from "./useAnalytics/exportHandlers.js";
import { AnalyticsCache } from "./useAnalytics/cacheManager.js";

export const useAnalytics = (assignmentId = null) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("term");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [comparisonEnabled, setComparisonEnabled] = useState(false);

  // Initialize cache with custom size
  const cache = useMemo(() => new AnalyticsCache(100), []);

  // Enhanced analytics calculations using statistical functions
  const calculateAnalytics = useCallback((data) => {
    const grades = data.submissions?.map((s) => s.grade) || [];

    return {
      basic: {
        mean: statisticalAnalysis.mean(grades),
        median: statisticalAnalysis.median(grades),
        mode: statisticalAnalysis.mode(grades),
      },
      distribution: {
        standardDeviation: statisticalAnalysis.standardDeviation(grades),
        quartiles: statisticalAnalysis.quartiles(grades),
        zScores: statisticalAnalysis.zScores(grades),
      },
      growth: {
        improvement: statisticalAnalysis.growthRate(
          grades[0],
          grades[grades.length - 1]
        ),
        trendline: statisticalAnalysis.movingAverage(grades, 3),
      },
    };
  }, []);

  // Prepare data for visualization
  const prepareChartData = useCallback((data, chartType) => {
    return visualizationHelpers.transformForChart(data, chartType);
  }, []);

  // Export data in different formats
  const exportData = useCallback(
    async (format, options = {}) => {
      if (!analyticsData) return null;

      switch (format) {
        case "pdf":
          return exportHandlers.toPDF(analyticsData, options);
        case "excel":
          return exportHandlers.toExcel(analyticsData, options);
        case "csv":
          return exportHandlers.toCSV(analyticsData, options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    },
    [analyticsData]
  );

  // Enhanced fetch with caching
  const fetchAnalytics = useCallback(
    async (filters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const cacheKey = JSON.stringify({
          assignmentId,
          timeframe,
          ...filters,
        });

        // Check cache first
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
          setAnalyticsData(cachedData);
          setLoading(false);
          return cachedData;
        }

        // API call
        const response = await fetch(`/api/assignments/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId,
            timeframe,
            dateRange,
            comparison: comparisonEnabled,
            ...filters,
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch analytics data");

        const rawData = await response.json();

        // Process data with enhanced analytics
        const processedData = {
          ...rawData,
          analytics: calculateAnalytics(rawData),
          charts: {
            performance: prepareChartData(rawData.performance, "line"),
            distribution: prepareChartData(rawData.distribution, "bar"),
            comparison: comparisonEnabled
              ? prepareChartData(rawData.comparison, "bar")
              : null,
          },
        };

        // Update cache
        cache.set(cacheKey, processedData);
        setAnalyticsData(processedData);

        return processedData;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      assignmentId,
      timeframe,
      dateRange,
      comparisonEnabled,
      calculateAnalytics,
      prepareChartData,
      cache,
    ]
  );

  // Get formatted data for specific chart types
  const getChartData = useCallback(
    (chartType) => {
      if (!analyticsData) return null;

      return visualizationHelpers.transformForChart(
        analyticsData[chartType],
        chartType
      );
    },
    [analyticsData]
  );

  // Get specific statistical metrics
  const getMetrics = useCallback(
    (metricType) => {
      if (!analyticsData?.analytics) return null;

      return analyticsData.analytics[metricType];
    },
    [analyticsData]
  );

  // Clear old cache entries
  useEffect(() => {
    const ONE_HOUR = 3600000;
    const clearOldCache = () => {
      cache.clearOlderThan(Date.now() - ONE_HOUR);
    };

    const interval = setInterval(clearOldCache, ONE_HOUR);
    return () => clearInterval(interval);
  }, [cache]);

  return {
    analyticsData,
    loading,
    error,
    // Data fetching
    fetchAnalytics,
    // Time controls
    setTimeframe,
    setDateRange,
    setComparisonEnabled,
    // Data access
    getMetrics,
    getChartData,
    // Export functions
    exportData,
    // Cache controls
    clearCache: () => cache.clear(),
    // Helper functions
    calculateGrowth: statisticalAnalysis.growthRate,
    normalizeData: statisticalAnalysis.normalize,
    formatValue: visualizationHelpers.formatValue,
  };
};

export default useAnalytics;

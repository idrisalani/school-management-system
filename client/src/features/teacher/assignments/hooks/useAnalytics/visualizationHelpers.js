// @ts-nocheck

//teacher/components/assignments/hooks/useAnalytics/visualizationHelpers.js
import { statisticalAnalysis } from "./statisticalAnalysis.js";

export const visualizationHelpers = {
  // Color Schemes
  colorSchemes: {
    categorical: [
      "#4E79A7",
      "#F28E2B",
      "#E15759",
      "#76B7B2",
      "#59A14F",
      "#EDC948",
      "#B07AA1",
      "#FF9DA7",
      "#9C755F",
      "#BAB0AC",
    ],
    sequential: ["#D3E5F3", "#90C1E3", "#4E9BD4", "#2B78C2", "#1A579B"],
    diverging: [
      "#D73027",
      "#F46D43",
      "#FDAE61",
      "#FEE08B",
      "#FFFFBF",
      "#D9EF8B",
      "#A6D96A",
      "#66BD63",
      "#1A9850",
    ],
  },

  // Data Transformations
  transformForChart: (data, type) => {
    switch (type) {
      case "bar":
        return {
          labels: Object.keys(data),
          datasets: [
            {
              data: Object.values(data),
              backgroundColor: visualizationHelpers.colorSchemes.categorical,
            },
          ],
        };

      case "line":
        return {
          labels: data.map((d) => d.date),
          datasets: [
            {
              data: data.map((d) => d.value),
              borderColor: visualizationHelpers.colorSchemes.sequential[3],
              fill: false,
            },
          ],
        };

      case "pie":
        return {
          labels: Object.keys(data),
          datasets: [
            {
              data: Object.values(data),
              backgroundColor: visualizationHelpers.colorSchemes.categorical,
            },
          ],
        };

      default:
        return data;
    }
  },

  // Scale Helpers
  generateScales: (data, type) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    return {
      linear: {
        min: min - range * 0.1,
        max: max + range * 0.1,
        stepSize: range / 10,
      },
      logarithmic: {
        min: Math.max(min, 0.1),
        max: max * 1.1,
      },
      percentage: {
        min: 0,
        max: 100,
        stepSize: 10,
      },
    }[type];
  },

  // Format Helpers
  formatValue: (value, format) => {
    switch (format) {
      case "percentage":
        return `${Math.round(value * 100) / 100}%`;
      case "decimal":
        return Number(value).toFixed(2);
      case "integer":
        return Math.round(value);
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value);
      default:
        return value;
    }
  },

  // Annotation Helpers
  generateAnnotations: (data, type) => {
    const stats = {
      mean: statisticalAnalysis.mean(data),
      median: statisticalAnalysis.median(data),
      stdDev: statisticalAnalysis.standardDeviation(data),
    };

    switch (type) {
      case "line":
        return {
          line: [
            {
              type: "line",
              mode: "horizontal",
              scaleID: "y",
              value: stats.mean,
              borderColor: "rgba(75, 192, 192, 0.5)",
              borderWidth: 2,
              label: { content: "Mean" },
            },
          ],
        };

      case "box": {
        const quartiles = statisticalAnalysis.quartiles(data);
        return {
          Q1: quartiles.Q1,
          Q3: quartiles.Q3,
          median: stats.median,
          whiskers: {
            min: quartiles.Q1 - 1.5 * quartiles.IQR,
            max: quartiles.Q3 + 1.5 * quartiles.IQR,
          },
        };
      }

      default:
        return {};
    }
  },
};

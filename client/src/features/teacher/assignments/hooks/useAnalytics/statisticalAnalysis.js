//teacher/components/assignments/hooks/useAnalytics/statisticalAnalysis.js

export const statisticalAnalysis = {
    // Basic Statistics
    mean: (numbers) => {
      if (!numbers.length) return 0;
      return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    },
  
    weightedMean: (numbers, weights) => {
      if (!numbers.length || numbers.length !== weights.length) return 0;
      const sum = numbers.reduce((acc, num, i) => acc + num * weights[i], 0);
      const weightSum = weights.reduce((acc, weight) => acc + weight, 0);
      return sum / weightSum;
    },
  
    median: (numbers) => {
      if (!numbers.length) return 0;
      const sorted = [...numbers].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
    },
  
    mode: (numbers) => {
      if (!numbers.length) return 0;
      const frequency = {};
      numbers.forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1;
      });
      return Object.entries(frequency).reduce((a, b) => 
        frequency[a] > frequency[b] ? a : b
      )[0];
    },
  
    // Variance and Dispersion
    variance: (numbers, population = false) => {
      if (numbers.length < 2) return 0;
      const mean = statisticalAnalysis.mean(numbers);
      const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
      return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / 
             (numbers.length - (population ? 0 : 1));
    },
  
    standardDeviation: (numbers, population = false) => {
      return Math.sqrt(statisticalAnalysis.variance(numbers, population));
    },
  
    coefficientOfVariation: (numbers) => {
      const mean = statisticalAnalysis.mean(numbers);
      if (mean === 0) return 0;
      return (statisticalAnalysis.standardDeviation(numbers) / mean) * 100;
    },
  
    // Distribution Analysis
    percentile: (numbers, p) => {
      if (!numbers.length) return 0;
      const sorted = [...numbers].sort((a, b) => a - b);
      const rank = (p / 100) * (sorted.length - 1);
      const floor = Math.floor(rank);
      const diff = rank - floor;
      if (diff === 0) return sorted[floor];
      return sorted[floor] + diff * (sorted[floor + 1] - sorted[floor]);
    },
  
    quartiles: (numbers) => {
      return {
        Q1: statisticalAnalysis.percentile(numbers, 25),
        Q2: statisticalAnalysis.percentile(numbers, 50),
        Q3: statisticalAnalysis.percentile(numbers, 75),
        IQR: statisticalAnalysis.percentile(numbers, 75) - 
             statisticalAnalysis.percentile(numbers, 25)
      };
    },
  
    // Z-Scores and Normalization
    zScores: (numbers) => {
      const mean = statisticalAnalysis.mean(numbers);
      const stdDev = statisticalAnalysis.standardDeviation(numbers);
      return numbers.map(num => (num - mean) / stdDev);
    },
  
    normalize: (numbers, newMin = 0, newMax = 100) => {
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      return numbers.map(num => 
        (((num - min) * (newMax - newMin)) / (max - min)) + newMin
      );
    },
  
    // Growth and Improvement
    growthRate: (initial, final) => {
      return ((final - initial) / Math.abs(initial)) * 100;
    },
  
    cumulativeGrowth: (numbers) => {
      if (numbers.length < 2) return 0;
      return ((numbers[numbers.length - 1] - numbers[0]) / numbers[0]) * 100;
    },
  
    movingAverage: (numbers, window = 3) => {
      const result = [];
      for (let i = 0; i <= numbers.length - window; i++) {
        const windowSlice = numbers.slice(i, i + window);
        result.push(statisticalAnalysis.mean(windowSlice));
      }
      return result;
    }
  };
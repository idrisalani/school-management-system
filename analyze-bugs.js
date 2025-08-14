#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class BugAnalyzer {
  constructor() {
    this.errorCategories = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: [],
    };

    this.errorPatterns = {
      critical: [/TS2571/, /TS2532/, /TS2531/, /TS18047/],
      high: [/TS2345/, /TS2322/, /TS2349/, /TS2554/],
      medium: [/TS2339/, /TS2551/, /TS2552/, /TS2304/],
      low: [/TS7006/, /TS7031/, /TS7034/],
    };
  }

  runTypeCheck() {
    console.log("🔍 Running TypeScript check...\n");

    try {
      execSync("npx tsc --noEmit --pretty false 2>&1", {
        encoding: "utf-8",
        stdio: "pipe",
      });
      return "✅ No type errors found!";
    } catch (error) {
      return error.stdout || error.message;
    }
  }

  parseErrors(output) {
    const lines = output.split("\n").filter((line) => line.trim());

    lines.forEach((line) => {
      if (line.includes("error TS")) {
        const category = this.categorizeError(line);
        this.errorCategories[category].push(line);
      }
    });
  }

  categorizeError(errorLine) {
    for (const [category, patterns] of Object.entries(this.errorPatterns)) {
      if (patterns.some((pattern) => pattern.test(errorLine))) {
        return category;
      }
    }
    return "info";
  }

  generateReport() {
    const totalErrors = Object.values(this.errorCategories).reduce(
      (sum, errors) => sum + errors.length,
      0
    );

    console.log("📊 BUG ANALYSIS REPORT");
    console.log("=".repeat(50));
    console.log(`Total Issues Found: ${totalErrors}\n`);

    if (totalErrors === 0) {
      console.log("🎉 Congratulations! No type errors found!");
      return;
    }

    console.log("📈 PRIORITY BREAKDOWN:");
    Object.entries(this.errorCategories).forEach(([category, errors]) => {
      if (errors.length > 0) {
        const emoji = {
          critical: "🚨",
          high: "⚠️",
          medium: "⚡",
          low: "💡",
          info: "ℹ️",
        }[category];
        console.log(
          `${emoji} ${category.toUpperCase()}: ${errors.length} issues`
        );
      }
    });

    console.log("\n🛠️  RECOMMENDED FIXING ORDER:");
    console.log("1. 🚨 CRITICAL: Add null checks (obj?.property)");
    console.log("2. ⚠️  HIGH: Fix type mismatches in function calls");
    console.log("3. ⚡ MEDIUM: Fix property typos and missing imports");
    console.log("4. 💡 LOW: Add JSDoc type annotations");

    console.log("\n📋 FIRST 10 ERRORS TO FIX:");
    console.log("-".repeat(40));

    const allErrors = [
      ...this.errorCategories.critical,
      ...this.errorCategories.high,
      ...this.errorCategories.medium,
    ].slice(0, 10);

    allErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  analyze() {
    console.log("🚀 Starting JavaScript Bug Analysis...\n");

    const output = this.runTypeCheck();

    if (output === "✅ No type errors found!") {
      console.log(output);
      return;
    }

    this.parseErrors(output);
    this.generateReport();

    console.log("\n🎯 NEXT STEPS:");
    console.log("1. Run: npm run type-check (see detailed errors)");
    console.log("2. Fix critical issues first");
    console.log("3. Add JSDoc type annotations");
    console.log("4. Run: npm run type-check:watch (real-time checking)");
  }
}

const analyzer = new BugAnalyzer();
analyzer.analyze();

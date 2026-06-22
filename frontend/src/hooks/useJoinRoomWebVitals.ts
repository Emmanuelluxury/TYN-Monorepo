/**
 * Web Vitals Monitoring for Join Room Flow
 *
 * Tracks Core Web Vitals (CLS, LCP, INP) for the join room page to ensure
 * it meets performance budgets and provides a fast user experience.
 *
 * Budget targets:
 *  - Largest Contentful Paint (LCP): < 2.5s
 *  - Cumulative Layout Shift (CLS): < 0.1
 *  - Interaction to Next Paint (INP): < 200ms
 */

"use client";

import { useEffect } from "react";

interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
}

interface WebVitalsConfig {
  reportingEndpoint?: string;
  debug?: boolean;
  budgets?: {
    lcp?: number;
    cls?: number;
    inp?: number;
  };
}

/**
 * Hook to monitor and report Web Vitals metrics for the join room flow.
 * Automatically triggers when metrics exceed performance budgets.
 */
export function useJoinRoomWebVitals(config: WebVitalsConfig = {}) {
  const {
    debug = process.env.NODE_ENV === "development",
    reportingEndpoint = "/api/v1/metrics",
    budgets = {
      lcp: 2500, // milliseconds
      cls: 0.1, // unitless (10%)
      inp: 200, // milliseconds
    },
  } = config;

  useEffect(() => {
    // Use native Web Vitals API if available
    if (typeof window === "undefined") return;

    let metrics: Record<string, PerformanceMetric> = {};

    /**
     * Report a metric to the backend
     */
    const reportMetric = async (metric: PerformanceMetric) => {
      try {
        const payload = {
          timestamp: new Date().toISOString(),
          route: "/join-room",
          metric: {
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
          },
          // Add runtime context
          navigation: {
            entryType: "navigation",
            duration: performance.now(),
          },
        };

        if (debug) {
          console.debug("[Web Vitals]", metric.name, metric.value.toFixed(2), metric.rating);
        }

        // Send to backend in production only
        if (process.env.NODE_ENV === "production") {
          await fetch(reportingEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true, // Ensure beacon is sent even on page unload
          }).catch(() => {
            // Silently fail if metrics endpoint is unavailable
          });
        }
      } catch (err) {
        if (debug) {
          console.error("[Web Vitals] Failed to report metric", err);
        }
      }
    };

    /**
     * Monitor Largest Contentful Paint (LCP)
     */
    const observeLCP = () => {
      if (!("PerformanceObserver" in window)) return;

      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;

          const value = lastEntry.renderTime || lastEntry.loadTime;
          const metric: PerformanceMetric = {
            name: "LCP",
            value,
            rating: value <= budgets.lcp! ? "good" : value <= 4000 ? "needs-improvement" : "poor",
            delta: lastEntry.duration || 0,
          };

          metrics.lcp = metric;
          reportMetric(metric);
        });

        observer.observe({ entryTypes: ["largest-contentful-paint"] });
        return observer;
      } catch (err) {
        if (debug) console.error("[LCP] Observation failed", err);
      }
    };

    /**
     * Monitor Cumulative Layout Shift (CLS)
     */
    const observeCLS = () => {
      if (!("PerformanceObserver" in window)) return;

      try {
        let clsValue = 0;
        let sessionValue = 0;
        let sessionEntries: PerformanceEntry[] = [];

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              const firstSessionEntry = sessionEntries[0];
              const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

              if (
                entry.startTime - (lastSessionEntry?.startTime || 0) < 1000 &&
                entry.startTime - (firstSessionEntry?.startTime || 0) < 5000
              ) {
                sessionEntries.push(entry);
                sessionValue += entry.value;
              } else {
                sessionEntries = [entry];
                sessionValue = entry.value;
              }

              clsValue = Math.max(clsValue, sessionValue);
            }
          }

          const metric: PerformanceMetric = {
            name: "CLS",
            value: clsValue,
            rating:
              clsValue <= budgets.cls!
                ? "good"
                : clsValue <= 0.25
                  ? "needs-improvement"
                  : "poor",
            delta: clsValue,
          };

          metrics.cls = metric;

          // Report CLS periodically (not on every change to avoid spam)
          if (clsValue > budgets.cls!) {
            reportMetric(metric);
          }
        });

        observer.observe({ entryTypes: ["layout-shift"] });
        return observer;
      } catch (err) {
        if (debug) console.error("[CLS] Observation failed", err);
      }
    };

    /**
     * Monitor Interaction to Next Paint (INP)
     */
    const observeINP = () => {
      if (!("PerformanceObserver" in window)) return;

      try {
        let inpValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            inpValue = Math.max(inpValue, entry.duration);
          }

          const metric: PerformanceMetric = {
            name: "INP",
            value: inpValue,
            rating:
              inpValue <= budgets.inp!
                ? "good"
                : inpValue <= 500
                  ? "needs-improvement"
                  : "poor",
            delta: inpValue,
          };

          metrics.inp = metric;

          // Only report if it exceeds budget
          if (inpValue > budgets.inp!) {
            reportMetric(metric);
          }
        });

        observer.observe({ entryTypes: ["event"] });
        return observer;
      } catch (err) {
        if (debug) console.error("[INP] Observation failed", err);
      }
    };

    // Start monitoring
    const lcpObserver = observeLCP();
    const clsObserver = observeCLS();
    const inpObserver = observeINP();

    // Report all metrics when page is about to unload
    const handleBeforeUnload = () => {
      if (debug) {
        console.debug("[Web Vitals] Final metrics:", metrics);
      }

      // Queue final reports
      if (metrics.lcp) reportMetric(metrics.lcp);
      if (metrics.cls && metrics.cls.value > 0) reportMetric(metrics.cls);
      if (metrics.inp) reportMetric(metrics.inp);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      lcpObserver?.disconnect();
      clsObserver?.disconnect();
      inpObserver?.disconnect();
    };
  }, [debug, reportingEndpoint, budgets]);
}

/**
 * Get current Web Vitals snapshot (for testing or debugging)
 */
export async function getWebVitalsSnapshot(): Promise<Record<string, PerformanceMetric>> {
  if (typeof window === "undefined") return {};

  const metrics: Record<string, PerformanceMetric> = {};

  // Get LCP
  const lcpEntries = performance.getEntriesByType("largest-contentful-paint") as any[];
  if (lcpEntries.length > 0) {
    const lastLCP = lcpEntries[lcpEntries.length - 1];
    metrics.lcp = {
      name: "LCP",
      value: lastLCP.renderTime || lastLCP.loadTime,
      rating: "good",
      delta: 0,
    };
  }

  // Get CLS (requires observation, can't be queried directly)
  const layoutShiftEntries = performance.getEntriesByType("layout-shift") as any[];
  let totalCLS = 0;
  for (const entry of layoutShiftEntries) {
    if (!entry.hadRecentInput) {
      totalCLS += entry.value;
    }
  }
  if (totalCLS > 0) {
    metrics.cls = {
      name: "CLS",
      value: totalCLS,
      rating: "good",
      delta: totalCLS,
    };
  }

  // Get INP (requires observation)
  const eventEntries = performance.getEntriesByType("event") as any[];
  let maxINP = 0;
  for (const entry of eventEntries) {
    maxINP = Math.max(maxINP, entry.duration);
  }
  if (maxINP > 0) {
    metrics.inp = {
      name: "INP",
      value: maxINP,
      rating: "good",
      delta: maxINP,
    };
  }

  return metrics;
}

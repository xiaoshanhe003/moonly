import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getCycleSummary, getMissedPeriodCandidate, getSuggestedStep } from "../../../src/features/cycle/cycle.ts";
import type { CycleProfile, DailyEntry } from "../../../src/features/cycle/types.ts";

const baseProfile: CycleProfile = {
  lastPeriodStart: "2026-03-31",
  periodLength: 7,
  cycleLength: 32,
  isPeriodLengthEstimated: false,
  isCycleLengthEstimated: false
};

function entry(
  date: string,
  bleedingLevel: DailyEntry["bleedingLevel"],
  periodSignal: DailyEntry["periodSignal"] = "none"
): DailyEntry {
  return {
    date,
    bleedingLevel,
    periodSignal
  };
}

function summary(entries: Record<string, DailyEntry>, date: string) {
  return getCycleSummary(baseProfile, entries, new Date(`${date}T12:00:00`));
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("cycle prediction with sparse records", () => {
  it("keeps the onboarded period length when a previous period has sparse bleeding logs", () => {
    const entries = {
      "2026-05-02": entry("2026-05-02", "spotting", "confirmed_start"),
      "2026-05-03": entry("2026-05-03", "spotting"),
      "2026-05-10": entry("2026-05-10", "none"),
      "2026-06-01": entry("2026-06-01", "spotting", "confirmed_start"),
      "2026-06-02": entry("2026-06-02", "medium")
    };

    const result = summary(entries, "2026-06-02");

    assert.equal(result.periodLength, 7);
    assert.equal(result.cycleLength, 31);
    assert.equal(formatDateKey(result.lastPeriodStart), "2026-06-01");
    assert.equal(result.phase.label, "月经期");
  });

  it("calibrates period length only when the end is explicitly recorded on the next day", () => {
    const entries = {
      "2026-05-02": entry("2026-05-02", "spotting", "confirmed_start"),
      "2026-05-03": entry("2026-05-03", "spotting"),
      "2026-05-04": entry("2026-05-04", "none"),
      "2026-06-01": entry("2026-06-01", "spotting", "confirmed_start"),
      "2026-06-02": entry("2026-06-02", "medium")
    };

    const result = summary(entries, "2026-06-02");

    assert.equal(result.periodLength, 2);
    assert.equal(result.cycleLength, 31);
  });

  it("does not count an unlogged day inside a bleeding streak as period-length evidence", () => {
    const entries = {
      "2026-05-02": entry("2026-05-02", "medium", "confirmed_start"),
      "2026-05-04": entry("2026-05-04", "medium"),
      "2026-05-05": entry("2026-05-05", "none"),
      "2026-06-01": entry("2026-06-01", "medium", "confirmed_start")
    };

    const result = summary(entries, "2026-06-02");

    assert.equal(result.periodLength, 7);
    assert.equal(result.cycleLength, 31);
  });

  it("does not stretch cycle length from a single one-month logging interruption", () => {
    const entries = {
      "2026-06-01": entry("2026-06-01", "medium", "confirmed_start"),
      "2026-06-02": entry("2026-06-02", "medium")
    };

    const result = summary(entries, "2026-06-02");
    const missed = getMissedPeriodCandidate(baseProfile, entries, new Date("2026-06-02T12:00:00"));

    assert.equal(result.cycleLength, 32);
    assert.equal(formatDateKey(result.lastPeriodStart), "2026-06-01");
    assert.deepEqual(missed && {
      previousStart: missed.previousStart,
      suggestedStart: missed.suggestedStart,
      nextStart: missed.nextStart,
      gapDays: missed.gapDays
    }, {
      previousStart: "2026-03-31",
      suggestedStart: "2026-05-02",
      nextStart: "2026-06-01",
      gapDays: 62
    });
  });

  it("extends an overdue cycle only when today explicitly records no bleeding", () => {
    const noEntryResult = summary({}, "2026-05-05");
    const noBleedingResult = summary({
      "2026-05-05": entry("2026-05-05", "none")
    }, "2026-05-05");

    assert.equal(noEntryResult.cycleLength, 32);
    assert.equal(noBleedingResult.cycleLength, 36);
  });

  it("keeps the whole overdue predicted period in luteal when a later day records no bleeding", () => {
    const entries = {
      "2026-05-03": entry("2026-05-03", "none")
    };

    const firstPredictedPeriodDay = summary(entries, "2026-05-02");
    const recordedNoBleedingDay = summary(entries, "2026-05-03");
    const nextPredictedPeriodDay = summary(entries, "2026-05-04");

    assert.equal(firstPredictedPeriodDay.phase.label, "黄体期");
    assert.equal(recordedNoBleedingDay.phase.label, "黄体期");
    assert.equal(nextPredictedPeriodDay.phase.label, "月经期");
  });

  it("does not use future no-bleeding logs to stretch historical cycle summaries", () => {
    const profile: CycleProfile = {
      lastPeriodStart: "2026-03-25",
      periodLength: 5,
      cycleLength: 28,
      isPeriodLengthEstimated: false,
      isCycleLengthEstimated: false
    };
    const entries = {
      "2026-04-30": entry("2026-04-30", "none"),
      "2026-05-30": entry("2026-05-30", "none")
    };

    const result = getCycleSummary(profile, entries, new Date("2026-04-10T12:00:00"));

    assert.equal(result.cycleLength, 28);
    assert.equal(result.phase.label, "黄体期");
  });

  it("ignores single unconfirmed ovulation spotting for cycle calibration", () => {
    const entries = {
      "2026-04-17": entry("2026-04-17", "spotting"),
      "2026-06-01": entry("2026-06-01", "medium", "confirmed_start")
    };

    const result = summary(entries, "2026-06-02");

    assert.equal(result.cycleLength, 32);
    assert.equal(formatDateKey(result.lastPeriodStart), "2026-06-01");
  });
});

describe("daily log step order", () => {
  const menstrualStepOrder = ["flow", "mood", "energy", "symptoms"] as const;

  it("asks for bleeding level first during the menstrual phase", () => {
    assert.equal(getSuggestedStep({ date: "2026-06-01" }, [...menstrualStepOrder]), "flow");
  });

  it("moves from bleeding level to mood during the menstrual phase", () => {
    assert.equal(
      getSuggestedStep({ date: "2026-06-01", bleedingLevel: "medium" }, [...menstrualStepOrder]),
      "mood"
    );
  });
});

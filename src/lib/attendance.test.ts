import { describe, expect, it } from "vitest";
import { markAllPresent, upsertAttendanceRecord, buildMonthlyRows } from "./attendance";
import { seedData } from "./seed";

describe("attendance helpers", () => {
  it("marks every tracked slot present for a class and date", () => {
    const data = markAllPresent(seedData, "2026-06-01", "class_1a", "schedule_regular");
    const records = Object.values(data.attendance).filter((record) => record.date === "2026-06-01");

    expect(records).toHaveLength(21);
    expect(records.every((record) => record.status === "present")).toBe(true);
  });

  it("allows a specific student slot to be edited after hadir semua", () => {
    const presentData = markAllPresent(seedData, "2026-06-01", "class_1a", "schedule_regular");
    const editedData = upsertAttendanceRecord(presentData, {
      date: "2026-06-01",
      classId: "class_1a",
      studentId: "student_ahmad",
      slotId: "slot_1",
      status: "duty",
      note: "Piket kelas"
    });

    const monthlyRows = buildMonthlyRows(editedData, "2026-06", "class_1a");
    expect(monthlyRows[0].tugas_piket).toBe(1);
    expect(monthlyRows[0].hadir).toBe(6);
  });
});

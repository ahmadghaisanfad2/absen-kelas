import { describe, expect, it } from "vitest";
import {
  addClass,
  buildMonthlyRows,
  deleteClassGroup,
  markAllPresent,
  sortClassGroupsByName,
  updateClassName,
  updateStudent,
  upsertAttendanceRecord
} from "./attendance";
import { seedData } from "./seed";

describe("attendance helpers", () => {
  it("marks every tracked slot present for a class and date", () => {
    const data = markAllPresent(seedData, "2026-06-01", "class_1a", "schedule_regular");
    const records = Object.values(data.attendance).filter((record) => record.date === "2026-06-01");

    expect(records).toHaveLength(21);
    expect(records.every((record) => record.status === "present")).toBe(true);
  });

  it("allows a specific student slot to be edited after hadir semua", () => {
    const baseData = { ...seedData, attendance: {} };
    const presentData = markAllPresent(baseData, "2026-06-01", "class_1a", "schedule_regular");
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

  it("renames classes and students", () => {
    const renamedClass = updateClassName(seedData, "class_1a", "Kelas 1 Putra");
    const renamedStudent = updateStudent(renamedClass, "student_ahmad", {
      name: "Ahmad F.",
      nis: "1001A",
      gender: "L",
      note: "Ketua kelas"
    });

    expect(renamedStudent.classes.find((item) => item.id === "class_1a")?.name).toBe("Kelas 1 Putra");
    expect(renamedStudent.students.find((item) => item.id === "student_ahmad")).toMatchObject({
      name: "Ahmad F.",
      nis: "1001A",
      gender: "L",
      note: "Ketua kelas"
    });
  });

  it("sorts class groups in natural school order", () => {
    const unorderedData = {
      ...seedData,
      classes: [
        { id: "class_2a", name: "Kelas 2A" },
        { id: "class_1a", name: "Kelas 1A" },
        { id: "class_10a", name: "Kelas 10A" },
        { id: "class_1b", name: "Kelas 1B" }
      ]
    };

    const sortedData = sortClassGroupsByName(unorderedData);

    expect(sortedData.classes.map((item) => item.name)).toEqual([
      "Kelas 1A",
      "Kelas 1B",
      "Kelas 2A",
      "Kelas 10A"
    ]);
  });

  it("keeps newly added classes in natural order", () => {
    const dataWithInsertedClass = addClass(seedData, "Kelas 1B");

    expect(dataWithInsertedClass.classes.map((item) => item.name)).toEqual([
      "Kelas 1A",
      "Kelas 1B",
      "Kelas 2A"
    ]);
  });

  it("deletes a class with its students, attendance, order, and sort settings", () => {
    const deletedData = deleteClassGroup(seedData, "class_1a");

    expect(deletedData.classes.some((item) => item.id === "class_1a")).toBe(false);
    expect(deletedData.students.some((student) => student.classId === "class_1a")).toBe(false);
    expect(Object.values(deletedData.attendance).some((record) => record.classId === "class_1a")).toBe(false);
    expect(deletedData.studentOrderByClass.class_1a).toBeUndefined();
    expect(deletedData.studentSortModeByClass.class_1a).toBeUndefined();
  });
});

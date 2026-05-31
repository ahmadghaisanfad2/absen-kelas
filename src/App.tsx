import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  Upload,
  Users
} from "lucide-react";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import appLogoUrl from "./assets/app-logo-ui.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  addClass,
  addSchedulePattern,
  addStudent,
  attendanceRecordKey,
  buildMonthlyRows,
  deleteStudent,
  markAllPresent,
  studentsForClass,
  trackedSlots,
  updateSchedulePattern,
  upsertAttendanceRecord
} from "./lib/attendance";
import { monthKeyFromDate, todayIso, formatIndonesianDate } from "./lib/dates";
import {
  createDailyWorkbookForClasses,
  createMonthlyWorkbookForClasses,
  createStudentTemplateWorkbook,
  dailyFileNameForClasses,
  downloadWorkbook,
  importStudents,
  monthlyFileNameForClasses,
  parseStudentWorkbook
} from "./lib/excel";
import { makeId } from "./lib/ids";
import { ATTENDANCE_STATUS_OPTIONS, statusLabel } from "./lib/status";
import { createBackupPayload, loadAppData, parseBackupPayload, resetAppData, saveAppData } from "./lib/storage";
import type { AppData, AttendanceStatus, ClassGroup, LessonSlot, SchedulePattern } from "./lib/types";

type ViewKey = "dashboard" | "attendance" | "students" | "classes" | "schedules" | "exports" | "settings";
type ToastKind = "success" | "error" | "info";

const navItems: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "attendance", label: "Input Absensi", icon: ClipboardList },
  { key: "students", label: "Data Siswa", icon: Users },
  { key: "classes", label: "Data Kelas", icon: GraduationCap },
  { key: "schedules", label: "Pengaturan Jam", icon: CalendarDays },
  { key: "exports", label: "Rekap & Export", icon: FileSpreadsheet },
  { key: "settings", label: "Pengaturan", icon: Settings }
];

function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedClassId, setSelectedClassId] = useState(data.classes[0]?.id ?? "");
  const [selectedScheduleId, setSelectedScheduleId] = useState(data.activeSchedulePatternId);
  const [studentForm, setStudentForm] = useState({ name: "", nis: "", gender: "", note: "" });
  const [className, setClassName] = useState("");
  const [scheduleName, setScheduleName] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [exportClassIds, setExportClassIds] = useState<string[]>(() => data.classes.map((item) => item.id));

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  useEffect(() => {
    setExportClassIds((current) => {
      const validIds = data.classes.map((item) => item.id);
      const next = current.filter((id) => validIds.includes(id));
      const normalized = next.length > 0 ? next : validIds;

      if (normalized.length === current.length && normalized.every((id, index) => id === current[index])) {
        return current;
      }

      return normalized;
    });
  }, [data.classes]);

  const selectedClass = data.classes.find((item) => item.id === selectedClassId) ?? data.classes[0];
  const selectedSchedule =
    data.schedulePatterns.find((item) => item.id === selectedScheduleId) ?? data.schedulePatterns[0];
  const selectedStudents = useMemo(
    () => studentsForClass(data.students, selectedClass?.id ?? ""),
    [data.students, selectedClass?.id]
  );
  const monthlyRows = useMemo(
    () => buildMonthlyRows(data, monthKeyFromDate(selectedDate), selectedClass?.id ?? ""),
    [data, selectedDate, selectedClass?.id]
  );
  const exportClasses = useMemo(
    () => data.classes.filter((item) => exportClassIds.includes(item.id)),
    [data.classes, exportClassIds]
  );
  const trackedSlotCount = selectedSchedule ? trackedSlots(selectedSchedule).length : 0;
  const filledToday = Object.values(data.attendance).filter(
    (record) => record.date === selectedDate && record.classId === selectedClass?.id
  ).length;

  function updateData(nextData: AppData) {
    setData(nextData);
  }

  function notify(message: string, kind: ToastKind = "success") {
    window.setTimeout(() => {
      let stack = document.querySelector<HTMLDivElement>("#absen-toast-root");
      if (!stack) {
        stack = document.createElement("div");
        stack.id = "absen-toast-root";
        stack.className = "toast-stack";
        stack.setAttribute("aria-live", "polite");
        stack.setAttribute("aria-relevant", "additions");
        document.body.append(stack);
      }

      const notice = document.createElement("div");
      notice.className = `app-toast ${kind}`;
      notice.setAttribute("role", "status");

      const text = document.createElement("span");
      text.textContent = message;

      const dismiss = document.createElement("button");
      dismiss.className = "toast-dismiss";
      dismiss.type = "button";
      dismiss.setAttribute("aria-label", "Tutup notifikasi");
      dismiss.textContent = "x";
      dismiss.addEventListener("click", () => notice.remove());

      notice.append(text, dismiss);
      stack.append(notice);

      while (stack.children.length > 3) {
        stack.firstElementChild?.remove();
      }

      window.setTimeout(() => notice.remove(), 3600);
    }, 0);
  }

  function handleMarkAllPresent() {
    if (!selectedClass || !selectedSchedule) return;
    updateData(markAllPresent(data, selectedDate, selectedClass.id, selectedSchedule.id));
    notify(`${selectedStudents.length} siswa ditandai hadir untuk ${trackedSlotCount} jam pelajaran.`);
  }

  function handleAttendanceChange(
    studentId: string,
    slotId: string,
    status: AttendanceStatus,
    customStatus?: string,
    note?: string,
    shouldNotify = false
  ) {
    if (!selectedClass) return;
    updateData(
      upsertAttendanceRecord(data, {
        date: selectedDate,
        classId: selectedClass.id,
        studentId,
        slotId,
        status,
        customStatus,
        note
      })
    );
    if (shouldNotify) {
      const student = data.students.find((item) => item.id === studentId);
      notify(`Absensi ${student?.name ?? "siswa"} diperbarui.`);
    }
  }

  async function handleImportStudents(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    try {
      const rows = await parseStudentWorkbook(file);
      const imported = importStudents(data, rows);
      updateData(imported.data);
      setImportMessage(
        `${imported.result.importedStudents} siswa masuk, ${imported.result.createdClasses} kelas baru, ${imported.result.skippedRows} baris dilewati.`
      );
      notify(`${imported.result.importedStudents} siswa berhasil diimport dari Excel.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Import gagal.");
      notify(error instanceof Error ? error.message : "Import gagal.", "error");
    } finally {
      event.currentTarget.value = "";
    }
  }

  function handleRestoreBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        updateData(parseBackupPayload(String(reader.result)));
        notify("Backup berhasil direstore.");
      } catch (error) {
        notify(error instanceof Error ? error.message : "Restore backup gagal.", "error");
      }
    };
    reader.readAsText(file);
    event.currentTarget.value = "";
  }

  function setScheduleSlots(pattern: SchedulePattern, slots: LessonSlot[]) {
    updateData(updateSchedulePattern(data, { ...pattern, slots }));
  }

  function toggleExportClass(classId: string) {
    setExportClassIds((current) =>
      current.includes(classId) ? current.filter((id) => id !== classId) : [...current, classId]
    );
  }

  async function exportDailyForSelectedClasses() {
    const classIds = exportClasses.map((item) => item.id);
    if (classIds.length === 0 || !selectedSchedule) {
      notify("Pilih minimal satu kelas untuk export.", "error");
      return;
    }

    await downloadWorkbook(
      createDailyWorkbookForClasses(data, selectedDate, classIds, selectedSchedule.id),
      dailyFileNameForClasses(data, selectedDate, classIds)
    );
    notify(`Rekap harian ${classIds.length} kelas berhasil didownload.`);
  }

  async function exportMonthlyForSelectedClasses() {
    const classIds = exportClasses.map((item) => item.id);
    if (classIds.length === 0) {
      notify("Pilih minimal satu kelas untuk export.", "error");
      return;
    }

    const monthKey = monthKeyFromDate(selectedDate);
    await downloadWorkbook(
      createMonthlyWorkbookForClasses(data, monthKey, classIds),
      monthlyFileNameForClasses(data, monthKey, classIds)
    );
    notify(`Rekap bulanan ${classIds.length} kelas berhasil didownload.`);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <img className="brand-mark" src={appLogoUrl} alt="" aria-hidden="true" />
          <div>
            <strong>Absen Kelas</strong>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                className={activeView === item.key ? "nav-item active" : "nav-item"}
                variant="ghost"
                key={item.key}
                type="button"
                onClick={() => setActiveView(item.key)}
              >
                <Icon data-icon="inline-start" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <CheckCircle2 size={18} />
          Data tersimpan lokal di perangkat ini.
        </div>
      </aside>

      <main className="main-panel">
        {activeView === "dashboard" && (
          <section className="view-stack">
            <PageHeader
              title="Dashboard"
              description="Ringkasan data lokal dan pintasan kerja operator absensi."
            />
            <div className="metric-grid">
              <MetricCard label="Kelas" value={data.classes.length} />
              <MetricCard label="Siswa" value={data.students.length} />
              <MetricCard label="Pola Jam" value={data.schedulePatterns.length} />
              <MetricCard label="Entri Hari Ini" value={filledToday} />
            </div>
            <div className="workspace-card hero-card">
              <div>
                <h2>Mulai input absensi hari ini</h2>
                <p>
                  Pilih kelas, pilih pola jam, klik Hadir Semua, lalu ubah status siswa yang berbeda dari buku
                  absen.
                </p>
              </div>
              <Button type="button" onClick={() => setActiveView("attendance")}>
                <ClipboardList data-icon="inline-start" />
                Buka Input Absensi
              </Button>
            </div>
          </section>
        )}

        {activeView === "attendance" && selectedClass && selectedSchedule && (
          <section className="view-stack">
            <PageHeader
              title="Input Absensi"
              description="Isi absensi per siswa dan per jam pelajaran. Slot pemisah tidak dihitung absensi."
            />
            <div className="toolbar-card">
              <label>
                Tanggal
                <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              </label>
              <label>
                Kelas
                <ClassSelect
                  classes={data.classes}
                  value={selectedClass.id}
                  onValueChange={setSelectedClassId}
                />
              </label>
              <label>
                Pola Jam
                <ScheduleSelect
                  schedules={data.schedulePatterns}
                  value={selectedSchedule.id}
                  onValueChange={setSelectedScheduleId}
                />
              </label>
              <Button type="button" onClick={handleMarkAllPresent}>
                <CheckCircle2 data-icon="inline-start" />
                Hadir Semua
              </Button>
            </div>

            <AttendanceGrid
              data={data}
              date={selectedDate}
              classId={selectedClass.id}
              students={selectedStudents}
              schedule={selectedSchedule}
              onChange={handleAttendanceChange}
            />
          </section>
        )}

        {activeView === "students" && selectedClass && (
          <section className="view-stack">
            <PageHeader
              title="Data Siswa"
              description="Tambah siswa manual atau import Excel dengan kolom nama_siswa dan kelas."
            />
            <div className="split-grid">
              <div className="workspace-card">
                <h2>Tambah Siswa</h2>
                <div className="form-grid">
                  <Input
                    placeholder="Nama siswa"
                    value={studentForm.name}
                    onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })}
                  />
                  <Input
                    placeholder="NIS (opsional)"
                    value={studentForm.nis}
                    onChange={(event) => setStudentForm({ ...studentForm, nis: event.target.value })}
                  />
                  <ClassSelect
                    classes={data.classes}
                    value={selectedClass.id}
                    onValueChange={setSelectedClassId}
                  />
                  <Input
                    placeholder="Jenis kelamin (opsional)"
                    value={studentForm.gender}
                    onChange={(event) => setStudentForm({ ...studentForm, gender: event.target.value })}
                  />
                  <Input
                    className="span-2"
                    placeholder="Catatan (opsional)"
                    value={studentForm.note}
                    onChange={(event) => setStudentForm({ ...studentForm, note: event.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (!studentForm.name.trim()) {
                      notify("Nama siswa wajib diisi.", "error");
                      return;
                    }
                    updateData(addStudent(data, { ...studentForm, classId: selectedClass.id }));
                    setStudentForm({ name: "", nis: "", gender: "", note: "" });
                    notify(`Siswa ditambahkan ke ${selectedClass.name}.`);
                  }}
                >
                  <Plus data-icon="inline-start" />
                  Tambah Siswa
                </Button>
              </div>

              <div className="workspace-card">
                <h2>Import Excel</h2>
                <p className="muted-text">Gunakan template agar format kolom konsisten.</p>
                <div className="button-row">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={async () => {
                      await downloadWorkbook(createStudentTemplateWorkbook(), "template-siswa-absen-kelas.xlsx");
                      notify("Template siswa berhasil didownload.");
                    }}
                  >
                    <Download data-icon="inline-start" />
                    Download Template
                  </Button>
                  <label className="file-button">
                    <Upload data-icon="inline-start" />
                    Import Excel
                    <input accept=".xlsx,.xls" type="file" onChange={handleImportStudents} />
                  </label>
                </div>
                {importMessage && <p className="inline-message">{importMessage}</p>}
              </div>
            </div>

            <div className="toolbar-card compact">
              <label>
                Tampilkan kelas
                <ClassSelect
                  classes={data.classes}
                  value={selectedClass.id}
                  onValueChange={setSelectedClassId}
                />
              </label>
              <span className="toolbar-summary">{selectedStudents.length} siswa di {selectedClass.name}</span>
            </div>

            <DataTable
              headers={["Nama", "NIS", "Kelas", "Catatan", ""]}
              rows={selectedStudents.map((student) => [
                student.name,
                student.nis ?? "-",
                data.classes.find((item) => item.id === student.classId)?.name ?? "-",
                student.note ?? "-",
                <Button
                  className="text-destructive"
                  key={student.id}
                  size="icon"
                  variant="outline"
                  type="button"
                  title="Hapus siswa"
                  onClick={() => {
                    updateData(deleteStudent(data, student.id));
                    notify(`${student.name} dihapus dari data siswa.`);
                  }}
                >
                  <Trash2 />
                </Button>
              ])}
            />
          </section>
        )}

        {activeView === "classes" && (
          <section className="view-stack">
            <PageHeader title="Data Kelas" description="Kelola daftar kelas yang dipakai untuk input absensi." />
            <div className="toolbar-card compact">
              <Input
                placeholder="Nama kelas, contoh: Kelas 3B"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
              />
              <Button
                type="button"
                onClick={() => {
                  if (!className.trim()) {
                    notify("Nama kelas wajib diisi.", "error");
                    return;
                  }
                  notify(`${className.trim()} ditambahkan.`);
                  updateData(addClass(data, className));
                  setClassName("");
                }}
              >
                <Plus data-icon="inline-start" />
                Tambah Kelas
              </Button>
            </div>
            <DataTable
              headers={["Nama Kelas", "Jumlah Siswa"]}
              rows={data.classes.map((item) => [
                item.name,
                data.students.filter((student) => student.classId === item.id).length.toString()
              ])}
            />
          </section>
        )}

        {activeView === "schedules" && selectedSchedule && (
          <section className="view-stack">
            <PageHeader
              title="Pengaturan Jam"
              description="Buat pola jam yang bisa dipilih saat input absensi, termasuk slot pemisah seperti istirahat."
            />
            <div className="toolbar-card compact">
              <Input
                placeholder="Nama pola baru, contoh: Ramadhan"
                value={scheduleName}
                onChange={(event) => setScheduleName(event.target.value)}
              />
              <Button
                type="button"
                onClick={() => {
                  if (!scheduleName.trim()) {
                    notify("Nama pola jam wajib diisi.", "error");
                    return;
                  }
                  updateData(addSchedulePattern(data, scheduleName));
                  notify(`Pola jam ${scheduleName.trim()} ditambahkan.`);
                  setScheduleName("");
                }}
              >
                <Plus data-icon="inline-start" />
                Tambah Pola
              </Button>
            </div>
            <div className="workspace-card">
              <div className="section-title-row">
                <label>
                  Pola aktif
                  <ScheduleSelect
                    schedules={data.schedulePatterns}
                    value={selectedSchedule.id}
                    onValueChange={setSelectedScheduleId}
                  />
                </label>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setScheduleSlots(selectedSchedule, [
                      ...selectedSchedule.slots,
                      { id: makeId("slot"), name: `Jam ${selectedSchedule.slots.length + 1}`, isAttendanceTracked: true }
                    ]);
                    notify("Slot jam pelajaran ditambahkan.");
                  }}
                >
                  <Plus data-icon="inline-start" />
                  Tambah Slot
                </Button>
              </div>
              <div className="slot-list">
                {selectedSchedule.slots.map((slot, index) => (
                  <div className="slot-row" key={slot.id}>
                    <span className="slot-number">{index + 1}</span>
                    <Input
                      value={slot.name}
                      onChange={(event) => {
                        const slots = selectedSchedule.slots.map((item) =>
                          item.id === slot.id ? { ...item, name: event.target.value } : item
                        );
                        setScheduleSlots(selectedSchedule, slots);
                      }}
                    />
                    <label className="toggle-row">
                      <Checkbox
                        checked={slot.isAttendanceTracked}
                        onCheckedChange={(checked) => {
                          const slots = selectedSchedule.slots.map((item) =>
                            item.id === slot.id ? { ...item, isAttendanceTracked: checked === true } : item
                          );
                          setScheduleSlots(selectedSchedule, slots);
                          notify("Pengaturan slot diperbarui.");
                        }}
                      />
                      Wajib absen
                    </label>
                    <Button
                      className="text-destructive"
                      size="icon"
                      variant="outline"
                      type="button"
                      title="Hapus slot"
                      onClick={() => {
                        setScheduleSlots(
                          selectedSchedule,
                          selectedSchedule.slots.filter((item) => item.id !== slot.id)
                        );
                        notify(`${slot.name} dihapus dari pola jam.`);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeView === "exports" && selectedClass && selectedSchedule && (
          <section className="view-stack">
            <PageHeader
              title="Rekap & Export"
              description="Export rekap harian atau bulanan ke Excel untuk arsip dan laporan sekolah."
            />
            <div className="workspace-card">
              <div className="section-title-row">
                <div>
                  <h2>Kelas yang diexport</h2>
                  <p className="muted-text">
                    Pilih satu, beberapa, atau semua kelas. Setiap kelas akan dibuat sebagai sheet terpisah di Excel.
                  </p>
                </div>
                <div className="button-row no-margin">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setExportClassIds(data.classes.map((item) => item.id));
                      notify("Semua kelas dipilih untuk export.", "info");
                    }}
                  >
                    Semua Kelas
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setExportClassIds([selectedClass.id]);
                      notify(`${selectedClass.name} dipilih untuk export.`, "info");
                    }}
                  >
                    Kelas Aktif
                  </Button>
                </div>
              </div>
              <div className="class-picker-grid">
                {data.classes.map((item) => (
                  <label className="class-check" key={item.id}>
                    <Checkbox
                      checked={exportClassIds.includes(item.id)}
                      onCheckedChange={() => toggleExportClass(item.id)}
                    />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{data.students.filter((student) => student.classId === item.id).length} siswa</small>
                    </span>
                  </label>
                ))}
              </div>
              <p className={exportClasses.length === 0 ? "inline-message error" : "inline-message"}>
                {exportClasses.length === 0
                  ? "Pilih minimal satu kelas sebelum export."
                  : `${exportClasses.length} kelas dipilih untuk export.`}
              </p>
            </div>
            <div className="split-grid">
              <div className="workspace-card">
                <h2>Rekap Harian</h2>
                <p className="muted-text">
                  {formatIndonesianDate(selectedDate)} - {exportClasses.length} kelas dipilih
                </p>
                <Button
                  disabled={exportClasses.length === 0}
                  type="button"
                  onClick={exportDailyForSelectedClasses}
                >
                  <Download data-icon="inline-start" />
                  Export Harian
                </Button>
              </div>
              <div className="workspace-card">
                <h2>Rekap Bulanan</h2>
                <p className="muted-text">
                  {monthKeyFromDate(selectedDate)} - {exportClasses.length} kelas dipilih
                </p>
                <Button
                  disabled={exportClasses.length === 0}
                  type="button"
                  onClick={exportMonthlyForSelectedClasses}
                >
                  <Download data-icon="inline-start" />
                  Export Bulanan
                </Button>
              </div>
            </div>
            <p className="muted-text">Preview di bawah menampilkan rekap bulanan kelas aktif: {selectedClass.name}.</p>
            <DataTable
              headers={["Nama", "Hadir", "Izin", "Sakit", "Alpa", "Tugas/Piket", "Lainnya", "Total Jam"]}
              rows={monthlyRows.map((row) => [
                row.nama_siswa,
                row.hadir.toString(),
                row.izin.toString(),
                row.sakit.toString(),
                row.alpa.toString(),
                row.tugas_piket.toString(),
                row.lainnya.toString(),
                row.total_jam.toString()
              ])}
            />
          </section>
        )}

        {activeView === "settings" && (
          <section className="view-stack">
            <PageHeader
              title="Pengaturan"
              description="Backup, restore, dan reset data lokal aplikasi."
            />
            <div className="split-grid">
              <div className="workspace-card">
                <DatabaseBackup size={26} />
                <h2>Backup Data</h2>
                <p className="muted-text">Simpan semua data kelas, siswa, pola jam, dan absensi ke file JSON.</p>
                <Button
                  type="button"
                  onClick={() => {
                    downloadTextFile(`backup-absen-kelas-${todayIso()}.json`, createBackupPayload(data));
                    notify("Backup data berhasil didownload.");
                  }}
                >
                  <Download data-icon="inline-start" />
                  Download Backup
                </Button>
              </div>
              <div className="workspace-card">
                <Upload size={26} />
                <h2>Restore Data</h2>
                <p className="muted-text">Pulihkan data dari file backup Absen Kelas.</p>
                <label className="file-button">
                  <Upload size={17} />
                  Pilih File Backup
                  <input accept=".json" type="file" onChange={handleRestoreBackup} />
                </label>
              </div>
            </div>
            <div className="workspace-card danger-zone">
              <div>
                <h2>Reset Data Demo</h2>
                <p className="muted-text">Menghapus data lokal dan memuat ulang contoh bawaan aplikasi.</p>
              </div>
              <Button
                variant="destructive"
                type="button"
                onClick={() => {
                  resetAppData();
                  setData(loadAppData());
                  notify("Data lokal direset ke contoh bawaan.");
                }}
              >
                <RotateCcw data-icon="inline-start" />
                Reset
              </Button>
            </div>
          </section>
          )}
      </main>
    </div>
  );
}

function ClassSelect({
  classes,
  value,
  onValueChange
}: {
  classes: ClassGroup[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Pilih kelas" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {classes.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function ScheduleSelect({
  schedules,
  value,
  onValueChange
}: {
  schedules: SchedulePattern[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Pilih pola jam" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {schedules.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <Badge className="local-badge" variant="outline">
        <Save data-icon="inline-start" />
        Offline
      </Badge>
    </header>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="metric-card">
      <CardContent>
        <span>{label}</span>
        <strong>{value}</strong>
      </CardContent>
    </Card>
  );
}

function AttendanceGrid({
  data,
  date,
  classId,
  students,
  schedule,
  onChange
}: {
  data: AppData;
  date: string;
  classId: string;
  students: AppData["students"];
  schedule: SchedulePattern;
  onChange: (
    studentId: string,
    slotId: string,
    status: AttendanceStatus,
    customStatus?: string,
    note?: string,
    shouldNotify?: boolean
  ) => void;
}) {
  return (
    <div className="attendance-table-wrap">
      <Table className="attendance-table">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky-col">Siswa</TableHead>
            {schedule.slots.map((slot) => (
              <TableHead key={slot.id} className={slot.isAttendanceTracked ? "" : "break-slot"}>
                {slot.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="student-cell sticky-col">
                <strong>{student.name}</strong>
                <span>{student.nis || "Tanpa NIS"}</span>
              </TableCell>
              {schedule.slots.map((slot) => {
                if (!slot.isAttendanceTracked) {
                  return (
                    <TableCell className="break-cell" key={slot.id}>
                      -
                    </TableCell>
                  );
                }

                const record = data.attendance[attendanceRecordKey(date, classId, student.id, slot.id)];
                const status = record?.status ?? "absent";

                return (
                  <TableCell className="attendance-cell" key={slot.id}>
                    <Select
                      value={status}
                      onValueChange={(value) =>
                        onChange(
                          student.id,
                          slot.id,
                          value as AttendanceStatus,
                          record?.customStatus,
                          record?.note,
                          true
                        )
                      }
                    >
                      <SelectTrigger className={`status-select status-${status}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {statusLabel(option)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {status === "other" && (
                      <Input
                        className="cell-note"
                        placeholder="Status"
                        value={record?.customStatus ?? ""}
                        onChange={(event) => onChange(student.id, slot.id, status, event.target.value, record?.note)}
                      />
                    )}
                    <Input
                      className="cell-note"
                      placeholder="Catatan"
                      value={record?.note ?? ""}
                      onChange={(event) =>
                        onChange(student.id, slot.id, status, record?.customStatus, event.target.value)
                      }
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {students.length === 0 && <div className="empty-state">Belum ada siswa di kelas ini.</div>}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <Card className="data-table-wrap">
      <Table className="data-table">
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && <div className="empty-state">Belum ada data.</div>}
    </Card>
  );
}

export default App;

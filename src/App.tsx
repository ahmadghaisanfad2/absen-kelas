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
  createDailyWorkbook,
  createMonthlyWorkbook,
  createStudentTemplateWorkbook,
  dailyFileName,
  downloadWorkbook,
  importStudents,
  monthlyFileName,
  parseStudentWorkbook
} from "./lib/excel";
import { makeId } from "./lib/ids";
import { ATTENDANCE_STATUS_OPTIONS, statusLabel } from "./lib/status";
import { createBackupPayload, loadAppData, parseBackupPayload, resetAppData, saveAppData } from "./lib/storage";
import type { AppData, AttendanceStatus, LessonSlot, SchedulePattern } from "./lib/types";

type ViewKey = "dashboard" | "attendance" | "students" | "classes" | "schedules" | "exports" | "settings";

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

  useEffect(() => {
    saveAppData(data);
  }, [data]);

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
  const trackedSlotCount = selectedSchedule ? trackedSlots(selectedSchedule).length : 0;
  const filledToday = Object.values(data.attendance).filter(
    (record) => record.date === selectedDate && record.classId === selectedClass?.id
  ).length;

  function updateData(nextData: AppData) {
    setData(nextData);
  }

  function handleMarkAllPresent() {
    if (!selectedClass || !selectedSchedule) return;
    updateData(markAllPresent(data, selectedDate, selectedClass.id, selectedSchedule.id));
  }

  function handleAttendanceChange(
    studentId: string,
    slotId: string,
    status: AttendanceStatus,
    customStatus?: string,
    note?: string
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
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Import gagal.");
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
      } catch (error) {
        alert(error instanceof Error ? error.message : "Restore backup gagal.");
      }
    };
    reader.readAsText(file);
    event.currentTarget.value = "";
  }

  function setScheduleSlots(pattern: SchedulePattern, slots: LessonSlot[]) {
    updateData(updateSchedulePattern(data, { ...pattern, slots }));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">AK</div>
          <div>
            <strong>Absen Kelas</strong>
            <span>Offline desktop</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeView === item.key ? "nav-item active" : "nav-item"}
                key={item.key}
                type="button"
                onClick={() => setActiveView(item.key)}
              >
                <Icon size={18} />
                {item.label}
              </button>
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
              <button className="primary-button" type="button" onClick={() => setActiveView("attendance")}>
                <ClipboardList size={18} />
                Buka Input Absensi
              </button>
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
                <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              </label>
              <label>
                Kelas
                <select value={selectedClass.id} onChange={(event) => setSelectedClassId(event.target.value)}>
                  {data.classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Pola Jam
                <select value={selectedSchedule.id} onChange={(event) => setSelectedScheduleId(event.target.value)}>
                  {data.schedulePatterns.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary-button" type="button" onClick={handleMarkAllPresent}>
                <CheckCircle2 size={18} />
                Hadir Semua
              </button>
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
                  <input
                    placeholder="Nama siswa"
                    value={studentForm.name}
                    onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })}
                  />
                  <input
                    placeholder="NIS (opsional)"
                    value={studentForm.nis}
                    onChange={(event) => setStudentForm({ ...studentForm, nis: event.target.value })}
                  />
                  <select value={selectedClass.id} onChange={(event) => setSelectedClassId(event.target.value)}>
                    {data.classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Jenis kelamin (opsional)"
                    value={studentForm.gender}
                    onChange={(event) => setStudentForm({ ...studentForm, gender: event.target.value })}
                  />
                  <input
                    className="span-2"
                    placeholder="Catatan (opsional)"
                    value={studentForm.note}
                    onChange={(event) => setStudentForm({ ...studentForm, note: event.target.value })}
                  />
                </div>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => {
                    updateData(addStudent(data, { ...studentForm, classId: selectedClass.id }));
                    setStudentForm({ name: "", nis: "", gender: "", note: "" });
                  }}
                >
                  <Plus size={18} />
                  Tambah Siswa
                </button>
              </div>

              <div className="workspace-card">
                <h2>Import Excel</h2>
                <p className="muted-text">Gunakan template agar format kolom konsisten.</p>
                <div className="button-row">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => downloadWorkbook(createStudentTemplateWorkbook(), "template-siswa-absen-kelas.xlsx")}
                  >
                    <Download size={17} />
                    Download Template
                  </button>
                  <label className="file-button">
                    <Upload size={17} />
                    Import Excel
                    <input accept=".xlsx,.xls" type="file" onChange={handleImportStudents} />
                  </label>
                </div>
                {importMessage && <p className="inline-message">{importMessage}</p>}
              </div>
            </div>

            <DataTable
              headers={["Nama", "NIS", "Kelas", "Catatan", ""]}
              rows={data.students.map((student) => [
                student.name,
                student.nis ?? "-",
                data.classes.find((item) => item.id === student.classId)?.name ?? "-",
                student.note ?? "-",
                <button
                  className="icon-button danger"
                  key={student.id}
                  type="button"
                  title="Hapus siswa"
                  onClick={() => updateData(deleteStudent(data, student.id))}
                >
                  <Trash2 size={16} />
                </button>
              ])}
            />
          </section>
        )}

        {activeView === "classes" && (
          <section className="view-stack">
            <PageHeader title="Data Kelas" description="Kelola daftar kelas yang dipakai untuk input absensi." />
            <div className="toolbar-card compact">
              <input
                placeholder="Nama kelas, contoh: Kelas 3B"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
              />
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  updateData(addClass(data, className));
                  setClassName("");
                }}
              >
                <Plus size={18} />
                Tambah Kelas
              </button>
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
              <input
                placeholder="Nama pola baru, contoh: Ramadhan"
                value={scheduleName}
                onChange={(event) => setScheduleName(event.target.value)}
              />
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  updateData(addSchedulePattern(data, scheduleName));
                  setScheduleName("");
                }}
              >
                <Plus size={18} />
                Tambah Pola
              </button>
            </div>
            <div className="workspace-card">
              <div className="section-title-row">
                <label>
                  Pola aktif
                  <select value={selectedSchedule.id} onChange={(event) => setSelectedScheduleId(event.target.value)}>
                    {data.schedulePatterns.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    setScheduleSlots(selectedSchedule, [
                      ...selectedSchedule.slots,
                      { id: makeId("slot"), name: `Jam ${selectedSchedule.slots.length + 1}`, isAttendanceTracked: true }
                    ])
                  }
                >
                  <Plus size={17} />
                  Tambah Slot
                </button>
              </div>
              <div className="slot-list">
                {selectedSchedule.slots.map((slot, index) => (
                  <div className="slot-row" key={slot.id}>
                    <span className="slot-number">{index + 1}</span>
                    <input
                      value={slot.name}
                      onChange={(event) => {
                        const slots = selectedSchedule.slots.map((item) =>
                          item.id === slot.id ? { ...item, name: event.target.value } : item
                        );
                        setScheduleSlots(selectedSchedule, slots);
                      }}
                    />
                    <label className="toggle-row">
                      <input
                        checked={slot.isAttendanceTracked}
                        type="checkbox"
                        onChange={(event) => {
                          const slots = selectedSchedule.slots.map((item) =>
                            item.id === slot.id ? { ...item, isAttendanceTracked: event.target.checked } : item
                          );
                          setScheduleSlots(selectedSchedule, slots);
                        }}
                      />
                      Wajib absen
                    </label>
                    <button
                      className="icon-button danger"
                      type="button"
                      title="Hapus slot"
                      onClick={() =>
                        setScheduleSlots(
                          selectedSchedule,
                          selectedSchedule.slots.filter((item) => item.id !== slot.id)
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
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
            <div className="split-grid">
              <div className="workspace-card">
                <h2>Rekap Harian</h2>
                <p className="muted-text">{formatIndonesianDate(selectedDate)} - {selectedClass.name}</p>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    downloadWorkbook(
                      createDailyWorkbook(data, selectedDate, selectedClass.id, selectedSchedule.id),
                      dailyFileName(data, selectedDate, selectedClass.id)
                    )
                  }
                >
                  <Download size={18} />
                  Export Harian
                </button>
              </div>
              <div className="workspace-card">
                <h2>Rekap Bulanan</h2>
                <p className="muted-text">
                  {monthKeyFromDate(selectedDate)} - {selectedClass.name} - {monthlyRows.length} siswa
                </p>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    downloadWorkbook(
                      createMonthlyWorkbook(data, monthKeyFromDate(selectedDate), selectedClass.id),
                      monthlyFileName(data, monthKeyFromDate(selectedDate), selectedClass.id)
                    )
                  }
                >
                  <Download size={18} />
                  Export Bulanan
                </button>
              </div>
            </div>
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
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => downloadTextFile(`backup-absen-kelas-${todayIso()}.json`, createBackupPayload(data))}
                >
                  <Download size={18} />
                  Download Backup
                </button>
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
              <button
                className="danger-button"
                type="button"
                onClick={() => {
                  resetAppData();
                  window.location.reload();
                }}
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="local-badge">
        <Save size={16} />
        Offline
      </div>
    </header>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
    note?: string
  ) => void;
}) {
  return (
    <div className="attendance-table-wrap">
      <table className="attendance-table">
        <thead>
          <tr>
            <th className="sticky-col">Siswa</th>
            {schedule.slots.map((slot) => (
              <th key={slot.id} className={slot.isAttendanceTracked ? "" : "break-slot"}>
                {slot.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td className="student-cell sticky-col">
                <strong>{student.name}</strong>
                <span>{student.nis || "Tanpa NIS"}</span>
              </td>
              {schedule.slots.map((slot) => {
                if (!slot.isAttendanceTracked) {
                  return (
                    <td className="break-cell" key={slot.id}>
                      -
                    </td>
                  );
                }

                const record = data.attendance[attendanceRecordKey(date, classId, student.id, slot.id)];
                const status = record?.status ?? "absent";

                return (
                  <td className="attendance-cell" key={slot.id}>
                    <select
                      className={`status-select status-${status}`}
                      value={status}
                      onChange={(event) =>
                        onChange(
                          student.id,
                          slot.id,
                          event.target.value as AttendanceStatus,
                          record?.customStatus,
                          record?.note
                        )
                      }
                    >
                      {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {statusLabel(option)}
                        </option>
                      ))}
                    </select>
                    {status === "other" && (
                      <input
                        className="cell-note"
                        placeholder="Status"
                        value={record?.customStatus ?? ""}
                        onChange={(event) => onChange(student.id, slot.id, status, event.target.value, record?.note)}
                      />
                    )}
                    <input
                      className="cell-note"
                      placeholder="Catatan"
                      value={record?.note ?? ""}
                      onChange={(event) =>
                        onChange(student.id, slot.id, status, record?.customStatus, event.target.value)
                      }
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {students.length === 0 && <div className="empty-state">Belum ada siswa di kelas ini.</div>}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty-state">Belum ada data.</div>}
    </div>
  );
}

export default App;

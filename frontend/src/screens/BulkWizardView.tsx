import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AumClass, AumFormat, BulkItem, School, saveBulk } from "@/src/api";
import { ConsultPicker, StepHeader, YesNo } from "@/src/screens/WizardView";
import { useTheme } from "@/src/theme";
import { Chip, EmptyState, Field, Icon, IconButton, Legend, Notice, NumberGrid, PrimaryButton, SecondaryButton, parseNumbers, useStyles } from "@/src/ui";

type Student = BulkItem & { key: string };
const newStudent = (name: string, respondent_id = "", gender = ""): Student => ({ key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, respondent_id, gender, selected_problem_numbers: [], heavy_problem_numbers: [], third_step: { complete: "Ya", other_problems: "", want_discussion: "Tidak", discussion_with: "Guru BK" } });

type Props = { formats: AumFormat[]; classes: AumClass[]; selectedClass: AumClass | null; activeSchool: School | null; onClose: () => void; onSaved: (classId: string, saved: number) => void };

export function BulkWizardView({ formats, classes, selectedClass, activeSchool, onClose, onSaved }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [classId, setClassId] = useState(selectedClass?.id || classes[0]?.id || "");
  const [academicYear, setAcademicYear] = useState(activeSchool?.academic_year || "2025/2026");
  const [students, setStudents] = useState<Student[]>([]);
  const [active, setActive] = useState(0);
  const [name, setName] = useState("");
  const [nis, setNis] = useState("");
  const [gender, setGender] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [showBulkNames, setShowBulkNames] = useState(false);
  const [inputMode, setInputMode] = useState<"grid" | "ketik">("grid");
  const [heavyMode, setHeavyMode] = useState(false);
  const [typed, setTyped] = useState("");
  const [typedHeavy, setTypedHeavy] = useState("");
  const [search, setSearch] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const cls = classes.find((c) => c.id === classId) || null;
  const format = formats.find((f) => f.id === cls?.format_id) || formats[0];
  const total = format?.total_items || 0;
  const current = students[active];
  const ready = useMemo(() => students.filter((s) => s.selected_problem_numbers.length).length, [students]);

  const update = (key: string, patch: Partial<Student>) => setStudents((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const addStudent = () => { if (!name.trim()) return; setStudents((list) => [...list, newStudent(name.trim(), nis.trim(), gender)]); setName(""); setNis(""); setGender(""); };
  const addMany = () => { const names = bulkNames.split(/\n|;/).map((n) => n.trim()).filter(Boolean); if (!names.length) return; setStudents((list) => [...list, ...names.map((n) => newStudent(n))]); setBulkNames(""); setShowBulkNames(false); };
  const removeStudent = (key: string) => { setStudents((list) => list.filter((s) => s.key !== key)); setActive(0); };
  const selectStudent = (index: number) => { setActive(index); const s = students[index]; setTyped(s.selected_problem_numbers.join(", ")); setTypedHeavy(s.heavy_problem_numbers.join(", ")); };

  const tapNumber = (n: number) => {
    if (!current) return;
    if (heavyMode) {
      if (!current.selected_problem_numbers.includes(n)) return Alert.alert("Belum dipilih", "Tandai nomor sebagai masalah dahulu, lalu tandai berat.");
      const heavy = current.heavy_problem_numbers.includes(n) ? current.heavy_problem_numbers.filter((i) => i !== n) : [...current.heavy_problem_numbers, n].sort((a, b) => a - b);
      update(current.key, { heavy_problem_numbers: heavy });
      return;
    }
    const selected = current.selected_problem_numbers.includes(n) ? current.selected_problem_numbers.filter((i) => i !== n) : [...current.selected_problem_numbers, n].sort((a, b) => a - b);
    update(current.key, { selected_problem_numbers: selected, heavy_problem_numbers: current.heavy_problem_numbers.filter((h) => selected.includes(h)) });
  };
  const applyTyped = () => {
    if (!current) return;
    const selected = parseNumbers(typed).filter((n) => n <= total);
    const heavy = parseNumbers(typedHeavy).filter((n) => selected.includes(n));
    update(current.key, { selected_problem_numbers: selected, heavy_problem_numbers: heavy });
  };
  const goNext = () => {
    if (step === 1) { if (!cls) return Alert.alert("Pilih kelas", "Tambahkan kelas dahulu di tab Data."); if (!students.length) return Alert.alert("Belum ada siswa", "Tambahkan minimal satu nama siswa."); selectStudent(0); }
    if (step === 2 && !ready) return Alert.alert("Belum ada nomor", "Isi nomor masalah minimal untuk satu siswa.");
    setStep((s) => Math.min(s + 1, 3));
  };
  const save = async () => {
    if (!cls) return;
    setSaving(true); setSaveError("");
    try {
      const items = students.filter((s) => s.selected_problem_numbers.length).map(({ key: _key, ...rest }) => rest);
      const response = await saveBulk({ class_id: cls.id, format_id: cls.format_id, academic_year: academicYear.trim(), items });
      onSaved(cls.id, response.saved);
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Lembar kelas belum tersimpan."); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <StepHeader step={step} total={3} count={students.length} onClose={onClose} title={`Lembar kelas · Langkah ${step} dari 3`} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 26 }]} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <>
            <Text style={styles.h2}>Siapkan lembar kelas</Text>
            <Text style={[styles.body, { marginTop: 6 }]}>Pilih kelas, lalu daftarkan semua siswa yang mengisi AUM. Nomor masalah diisi di langkah berikutnya.</Text>
            <Text style={styles.label}>KELAS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{classes.map((c) => <Chip key={c.id} testID={`bulk-class-${c.id}`} label={`${c.name} · ${c.format_id.replace("format_", "F")}`} active={classId === c.id} onPress={() => setClassId(c.id)} />)}</ScrollView>
            {!classes.length && <Text style={[styles.caption, { color: colors.error, marginTop: 8 }]}>Belum ada kelas. Tambahkan di tab Data.</Text>}
            <Field testID="bulk-year" label="TAHUN AJARAN" value={academicYear} onChangeText={setAcademicYear} placeholder="2025/2026" />
            <View style={[styles.card, { marginTop: 18 }]}>
              <Text style={styles.h3}>Tambah siswa</Text>
              <Field testID="bulk-name" label="NAMA" value={name} onChangeText={setName} placeholder="Nama siswa" autoCapitalize="words" />
              <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
                <View style={{ flex: 1 }}><Field testID="bulk-nis" label="NIS (opsional)" value={nis} onChangeText={setNis} placeholder="—" /></View>
                <View style={{ flexDirection: "row", gap: 6 }}>{["L", "P"].map((g) => <Chip key={g} label={g} active={gender === g} onPress={() => setGender(g)} testID={`bulk-gender-${g}`} />)}</View>
              </View>
              <View style={{ marginTop: 14 }}><PrimaryButton testID="bulk-add-student" title="Tambah ke daftar" icon="person-add-outline" onPress={addStudent} disabled={!name.trim()} /></View>
              <Pressable onPress={() => setShowBulkNames(!showBulkNames)} style={[styles.row, { gap: 6, marginTop: 14 }]} testID="bulk-toggle-many"><Icon name={showBulkNames ? "chevron-up" : "chevron-down"} size={15} color={colors.muted} /><Text style={styles.caption}>Tempel banyak nama sekaligus (satu nama per baris)</Text></Pressable>
              {showBulkNames && (<><Field testID="bulk-many-names" label="DAFTAR NAMA" value={bulkNames} onChangeText={setBulkNames} placeholder={"Ani\nBudi\nCitra"} multiline /><View style={{ marginTop: 10 }}><SecondaryButton testID="bulk-add-many" title="Tambahkan semua" icon="albums-outline" onPress={addMany} /></View></>)}
            </View>
            <View style={styles.between}><Text style={styles.h3}>Daftar siswa</Text><Text style={styles.caption}>{students.length} orang</Text></View>
            <View style={[styles.card, { marginTop: 10 }]}>
              {students.map((s, index) => (
                <View key={s.key} style={styles.listRow} testID={`bulk-student-${index}`}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{index + 1}</Text></View>
                  <View style={{ flex: 1 }}><Text style={styles.h3}>{s.name}</Text><Text style={styles.caption}>{s.respondent_id || "tanpa NIS"} · {s.gender || "—"}</Text></View>
                  <IconButton testID={`bulk-remove-${index}`} icon="close" tint={colors.error} onPress={() => removeStudent(s.key)} />
                </View>
              ))}
              {!students.length && <Text style={styles.body}>Belum ada siswa pada lembar ini.</Text>}
            </View>
          </>
        )}

        {step === 2 && current && (
          <>
            <Text style={styles.h2}>Isi nomor masalah</Text>
            <Text style={[styles.body, { marginTop: 6 }]}>Pilih siswa, lalu tandai nomor dari lembar jawabannya. Format {format?.code} · {total} item.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 14 }}>
              {students.map((s, index) => <Chip key={s.key} testID={`bulk-pick-${index}`} label={`${s.name}${s.selected_problem_numbers.length ? ` · ${s.selected_problem_numbers.length}` : ""}`} active={index === active} onPress={() => selectStudent(index)} icon={s.selected_problem_numbers.length ? "checkmark-circle" : undefined} />)}
            </ScrollView>
            <View style={[styles.softCard, { padding: 14 }]}>
              <View style={styles.between}>
                <View style={{ flex: 1 }}><Text style={[styles.h3, { color: colors.onBrandTertiary }]}>{current.name}</Text><Text style={[styles.caption, { color: colors.onBrandTertiary }]}>{current.selected_problem_numbers.length} masalah · {current.heavy_problem_numbers.length} berat · siswa {active + 1}/{students.length}</Text></View>
                <View style={[styles.row, { gap: 6 }]}>
                  <IconButton testID="bulk-prev-student" icon="chevron-back" onPress={() => selectStudent(Math.max(active - 1, 0))} background={colors.surfaceSecondary} />
                  <IconButton testID="bulk-next-student" icon="chevron-forward" onPress={() => selectStudent(Math.min(active + 1, students.length - 1))} background={colors.surfaceSecondary} />
                </View>
              </View>
            </View>
            <View style={styles.segmented}>
              {(["grid", "ketik"] as const).map((m) => <Pressable key={m} testID={`bulk-mode-${m}`} onPress={() => setInputMode(m)} style={[styles.segmentedItem, inputMode === m && styles.segmentedActive]}><Text style={[styles.caption, { fontWeight: "800", color: inputMode === m ? colors.brandPrimary : colors.muted }]}>{m === "grid" ? "Tap grid nomor" : "Ketik nomor"}</Text></Pressable>)}
            </View>
            {inputMode === "grid" ? (
              <>
                <View style={[styles.between, { gap: 10 }]}>
                  <Pressable testID="bulk-heavy-mode" onPress={() => setHeavyMode(!heavyMode)} style={[styles.chip, { backgroundColor: heavyMode ? colors.warning : colors.surfaceTertiary }]}><Icon name="flame-outline" size={15} color={heavyMode ? colors.onWarning : colors.onSurfaceTertiary} /><Text style={[styles.chipText, heavyMode && { color: colors.onWarning }]}>{heavyMode ? "Mode: tandai BERAT" : "Mode: pilih masalah"}</Text></Pressable>
                  <View style={{ flex: 1 }}><Field testID="bulk-search" label="" value={search} onChangeText={setSearch} keyboardType="number-pad" placeholder="Cari nomor" /></View>
                </View>
                <Legend />
                <NumberGrid total={total} selected={current.selected_problem_numbers} heavy={current.heavy_problem_numbers} onPress={tapNumber} filter={search} testPrefix="bulk-num" />
              </>
            ) : (
              <>
                <Field testID="bulk-typed" label={`NOMOR MASALAH (1–${total})`} value={typed} onChangeText={setTyped} placeholder="Contoh: 1, 5, 12 27" multiline />
                <Field testID="bulk-typed-heavy" label="NOMOR MASALAH BERAT (subset di atas)" value={typedHeavy} onChangeText={setTypedHeavy} placeholder="Contoh: 5" />
                <View style={{ marginTop: 12 }}><SecondaryButton testID="bulk-apply-typed" title="Terapkan ke siswa ini" icon="checkmark-done-outline" onPress={applyTyped} /></View>
                <View style={{ marginTop: 12 }}><Legend /><NumberGrid total={total} selected={current.selected_problem_numbers} heavy={current.heavy_problem_numbers} readOnly testPrefix="bulk-preview" /></View>
              </>
            )}
            <Pressable onPress={() => setShowExtra(!showExtra)} style={[styles.row, { gap: 6, marginTop: 18 }]} testID="bulk-toggle-extra"><Icon name={showExtra ? "chevron-up" : "chevron-down"} size={15} color={colors.muted} /><Text style={styles.caption}>Langkah 3 siswa ini: konseling & catatan</Text></Pressable>
            {showExtra && (
              <View style={[styles.card, { marginTop: 10 }]}>
                <Text style={styles.label}>INGIN MEMBICARAKAN MASALAH?</Text>
                <YesNo value={current.third_step.want_discussion || "Tidak"} onChange={(v) => update(current.key, { third_step: { ...current.third_step, want_discussion: v } })} testPrefix="bulk-discuss" />
                {current.third_step.want_discussion === "Ya" && <ConsultPicker value={current.third_step.discussion_with || "Guru BK"} onChange={(v) => update(current.key, { third_step: { ...current.third_step, discussion_with: v } })} testPrefix="bulk-consult" />}
                <Text style={styles.label}>SUDAH MENGGAMBARKAN KESELURUHAN?</Text>
                <YesNo value={current.third_step.complete || "Ya"} onChange={(v) => update(current.key, { third_step: { ...current.third_step, complete: v } })} testPrefix="bulk-complete" />
                <Field testID="bulk-other" label="MASALAH LAIN" value={current.third_step.other_problems || ""} onChangeText={(v) => update(current.key, { third_step: { ...current.third_step, other_problems: v } })} placeholder="Bila ada" multiline />
              </View>
            )}
          </>
        )}
        {step === 2 && !current && <EmptyState icon="people-outline" title="Belum ada siswa" message="Kembali ke langkah 1 untuk menambah siswa." />}

        {step === 3 && (
          <>
            <Text style={styles.h2}>Tinjau & simpan</Text>
            <Text style={[styles.body, { marginTop: 6 }]}>{ready} dari {students.length} siswa memiliki nomor masalah dan akan dihitung. Siswa tanpa nomor dilewati.</Text>
            <View style={{ marginTop: 14 }}><Notice icon="shield-checkmark-outline" text={`Kelas ${cls?.name || "—"} · Format ${format?.code} · TA ${academicYear}. Semua baris divalidasi dulu; jika ada yang tidak valid, tidak ada data yang tersimpan.`} /></View>
            <View style={styles.card}>
              {students.map((s, index) => (
                <Pressable key={s.key} onPress={() => { setStep(2); selectStudent(index); }} style={styles.listRow} testID={`bulk-review-${index}`}>
                  <View style={[styles.avatar, !s.selected_problem_numbers.length && { backgroundColor: colors.surfaceTertiary }]}><Icon name={s.selected_problem_numbers.length ? "checkmark" : "remove"} size={18} color={s.selected_problem_numbers.length ? colors.onBrandTertiary : colors.muted} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.h3}>{s.name}</Text><Text style={styles.caption}>{s.selected_problem_numbers.length ? `${s.selected_problem_numbers.length} masalah · ${s.heavy_problem_numbers.length} berat${s.third_step.want_discussion === "Ya" ? " · minta konseling" : ""}` : "Belum ada nomor — dilewati"}</Text></View>
                  <Icon name="chevron-forward" size={17} color={colors.muted} />
                </Pressable>
              ))}
            </View>
            {saveError ? <View style={[styles.notice, { backgroundColor: colors.error }]}><Icon name="alert-circle-outline" color={colors.onError} size={18} /><Text style={[styles.noticeText, { color: colors.onError }]}>{saveError}</Text></View> : null}
          </>
        )}
      </ScrollView>
      <View style={[styles.stickyAction, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {step > 1 && <View style={{ flex: 1 }}><SecondaryButton testID="bulk-back" title="Kembali" icon="arrow-back" onPress={() => setStep((s) => s - 1)} /></View>}
          <View style={{ flex: 1 }}>{step < 3 ? <PrimaryButton testID="bulk-next" title="Lanjut" icon="arrow-forward" onPress={goNext} /> : <PrimaryButton testID="bulk-save" title={saving ? "Menyimpan..." : `Simpan ${ready} siswa`} icon="checkmark" onPress={save} disabled={saving || !ready} />}</View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

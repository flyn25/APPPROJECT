import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AumClass, AumFormat, IndividualResult, Respondent, School, saveRespondent } from "@/src/api";
import { useTheme } from "@/src/theme";
import { Chip, Field, Icon, IconButton, Legend, Notice, NumberGrid, PrimaryButton, SecondaryButton, parseNumbers, useStyles } from "@/src/ui";

const CONSULT_OPTIONS = ["Guru BK", "Teman", "Guru lain", "Orangtua", "Ahli lain", "Lain-lain"];

export function StepHeader({ step, total, count, onClose, title }: { step: number; total: number; count: number; onClose: () => void; title?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.between, { paddingHorizontal: 20, paddingBottom: 14, gap: 14 }]}>
      <IconButton testID="wizard-close" icon="close" onPress={onClose} />
      <View style={{ flex: 1 }}>
        <View style={styles.row}>{Array.from({ length: total }, (_, i) => i + 1).map((item) => <View key={item} style={{ flex: 1, height: 5, borderRadius: 3, marginHorizontal: 3, backgroundColor: item <= step ? colors.brandPrimary : colors.surfaceTertiary }} />)}</View>
        <Text style={[styles.caption, { textAlign: "center", marginTop: 8 }]}>{title || `Langkah ${step} dari ${total}`}</Text>
      </View>
      <View style={[styles.circleButton, { backgroundColor: colors.brandTertiary }]}><Text style={[styles.h3, { color: colors.onBrandTertiary }]}>{count}</Text></View>
    </View>
  );
}

export function YesNo({ value, onChange, testPrefix }: { value: string; onChange: (v: string) => void; testPrefix: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {["Ya", "Tidak"].map((item) => (
        <Pressable key={item} testID={`${testPrefix}-${item}`} onPress={() => onChange(item)} style={[styles.secondaryButton, { flex: 1, borderColor: value === item ? colors.brandPrimary : colors.border, backgroundColor: value === item ? colors.brandTertiary : colors.surfaceSecondary }]}>
          <Icon name={value === item ? "radio-button-on" : "radio-button-off"} color={value === item ? colors.brandPrimary : colors.borderStrong} size={20} />
          <Text style={[styles.secondaryText, value === item && { color: colors.onBrandTertiary }]}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ConsultPicker({ value, onChange, testPrefix }: { value: string; onChange: (v: string) => void; testPrefix: string }) {
  const styles = useStyles();
  return (
    <>
      <Text style={styles.label}>KEPADA SIAPA?</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {CONSULT_OPTIONS.map((option) => <Chip key={option} label={option} active={value === option} onPress={() => onChange(option)} testID={`${testPrefix}-${option.replace(/\s/g, "")}`} />)}
      </View>
    </>
  );
}

type Props = { formats: AumFormat[]; classes: AumClass[]; selectedClass: AumClass | null; activeSchool: School | null; onClose: () => void; onSaved: (payload: { result: IndividualResult; respondent: Respondent }) => void };

export function WizardView({ formats, classes, selectedClass, activeSchool, onClose, onSaved }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [classId, setClassId] = useState(selectedClass?.id || classes[0]?.id || "");
  const [formatId, setFormatId] = useState(selectedClass?.format_id || classes[0]?.format_id || formats[0]?.id || "format_1");
  const [selected, setSelected] = useState<number[]>([]);
  const [heavy, setHeavy] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [respondentId, setRespondentId] = useState("");
  const [gender, setGender] = useState("");
  const [academicYear, setAcademicYear] = useState(activeSchool?.academic_year || "2025/2026");
  const [search, setSearch] = useState("");
  const [typed, setTyped] = useState("");
  const [inputMode, setInputMode] = useState<"grid" | "ketik">("grid");
  const [complete, setComplete] = useState("Ya");
  const [otherProblems, setOtherProblems] = useState("");
  const [wantDiscussion, setWantDiscussion] = useState("Ya");
  const [discussionWith, setDiscussionWith] = useState("Guru BK");
  const [saving, setSaving] = useState(false);
  const format = formats.find((item) => item.id === formatId) || formats[0];
  const total = format?.total_items || 0;

  const toggleNumber = (n: number) => setSelected((current) => (current.includes(n) ? current.filter((i) => i !== n) : [...current, n].sort((a, b) => a - b)));
  const toggleHeavy = (n: number) => setHeavy((current) => (current.includes(n) ? current.filter((i) => i !== n) : [...current, n].sort((a, b) => a - b)));
  const applyTyped = () => { const numbers = parseNumbers(typed).filter((n) => n <= total); setSelected(numbers); setHeavy((current) => current.filter((n) => numbers.includes(n))); };
  const outOfRange = useMemo(() => parseNumbers(typed).filter((n) => n > total), [typed, total]);

  const next = () => {
    if (step === 1 && !name.trim()) return Alert.alert("Data belum lengkap", "Isi nama responden terlebih dahulu.");
    if (step === 1 && !selected.length) return Alert.alert("Belum ada masalah", "Pilih minimal satu nomor masalah.");
    if (step === 2) setHeavy((current) => current.filter((item) => selected.includes(item)));
    setStep((current) => Math.min(current + 1, 3));
  };
  const save = async () => {
    setSaving(true);
    try {
      const cls = classes.find((item) => item.id === classId);
      const response = await saveRespondent({ name: name.trim(), respondent_id: respondentId.trim(), gender, institution: activeSchool?.name || "", class_name: cls?.name || "", class_id: classId, academic_year: academicYear.trim() || activeSchool?.academic_year || "2025/2026", filled_date: new Date().toISOString().slice(0, 10), format_id: formatId, selected_problem_numbers: selected, heavy_problem_numbers: heavy, third_step: { complete, other_problems: otherProblems, want_discussion: wantDiscussion, discussion_with: wantDiscussion === "Ya" ? discussionWith : "" } });
      onSaved({ result: response.result, respondent: response.respondent });
    } catch (error) { Alert.alert("Belum tersimpan", error instanceof Error ? error.message : "Periksa koneksi dan coba lagi."); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <StepHeader step={step} total={3} count={selected.length} onClose={onClose} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 26 }]} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <>
            <Text style={styles.h2}>Langkah 1 · Pilih masalah</Text>
            <Text style={[styles.body, { marginTop: 6 }]}>Tandai nomor masalah yang menjadi keluhan dan mengganggu responden sekarang.</Text>
            <Field testID="wizard-name" label="NAMA RESPONDEN" value={name} onChangeText={setName} placeholder="Contoh: Nadia Putri" autoCapitalize="words" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Field testID="wizard-respondent-id" label="NIS / NIM / ID" value={respondentId} onChangeText={setRespondentId} placeholder="2026-001" /></View>
              <View style={{ flex: 1 }}><Field testID="wizard-year" label="TAHUN AJARAN" value={academicYear} onChangeText={setAcademicYear} placeholder="2025/2026" /></View>
            </View>
            <Text style={styles.label}>JENIS KELAMIN</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>{["L", "P"].map((g) => <Chip key={g} testID={`wizard-gender-${g}`} label={g === "L" ? "Laki-laki" : "Perempuan"} active={gender === g} onPress={() => setGender(g)} />)}</View>
            {classes.length > 0 && (
              <>
                <Text style={styles.label}>KELAS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{classes.map((c) => <Chip key={c.id} testID={`wizard-class-${c.id}`} label={c.name} active={classId === c.id} onPress={() => { setClassId(c.id); setFormatId(c.format_id); setSelected([]); setHeavy([]); }} />)}</ScrollView>
              </>
            )}
            <Text style={styles.label}>FORMAT AUM</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{formats.map((item) => <Chip key={item.id} testID={`wizard-format-${item.id}`} label={`${item.code} · ${item.target.replace("Siswa ", "").replace("Mahasiswa ", "").replace("Warga ", "")}`} active={formatId === item.id} onPress={() => { setFormatId(item.id); setSelected([]); setHeavy([]); }} />)}</ScrollView>

            <Text style={styles.label}>CARA INPUT NOMOR</Text>
            <View style={[styles.segmented, { marginBottom: 6 }]}>
              {(["grid", "ketik"] as const).map((m) => <Pressable key={m} testID={`wizard-mode-${m}`} onPress={() => setInputMode(m)} style={[styles.segmentedItem, inputMode === m && styles.segmentedActive]}><Text style={[styles.caption, { fontWeight: "800", color: inputMode === m ? colors.brandPrimary : colors.muted }]}>{m === "grid" ? "Tap grid nomor" : "Ketik nomor"}</Text></Pressable>)}
            </View>
            {inputMode === "ketik" ? (
              <>
                <Field testID="wizard-typed" label={`KETIK NOMOR (1–${total}, pisahkan koma/spasi)`} value={typed} onChangeText={setTyped} placeholder="Contoh: 1, 5, 12 27 40" multiline />
                {outOfRange.length > 0 && <Text style={[styles.caption, { color: colors.error, marginTop: 6 }]}>Di luar rentang format: {outOfRange.join(", ")} (akan diabaikan)</Text>}
                <View style={{ marginTop: 10 }}><SecondaryButton testID="wizard-apply-typed" title={`Terapkan (${parseNumbers(typed).filter((n) => n <= total).length} nomor)`} icon="checkmark-done-outline" onPress={applyTyped} /></View>
                <Text style={[styles.caption, { marginTop: 10 }]}>Terpilih: {selected.length ? selected.join(", ") : "—"}</Text>
              </>
            ) : (
              <>
                <Field testID="wizard-search" label="CARI NOMOR" value={search} onChangeText={setSearch} keyboardType="number-pad" placeholder={`1–${total}`} />
                <View style={{ marginTop: 12 }}><Notice text="Sistem otomatis mengetahui bidang setiap nomor dari konfigurasi format. Tap nomor untuk memilih / membatalkan." /></View>
                <NumberGrid total={total} selected={selected} heavy={[]} onPress={toggleNumber} filter={search} testPrefix="wizard-num" />
              </>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <Text style={styles.h2}>Langkah 2 · Masalah berat</Text>
            <Text style={[styles.body, { marginTop: 6 }]}>Dari masalah yang telah dipilih, mana yang dirasakan amat berat atau amat mengganggu?</Text>
            <View style={[styles.softCard, { marginTop: 18 }]}><Text style={[styles.h3, { color: colors.onBrandTertiary }]}>{selected.length} masalah terpilih · {heavy.length} berat</Text><Text style={[styles.caption, { color: colors.onBrandTertiary, marginTop: 5 }]}>Ketuk nomor untuk menandainya sebagai masalah berat (oranye).</Text></View>
            <View style={styles.numberGrid}>
              {selected.map((n) => <Pressable key={n} testID={`wizard-heavy-${n}`} onPress={() => toggleHeavy(n)} style={[styles.number, heavy.includes(n) && styles.numberHeavy]}><Text style={[styles.numberText, heavy.includes(n) && { color: colors.onWarning }]}>{String(n).padStart(3, "0")}</Text></Pressable>)}
            </View>
          </>
        )}
        {step === 3 && (
          <>
            <Text style={styles.h2}>Langkah 3 · Informasi tambahan</Text>
            <Text style={[styles.body, { marginTop: 6 }]}>Lengkapi catatan agar laporan individual (Tabel 7) tetap utuh.</Text>
            <View style={[styles.card, { marginTop: 18, padding: 14 }]}><Text style={styles.caption}>Ringkasan</Text><Legend /><NumberGrid total={total} selected={selected} heavy={heavy} readOnly testPrefix="wizard-summary" /></View>
            <Text style={styles.label}>APAKAH DAFTAR MASALAH SUDAH MENGGAMBARKAN KESELURUHAN?</Text>
            <YesNo value={complete} onChange={setComplete} testPrefix="wizard-complete" />
            <Field testID="wizard-other" label="MASALAH LAIN YANG BELUM TERCANTUM" value={otherProblems} onChangeText={setOtherProblems} placeholder="Tuliskan bila ada..." multiline />
            <Text style={styles.label}>INGIN MEMBICARAKAN MASALAH?</Text>
            <YesNo value={wantDiscussion} onChange={setWantDiscussion} testPrefix="wizard-discuss" />
            {wantDiscussion === "Ya" && <ConsultPicker value={discussionWith} onChange={setDiscussionWith} testPrefix="wizard-consult" />}
          </>
        )}
      </ScrollView>
      <View style={[styles.stickyAction, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {step > 1 && <View style={{ flex: 1 }}><SecondaryButton testID="wizard-back" title="Kembali" icon="arrow-back" onPress={() => setStep((current) => current - 1)} /></View>}
          <View style={{ flex: 1 }}>{step < 3 ? <PrimaryButton testID="wizard-next" title="Lanjut" icon="arrow-forward" onPress={next} /> : <PrimaryButton testID="wizard-save" title={saving ? "Menyimpan..." : "Simpan & hitung"} icon="checkmark" onPress={save} disabled={saving} />}</View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

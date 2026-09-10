import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { AumFormat, School } from "@/src/api";
import { Chip, Field, PrimaryButton, SecondaryButton, Sheet, useStyles } from "@/src/ui";

const LEVELS = ["SD", "SLTP", "SLTA", "PT", "Masyarakat"];
const LEVEL_FORMAT: Record<string, string> = { SD: "format_1", SLTP: "format_2", SLTA: "format_3", PT: "format_4", Masyarakat: "format_5" };

export function SchoolSheet({ visible, school, onClose, onSave }: { visible: boolean; school: School | null; onClose: () => void; onSave: (name: string, academicYear: string, level: string) => void }) {
  const styles = useStyles();
  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState("2025/2026");
  const [level, setLevel] = useState("SLTP");
  useEffect(() => { if (visible) { setName(school?.name || ""); setAcademicYear(school?.academic_year || "2025/2026"); setLevel(school?.levels?.[0] || "SLTP"); } }, [visible, school]);
  return (
    <Sheet visible={visible} onClose={onClose} testID="school-sheet">
      <Text style={styles.h2}>{school ? "Ubah sekolah" : "Tambah sekolah"}</Text>
      <Text style={[styles.caption, { marginTop: 4 }]}>{school ? "Ganti tahun ajaran saat memasuki tahun baru; data lama tetap tersimpan per tahun." : "Sekolah baru akan tersimpan pada akun Anda."}</Text>
      <Field testID="school-name-input" label="NAMA SEKOLAH" value={name} onChangeText={setName} placeholder="Contoh: SMA Nusantara" autoCapitalize="words" />
      <Field testID="school-year-input" label="TAHUN AJARAN AKTIF" value={academicYear} onChangeText={setAcademicYear} placeholder="2025/2026" />
      {!school && (
        <>
          <Text style={styles.label}>JENJANG</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {LEVELS.map((l) => <Chip key={l} testID={`school-level-${l}`} label={l} active={level === l} onPress={() => setLevel(l)} />)}
          </ScrollView>
        </>
      )}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
        <View style={{ flex: 1 }}><SecondaryButton testID="school-cancel" title="Batal" onPress={onClose} /></View>
        <View style={{ flex: 1 }}><PrimaryButton testID="school-save" title="Simpan" icon="checkmark" onPress={() => onSave(name.trim(), academicYear.trim(), level)} disabled={!name.trim()} /></View>
      </View>
    </Sheet>
  );
}

export function ClassSheet({ visible, formats, defaultLevel, onClose, onCreate }: { visible: boolean; formats: AumFormat[]; defaultLevel?: string; onClose: () => void; onCreate: (name: string, level: string, formatId: string) => void }) {
  const styles = useStyles();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("SLTP");
  const [formatId, setFormatId] = useState("format_2");
  useEffect(() => { if (visible) { const l = defaultLevel && LEVELS.includes(defaultLevel) ? defaultLevel : "SLTP"; setName(""); setLevel(l); setFormatId(LEVEL_FORMAT[l]); } }, [visible, defaultLevel]);
  return (
    <Sheet visible={visible} onClose={onClose} testID="class-sheet">
      <Text style={styles.h2}>Tambah kelas</Text>
      <Text style={[styles.caption, { marginTop: 4 }]}>Kelas terhubung ke sekolah aktif. Format AUM mengikuti jenjang.</Text>
      <Field testID="class-name-input" label="NAMA KELAS" value={name} onChangeText={setName} placeholder="Contoh: XII IPA 1" autoCapitalize="words" />
      <Text style={styles.label}>JENJANG</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {LEVELS.map((l) => <Chip key={l} testID={`class-level-${l}`} label={l} active={level === l} onPress={() => { setLevel(l); setFormatId(LEVEL_FORMAT[l]); }} />)}
      </ScrollView>
      <Text style={styles.label}>FORMAT AUM</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {formats.map((f) => <Chip key={f.id} testID={`class-format-${f.id}`} label={`${f.code} · ${f.total_items} item`} active={formatId === f.id} onPress={() => setFormatId(f.id)} />)}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
        <View style={{ flex: 1 }}><SecondaryButton testID="class-cancel" title="Batal" onPress={onClose} /></View>
        <View style={{ flex: 1 }}><PrimaryButton testID="class-save" title="Simpan" icon="checkmark" onPress={() => onCreate(name.trim(), level, formatId)} disabled={!name.trim()} /></View>
      </View>
    </Sheet>
  );
}

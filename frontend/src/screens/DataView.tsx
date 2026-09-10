import { Pressable, ScrollView, Text, View } from "react-native";

import { AumClass, Respondent, School } from "@/src/api";
import { useTheme } from "@/src/theme";
import { Chip, EmptyState, Icon, IconButton, ScreenHeader, SecondaryButton, formatLabel, useStyles } from "@/src/ui";

type Props = {
  schools: School[];
  activeSchool: School | null;
  onSelectSchool: (school: School) => void;
  classes: AumClass[];
  respondents: Respondent[];
  selectedClass: AumClass | null;
  onSelectClass: (item: AumClass) => void;
  onOpenAnalysis: (item: AumClass) => void;
  onNew: () => void;
  onBulk: () => void;
  onImport: () => void;
  onTemplate: () => void;
  onExportGroup: (format: "xlsx" | "pdf") => void;
  onAddSchool: () => void;
  onEditSchool: () => void;
  onDeleteSchool: () => void;
  onAddClass: () => void;
  onDeleteClass: (item: AumClass) => void;
  onOpenRespondent: (r: Respondent) => void;
  onDeleteRespondent: (r: Respondent) => void;
};

export function DataView({ schools, activeSchool, onSelectSchool, classes, respondents, selectedClass, onSelectClass, onOpenAnalysis, onNew, onBulk, onImport, onTemplate, onExportGroup, onAddSchool, onEditSchool, onDeleteSchool, onAddClass, onDeleteClass, onOpenRespondent, onDeleteRespondent }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const visible = selectedClass ? respondents.filter((r) => r.class_id === selectedClass.id) : respondents;
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Database" subtitle="Sekolah · tahun ajaran · kelas · responden" right={<IconButton testID="add-school-button" icon="add" tint={colors.brandPrimary} onPress={onAddSchool} />} />

      <Text style={styles.label}>SEKOLAH</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {schools.map((s) => <Chip key={s.id} testID={`school-chip-${s.id}`} label={`${s.name} · ${s.academic_year}`} active={activeSchool?.id === s.id} onPress={() => onSelectSchool(s)} icon="school-outline" />)}
        {!schools.length && <Text style={styles.caption}>Belum ada sekolah. Tap + untuk menambah.</Text>}
      </ScrollView>
      {activeSchool && (
        <View style={[styles.row, { gap: 8, marginTop: 10 }]}>
          <Pressable testID="edit-school-button" onPress={onEditSchool} style={[styles.chip, { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }]}><Icon name="pencil-outline" size={14} color={colors.onSurfaceTertiary} /><Text style={styles.chipText}>Ubah nama / tahun</Text></Pressable>
          <Pressable testID="delete-school-button" onPress={onDeleteSchool} style={[styles.chip, { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }]}><Icon name="trash-outline" size={14} color={colors.error} /><Text style={[styles.chipText, { color: colors.error }]}>Hapus sekolah</Text></Pressable>
        </View>
      )}

      <View style={[styles.between, { marginTop: 22 }]}>
        <Text style={styles.h2}>Kelas</Text>
        <View style={[styles.row, { gap: 8 }]}>
          <IconButton testID="add-class-button" icon="layers-outline" tint={colors.brandPrimary} onPress={onAddClass} />
        </View>
      </View>
      <Text style={[styles.caption, { marginTop: 4, marginBottom: 12 }]}>Tap kelas untuk memfilter responden. Ikon grafik membuka analitik kelas.</Text>
      {classes.map((item) => {
        const active = selectedClass?.id === item.id;
        const count = respondents.filter((r) => r.class_id === item.id).length;
        return (
          <Pressable key={item.id} testID={`class-${item.id}`} onPress={() => onSelectClass(item)} style={[styles.card, { marginBottom: 10, padding: 14, borderColor: active ? colors.brandPrimary : colors.border }]}>
            <View style={[styles.row, { gap: 12 }]}>
              <View style={[styles.iconBubble, active && { backgroundColor: colors.brandPrimary }]}><Icon name="people-outline" color={active ? colors.onBrandPrimary : colors.onBrandTertiary} size={18} /></View>
              <View style={{ flex: 1 }}><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.level} · {formatLabel(item.format_id)} · {count} responden</Text></View>
              <IconButton testID={`class-analysis-${item.id}`} icon="bar-chart-outline" tint={colors.brandPrimary} onPress={() => onOpenAnalysis(item)} />
              <IconButton testID={`class-delete-${item.id}`} icon="trash-outline" tint={colors.error} onPress={() => onDeleteClass(item)} />
            </View>
          </Pressable>
        );
      })}
      {!classes.length && <EmptyState icon="layers-outline" title="Belum ada kelas" message={activeSchool ? "Tambahkan kelas untuk mulai mengelompokkan responden." : "Tambahkan sekolah terlebih dahulu."} />}

      <View style={[styles.between, { marginTop: 10 }]}>
        <Text style={styles.h2}>Responden{selectedClass ? ` · ${selectedClass.name}` : ""}</Text>
        <Text style={styles.caption}>{visible.length} orang</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 12, marginBottom: 12 }}>
        <View style={{ flex: 1 }}><SecondaryButton testID="add-respondent-button" title="Tambah 1 siswa" icon="person-add-outline" onPress={onNew} /></View>
        <View style={{ flex: 1 }}><SecondaryButton testID="bulk-respondent-button" title="Lembar kelas" icon="albums-outline" onPress={onBulk} /></View>
      </View>
      <View style={styles.card}>
        {visible.slice(0, 40).map((item) => (
          <View key={item.id} style={styles.listRow}>
            <Pressable testID={`respondent-${item.id}`} onPress={() => onOpenRespondent(item)} style={[styles.row, { flex: 1, gap: 12 }]}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 1).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.respondent_id || "—"} · {item.selected_problem_numbers.length} masalah · {item.heavy_problem_numbers.length} berat{item.third_step?.want_discussion === "Ya" ? " · minta konseling" : ""}</Text></View>
            </Pressable>
            <IconButton testID={`respondent-delete-${item.id}`} icon="trash-outline" tint={colors.error} onPress={() => onDeleteRespondent(item)} />
          </View>
        ))}
        {!visible.length && <Text style={styles.body}>Belum ada responden pada {selectedClass ? "kelas ini" : "sekolah ini"}.</Text>}
      </View>

      <Text style={styles.label}>IMPORT & EXPORT</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}><SecondaryButton testID="import-excel-button" title="Import Excel" icon="cloud-upload-outline" onPress={onImport} /></View>
        <View style={{ flex: 1 }}><SecondaryButton testID="template-download-button" title="Template" icon="download-outline" onPress={onTemplate} /></View>
      </View>
      {selectedClass && visible.length > 0 && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}><SecondaryButton testID="export-group-xlsx" title="XLSX kelompok" icon="document-attach-outline" onPress={() => onExportGroup("xlsx")} /></View>
          <View style={{ flex: 1 }}><SecondaryButton testID="export-group-pdf" title="PDF Tabel 8" icon="document-text-outline" onPress={() => onExportGroup("pdf")} /></View>
        </View>
      )}
    </ScrollView>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AumClass,
  AumFormat,
  Dashboard,
  GroupResult,
  IndividualResult,
  Respondent,
  School,
  demoLogin,
  getAudit,
  getClasses,
  getDashboard,
  getFormats,
  getGroupScore,
  getRespondents,
  getSchools,
  saveRespondent,
} from "@/src/api";
import { makeStyles, useTheme } from "@/src/theme";

const useStyles = makeStyles((colors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 116 },
  authPage: { flex: 1, backgroundColor: colors.surface, justifyContent: "center", padding: 24 },
  brandMark: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  h1: { color: colors.onSurface, fontSize: 30, fontWeight: "800", letterSpacing: -0.6 },
  h2: { color: colors.onSurface, fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  h3: { color: colors.onSurfaceSecondary, fontSize: 16, fontWeight: "800" },
  body: { color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 21 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  header: { paddingTop: 14, paddingBottom: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { color: colors.brandPrimary, fontSize: 12, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14 },
  glassCard: { backgroundColor: colors.brandTertiary, borderRadius: 20, padding: 18, marginBottom: 18 },
  primaryButton: { minHeight: 50, paddingHorizontal: 18, borderRadius: 16, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondaryButton: { minHeight: 48, paddingHorizontal: 16, borderRadius: 15, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  buttonText: { color: colors.onBrandPrimary, fontSize: 14, fontWeight: "800" },
  secondaryText: { color: colors.onSurfaceSecondary, fontSize: 14, fontWeight: "800" },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceTertiary, paddingHorizontal: 14, color: colors.onSurface, fontSize: 14, marginTop: 8 },
  label: { color: colors.onSurfaceSecondary, fontSize: 12, fontWeight: "800", marginTop: 14 },
  schoolBanner: { backgroundColor: colors.brandPrimary, borderRadius: 22, padding: 18, marginBottom: 20 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center", marginRight: 8 },
  chipActive: { backgroundColor: colors.brandPrimary },
  chipText: { color: colors.onSurfaceTertiary, fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: colors.onBrandPrimary },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  metric: { flexGrow: 1, flexBasis: "46%", minHeight: 108, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  metricValue: { color: colors.onSurface, fontSize: 25, fontWeight: "800", marginTop: 12 },
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center" },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBubble: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  recentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: colors.brandPrimary, fontSize: 14, fontWeight: "800" },
  tabBar: { position: "absolute", left: 14, right: 14, bottom: 12, minHeight: 68, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: 6 },
  tabItem: { minWidth: 60, minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  tabActive: { backgroundColor: colors.brandTertiary },
  tabLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", marginTop: 3 },
  tabLabelActive: { color: colors.brandPrimary },
  classRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: colors.surfaceTertiary, overflow: "hidden", marginTop: 8 },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: colors.brandPrimary },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.surfaceTertiary, overflow: "hidden", marginHorizontal: 12 },
  barFill: { height: 10, borderRadius: 5, backgroundColor: colors.brandSecondary },
  wizard: { flex: 1, backgroundColor: colors.surface },
  wizardHeader: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  circleButton: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary },
  stepDot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.surfaceTertiary, marginHorizontal: 3 },
  stepDotActive: { backgroundColor: colors.brandPrimary },
  numberGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 14 },
  number: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  numberSelected: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  numberHeavy: { backgroundColor: colors.warning, borderColor: colors.warning },
  numberText: { color: colors.onSurfaceSecondary, fontSize: 12, fontWeight: "800" },
  numberTextSelected: { color: colors.onBrandPrimary },
  stickyAction: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center", marginRight: 10 },
  radioOn: { borderColor: colors.brandPrimary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brandPrimary },
  notice: { borderRadius: 14, padding: 12, backgroundColor: colors.brandTertiary, flexDirection: "row", gap: 8, marginBottom: 12 },
  resultHero: { backgroundColor: colors.surfaceInverse, borderRadius: 22, padding: 20, marginBottom: 18 },
  resultNumber: { color: colors.onSurfaceInverse, fontSize: 38, fontWeight: "800" },
}));

function Icon({ name, size = 20, color }: { name: keyof typeof Ionicons.glyphMap; size?: number; color: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function PrimaryButton({ title, icon, onPress, disabled = false }: { title: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, { opacity: disabled ? 0.5 : pressed ? 0.78 : 1 }]}>{icon && <Icon name={icon} color={colors.onBrandPrimary} size={18} />}<Text style={styles.buttonText}>{title}</Text></Pressable>;
}

function SecondaryButton({ title, icon, onPress }: { title: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.75 : 1 }]}>{icon && <Icon name={icon} color={colors.onSurfaceSecondary} size={18} />}<Text style={styles.secondaryText}>{title}</Text></Pressable>;
}

function MetricCard({ label, value, icon, accent = false }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; accent?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={[styles.metric, accent && { backgroundColor: colors.brandTertiary, borderColor: colors.brandTertiary }]}><Icon name={icon} size={19} color={accent ? colors.brandPrimary : colors.muted} /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Header({ title, subtitle, onRefresh }: { title: string; subtitle: string; onRefresh?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.header}><View><Text style={styles.eyebrow}>AUM Umum BK</Text><Text style={[styles.h1, { marginTop: 4 }]}>{title}</Text><Text style={[styles.caption, { marginTop: 3 }]}>{subtitle}</Text></View>{onRefresh && <Pressable onPress={onRefresh} style={styles.circleButton}><Icon name="refresh-outline" color={colors.brandPrimary} /></Pressable>}</View>;
}

function AuthScreen({ onDemo, loading, error }: { onDemo: () => void; loading: boolean; error: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.authPage}><View style={styles.brandMark}><Icon name="leaf-outline" size={32} color={colors.onBrandPrimary} /></View><Text style={styles.eyebrow}>RUANG KERJA GURU BK</Text><Text style={[styles.h1, { marginTop: 8 }]}>AUM Umum{`\n`}BK Mobile</Text><Text style={[styles.body, { marginTop: 16, maxWidth: 330 }]}>Kelola input, pengolahan, dan profil masalah AUM secara rapi, deterministik, dan rahasia.</Text><View style={[styles.notice, { marginTop: 28 }]}><Icon name="lock-closed-outline" color={colors.onBrandTertiary} size={18} /><Text style={[styles.caption, { flex: 1, color: colors.onBrandTertiary }]}>Data AUM adalah data rahasia. Aplikasi tidak membuat diagnosis psikologis.</Text></View>{error ? <Text style={{ color: colors.error, marginBottom: 12 }}>{error}</Text> : null}<PrimaryButton title={loading ? "Menyiapkan ruang demo..." : "Masuk Demo Instan"} icon={loading ? undefined : "arrow-forward"} onPress={onDemo} disabled={loading} />{loading && <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 18 }} />}<Text style={[styles.caption, { textAlign: "center", marginTop: 24 }]}>Mode Demo menggunakan data contoh terpisah dari data nyata.</Text></View>;
}

function DashboardView({ dashboard, school, onNew, onData, onRefresh }: { dashboard: Dashboard | null; school: School | null; onNew: () => void; onData: () => void; onRefresh: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Header title="Ringkasan" subtitle="Pantau pekerjaan AUM hari ini" onRefresh={onRefresh} /><View style={styles.schoolBanner}><View style={styles.between}><View style={{ flex: 1 }}><Text style={[styles.caption, { color: colors.brandTertiary }]}>SEKOLAH AKTIF</Text><Text style={[styles.h2, { color: colors.onBrandPrimary, marginTop: 6 }]}>{school?.name || "Belum ada sekolah"}</Text><Text style={[styles.caption, { color: colors.brandTertiary, marginTop: 4 }]}>{school?.academic_year || "Pilih sekolah untuk memulai"}</Text></View><View style={[styles.iconBubble, { backgroundColor: colors.brandSecondary }]}><Icon name="school-outline" color={colors.onBrandSecondary} size={21} /></View></View><Pressable onPress={onData} style={{ marginTop: 18, flexDirection: "row", alignItems: "center" }}><Text style={[styles.caption, { color: colors.onBrandPrimary, fontWeight: "800" }]}>Kelola database sekolah</Text><Icon name="chevron-forward" color={colors.onBrandPrimary} size={16} /></Pressable></View><View style={styles.metricGrid}><MetricCard label="Responden" value={dashboard?.respondent_count ?? 0} icon="people-outline" accent /><MetricCard label="Kelas aktif" value={dashboard?.class_count ?? 0} icon="layers-outline" /><MetricCard label="Total masalah" value={dashboard?.total_problems ?? 0} icon="analytics-outline" /><MetricCard label="Masalah berat" value={dashboard?.total_heavy ?? 0} icon="alert-circle-outline" /></View><View style={[styles.card, { marginTop: 8 }]}><View style={styles.between}><View><Text style={styles.h3}>Mulai pengolahan</Text><Text style={[styles.caption, { marginTop: 4 }]}>Ikuti wizard tiga langkah AUM.</Text></View><View style={styles.iconBubble}><Icon name="create-outline" color={colors.brandPrimary} /></View></View><PrimaryButton title="Input responden baru" icon="add" onPress={onNew} /></View><View style={styles.card}><View style={styles.between}><Text style={styles.h3}>Aktivitas terbaru</Text><Text style={styles.caption}>{dashboard?.recent.length || 0} data</Text></View>{dashboard?.recent?.length ? dashboard.recent.map((item) => <View key={item.id} style={styles.recentRow}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 1)}</Text></View><View style={{ flex: 1 }}><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.class_name || "Kelas"} · {item.selected_problem_numbers?.length || 0} masalah terpilih</Text></View><Icon name="chevron-forward" size={17} color={colors.muted} /></View>) : <Text style={[styles.body, { marginTop: 14 }]}>Belum ada data responden.</Text>}</View></ScrollView>;
}

function DataView({ school, classes, respondents, selectedClass, onSelectClass, onNew }: { school: School | null; classes: AumClass[]; respondents: Respondent[]; selectedClass: AumClass | null; onSelectClass: (item: AumClass) => void; onNew: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Header title="Database" subtitle="Sekolah · tahun ajaran · kelas" /><View style={styles.card}><Text style={styles.caption}>SEKOLAH AKTIF</Text><Text style={[styles.h3, { marginTop: 6 }]}>{school?.name || "Belum dipilih"}</Text><Text style={styles.caption}>{school?.academic_year || "2025/2026"}</Text></View><View style={styles.between}><Text style={styles.h2}>Kelas & kelompok</Text><Pressable onPress={onNew} style={styles.circleButton}><Icon name="person-add-outline" color={colors.brandPrimary} /></Pressable></View><Text style={[styles.caption, { marginTop: 5, marginBottom: 12 }]}>Pilih kelas untuk melihat responden dan hasil agregat.</Text>{classes.map((item) => <Pressable key={item.id} onPress={() => onSelectClass(item)} style={[styles.card, { marginBottom: 10, borderColor: selectedClass?.id === item.id ? colors.brandPrimary : colors.border }]}><View style={styles.between}><View><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.level} · {item.format_id.replace("format_", "Format ")}</Text></View><Icon name={selectedClass?.id === item.id ? "checkmark-circle" : "chevron-forward"} color={selectedClass?.id === item.id ? colors.brandPrimary : colors.muted} size={22} /></View></Pressable>)}<View style={[styles.card, { marginTop: 8 }]}><View style={styles.between}><Text style={styles.h3}>Responden {selectedClass ? `· ${selectedClass.name}` : "terbaru"}</Text><Text style={styles.caption}>{respondents.length} orang</Text></View>{respondents.slice(0, 8).map((item) => <View key={item.id} style={styles.recentRow}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 1)}</Text></View><View style={{ flex: 1 }}><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.respondent_id} · {item.selected_problem_numbers.length} masalah</Text></View><Icon name="chevron-forward" size={17} color={colors.muted} /></View>)}</View><View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}><View style={{ flex: 1 }}><SecondaryButton title="Template Excel" icon="download-outline" onPress={() => Alert.alert("Template Excel", "Template siap digunakan pada alur import data.")} /></View><View style={{ flex: 1 }}><SecondaryButton title="Export PDF" icon="document-text-outline" onPress={() => Alert.alert("Export PDF", "Pilih hasil individual atau kelompok dari halaman hasil.")} /></View></View></ScrollView>;
}

function AnalysisView({ group, selectedClass, loading, onRefresh }: { group: GroupResult | null; selectedClass: AumClass | null; loading: boolean; onRefresh: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const max = Math.max(...(group?.rows || []).map((row) => row.total), 1);
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Header title="Analitik" subtitle={selectedClass ? `Profil masalah ${selectedClass.name}` : "Profil masalah kelompok"} onRefresh={onRefresh} />{loading ? <View style={styles.card}><ActivityIndicator color={colors.brandPrimary} /><Text style={[styles.body, { textAlign: "center", marginTop: 12 }]}>Menghitung hasil kelompok...</Text></View> : group ? <><View style={styles.metricGrid}><MetricCard label="Responden" value={group.respondent_count} icon="people-outline" accent /><MetricCard label="Masalah / siswa" value={group.average_problems} icon="pulse-outline" /><MetricCard label="Total masalah" value={group.total_problems} icon="bar-chart-outline" /><MetricCard label="Masalah berat" value={group.total_heavy_problems} icon="warning-outline" /></View><View style={styles.glassCard}><Text style={[styles.caption, { color: colors.onBrandTertiary }]}>RINGKASAN DESKRIPTIF</Text><Text style={[styles.h2, { color: colors.onBrandTertiary, marginTop: 7 }]}>Pola kebutuhan layanan</Text><Text style={[styles.body, { color: colors.onBrandTertiary, marginTop: 6 }]}>Gunakan data ini sebagai bahan pertimbangan tindak lanjut Guru BK, bukan sebagai diagnosis.</Text></View><View style={styles.card}><View style={styles.between}><Text style={styles.h3}>Ranking bidang</Text><Text style={styles.caption}>JML masalah</Text></View>{[...group.rows].sort((a, b) => b.total - a.total).map((row) => <View key={row.domain_code} style={{ marginTop: 17 }}><View style={styles.between}><Text style={styles.h3}>{row.domain_code}</Text><Text style={styles.caption}>{row.total} · {row.percentage}%</Text></View><View style={styles.row}><View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max((row.total / max) * 100, 3)}%` }]} /></View><Text style={[styles.caption, { width: 35, textAlign: "right" }]}>{row.average}</Text></View></View>)}</View><View style={styles.card}><Text style={styles.h3}>Tabel hasil kelompok</Text><Text style={[styles.caption, { marginTop: 4 }]}>Terendah · Tertinggi · JML · % · Rata-rata · JML Berat</Text>{group.rows.map((row) => <View key={row.domain_code} style={styles.classRow}><View style={styles.between}><Text style={styles.h3}>{row.domain_code}</Text><Text style={styles.caption}>{row.total} masalah</Text></View><Text style={styles.caption}>Min {row.lowest} · Max {row.highest} · {row.percentage}% · berat {row.heavy_total}</Text></View>)}</View><SecondaryButton title="Export hasil kelompok" icon="share-outline" onPress={() => Alert.alert("Export", "Hasil kelompok siap diekspor ke PDF atau Excel.")} /></> : <View style={styles.card}><Text style={styles.h3}>Belum ada data kelompok</Text><Text style={[styles.body, { marginTop: 8 }]}>Pilih kelas dengan responden untuk menghitung profil masalah.</Text></View>}</ScrollView>;
}

function AuditView({ audit }: { audit: { id: string; action: string; details: { formula: string }; created_at: string }[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Header title="Audit" subtitle="Jejak perhitungan dan keamanan data" /><View style={styles.notice}><Icon name="shield-checkmark-outline" color={colors.onBrandTertiary} size={20} /><Text style={[styles.caption, { flex: 1, color: colors.onBrandTertiary }]}>Setiap skor berasal dari data mentah dan rumus deterministik yang dapat ditelusuri.</Text></View><View style={styles.card}><Text style={styles.h3}>Log perhitungan</Text>{audit.length ? audit.map((item) => <View key={item.id} style={styles.classRow}><View style={styles.row}><View style={styles.iconBubble}><Icon name="calculator-outline" color={colors.brandPrimary} size={18} /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.h3}>{item.action === "score_individual" ? "Scoring individual" : item.action}</Text><Text style={styles.caption}>{new Date(item.created_at).toLocaleString("id-ID")}</Text></View></View><Text style={[styles.caption, { marginTop: 10, color: colors.onSurfaceTertiary }]}>{item.details.formula}</Text></View>) : <Text style={[styles.body, { marginTop: 12 }]}>Log audit masih kosong.</Text>}</View><View style={styles.card}><Text style={styles.h3}>Integritas sistem</Text>{["Konfigurasi lima format AUM", "Validasi nomor dan masalah berat", "Data mentah terpisah dari hasil", "Tidak ada kategori diagnosis baru"].map((label) => <View key={label} style={[styles.row, { marginTop: 15 }]}><Icon name="checkmark-circle" color={colors.success} size={19} /><Text style={[styles.body, { marginLeft: 9 }]}>{label}</Text></View>)}</View><SecondaryButton title="Backup data" icon="cloud-upload-outline" onPress={() => Alert.alert("Backup", "Backup data demo siap dibuat dari server.")} /></ScrollView>;
}

function IndividualResultView({ result, onClose }: { result: { result: IndividualResult; respondent: Respondent }; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.page}><View style={[styles.wizardHeader, { paddingTop: 16 }]}><Pressable onPress={onClose} style={styles.circleButton}><Icon name="arrow-back" color={colors.onSurfaceSecondary} /></Pressable><Text style={styles.h3}>Hasil AUM Individual</Text><Pressable onPress={() => Alert.alert("Export PDF", "Laporan individual siap diekspor.")} style={styles.circleButton}><Icon name="share-outline" color={colors.brandPrimary} /></Pressable></View><ScrollView contentContainerStyle={styles.content}><View style={styles.resultHero}><Text style={[styles.caption, { color: colors.brandTertiary }]}>RAHASIA · HASIL DESKRIPTIF</Text><Text style={[styles.h2, { color: colors.onSurfaceInverse, marginTop: 10 }]}>{result.respondent.name}</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75, marginTop: 5 }]}>{result.respondent.class_name || "Responden"} · {result.respondent.respondent_id}</Text><View style={[styles.row, { marginTop: 20, gap: 26 }]}><View><Text style={styles.resultNumber}>{result.result.total_problems}</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75 }]}>masalah terpilih</Text></View><View><Text style={styles.resultNumber}>{result.result.total_heavy_problems}</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75 }]}>masalah berat</Text></View><View><Text style={styles.resultNumber}>{result.result.overall_percentage}%</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75 }]}>persentase</Text></View></View></View><View style={styles.card}><Text style={styles.h3}>Per bidang masalah</Text>{result.result.rows.map((row) => <View key={row.domain_code} style={{ marginTop: 17 }}><View style={styles.between}><Text style={styles.h3}>{row.domain_code}</Text><Text style={styles.caption}>{row.count} · {row.percentage}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(row.percentage, row.count ? 3 : 0)}%` }]} /></View><Text style={[styles.caption, { marginTop: 5 }]}>Masalah berat: {row.heavy_problem_numbers.length ? row.heavy_problem_numbers.map((n) => String(n).padStart(3, "0")).join(", ") : "Tidak ada"}</Text></View>)}</View><View style={styles.notice}><Icon name="information-circle-outline" color={colors.onBrandTertiary} size={19} /><Text style={[styles.caption, { flex: 1, color: colors.onBrandTertiary }]}>Masalah yang terungkap dapat menjadi bahan pertimbangan Guru BK untuk tindak lanjut.</Text></View></ScrollView></View>;
}

function WizardView({ formats, classes, selectedClass, onClose, onSaved }: { formats: AumFormat[]; classes: AumClass[]; selectedClass: AumClass | null; onClose: () => void; onSaved: (payload: { result: IndividualResult; respondent: Respondent }) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [formatId, setFormatId] = useState(selectedClass?.format_id || formats[0]?.id || "format_1");
  const [selected, setSelected] = useState<number[]>([]);
  const [heavy, setHeavy] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [respondentId, setRespondentId] = useState("");
  const [classId] = useState(selectedClass?.id || classes[0]?.id || "");
  const [search, setSearch] = useState("");
  const [complete, setComplete] = useState("Ya");
  const [otherProblems, setOtherProblems] = useState("");
  const [wantDiscussion, setWantDiscussion] = useState("Ya");
  const [discussionWith, setDiscussionWith] = useState("Guru BK");
  const [saving, setSaving] = useState(false);
  const format = formats.find((item) => item.id === formatId) || formats[0];
  const numbers = useMemo(() => Array.from({ length: format?.total_items || 0 }, (_, i) => i + 1).filter((item) => !search || String(item).includes(search)), [format?.total_items, search]);
  const toggleNumber = (number: number) => setSelected((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number].sort((a, b) => a - b));
  const toggleHeavy = (number: number) => setHeavy((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number].sort((a, b) => a - b));
  const next = () => { if (step === 1 && !name.trim()) return Alert.alert("Data belum lengkap", "Isi nama responden terlebih dahulu."); if (step === 2) setHeavy((current) => current.filter((item) => selected.includes(item))); setStep((current) => Math.min(current + 1, 3)); };
  const save = async () => { setSaving(true); try { const selectedClassItem = classes.find((item) => item.id === classId); const response = await saveRespondent({ mode: "demo", name: name.trim(), respondent_id: respondentId.trim(), gender: "", institution: "SMP Harapan Bangsa", class_name: selectedClassItem?.name || "", class_id: classId, academic_year: "2025/2026", filled_date: new Date().toISOString().slice(0, 10), format_id: formatId, selected_problem_numbers: selected, heavy_problem_numbers: heavy, third_step: { complete, other_problems: otherProblems, want_discussion: wantDiscussion, discussion_with: discussionWith } }); onSaved({ result: response.result, respondent: response.respondent }); } catch (error) { Alert.alert("Belum tersimpan", error instanceof Error ? error.message : "Periksa koneksi dan coba lagi."); } finally { setSaving(false); } };
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.wizard, { paddingTop: insets.top }]}><View style={styles.wizardHeader}><Pressable onPress={onClose} style={styles.circleButton}><Icon name="close" color={colors.onSurfaceSecondary} /></Pressable><View style={{ flex: 1, marginHorizontal: 14 }}><View style={styles.row}>{[1, 2, 3].map((item) => <View key={item} style={[styles.stepDot, item <= step && styles.stepDotActive]} />)}</View><Text style={[styles.caption, { textAlign: "center", marginTop: 8 }]}>Langkah {step} dari 3</Text></View><View style={styles.circleButton}><Text style={[styles.h3, { color: colors.brandPrimary }]}>{selected.length}</Text></View></View><ScrollView contentContainerStyle={[styles.content, { paddingBottom: 26 }]} keyboardShouldPersistTaps="handled">{step === 1 && <><Text style={styles.h2}>Pilih masalah</Text><Text style={[styles.body, { marginTop: 6 }]}>Tandai nomor masalah yang menjadi keluhan dan mengganggu responden sekarang.</Text><Text style={styles.label}>NAMA RESPONDEN</Text><TextInput value={name} onChangeText={setName} placeholder="Contoh: Nadia Putri" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>NIS / NIM / ID</Text><TextInput value={respondentId} onChangeText={setRespondentId} placeholder="Contoh: 2026-001" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>FORMAT AUM</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 9 }}>{formats.map((item) => <Pressable key={item.id} onPress={() => { setFormatId(item.id); setSelected([]); setHeavy([]); }} style={[styles.chip, formatId === item.id && styles.chipActive]}><Text style={[styles.chipText, formatId === item.id && styles.chipTextActive]}>{item.code} · {item.target.replace("Siswa ", "")}</Text></Pressable>)}</ScrollView><Text style={styles.label}>CARI NOMOR MASALAH</Text><TextInput value={search} onChangeText={setSearch} keyboardType="number-pad" placeholder={`1–${format?.total_items}`} placeholderTextColor={colors.muted} style={styles.input} /><View style={styles.notice}><Icon name="information-circle-outline" color={colors.onBrandTertiary} size={18} /><Text style={[styles.caption, { flex: 1, color: colors.onBrandTertiary }]}>Sistem otomatis mengetahui bidang setiap nomor dari konfigurasi format.</Text></View><View style={styles.numberGrid}>{numbers.map((number) => <Pressable key={number} onPress={() => toggleNumber(number)} style={[styles.number, selected.includes(number) && styles.numberSelected]}><Text style={[styles.numberText, selected.includes(number) && styles.numberTextSelected]}>{String(number).padStart(3, "0")}</Text></Pressable>)}</View></>}{step === 2 && <><Text style={styles.h2}>Masalah berat</Text><Text style={[styles.body, { marginTop: 6 }]}>Dari masalah yang telah dipilih, mana yang dirasakan amat berat atau amat mengganggu?</Text><View style={[styles.glassCard, { marginTop: 20 }]}><Text style={[styles.h3, { color: colors.onBrandTertiary }]}>{selected.length} masalah terpilih</Text><Text style={[styles.caption, { color: colors.onBrandTertiary, marginTop: 5 }]}>Ketuk nomor untuk menandainya sebagai masalah berat.</Text></View><View style={styles.numberGrid}>{selected.map((number) => <Pressable key={number} onPress={() => toggleHeavy(number)} style={[styles.number, heavy.includes(number) && styles.numberHeavy]}><Text style={[styles.numberText, heavy.includes(number) && { color: colors.onWarning }]}>{String(number).padStart(3, "0")}</Text></Pressable>)}</View></>}{step === 3 && <><Text style={styles.h2}>Informasi tambahan</Text><Text style={[styles.body, { marginTop: 6 }]}>Lengkapi catatan agar laporan individual tetap utuh.</Text><Text style={styles.label}>APAKAH MASALAH SUDAH MENGGAMBARKAN KESELURUHAN?</Text><View style={{ flexDirection: "row", marginTop: 8, gap: 10 }}>{["Ya", "Tidak"].map((item) => <Pressable key={item} onPress={() => setComplete(item)} style={[styles.secondaryButton, { flex: 1, borderColor: complete === item ? colors.brandPrimary : colors.border }]}><View style={[styles.radio, complete === item && styles.radioOn]}>{complete === item && <View style={styles.radioDot} />}</View><Text style={styles.secondaryText}>{item}</Text></Pressable>)}</View><Text style={styles.label}>MASALAH LAIN YANG BELUM TERCANTUM</Text><TextInput value={otherProblems} onChangeText={setOtherProblems} placeholder="Tuliskan bila ada..." placeholderTextColor={colors.muted} multiline style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 13 }]} /><Text style={styles.label}>INGIN MEMBICARAKAN MASALAH?</Text><View style={{ flexDirection: "row", marginTop: 8, gap: 10 }}>{["Ya", "Tidak"].map((item) => <Pressable key={item} onPress={() => setWantDiscussion(item)} style={[styles.secondaryButton, { flex: 1, borderColor: wantDiscussion === item ? colors.brandPrimary : colors.border }]}><View style={[styles.radio, wantDiscussion === item && styles.radioOn]}>{wantDiscussion === item && <View style={styles.radioDot} />}</View><Text style={styles.secondaryText}>{item}</Text></Pressable>)}</View>{wantDiscussion === "Ya" && <><Text style={styles.label}>KEPADA SIAPA?</Text><TextInput value={discussionWith} onChangeText={setDiscussionWith} placeholder="Guru BK" placeholderTextColor={colors.muted} style={styles.input} /></>}</>}</ScrollView><View style={[styles.stickyAction, { paddingBottom: Math.max(insets.bottom, 12) }]}><View style={{ flexDirection: "row", gap: 10 }}>{step > 1 && <View style={{ flex: 1 }}><SecondaryButton title="Kembali" icon="arrow-back" onPress={() => setStep((current) => current - 1)} /></View>}<View style={{ flex: 1 }}>{step < 3 ? <PrimaryButton title="Lanjut" icon="arrow-forward" onPress={next} /> : <PrimaryButton title={saving ? "Menyimpan..." : "Simpan & hitung"} icon="checkmark" onPress={save} disabled={saving} />}</View></View></View></KeyboardAvoidingView>;
}

function BottomTabs({ active, onChange }: { active: string; onChange: (tab: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tabs: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [{ id: "ringkasan", label: "Ringkasan", icon: "grid-outline" }, { id: "data", label: "Data", icon: "folder-open-outline" }, { id: "analitik", label: "Analitik", icon: "bar-chart-outline" }, { id: "audit", label: "Audit", icon: "shield-checkmark-outline" }];
  return <View style={styles.tabBar}>{tabs.map((tab) => <Pressable key={tab.id} onPress={() => onChange(tab.id)} style={[styles.tabItem, active === tab.id && styles.tabActive]}><Icon name={tab.icon} size={20} color={active === tab.id ? colors.brandPrimary : colors.muted} /><Text style={[styles.tabLabel, active === tab.id && styles.tabLabelActive]}>{tab.label}</Text></Pressable>)}</View>;
}

export default function Index() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("ringkasan");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [formats, setFormats] = useState<AumFormat[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [classes, setClasses] = useState<AumClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<AumClass | null>(null);
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [audit, setAudit] = useState<{ id: string; action: string; details: { formula: string }; created_at: string }[]>([]);
  const [group, setGroup] = useState<GroupResult | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [resultPreview, setResultPreview] = useState<{ result: IndividualResult; respondent: Respondent } | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    setScreenLoading(true); setError("");
    try { const [formatData, dashboardData, schoolData, auditData] = await Promise.all([getFormats(), getDashboard(), getSchools(), getAudit()]); const firstSchool = schoolData[0] || null; const classData = firstSchool ? await getClasses(firstSchool.id) : []; const respondentData = await getRespondents(); setFormats(formatData); setDashboard(dashboardData); setSchool(firstSchool); setClasses(classData); setSelectedClass((current) => current || classData[0] || null); setRespondents(respondentData); setAudit(auditData); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Data belum dapat dimuat."); } finally { setScreenLoading(false); }
  };
  const loadGroup = useCallback(async () => { if (!selectedClass) return; setGroupLoading(true); try { setGroup(await getGroupScore(selectedClass.format_id, selectedClass.id)); } catch { setGroup(null); } finally { setGroupLoading(false); } }, [selectedClass]);
  const handleDemo = async () => { setLoading(true); setError(""); try { await demoLogin(); setSession(true); await loadData(); Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: Platform.OS !== "web" }).start(); } catch (loginError) { setError(loginError instanceof Error ? loginError.message : "Tidak dapat masuk ke mode demo."); } finally { setLoading(false); } };
  const refresh = async () => { await loadData(); if (activeTab === "analitik") await loadGroup(); };
  useEffect(() => { if (session && activeTab === "analitik" && selectedClass) loadGroup(); }, [session, activeTab, selectedClass, loadGroup]);
  if (!session) return <AuthScreen onDemo={handleDemo} loading={loading || screenLoading} error={error} />;
  if (showWizard) return <WizardView formats={formats} classes={classes} selectedClass={selectedClass} onClose={() => setShowWizard(false)} onSaved={(value) => { setShowWizard(false); setResultPreview(value); loadData(); }} />;
  if (resultPreview) return <IndividualResultView result={resultPreview} onClose={() => setResultPreview(null)} />;
  const body = activeTab === "ringkasan" ? <DashboardView dashboard={dashboard} school={school} onNew={() => setShowWizard(true)} onData={() => setActiveTab("data")} onRefresh={refresh} /> : activeTab === "data" ? <DataView school={school} classes={classes} respondents={respondents} selectedClass={selectedClass} onSelectClass={(item) => { setSelectedClass(item); setActiveTab("analitik"); }} onNew={() => setShowWizard(true)} /> : activeTab === "analitik" ? <AnalysisView group={group} selectedClass={selectedClass} loading={groupLoading || screenLoading} onRefresh={loadGroup} /> : <AuditView audit={audit} />;
  return <Animated.View style={[styles.page, { opacity: fade }]}>{screenLoading && !dashboard ? <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.brandPrimary} /><Text style={[styles.body, { marginTop: 12 }]}>Memuat ruang kerja...</Text></View> : body}<BottomTabs active={activeTab} onChange={setActiveTab} /><View style={{ height: insets.bottom === 0 ? 0 : 0 }} /></Animated.View>;
}
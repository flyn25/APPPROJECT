import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Modal,
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
  AuditBreakdown,
  Comparison,
  Dashboard,
  GroupResult,
  IndividualResult,
  Respondent,
  School,
  SchoolRekap,
  createClass,
  createSchool,
  demoLogin,
  getAudit,
  getAuditIndividual,
  getAuthHeaders,
  getClassComparison,
  getClasses,
  getDashboard,
  getExportUrl,
  getFormats,
  getImportTemplateUrl,
  getGroupScore,
  getRespondents,
  getSchoolRekap,
  getSchools,
  login,
  register,
  saveRespondent,
  setAuthSession,
  uploadImport,
} from "@/src/api";
import { makeStyles, useTheme } from "@/src/theme";

const useStyles = makeStyles((colors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 116 },
  authPage: { flex: 1, backgroundColor: colors.surface, justifyContent: "center", padding: 24 },
  brandMark: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  h1: { color: colors.onSurface, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  h2: { color: colors.onSurface, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  h3: { color: colors.onSurfaceSecondary, fontSize: 15, fontWeight: "800" },
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
  chipRow: { paddingHorizontal: 20, height: 56, marginBottom: 6 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  chipActive: { backgroundColor: colors.brandPrimary },
  chipText: { color: colors.onSurfaceTertiary, fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: colors.onBrandPrimary },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  metric: { flexGrow: 1, flexBasis: "46%", minHeight: 108, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  metricValue: { color: colors.onSurface, fontSize: 24, fontWeight: "800", marginTop: 12 },
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
  resultNumber: { color: colors.onSurfaceInverse, fontSize: 34, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.55)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  tableCell: { flex: 1, paddingVertical: 8, paddingHorizontal: 6 },
  tableHeaderCell: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, backgroundColor: colors.surfaceTertiary },
  segmented: { flexDirection: "row", backgroundColor: colors.surfaceTertiary, borderRadius: 14, padding: 4, marginBottom: 14 },
  segmentedItem: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  segmentedActive: { backgroundColor: colors.surfaceSecondary },
}));

function Icon({ name, size = 20, color }: { name: keyof typeof Ionicons.glyphMap; size?: number; color: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function PrimaryButton({ title, icon, onPress, disabled = false, testID }: { title: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <Pressable testID={testID} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, { opacity: disabled ? 0.5 : pressed ? 0.78 : 1 }]}>{icon && <Icon name={icon} color={colors.onBrandPrimary} size={18} />}<Text style={styles.buttonText}>{title}</Text></Pressable>;
}

function SecondaryButton({ title, icon, onPress, testID }: { title: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.75 : 1 }]}>{icon && <Icon name={icon} color={colors.onSurfaceSecondary} size={18} />}<Text style={styles.secondaryText}>{title}</Text></Pressable>;
}

async function shareExport(scope: "individual" | "group", identifier: string, format: "xlsx" | "pdf") {
  try {
    const url = getExportUrl(scope, identifier, format);
    if (Platform.OS === "web") { await Linking.openURL(url); return; }
    const directory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    if (!directory) throw new Error("Folder penyimpanan tidak tersedia.");
    const filename = `${scope === "individual" ? "hasil-aum-individual" : "hasil-aum-kelompok"}.${format}`;
    const downloaded = await FileSystem.downloadAsync(url, `${directory}${filename}`, { headers: getAuthHeaders() });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(downloaded.uri, { mimeType: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    else Alert.alert("File siap", downloaded.uri);
  } catch (error) { Alert.alert("Export gagal", error instanceof Error ? error.message : "File belum dapat dibuat."); }
}

async function downloadImportTemplate() {
  try {
    const url = getImportTemplateUrl();
    if (Platform.OS === "web") return Linking.openURL(url);
    const directory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    if (!directory) throw new Error("Folder penyimpanan tidak tersedia.");
    const downloaded = await FileSystem.downloadAsync(url, `${directory}template-import-aum.xlsx`, { headers: getAuthHeaders() });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(downloaded.uri, { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  } catch (error) { Alert.alert("Template gagal", error instanceof Error ? error.message : "Template belum dapat diunduh."); }
}

async function chooseImport(onSuccess: (message: string) => void) {
  try {
    const picked = await DocumentPicker.getDocumentAsync({ type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"], copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    const formData = new FormData();
    if (Platform.OS === "web" && asset.file) formData.append("file", asset.file);
    else formData.append("file", { uri: asset.uri, name: asset.name, type: asset.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } as unknown as Blob);
    const result = await uploadImport(formData);
    onSuccess(`${result.imported} baris berhasil diimport secara transaksional.`);
  } catch (error) { Alert.alert("Import ditolak", error instanceof Error ? error.message : "Periksa format dan isi file."); }
}

function MetricCard({ label, value, icon, accent = false, testID }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; accent?: boolean; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View testID={testID} style={[styles.metric, accent && { backgroundColor: colors.brandTertiary, borderColor: colors.brandTertiary }]}><Icon name={icon} size={19} color={accent ? colors.brandPrimary : colors.muted} /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Header({ title, subtitle, onRefresh }: { title: string; subtitle: string; onRefresh?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.header}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>AUM Umum BK</Text><Text style={[styles.h1, { marginTop: 4 }]}>{title}</Text><Text style={[styles.caption, { marginTop: 3 }]}>{subtitle}</Text></View>{onRefresh && <Pressable onPress={onRefresh} testID="refresh-button" style={styles.circleButton}><Icon name="refresh-outline" color={colors.brandPrimary} /></Pressable>}</View>;
}

function AuthScreen({ onDemo, onSubmit, loading, error }: { onDemo: () => void; onSubmit: (name: string, email: string, password: string, isRegister: boolean) => void; loading: boolean; error: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.authPage}><ScrollView contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }} keyboardShouldPersistTaps="handled"><View style={styles.brandMark}><Icon name="leaf-outline" size={32} color={colors.onBrandPrimary} /></View><Text style={styles.eyebrow}>RUANG KERJA GURU BK</Text><Text style={[styles.h1, { marginTop: 8 }]}>AUM Umum{`\n`}BK Mobile</Text><Text style={[styles.body, { marginTop: 16, maxWidth: 330 }]}>Kelola input, pengolahan, dan profil masalah AUM secara rapi, deterministik, dan rahasia.</Text><View style={[styles.notice, { marginTop: 22 }]}><Icon name="lock-closed-outline" color={colors.onBrandTertiary} size={18} /><Text style={[styles.caption, { flex: 1, color: colors.onBrandTertiary }]}>Data AUM adalah data rahasia. Aplikasi tidak membuat diagnosis psikologis.</Text></View><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Pressable onPress={() => setIsRegister(false)} testID="auth-tab-login" style={[styles.chip, { flex: 1 }, !isRegister && styles.chipActive]}><Text style={[styles.chipText, !isRegister && styles.chipTextActive]}>Masuk</Text></Pressable><Pressable onPress={() => setIsRegister(true)} testID="auth-tab-register" style={[styles.chip, { flex: 1 }, isRegister && styles.chipActive]}><Text style={[styles.chipText, isRegister && styles.chipTextActive]}>Buat akun</Text></Pressable></View>{isRegister && <><Text style={styles.label}>NAMA LENGKAP</Text><TextInput testID="auth-name" value={name} onChangeText={setName} placeholder="Nama Guru BK" placeholderTextColor={colors.muted} style={styles.input} /></>}<Text style={styles.label}>EMAIL</Text><TextInput testID="auth-email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="nama@sekolah.id" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>KATA SANDI</Text><TextInput testID="auth-password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimal 8 karakter" placeholderTextColor={colors.muted} style={styles.input} />{error ? <Text testID="auth-error" style={{ color: colors.error, marginVertical: 10 }}>{error}</Text> : null}<PrimaryButton testID="auth-submit" title={loading ? "Memproses..." : isRegister ? "Buat akun aman" : "Masuk ke ruang kerja"} icon={loading ? undefined : "arrow-forward"} onPress={() => onSubmit(name, email, password, isRegister)} disabled={loading} /><View style={{ marginTop: 10 }}><SecondaryButton testID="auth-demo" title="Masuk Demo Instan" icon="flask-outline" onPress={onDemo} /></View>{loading && <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 16 }} />}<Text style={[styles.caption, { textAlign: "center", marginTop: 18 }]}>Mode Demo menggunakan data contoh terpisah dari data nyata.</Text></ScrollView></KeyboardAvoidingView>;
}

function DashboardView({ dashboard, school, onNew, onData, onRekap, onRefresh }: { dashboard: Dashboard | null; school: School | null; onNew: () => void; onData: () => void; onRekap: () => void; onRefresh: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Header title="Ringkasan" subtitle="Pantau pekerjaan AUM hari ini" onRefresh={onRefresh} /><View style={styles.schoolBanner} testID="active-school-banner"><View style={styles.between}><View style={{ flex: 1 }}><Text style={[styles.caption, { color: colors.brandTertiary }]}>SEKOLAH AKTIF</Text><Text style={[styles.h2, { color: colors.onBrandPrimary, marginTop: 6 }]}>{school?.name || "Belum ada sekolah"}</Text><Text style={[styles.caption, { color: colors.brandTertiary, marginTop: 4 }]}>{school?.academic_year || "Pilih sekolah untuk memulai"}</Text></View><View style={[styles.iconBubble, { backgroundColor: colors.brandSecondary }]}><Icon name="school-outline" color={colors.onBrandSecondary} size={21} /></View></View><View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}><Pressable onPress={onData} testID="banner-manage-db" style={{ flexDirection: "row", alignItems: "center" }}><Text style={[styles.caption, { color: colors.onBrandPrimary, fontWeight: "800" }]}>Kelola database</Text><Icon name="chevron-forward" color={colors.onBrandPrimary} size={16} /></Pressable><Pressable onPress={onRekap} testID="banner-rekap" style={{ flexDirection: "row", alignItems: "center" }}><Text style={[styles.caption, { color: colors.onBrandPrimary, fontWeight: "800" }]}>Rekap sekolah</Text><Icon name="chevron-forward" color={colors.onBrandPrimary} size={16} /></Pressable></View></View><View style={styles.metricGrid}><MetricCard testID="metric-respondents" label="Responden" value={dashboard?.respondent_count ?? 0} icon="people-outline" accent /><MetricCard testID="metric-classes" label="Kelas aktif" value={dashboard?.class_count ?? 0} icon="layers-outline" /><MetricCard testID="metric-problems" label="Total masalah" value={dashboard?.total_problems ?? 0} icon="analytics-outline" /><MetricCard testID="metric-heavy" label="Masalah berat" value={dashboard?.total_heavy ?? 0} icon="alert-circle-outline" /></View><View style={[styles.card, { marginTop: 8 }]}><View style={styles.between}><View><Text style={styles.h3}>Mulai pengolahan</Text><Text style={[styles.caption, { marginTop: 4 }]}>Ikuti wizard tiga langkah AUM.</Text></View><View style={styles.iconBubble}><Icon name="create-outline" color={colors.brandPrimary} /></View></View><PrimaryButton testID="new-respondent-button" title="Input responden baru" icon="add" onPress={onNew} /></View><View style={styles.card}><View style={styles.between}><Text style={styles.h3}>Aktivitas terbaru</Text><Text style={styles.caption}>{dashboard?.recent.length || 0} data</Text></View>{dashboard?.recent?.length ? dashboard.recent.map((item) => <View key={item.id} style={styles.recentRow} testID={`recent-${item.id}`}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 1)}</Text></View><View style={{ flex: 1 }}><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.class_name || "Kelas"} · {item.selected_problem_numbers?.length || 0} masalah terpilih</Text></View><Icon name="chevron-forward" size={17} color={colors.muted} /></View>) : <Text style={[styles.body, { marginTop: 14 }]}>Belum ada data responden.</Text>}</View></ScrollView>;
}

function DataView({ schools, activeSchool, onSelectSchool, classes, respondents, selectedClass, onSelectClass, onNew, onImport, onTemplate, onExportGroup, onAddSchool, onAddClass, onOpenRespondent }: { schools: School[]; activeSchool: School | null; onSelectSchool: (school: School) => void; classes: AumClass[]; respondents: Respondent[]; selectedClass: AumClass | null; onSelectClass: (item: AumClass) => void; onNew: () => void; onImport: () => void; onTemplate: () => void; onExportGroup: (format: "xlsx" | "pdf") => void; onAddSchool: () => void; onAddClass: () => void; onOpenRespondent: (r: Respondent) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Header title="Database" subtitle="Sekolah · tahun ajaran · kelas" />
    <View style={styles.between}><Text style={styles.h3}>SEKOLAH</Text><Pressable onPress={onAddSchool} testID="add-school-button" style={styles.circleButton}><Icon name="add" color={colors.brandPrimary} /></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
      {schools.map((s) => <Pressable key={s.id} testID={`school-chip-${s.id}`} onPress={() => onSelectSchool(s)} style={[styles.chip, activeSchool?.id === s.id && styles.chipActive]}><Text style={[styles.chipText, activeSchool?.id === s.id && styles.chipTextActive]}>{s.name}</Text></Pressable>)}
      {!schools.length && <Text style={styles.caption}>Belum ada sekolah. Tap + untuk menambah.</Text>}
    </ScrollView>
    <View style={styles.between}><Text style={styles.h2}>Kelas & kelompok</Text><View style={{ flexDirection: "row", gap: 8 }}><Pressable onPress={onAddClass} testID="add-class-button" style={styles.circleButton}><Icon name="layers-outline" color={colors.brandPrimary} /></Pressable><Pressable onPress={onNew} testID="add-respondent-button" style={styles.circleButton}><Icon name="person-add-outline" color={colors.brandPrimary} /></Pressable></View></View>
    <Text style={[styles.caption, { marginTop: 5, marginBottom: 12 }]}>Pilih kelas untuk melihat responden dan hasil agregat.</Text>
    {classes.map((item) => <Pressable key={item.id} testID={`class-${item.id}`} onPress={() => onSelectClass(item)} style={[styles.card, { marginBottom: 10, borderColor: selectedClass?.id === item.id ? colors.brandPrimary : colors.border }]}><View style={styles.between}><View><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.level} · {item.format_id.replace("format_", "Format ")}</Text></View><Icon name={selectedClass?.id === item.id ? "checkmark-circle" : "chevron-forward"} color={selectedClass?.id === item.id ? colors.brandPrimary : colors.muted} size={22} /></View></Pressable>)}
    {!classes.length && <Text style={[styles.body, { marginBottom: 12 }]}>Belum ada kelas pada sekolah ini.</Text>}
    <View style={[styles.card, { marginTop: 8 }]}><View style={styles.between}><Text style={styles.h3}>Responden {selectedClass ? `· ${selectedClass.name}` : "terbaru"}</Text><Text style={styles.caption}>{respondents.length} orang</Text></View>{respondents.slice(0, 12).map((item) => <Pressable key={item.id} testID={`respondent-${item.id}`} onPress={() => onOpenRespondent(item)} style={styles.recentRow}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 1)}</Text></View><View style={{ flex: 1 }}><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.respondent_id || "—"} · {item.selected_problem_numbers.length} masalah</Text></View><Icon name="chevron-forward" size={17} color={colors.muted} /></Pressable>)}{!respondents.length && <Text style={[styles.body, { marginTop: 12 }]}>Belum ada responden.</Text>}</View>
    <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}><View style={{ flex: 1 }}><SecondaryButton testID="import-excel-button" title="Import Excel" icon="cloud-upload-outline" onPress={onImport} /></View><View style={{ flex: 1 }}><SecondaryButton testID="template-download-button" title="Template" icon="download-outline" onPress={onTemplate} /></View></View>
    {selectedClass && respondents.some((r) => r.class_id === selectedClass.id) && <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}><View style={{ flex: 1 }}><SecondaryButton testID="export-group-xlsx" title="XLSX kelompok" icon="document-attach-outline" onPress={() => onExportGroup("xlsx")} /></View><View style={{ flex: 1 }}><SecondaryButton testID="export-group-pdf" title="PDF kelompok" icon="document-text-outline" onPress={() => onExportGroup("pdf")} /></View></View>}
  </ScrollView>;
}

function AnalysisView({ mode, onModeChange, group, comparison, rekap, selectedClass, activeSchool, loading, onRefresh, onExport }: { mode: "kelas" | "sekolah" | "bandingkan"; onModeChange: (mode: "kelas" | "sekolah" | "bandingkan") => void; group: GroupResult | null; comparison: Comparison | null; rekap: SchoolRekap | null; selectedClass: AumClass | null; activeSchool: School | null; loading: boolean; onRefresh: () => void; onExport: (format: "xlsx" | "pdf") => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const max = Math.max(...(group?.rows || []).map((row) => row.total), 1);
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Header title="Analitik" subtitle={mode === "kelas" ? (selectedClass ? `Profil masalah ${selectedClass.name}` : "Pilih kelas dahulu") : mode === "sekolah" ? `Rekap ${activeSchool?.name || "sekolah"}` : `Perbandingan kelas ${activeSchool?.name || ""}`} onRefresh={onRefresh} />
    <View style={styles.segmented}>
      {(["kelas", "sekolah", "bandingkan"] as const).map((m) => <Pressable key={m} testID={`analitik-tab-${m}`} onPress={() => onModeChange(m)} style={[styles.segmentedItem, mode === m && styles.segmentedActive]}><Text style={[styles.caption, { fontWeight: "800", color: mode === m ? colors.brandPrimary : colors.muted }]}>{m === "kelas" ? "Kelas" : m === "sekolah" ? "Rekap Sekolah" : "Bandingkan"}</Text></Pressable>)}
    </View>
    {loading ? <View style={styles.card}><ActivityIndicator color={colors.brandPrimary} /><Text style={[styles.body, { textAlign: "center", marginTop: 12 }]}>Menghitung hasil kelompok...</Text></View> : mode === "kelas" ? (group ? <><View style={styles.metricGrid}><MetricCard label="Responden" value={group.respondent_count} icon="people-outline" accent /><MetricCard label="Masalah / siswa" value={group.average_problems} icon="pulse-outline" /><MetricCard label="Total masalah" value={group.total_problems} icon="bar-chart-outline" /><MetricCard label="Masalah berat" value={group.total_heavy_problems} icon="warning-outline" /></View><View style={styles.glassCard}><Text style={[styles.caption, { color: colors.onBrandTertiary }]}>RINGKASAN DESKRIPTIF</Text><Text style={[styles.h2, { color: colors.onBrandTertiary, marginTop: 7 }]}>Pola kebutuhan layanan</Text><Text style={[styles.body, { color: colors.onBrandTertiary, marginTop: 6 }]}>Gunakan data ini sebagai bahan pertimbangan tindak lanjut Guru BK, bukan sebagai diagnosis.</Text></View><View style={styles.card}><View style={styles.between}><Text style={styles.h3}>Ranking bidang</Text><Text style={styles.caption}>JML masalah</Text></View>{[...group.rows].sort((a, b) => b.total - a.total).map((row) => <View key={row.domain_code} style={{ marginTop: 17 }}><View style={styles.between}><Text style={styles.h3}>{row.domain_code}</Text><Text style={styles.caption}>{row.total} · {row.percentage}%</Text></View><View style={styles.row}><View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max((row.total / max) * 100, 3)}%` }]} /></View><Text style={[styles.caption, { width: 35, textAlign: "right" }]}>{row.average}</Text></View></View>)}</View><View style={styles.card}><Text style={styles.h3}>Tabel hasil kelompok</Text><Text style={[styles.caption, { marginTop: 4 }]}>Terendah · Tertinggi · JML · % · Rata-rata · JML Berat</Text>{group.rows.map((row) => <View key={row.domain_code} style={styles.classRow}><View style={styles.between}><Text style={styles.h3}>{row.domain_code}</Text><Text style={styles.caption}>{row.total} masalah</Text></View><Text style={styles.caption}>Min {row.lowest} · Max {row.highest} · {row.percentage}% · rata {row.average} · berat {row.heavy_total}</Text></View>)}</View><View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1 }}><SecondaryButton testID="analytics-export-xlsx" title="Export XLSX" icon="document-attach-outline" onPress={() => onExport("xlsx")} /></View><View style={{ flex: 1 }}><SecondaryButton testID="analytics-export-pdf" title="Export PDF" icon="document-text-outline" onPress={() => onExport("pdf")} /></View></View></> : <View style={styles.card}><Text style={styles.h3}>Belum ada data kelompok</Text><Text style={[styles.body, { marginTop: 8 }]}>Pilih kelas dengan responden untuk menghitung profil masalah.</Text></View>) : mode === "sekolah" ? (rekap ? <><View style={styles.metricGrid}><MetricCard label="Responden" value={rekap.respondent_count} icon="people-outline" accent /><MetricCard label="Kelas" value={rekap.class_count} icon="layers-outline" /><MetricCard label="Total masalah" value={rekap.total_problems} icon="analytics-outline" /><MetricCard label="Masalah berat" value={rekap.total_heavy_problems} icon="warning-outline" /></View><View style={styles.card}><Text style={styles.h3}>Distribusi per bidang</Text>{rekap.domain_rows.map((r) => <View key={r.code} style={styles.classRow}><View style={styles.between}><Text style={styles.h3}>{r.code} — {r.name}</Text><Text style={styles.caption}>{r.total} · berat {r.heavy}</Text></View></View>)}{!rekap.domain_rows.length && <Text style={[styles.body, { marginTop: 8 }]}>Belum ada data.</Text>}</View><View style={styles.card}><Text style={styles.h3}>Rekap per kelas</Text>{rekap.class_summary.map((c) => <View key={c.class_id} style={styles.classRow}><View style={styles.between}><Text style={styles.h3}>{c.name}</Text><Text style={styles.caption}>{c.respondent_count} siswa</Text></View><Text style={styles.caption}>Total {c.total_problems} · berat {c.total_heavy} · rata {c.average_problems}</Text></View>)}</View></> : <View style={styles.card}><Text style={styles.h3}>Belum ada data sekolah</Text><Text style={[styles.body, { marginTop: 8 }]}>Tambahkan responden untuk melihat rekap agregat sekolah.</Text></View>) : (comparison && comparison.classes.length ? <View style={styles.card}><Text style={styles.h3}>Bandingkan kelas</Text><Text style={[styles.caption, { marginTop: 4, marginBottom: 8 }]}>Jumlah masalah per bidang per kelas</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View><View style={{ flexDirection: "row" }}><View style={[styles.tableHeaderCell, { width: 110 }]}><Text style={styles.caption}>BIDANG</Text></View>{comparison.classes.map((c) => <View key={c.id} style={[styles.tableHeaderCell, { width: 90 }]}><Text style={styles.caption}>{c.name}</Text></View>)}</View>{comparison.domains.map((row) => <View key={row.code} style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.divider }}><View style={[styles.tableCell, { width: 110 }]}><Text style={styles.h3}>{row.code}</Text><Text style={styles.caption}>{row.name}</Text></View>{row.cells.map((cell) => <View key={cell.class_id} style={[styles.tableCell, { width: 90 }]}><Text style={styles.h3}>{cell.count}</Text><Text style={styles.caption}>{cell.respondents} siswa</Text></View>)}</View>)}</View></ScrollView></View> : <View style={styles.card}><Text style={styles.h3}>Belum ada perbandingan</Text><Text style={[styles.body, { marginTop: 8 }]}>Tambah minimal dua kelas dengan responden.</Text></View>)}
  </ScrollView>;
}

function AuditView({ audit, onSelectRespondent, respondents }: { audit: { id: string; action: string; details: { formula: string }; created_at: string }[]; onSelectRespondent: (id: string) => void; respondents: Respondent[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Header title="Audit" subtitle="Jejak perhitungan dan keamanan data" /><View style={styles.notice}><Icon name="shield-checkmark-outline" color={colors.onBrandTertiary} size={20} /><Text style={[styles.caption, { flex: 1, color: colors.onBrandTertiary }]}>Setiap skor berasal dari data mentah dan rumus deterministik yang dapat ditelusuri.</Text></View>
    <View style={styles.card}><Text style={styles.h3}>Telusuri perhitungan individual</Text><Text style={[styles.caption, { marginTop: 4, marginBottom: 8 }]}>Pilih responden untuk melihat rincian rumus per bidang.</Text>{respondents.slice(0, 10).map((item) => <Pressable key={item.id} testID={`audit-respondent-${item.id}`} onPress={() => onSelectRespondent(item.id)} style={styles.recentRow}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 1)}</Text></View><View style={{ flex: 1 }}><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.class_name} · {item.selected_problem_numbers.length} masalah</Text></View><Icon name="chevron-forward" size={17} color={colors.muted} /></Pressable>)}{!respondents.length && <Text style={[styles.body, { marginTop: 8 }]}>Belum ada responden.</Text>}</View>
    <View style={styles.card}><Text style={styles.h3}>Log perhitungan</Text>{audit.length ? audit.map((item) => <View key={item.id} style={styles.classRow}><View style={styles.row}><View style={styles.iconBubble}><Icon name="calculator-outline" color={colors.brandPrimary} size={18} /></View><View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.h3}>{item.action === "score_individual" ? "Scoring individual" : item.action === "import_excel" ? "Import Excel" : item.action}</Text><Text style={styles.caption}>{new Date(item.created_at).toLocaleString("id-ID")}</Text></View></View><Text style={[styles.caption, { marginTop: 10, color: colors.onSurfaceTertiary }]}>{item.details?.formula || "—"}</Text></View>) : <Text style={[styles.body, { marginTop: 12 }]}>Log audit masih kosong.</Text>}</View>
    <View style={styles.card}><Text style={styles.h3}>Integritas sistem</Text>{["Konfigurasi lima format AUM (75/155/200/210/265)", "Validasi nomor & masalah berat", "Data mentah terpisah dari hasil", "Tidak ada kategori diagnosis baru"].map((label) => <View key={label} style={[styles.row, { marginTop: 15 }]}><Icon name="checkmark-circle" color={colors.success} size={19} /><Text style={[styles.body, { marginLeft: 9 }]}>{label}</Text></View>)}</View>
  </ScrollView>;
}

function AuditDetailView({ data, onClose }: { data: AuditBreakdown; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.page}><View style={[styles.wizardHeader, { paddingTop: 16 }]}><Pressable onPress={onClose} testID="audit-detail-close" style={styles.circleButton}><Icon name="arrow-back" color={colors.onSurfaceSecondary} /></Pressable><Text style={styles.h3}>Audit — {data.respondent.name}</Text><View style={{ width: 44 }} /></View><ScrollView contentContainerStyle={styles.content}><View style={styles.resultHero}><Text style={[styles.caption, { color: colors.brandTertiary }]}>AUDIT PERHITUNGAN · DETERMINISTIK</Text><Text style={[styles.h2, { color: colors.onSurfaceInverse, marginTop: 8 }]}>{data.respondent.name}</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75, marginTop: 4 }]}>{data.respondent.class_name} · {data.format_id.replace("format_", "Format ")}</Text><View style={[styles.row, { marginTop: 18, gap: 22 }]}><View><Text style={styles.resultNumber}>{data.total_problems}</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75 }]}>masalah</Text></View><View><Text style={styles.resultNumber}>{data.total_heavy}</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75 }]}>berat</Text></View><View><Text style={styles.resultNumber}>{data.overall_percentage}%</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75 }]}>persentase</Text></View></View></View>{data.breakdown.map((row) => <View key={row.domain} style={styles.card}><Text style={styles.h3}>{row.domain}</Text><Text style={[styles.caption, { marginTop: 4 }]}>Nomor terpilih: {row.problem_numbers.join(", ") || "—"}</Text><Text style={[styles.caption, { marginTop: 4 }]}>Nomor berat: {row.heavy_numbers.join(", ") || "—"}</Text><Text style={[styles.body, { marginTop: 8, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }]}>{row.formula}</Text></View>)}</ScrollView></View>;
}

function IndividualResultView({ result, onClose, onExport }: { result: { result: IndividualResult; respondent: Respondent }; onClose: () => void; onExport: (format: "xlsx" | "pdf") => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return <View style={styles.page}><View style={[styles.wizardHeader, { paddingTop: 16 }]}><Pressable testID="result-close" onPress={onClose} style={styles.circleButton}><Icon name="arrow-back" color={colors.onSurfaceSecondary} /></Pressable><Text style={styles.h3}>Hasil AUM Individual</Text><Pressable testID="result-share" onPress={() => onExport("pdf")} style={styles.circleButton}><Icon name="share-outline" color={colors.brandPrimary} /></Pressable></View><ScrollView contentContainerStyle={styles.content}><View style={styles.resultHero}><Text style={[styles.caption, { color: colors.brandTertiary }]}>RAHASIA · HASIL DESKRIPTIF</Text><Text style={[styles.h2, { color: colors.onSurfaceInverse, marginTop: 10 }]}>{result.respondent.name}</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75, marginTop: 5 }]}>{result.respondent.class_name || "Responden"} · {result.respondent.respondent_id || "—"}</Text><View style={[styles.row, { marginTop: 20, gap: 22 }]}><View><Text style={styles.resultNumber}>{result.result.total_problems}</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75 }]}>masalah</Text></View><View><Text style={styles.resultNumber}>{result.result.total_heavy_problems}</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75 }]}>berat</Text></View><View><Text style={styles.resultNumber}>{result.result.overall_percentage}%</Text><Text style={[styles.caption, { color: colors.onSurfaceInverse, opacity: 0.75 }]}>persentase</Text></View></View></View><View style={styles.card}><Text style={styles.h3}>Per bidang masalah</Text>{result.result.rows.map((row) => <View key={row.domain_code} style={{ marginTop: 17 }}><View style={styles.between}><Text style={styles.h3}>{row.domain_code}</Text><Text style={styles.caption}>{row.count} · {row.percentage}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(row.percentage, row.count ? 3 : 0)}%` }]} /></View><Text style={[styles.caption, { marginTop: 5 }]}>Masalah berat: {row.heavy_problem_numbers.length ? row.heavy_problem_numbers.map((n) => String(n).padStart(3, "0")).join(", ") : "Tidak ada"}</Text></View>)}</View><View style={styles.notice}><Icon name="information-circle-outline" color={colors.onBrandTertiary} size={19} /><Text style={[styles.caption, { flex: 1, color: colors.onBrandTertiary }]}>Masalah yang terungkap dapat menjadi bahan pertimbangan Guru BK untuk tindak lanjut.</Text></View><View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1 }}><SecondaryButton title="Excel" icon="document-attach-outline" onPress={() => onExport("xlsx")} /></View><View style={{ flex: 1 }}><SecondaryButton title="PDF" icon="document-text-outline" onPress={() => onExport("pdf")} /></View></View></ScrollView></View>;
}

function WizardView({ formats, classes, selectedClass, mode, activeSchool, onClose, onSaved }: { formats: AumFormat[]; classes: AumClass[]; selectedClass: AumClass | null; mode: "demo" | "real"; activeSchool: School | null; onClose: () => void; onSaved: (payload: { result: IndividualResult; respondent: Respondent }) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [formatId, setFormatId] = useState(selectedClass?.format_id || formats[0]?.id || "format_1");
  const [selected, setSelected] = useState<number[]>([]);
  const [heavy, setHeavy] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [respondentId, setRespondentId] = useState("");
  const [classId, setClassId] = useState(selectedClass?.id || classes[0]?.id || "");
  const [gender, setGender] = useState("");
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
  const next = () => { if (step === 1 && !name.trim()) return Alert.alert("Data belum lengkap", "Isi nama responden terlebih dahulu."); if (step === 1 && !selected.length) return Alert.alert("Belum ada masalah", "Pilih minimal satu nomor masalah."); if (step === 2) setHeavy((current) => current.filter((item) => selected.includes(item))); setStep((current) => Math.min(current + 1, 3)); };
  const save = async () => { setSaving(true); try { const selectedClassItem = classes.find((item) => item.id === classId); const response = await saveRespondent({ mode, name: name.trim(), respondent_id: respondentId.trim(), gender, institution: activeSchool?.name || "", class_name: selectedClassItem?.name || "", class_id: classId, academic_year: activeSchool?.academic_year || "2025/2026", filled_date: new Date().toISOString().slice(0, 10), format_id: formatId, selected_problem_numbers: selected, heavy_problem_numbers: heavy, third_step: { complete, other_problems: otherProblems, want_discussion: wantDiscussion, discussion_with: discussionWith } }); onSaved({ result: response.result, respondent: response.respondent }); } catch (error) { Alert.alert("Belum tersimpan", error instanceof Error ? error.message : "Periksa koneksi dan coba lagi."); } finally { setSaving(false); } };
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.wizard, { paddingTop: insets.top }]}><View style={styles.wizardHeader}><Pressable testID="wizard-close" onPress={onClose} style={styles.circleButton}><Icon name="close" color={colors.onSurfaceSecondary} /></Pressable><View style={{ flex: 1, marginHorizontal: 14 }}><View style={styles.row}>{[1, 2, 3].map((item) => <View key={item} style={[styles.stepDot, item <= step && styles.stepDotActive]} />)}</View><Text style={[styles.caption, { textAlign: "center", marginTop: 8 }]}>Langkah {step} dari 3</Text></View><View style={styles.circleButton}><Text style={[styles.h3, { color: colors.brandPrimary }]}>{selected.length}</Text></View></View><ScrollView contentContainerStyle={[styles.content, { paddingBottom: 26 }]} keyboardShouldPersistTaps="handled">
    {step === 1 && <><Text style={styles.h2}>Pilih masalah</Text><Text style={[styles.body, { marginTop: 6 }]}>Tandai nomor masalah yang menjadi keluhan dan mengganggu responden sekarang.</Text><Text style={styles.label}>NAMA RESPONDEN</Text><TextInput testID="wizard-name" value={name} onChangeText={setName} placeholder="Contoh: Nadia Putri" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>NIS / NIM / ID</Text><TextInput testID="wizard-respondent-id" value={respondentId} onChangeText={setRespondentId} placeholder="Contoh: 2026-001" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>JENIS KELAMIN</Text><View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>{["L", "P"].map((g) => <Pressable key={g} testID={`wizard-gender-${g}`} onPress={() => setGender(g)} style={[styles.chip, gender === g && styles.chipActive]}><Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g === "L" ? "Laki-laki" : "Perempuan"}</Text></Pressable>)}</View>
      {classes.length > 0 && <><Text style={styles.label}>KELAS</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>{classes.map((c) => <Pressable key={c.id} testID={`wizard-class-${c.id}`} onPress={() => { setClassId(c.id); setFormatId(c.format_id); setSelected([]); setHeavy([]); }} style={[styles.chip, classId === c.id && styles.chipActive]}><Text style={[styles.chipText, classId === c.id && styles.chipTextActive]}>{c.name}</Text></Pressable>)}</ScrollView></>}
      <Text style={styles.label}>FORMAT AUM</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>{formats.map((item) => <Pressable key={item.id} testID={`wizard-format-${item.id}`} onPress={() => { setFormatId(item.id); setSelected([]); setHeavy([]); }} style={[styles.chip, formatId === item.id && styles.chipActive]}><Text style={[styles.chipText, formatId === item.id && styles.chipTextActive]}>{item.code} · {item.target.replace("Siswa ", "").replace("Mahasiswa ", "").replace("Warga ", "")}</Text></Pressable>)}</ScrollView>
      <Text style={styles.label}>CARI NOMOR MASALAH</Text><TextInput testID="wizard-search" value={search} onChangeText={setSearch} keyboardType="number-pad" placeholder={`1–${format?.total_items}`} placeholderTextColor={colors.muted} style={styles.input} /><View style={styles.notice}><Icon name="information-circle-outline" color={colors.onBrandTertiary} size={18} /><Text style={[styles.caption, { flex: 1, color: colors.onBrandTertiary }]}>Sistem otomatis mengetahui bidang setiap nomor dari konfigurasi format.</Text></View><View style={styles.numberGrid}>{numbers.map((number) => <Pressable key={number} testID={`wizard-num-${number}`} onPress={() => toggleNumber(number)} style={[styles.number, selected.includes(number) && styles.numberSelected]}><Text style={[styles.numberText, selected.includes(number) && styles.numberTextSelected]}>{String(number).padStart(3, "0")}</Text></Pressable>)}</View></>}
    {step === 2 && <><Text style={styles.h2}>Masalah berat</Text><Text style={[styles.body, { marginTop: 6 }]}>Dari masalah yang telah dipilih, mana yang dirasakan amat berat atau amat mengganggu?</Text><View style={[styles.glassCard, { marginTop: 20 }]}><Text style={[styles.h3, { color: colors.onBrandTertiary }]}>{selected.length} masalah terpilih</Text><Text style={[styles.caption, { color: colors.onBrandTertiary, marginTop: 5 }]}>Ketuk nomor untuk menandainya sebagai masalah berat.</Text></View><View style={styles.numberGrid}>{selected.map((number) => <Pressable key={number} testID={`wizard-heavy-${number}`} onPress={() => toggleHeavy(number)} style={[styles.number, heavy.includes(number) && styles.numberHeavy]}><Text style={[styles.numberText, heavy.includes(number) && { color: colors.onWarning }]}>{String(number).padStart(3, "0")}</Text></Pressable>)}</View></>}
    {step === 3 && <><Text style={styles.h2}>Informasi tambahan</Text><Text style={[styles.body, { marginTop: 6 }]}>Lengkapi catatan agar laporan individual tetap utuh.</Text><Text style={styles.label}>APAKAH MASALAH SUDAH MENGGAMBARKAN KESELURUHAN?</Text><View style={{ flexDirection: "row", marginTop: 8, gap: 10 }}>{["Ya", "Tidak"].map((item) => <Pressable key={item} testID={`wizard-complete-${item}`} onPress={() => setComplete(item)} style={[styles.secondaryButton, { flex: 1, borderColor: complete === item ? colors.brandPrimary : colors.border }]}><View style={[styles.radio, complete === item && styles.radioOn]}>{complete === item && <View style={styles.radioDot} />}</View><Text style={styles.secondaryText}>{item}</Text></Pressable>)}</View><Text style={styles.label}>MASALAH LAIN YANG BELUM TERCANTUM</Text><TextInput testID="wizard-other" value={otherProblems} onChangeText={setOtherProblems} placeholder="Tuliskan bila ada..." placeholderTextColor={colors.muted} multiline style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 13 }]} /><Text style={styles.label}>INGIN MEMBICARAKAN MASALAH?</Text><View style={{ flexDirection: "row", marginTop: 8, gap: 10 }}>{["Ya", "Tidak"].map((item) => <Pressable key={item} testID={`wizard-discuss-${item}`} onPress={() => setWantDiscussion(item)} style={[styles.secondaryButton, { flex: 1, borderColor: wantDiscussion === item ? colors.brandPrimary : colors.border }]}><View style={[styles.radio, wantDiscussion === item && styles.radioOn]}>{wantDiscussion === item && <View style={styles.radioDot} />}</View><Text style={styles.secondaryText}>{item}</Text></Pressable>)}</View>{wantDiscussion === "Ya" && <><Text style={styles.label}>KEPADA SIAPA?</Text><TextInput testID="wizard-discuss-with" value={discussionWith} onChangeText={setDiscussionWith} placeholder="Guru BK" placeholderTextColor={colors.muted} style={styles.input} /></>}</>}
  </ScrollView><View style={[styles.stickyAction, { paddingBottom: Math.max(insets.bottom, 12) }]}><View style={{ flexDirection: "row", gap: 10 }}>{step > 1 && <View style={{ flex: 1 }}><SecondaryButton testID="wizard-back" title="Kembali" icon="arrow-back" onPress={() => setStep((current) => current - 1)} /></View>}<View style={{ flex: 1 }}>{step < 3 ? <PrimaryButton testID="wizard-next" title="Lanjut" icon="arrow-forward" onPress={next} /> : <PrimaryButton testID="wizard-save" title={saving ? "Menyimpan..." : "Simpan & hitung"} icon="checkmark" onPress={save} disabled={saving} />}</View></View></View></KeyboardAvoidingView>;
}

function AddSchoolModal({ visible, onClose, onCreate }: { visible: boolean; onClose: () => void; onCreate: (name: string, academicYear: string, level: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState("2025/2026");
  const [level, setLevel] = useState("SLTP");
  useEffect(() => { if (visible) { setName(""); setAcademicYear("2025/2026"); setLevel("SLTP"); } }, [visible]);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalOverlay}><View style={styles.modalSheet}><Text style={styles.h2}>Tambah sekolah</Text><Text style={[styles.caption, { marginTop: 4 }]}>Sekolah baru akan tersimpan pada akun Anda.</Text><Text style={styles.label}>NAMA SEKOLAH</Text><TextInput testID="school-name-input" value={name} onChangeText={setName} placeholder="Contoh: SMA Nusantara" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>TAHUN AJARAN</Text><TextInput testID="school-year-input" value={academicYear} onChangeText={setAcademicYear} placeholder="2025/2026" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>JENJANG</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>{["SD", "SLTP", "SLTA", "PT", "Masyarakat"].map((l) => <Pressable key={l} testID={`school-level-${l}`} onPress={() => setLevel(l)} style={[styles.chip, level === l && styles.chipActive]}><Text style={[styles.chipText, level === l && styles.chipTextActive]}>{l}</Text></Pressable>)}</ScrollView><View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}><View style={{ flex: 1 }}><SecondaryButton testID="school-cancel" title="Batal" icon="close" onPress={onClose} /></View><View style={{ flex: 1 }}><PrimaryButton testID="school-save" title="Simpan" icon="checkmark" onPress={() => onCreate(name.trim(), academicYear.trim(), level)} disabled={!name.trim()} /></View></View></View></View></Modal>;
}

function AddClassModal({ visible, formats, onClose, onCreate }: { visible: boolean; formats: AumFormat[]; onClose: () => void; onCreate: (name: string, level: string, formatId: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("SLTP");
  const [formatId, setFormatId] = useState("format_2");
  useEffect(() => { if (visible) { setName(""); setLevel("SLTP"); setFormatId("format_2"); } }, [visible]);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalOverlay}><View style={styles.modalSheet}><Text style={styles.h2}>Tambah kelas</Text><Text style={[styles.caption, { marginTop: 4 }]}>Kelas akan terhubung ke sekolah aktif.</Text><Text style={styles.label}>NAMA KELAS</Text><TextInput testID="class-name-input" value={name} onChangeText={setName} placeholder="Contoh: XII IPA 1" placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>JENJANG</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>{["SD", "SLTP", "SLTA", "PT", "Masyarakat"].map((l) => <Pressable key={l} testID={`class-level-${l}`} onPress={() => setLevel(l)} style={[styles.chip, level === l && styles.chipActive]}><Text style={[styles.chipText, level === l && styles.chipTextActive]}>{l}</Text></Pressable>)}</ScrollView><Text style={styles.label}>FORMAT AUM</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>{formats.map((f) => <Pressable key={f.id} testID={`class-format-${f.id}`} onPress={() => setFormatId(f.id)} style={[styles.chip, formatId === f.id && styles.chipActive]}><Text style={[styles.chipText, formatId === f.id && styles.chipTextActive]}>{f.code} · {f.target.replace("Siswa ", "").replace("Mahasiswa ", "")}</Text></Pressable>)}</ScrollView><View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}><View style={{ flex: 1 }}><SecondaryButton testID="class-cancel" title="Batal" icon="close" onPress={onClose} /></View><View style={{ flex: 1 }}><PrimaryButton testID="class-save" title="Simpan" icon="checkmark" onPress={() => onCreate(name.trim(), level, formatId)} disabled={!name.trim()} /></View></View></View></View></Modal>;
}

function BottomTabs({ active, onChange }: { active: string; onChange: (tab: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tabs: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [{ id: "ringkasan", label: "Ringkasan", icon: "grid-outline" }, { id: "data", label: "Data", icon: "folder-open-outline" }, { id: "analitik", label: "Analitik", icon: "bar-chart-outline" }, { id: "audit", label: "Audit", icon: "shield-checkmark-outline" }];
  return <View style={styles.tabBar}>{tabs.map((tab) => <Pressable key={tab.id} testID={`tab-${tab.id}`} onPress={() => onChange(tab.id)} style={[styles.tabItem, active === tab.id && styles.tabActive]}><Icon name={tab.icon} size={20} color={active === tab.id ? colors.brandPrimary : colors.muted} /><Text style={[styles.tabLabel, active === tab.id && styles.tabLabelActive]}>{tab.label}</Text></Pressable>)}</View>;
}

export default function Index() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState(false);
  const [mode, setMode] = useState<"demo" | "real">("demo");
  const [loading, setLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("ringkasan");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [formats, setFormats] = useState<AumFormat[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [activeSchool, setActiveSchool] = useState<School | null>(null);
  const [classes, setClasses] = useState<AumClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<AumClass | null>(null);
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [audit, setAudit] = useState<{ id: string; action: string; details: { formula: string }; created_at: string }[]>([]);
  const [group, setGroup] = useState<GroupResult | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [analyticsMode, setAnalyticsMode] = useState<"kelas" | "sekolah" | "bandingkan">("kelas");
  const [rekap, setRekap] = useState<SchoolRekap | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [resultPreview, setResultPreview] = useState<{ result: IndividualResult; respondent: Respondent } | null>(null);
  const [auditDetail, setAuditDetail] = useState<AuditBreakdown | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    setScreenLoading(true); setError("");
    try {
      const [formatData, dashboardData, schoolData, auditData] = await Promise.all([getFormats(), getDashboard(), getSchools(), getAudit()]);
      setFormats(formatData); setDashboard(dashboardData); setSchools(schoolData); setAudit(auditData);
      const firstSchool = schoolData[0] || null;
      setActiveSchool((current) => current && schoolData.find((s) => s.id === current.id) ? current : firstSchool);
      const school = firstSchool;
      if (school) {
        const [classData, respondentData] = await Promise.all([getClasses(school.id), getRespondents()]);
        setClasses(classData);
        setRespondents(respondentData);
        setSelectedClass((current) => (current && classData.find((c) => c.id === current.id)) || classData[0] || null);
      } else {
        setClasses([]); setRespondents([]); setSelectedClass(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Data belum dapat dimuat.");
    } finally { setScreenLoading(false); }
  }, []);

  const loadClassesForSchool = useCallback(async (school: School) => {
    setActiveSchool(school);
    try {
      const [classData, respondentData] = await Promise.all([getClasses(school.id), getRespondents()]);
      setClasses(classData); setRespondents(respondentData);
      setSelectedClass(classData[0] || null);
    } catch { setClasses([]); setSelectedClass(null); }
  }, []);

  const loadGroup = useCallback(async () => {
    if (!selectedClass) { setGroup(null); return; }
    setGroupLoading(true);
    try { setGroup(await getGroupScore(selectedClass.format_id, selectedClass.id)); }
    catch { setGroup(null); }
    finally { setGroupLoading(false); }
  }, [selectedClass]);

  const loadRekap = useCallback(async () => {
    if (!activeSchool) { setRekap(null); return; }
    setGroupLoading(true);
    try { setRekap(await getSchoolRekap(activeSchool.id)); }
    catch { setRekap(null); }
    finally { setGroupLoading(false); }
  }, [activeSchool]);

  const loadComparison = useCallback(async () => {
    if (!activeSchool) { setComparison(null); return; }
    setGroupLoading(true);
    try { setComparison(await getClassComparison(activeSchool.id)); }
    catch { setComparison(null); }
    finally { setGroupLoading(false); }
  }, [activeSchool]);

  const enterSession = async (auth: { token: string; mode: "demo" | "real" }) => {
    setAuthSession(auth.token, auth.mode);
    setMode(auth.mode); setSession(true);
    await loadData();
    Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: Platform.OS !== "web" }).start();
  };
  const handleDemo = async () => { setLoading(true); setError(""); try { await enterSession(await demoLogin()); } catch (loginError) { setError(loginError instanceof Error ? loginError.message : "Tidak dapat masuk ke mode demo."); } finally { setLoading(false); } };
  const handleAuth = async (name: string, email: string, password: string, isRegister: boolean) => { setLoading(true); setError(""); try { await enterSession(await (isRegister ? register(name, email, password) : login(email, password))); } catch (loginError) { setError(loginError instanceof Error ? loginError.message : "Autentikasi belum berhasil."); } finally { setLoading(false); } };
  const handleImport = () => chooseImport(async (message) => { Alert.alert("Import berhasil", message); await loadData(); });
  const handleGroupExport = (format: "xlsx" | "pdf") => selectedClass ? shareExport("group", selectedClass.id, format) : Alert.alert("Pilih kelas", "Pilih kelas terlebih dahulu untuk export kelompok.");
  const handleIndividualExport = (format: "xlsx" | "pdf") => resultPreview ? shareExport("individual", resultPreview.respondent.id, format) : undefined;
  const handleCreateSchool = async (name: string, academicYear: string, level: string) => {
    try { const created = await createSchool({ name, academic_year: academicYear, levels: [level] }); setShowSchoolModal(false); await loadData(); setActiveSchool(created); }
    catch (e) { Alert.alert("Gagal", e instanceof Error ? e.message : "Sekolah belum dapat dibuat."); }
  };
  const handleCreateClass = async (name: string, level: string, formatId: string) => {
    if (!activeSchool) { Alert.alert("Pilih sekolah", "Tambah/pilih sekolah dulu."); return; }
    try { await createClass({ school_id: activeSchool.id, name, level, format_id: formatId }); setShowClassModal(false); const classData = await getClasses(activeSchool.id); setClasses(classData); }
    catch (e) { Alert.alert("Gagal", e instanceof Error ? e.message : "Kelas belum dapat dibuat."); }
  };
  const handleOpenAudit = async (id: string) => {
    try { setAuditDetail(await getAuditIndividual(id)); }
    catch (e) { Alert.alert("Belum tersedia", e instanceof Error ? e.message : "Audit gagal dimuat."); }
  };
  const handleOpenRespondent = async (r: Respondent) => {
    try {
      const detail = await getAuditIndividual(r.id);
      setResultPreview({ result: { total_problems: detail.total_problems, total_heavy_problems: detail.total_heavy, overall_percentage: detail.overall_percentage, rows: detail.breakdown.map((b) => ({ domain_code: b.domain.split(" — ")[0], domain_name: b.domain.split(" — ")[1] || "", count: b.count, percentage: b.percentage, heavy_problem_numbers: b.heavy_numbers.map((n) => parseInt(n, 10)), problem_numbers: b.problem_numbers.map((n) => parseInt(n, 10)) })) }, respondent: r });
    } catch (e) { Alert.alert("Gagal", e instanceof Error ? e.message : "Data belum tersedia."); }
  };
  const refresh = async () => {
    await loadData();
    if (activeTab === "analitik") { if (analyticsMode === "kelas") await loadGroup(); else if (analyticsMode === "sekolah") await loadRekap(); else await loadComparison(); }
  };
  useEffect(() => {
    if (!session || activeTab !== "analitik") return;
    if (analyticsMode === "kelas") loadGroup();
    else if (analyticsMode === "sekolah") loadRekap();
    else loadComparison();
  }, [session, activeTab, analyticsMode, loadGroup, loadRekap, loadComparison]);

  if (!session) return <AuthScreen onDemo={handleDemo} onSubmit={handleAuth} loading={loading || screenLoading} error={error} />;
  if (showWizard) return <WizardView formats={formats} classes={classes} selectedClass={selectedClass} mode={mode} activeSchool={activeSchool} onClose={() => setShowWizard(false)} onSaved={(value) => { setShowWizard(false); setResultPreview(value); loadData(); }} />;
  if (resultPreview) return <IndividualResultView result={resultPreview} onClose={() => setResultPreview(null)} onExport={handleIndividualExport} />;
  if (auditDetail) return <AuditDetailView data={auditDetail} onClose={() => setAuditDetail(null)} />;
  const body = activeTab === "ringkasan" ? <DashboardView dashboard={dashboard} school={activeSchool} onNew={() => setShowWizard(true)} onData={() => setActiveTab("data")} onRekap={() => { setAnalyticsMode("sekolah"); setActiveTab("analitik"); }} onRefresh={refresh} /> : activeTab === "data" ? <DataView schools={schools} activeSchool={activeSchool} onSelectSchool={loadClassesForSchool} classes={classes} respondents={selectedClass ? respondents.filter((r) => r.class_id === selectedClass.id) : respondents} selectedClass={selectedClass} onSelectClass={(item) => { setSelectedClass(item); setAnalyticsMode("kelas"); setActiveTab("analitik"); }} onNew={() => setShowWizard(true)} onImport={handleImport} onTemplate={downloadImportTemplate} onExportGroup={handleGroupExport} onAddSchool={() => setShowSchoolModal(true)} onAddClass={() => setShowClassModal(true)} onOpenRespondent={handleOpenRespondent} /> : activeTab === "analitik" ? <AnalysisView mode={analyticsMode} onModeChange={setAnalyticsMode} group={group} comparison={comparison} rekap={rekap} selectedClass={selectedClass} activeSchool={activeSchool} loading={groupLoading} onRefresh={refresh} onExport={handleGroupExport} /> : <AuditView audit={audit} respondents={respondents} onSelectRespondent={handleOpenAudit} />;
  return <Animated.View style={[styles.page, { opacity: fade }]}>
    {screenLoading && !dashboard ? <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.brandPrimary} /><Text style={[styles.body, { marginTop: 12 }]}>Memuat ruang kerja...</Text></View> : body}
    <BottomTabs active={activeTab} onChange={setActiveTab} />
    <AddSchoolModal visible={showSchoolModal} onClose={() => setShowSchoolModal(false)} onCreate={handleCreateSchool} />
    <AddClassModal visible={showClassModal} formats={formats} onClose={() => setShowClassModal(false)} onCreate={handleCreateClass} />
    <View style={{ height: insets.bottom === 0 ? 0 : 0 }} />
  </Animated.View>;
}

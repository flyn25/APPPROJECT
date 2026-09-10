import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AuditBreakdown,
  AuditLog,
  AumClass,
  AumFormat,
  Comparison,
  Dashboard,
  GroupResult,
  IndividualResult,
  KonselingBoard,
  KonselingItem,
  Respondent,
  School,
  SchoolRekap,
  Trend,
  clearSession,
  createClass,
  createSchool,
  deleteClass,
  deleteRespondent,
  deleteSchool,
  getAudit,
  getAuditIndividual,
  getClassComparison,
  getClasses,
  getDashboard,
  getFormats,
  getGroupScore,
  getIndividualResult,
  getKonseling,
  getMe,
  getRespondents,
  getSchoolRekap,
  getSchools,
  getTrend,
  login,
  persistSession,
  register,
  restoreSession,
  updateKonseling,
  updateSchool,
} from "@/src/api";
import { chooseImport, downloadImportTemplate, shareExport } from "@/src/files";
import { AnalysisView, AnalyticsMode } from "@/src/screens/AnalysisView";
import { AuditDetailView, AuditView } from "@/src/screens/AuditView";
import { AuthScreen } from "@/src/screens/AuthScreen";
import { BulkWizardView } from "@/src/screens/BulkWizardView";
import { DashboardView } from "@/src/screens/DashboardView";
import { DataView } from "@/src/screens/DataView";
import { IndividualResultView } from "@/src/screens/IndividualResultView";
import { KonselingView } from "@/src/screens/KonselingView";
import { ClassSheet, SchoolSheet } from "@/src/screens/Sheets";
import { WizardView } from "@/src/screens/WizardView";
import { useTheme } from "@/src/theme";
import { ConfirmRequest, ConfirmSheet, Icon, IconName, useStyles } from "@/src/ui";

const TABS: { id: string; label: string; icon: IconName }[] = [
  { id: "ringkasan", label: "Ringkasan", icon: "grid-outline" },
  { id: "data", label: "Data", icon: "folder-open-outline" },
  { id: "analitik", label: "Analitik", icon: "bar-chart-outline" },
  { id: "konseling", label: "Konseling", icon: "chatbubbles-outline" },
  { id: "audit", label: "Audit", icon: "shield-checkmark-outline" },
];

function BottomTabs({ active, onChange, badge }: { active: string; onChange: (tab: string) => void; badge: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { bottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((tab) => (
        <Pressable key={tab.id} testID={`tab-${tab.id}`} onPress={() => onChange(tab.id)} style={[styles.tabItem, active === tab.id && styles.tabActive]}>
          <View>
            <Icon name={tab.icon} size={20} color={active === tab.id ? colors.brandPrimary : colors.muted} />
            {tab.id === "konseling" && badge > 0 && <View style={{ position: "absolute", top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.warning, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 }}><Text style={{ color: colors.onWarning, fontSize: 9, fontWeight: "800" }}>{badge}</Text></View>}
          </View>
          <Text style={[styles.tabLabel, active === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Index() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("ringkasan");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [formats, setFormats] = useState<AumFormat[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [activeSchool, setActiveSchoolState] = useState<School | null>(null);
  const activeSchoolRef = useRef<School | null>(null);
  const setActiveSchool = (school: School | null) => { activeSchoolRef.current = school; setActiveSchoolState(school); };
  const [classes, setClasses] = useState<AumClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<AumClass | null>(null);
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [group, setGroup] = useState<GroupResult | null>(null);
  const [rekap, setRekap] = useState<SchoolRekap | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [trend, setTrend] = useState<Trend | null>(null);
  const [konseling, setKonseling] = useState<KonselingBoard | null>(null);
  const [konselingLoading, setKonselingLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsMode, setAnalyticsMode] = useState<AnalyticsMode>("kelas");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [schoolSheet, setSchoolSheet] = useState<"hidden" | "create" | "edit">("hidden");
  const [showClassSheet, setShowClassSheet] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [resultPreview, setResultPreview] = useState<{ result: IndividualResult; respondent: Respondent } | null>(null);
  const [auditDetail, setAuditDetail] = useState<AuditBreakdown | null>(null);

  const loadSchoolData = useCallback(async (school: School | null) => {
    if (!school) { setClasses([]); setRespondents([]); setSelectedClass(null); return; }
    const [classData, respondentData] = await Promise.all([getClasses(school.id), getRespondents()]);
    const classIds = new Set(classData.map((c) => c.id));
    setClasses(classData);
    setRespondents(respondentData.filter((r) => classIds.has(r.class_id || "")));
    setSelectedClass((current) => (current && classData.find((c) => c.id === current.id)) || classData[0] || null);
  }, []);

  const loadData = useCallback(async (preferredSchoolId?: string) => {
    setScreenLoading(true); setError("");
    try {
      const [formatData, dashboardData, schoolData, auditData, konselingData] = await Promise.all([getFormats(), getDashboard(), getSchools(), getAudit(), getKonseling()]);
      setFormats(formatData); setDashboard(dashboardData); setSchools(schoolData); setAudit(auditData); setKonseling(konselingData);
      const school = schoolData.find((s) => s.id === (preferredSchoolId || activeSchoolRef.current?.id)) || schoolData[0] || null;
      setActiveSchool(school);
      await loadSchoolData(school);
      setRefreshKey((k) => k + 1);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Data belum dapat dimuat.");
    } finally { setScreenLoading(false); }
  }, [loadSchoolData]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      if (analyticsMode === "kelas") setGroup(selectedClass ? await getGroupScore(selectedClass.format_id, selectedClass.id).catch(() => null) : null);
      else if (analyticsMode === "sekolah") setRekap(activeSchool ? await getSchoolRekap(activeSchool.id).catch(() => null) : null);
      else if (analyticsMode === "bandingkan") setComparison(activeSchool ? await getClassComparison(activeSchool.id).catch(() => null) : null);
      else setTrend(activeSchool ? await getTrend(activeSchool.id).catch(() => null) : null);
    } finally { setAnalyticsLoading(false); }
  }, [analyticsMode, selectedClass, activeSchool]);

  const loadKonseling = useCallback(async () => {
    setKonselingLoading(true);
    try { setKonseling(await getKonseling(activeSchool?.id)); } catch { /* keep previous */ } finally { setKonselingLoading(false); }
  }, [activeSchool]);

  useEffect(() => {
    (async () => {
      const token = await restoreSession();
      if (token) {
        try { const me = await getMe(); setUserName(me.user.name); setSession(true); await loadData(); }
        catch { await clearSession(); }
      }
      setBooting(false);
    })();
  }, [loadData]);

  useEffect(() => { if (session && activeTab === "analitik") loadAnalytics(); }, [session, activeTab, loadAnalytics]);
  useEffect(() => { if (session && activeTab === "konseling") loadKonseling(); }, [session, activeTab, loadKonseling]);

  const enterSession = async (auth: { token: string; user: { name: string } }) => {
    await persistSession(auth.token);
    setUserName(auth.user.name); setSession(true);
    await loadData();
  };
  const handleAuth = async (name: string, email: string, password: string, isRegister: boolean) => {
    setLoading(true); setError("");
    try { await enterSession(await (isRegister ? register(name, email, password) : login(email, password))); }
    catch (loginError) { setError(loginError instanceof Error ? loginError.message : "Autentikasi belum berhasil."); }
    finally { setLoading(false); }
  };
  const handleLogout = () => setConfirm({ title: "Keluar dari ruang kerja?", message: "Sesi akan ditutup. Data tetap aman tersimpan pada akun Anda.", confirmLabel: "Keluar", onConfirm: async () => { await clearSession(); setSession(false); setActiveTab("ringkasan"); setDashboard(null); setSchools([]); setActiveSchool(null); setClasses([]); setRespondents([]); setResultPreview(null); } });

  const selectSchool = async (school: School) => { setActiveSchool(school); setSelectedClass(null); await loadSchoolData(school); };
  const handleImport = () => chooseImport(async (message) => { Alert.alert("Import berhasil", message); await loadData(); });
  const handleGroupExport = (format: "xlsx" | "pdf") => (selectedClass ? shareExport("group", selectedClass.id, format) : Alert.alert("Pilih kelas", "Pilih kelas terlebih dahulu untuk export kelompok."));

  const handleSaveSchool = async (name: string, academicYear: string, level: string) => {
    try {
      if (schoolSheet === "edit" && activeSchool) { const updated = await updateSchool(activeSchool.id, { name, academic_year: academicYear }); setSchoolSheet("hidden"); await loadData(updated.id); }
      else { const created = await createSchool({ name, academic_year: academicYear, levels: [level] }); setSchoolSheet("hidden"); await loadData(created.id); }
    } catch (e) { Alert.alert("Gagal", e instanceof Error ? e.message : "Sekolah belum dapat disimpan."); }
  };
  const handleCreateClass = async (name: string, level: string, formatId: string) => {
    if (!activeSchool) { Alert.alert("Pilih sekolah", "Tambah/pilih sekolah dulu."); return; }
    try { await createClass({ school_id: activeSchool.id, name, level, format_id: formatId }); setShowClassSheet(false); await loadSchoolData(activeSchool); }
    catch (e) { Alert.alert("Gagal", e instanceof Error ? e.message : "Kelas belum dapat dibuat."); }
  };

  const confirmDeleteRespondent = (r: Respondent, afterDelete?: () => void) => setConfirm({ title: `Hapus ${r.name}?`, message: "Data responden dan hasil olahannya akan dihapus permanen. Tindakan ini tercatat di Audit.", danger: true, onConfirm: async () => { try { await deleteRespondent(r.id); afterDelete?.(); await loadData(); } catch (e) { Alert.alert("Gagal", e instanceof Error ? e.message : "Belum dapat dihapus."); } } });
  const confirmDeleteClass = (c: AumClass) => { const count = respondents.filter((r) => r.class_id === c.id).length; setConfirm({ title: `Hapus kelas ${c.name}?`, message: `${count} responden beserta hasilnya di kelas ini ikut terhapus permanen.`, danger: true, onConfirm: async () => { try { await deleteClass(c.id); await loadData(); } catch (e) { Alert.alert("Gagal", e instanceof Error ? e.message : "Belum dapat dihapus."); } } }); };
  const confirmDeleteSchool = () => { if (!activeSchool) return; setConfirm({ title: `Hapus sekolah ${activeSchool.name}?`, message: `Semua kelas (${classes.length}) dan responden (${respondents.length}) di sekolah ini akan dihapus permanen. Pastikan Anda sudah mengekspor data yang diperlukan.`, danger: true, confirmLabel: "Hapus semua", onConfirm: async () => { try { await deleteSchool(activeSchool.id); setActiveSchool(null); await loadData(); } catch (e) { Alert.alert("Gagal", e instanceof Error ? e.message : "Belum dapat dihapus."); } } }); };

  const openRespondent = async (r: Respondent | { id: string }) => {
    try { const detail = await getIndividualResult(r.id); setResultPreview({ result: detail.result, respondent: detail.respondent }); }
    catch (e) { Alert.alert("Gagal", e instanceof Error ? e.message : "Data belum tersedia."); }
  };
  const openAudit = async (id: string) => {
    try { setAuditDetail(await getAuditIndividual(id)); }
    catch (e) { Alert.alert("Belum tersedia", e instanceof Error ? e.message : "Audit gagal dimuat."); }
  };
  const handleKonselingUpdate = async (item: KonselingItem, status: string, note: string) => {
    try { await updateKonseling(item.id, status, note); await loadKonseling(); }
    catch (e) { Alert.alert("Gagal", e instanceof Error ? e.message : "Status belum tersimpan."); }
  };
  const refresh = async () => { await loadData(); if (activeTab === "analitik") await loadAnalytics(); if (activeTab === "konseling") await loadKonseling(); };

  if (booting) return <View style={[styles.page, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator color={colors.brandPrimary} /><Text style={[styles.body, { marginTop: 12 }]}>Menyiapkan ruang kerja...</Text></View>;
  if (!session) return <AuthScreen onSubmit={handleAuth} loading={loading || screenLoading} error={error} />;
  if (showWizard) return <WizardView formats={formats} classes={classes} selectedClass={selectedClass} activeSchool={activeSchool} onClose={() => setShowWizard(false)} onSaved={(value) => { setShowWizard(false); setResultPreview(value); loadData(); }} />;
  if (showBulk) return <BulkWizardView formats={formats} classes={classes} selectedClass={selectedClass} activeSchool={activeSchool} onClose={() => setShowBulk(false)} onSaved={async (classId, saved) => { setShowBulk(false); await loadData(); const cls = classes.find((c) => c.id === classId); if (cls) setSelectedClass(cls); setAnalyticsMode("kelas"); setActiveTab("analitik"); Alert.alert("Lembar kelas tersimpan", `${saved} siswa berhasil dihitung.`); }} />;
  if (auditDetail) return <AuditDetailView data={auditDetail} onClose={() => setAuditDetail(null)} />;
  if (resultPreview) return (
    <>
      <IndividualResultView result={resultPreview.result} respondent={resultPreview.respondent} format={formats.find((f) => f.id === resultPreview.respondent.format_id)} onClose={() => setResultPreview(null)} onExport={(format) => shareExport("individual", resultPreview.respondent.id, format)} onDelete={() => confirmDeleteRespondent(resultPreview.respondent, () => setResultPreview(null))} onAudit={() => openAudit(resultPreview.respondent.id)} />
      <ConfirmSheet request={confirm} onClose={() => setConfirm(null)} />
    </>
  );

  const pendingKonseling = konseling?.counts?.Belum ?? 0;
  const body = activeTab === "ringkasan"
    ? <DashboardView dashboard={dashboard} school={activeSchool} userName={userName} konseling={konseling} onNew={() => setShowWizard(true)} onBulk={() => setShowBulk(true)} onData={() => setActiveTab("data")} onRekap={() => { setAnalyticsMode("sekolah"); setActiveTab("analitik"); }} onKonseling={() => setActiveTab("konseling")} onRefresh={refresh} onLogout={handleLogout} onOpenRespondent={openRespondent} />
    : activeTab === "data"
      ? <DataView schools={schools} activeSchool={activeSchool} onSelectSchool={selectSchool} classes={classes} respondents={respondents} selectedClass={selectedClass} onSelectClass={(item) => setSelectedClass(selectedClass?.id === item.id ? null : item)} onOpenAnalysis={(item) => { setSelectedClass(item); setAnalyticsMode("kelas"); setActiveTab("analitik"); }} onNew={() => setShowWizard(true)} onBulk={() => setShowBulk(true)} onImport={handleImport} onTemplate={downloadImportTemplate} onExportGroup={handleGroupExport} onAddSchool={() => setSchoolSheet("create")} onEditSchool={() => setSchoolSheet("edit")} onDeleteSchool={confirmDeleteSchool} onAddClass={() => setShowClassSheet(true)} onDeleteClass={confirmDeleteClass} onOpenRespondent={openRespondent} onDeleteRespondent={(r) => confirmDeleteRespondent(r)} />
      : activeTab === "analitik"
        ? <AnalysisView mode={analyticsMode} onModeChange={setAnalyticsMode} group={group} comparison={comparison} rekap={rekap} trend={trend} classes={classes} selectedClass={selectedClass} onSelectClass={setSelectedClass} activeSchool={activeSchool} loading={analyticsLoading} refreshKey={refreshKey} onRefresh={refresh} onExport={handleGroupExport} />
        : activeTab === "konseling"
          ? <KonselingView board={konseling} loading={konselingLoading} onRefresh={loadKonseling} onUpdate={handleKonselingUpdate} onOpen={openRespondent} />
          : <AuditView audit={audit} respondents={respondents} onSelectRespondent={openAudit} />;

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {screenLoading && !dashboard ? <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.brandPrimary} /><Text style={[styles.body, { marginTop: 12 }]}>Memuat ruang kerja...</Text></View> : body}
      {error ? <Text style={[styles.caption, { color: colors.error, textAlign: "center", marginBottom: 96 }]}>{error}</Text> : null}
      <BottomTabs active={activeTab} onChange={setActiveTab} badge={pendingKonseling} />
      <SchoolSheet visible={schoolSheet !== "hidden"} school={schoolSheet === "edit" ? activeSchool : null} onClose={() => setSchoolSheet("hidden")} onSave={handleSaveSchool} />
      <ClassSheet visible={showClassSheet} formats={formats} defaultLevel={activeSchool?.levels?.[0]} onClose={() => setShowClassSheet(false)} onCreate={handleCreateClass} />
      <ConfirmSheet request={confirm} onClose={() => setConfirm(null)} />
    </View>
  );
}

import { Pressable, ScrollView, Text, View } from "react-native";

import { AumClass, Comparison, GroupResult, School, SchoolRekap, Trend } from "@/src/api";
import { useTheme } from "@/src/theme";
import { AnalysisCard } from "@/src/screens/AnalysisCard";
import { Chip, EmptyState, IconButton, Loading, MetricCard, ScreenHeader, SecondaryButton, useStyles } from "@/src/ui";

export type AnalyticsMode = "kelas" | "sekolah" | "bandingkan" | "tren";
const MODES: { id: AnalyticsMode; label: string }[] = [{ id: "kelas", label: "Kelas" }, { id: "sekolah", label: "Sekolah" }, { id: "bandingkan", label: "Bandingkan" }, { id: "tren", label: "Tren" }];

type Props = {
  mode: AnalyticsMode;
  onModeChange: (mode: AnalyticsMode) => void;
  group: GroupResult | null;
  comparison: Comparison | null;
  rekap: SchoolRekap | null;
  trend: Trend | null;
  classes: AumClass[];
  selectedClass: AumClass | null;
  onSelectClass: (item: AumClass) => void;
  activeSchool: School | null;
  loading: boolean;
  refreshKey: number;
  onRefresh: () => void;
  onExport: (format: "xlsx" | "pdf") => void;
};

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const styles = useStyles();
  return (
    <View style={[styles.row, { gap: 10, marginTop: 8 }]}>
      <Text style={[styles.caption, { width: 72 }]} numberOfLines={1}>{label}</Text>
      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max((value / Math.max(max, 1)) * 100, value ? 3 : 0)}%`, backgroundColor: color }]} /></View>
      <Text style={[styles.caption, { width: 40, textAlign: "right", fontWeight: "800" }]}>{value}</Text>
    </View>
  );
}

export function AnalysisView({ mode, onModeChange, group, comparison, rekap, trend, classes, selectedClass, onSelectClass, activeSchool, loading, refreshKey, onRefresh, onExport }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const subtitle = mode === "kelas" ? (selectedClass ? `Profil masalah ${selectedClass.name}` : "Pilih kelas dahulu") : mode === "sekolah" ? `Rekap ${activeSchool?.name || "sekolah"}` : mode === "bandingkan" ? "Perbandingan antar kelas" : "Tren antar tahun ajaran";
  const yearColors = [colors.brandPrimary, colors.brandSecondary, colors.warning, colors.info, colors.error, colors.success];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Analitik" subtitle={subtitle} right={<IconButton testID="refresh-button" icon="refresh-outline" tint={colors.brandPrimary} onPress={onRefresh} />} />
      <View style={styles.segmented}>
        {MODES.map((m) => <Pressable key={m.id} testID={`analitik-tab-${m.id}`} onPress={() => onModeChange(m.id)} style={[styles.segmentedItem, mode === m.id && styles.segmentedActive]}><Text style={[styles.caption, { fontWeight: "800", color: mode === m.id ? colors.brandPrimary : colors.muted }]}>{m.label}</Text></Pressable>)}
      </View>

      {mode === "kelas" && classes.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
          {classes.map((c) => <Chip key={c.id} testID={`analitik-class-${c.id}`} label={c.name} active={selectedClass?.id === c.id} onPress={() => onSelectClass(c)} />)}
        </ScrollView>
      )}

      {loading ? <Loading text="Menghitung hasil..." /> : null}

      {!loading && mode === "kelas" && (group && selectedClass ? (
        <>
          <View style={styles.metricGrid}>
            <MetricCard label="Responden" value={group.respondent_count} icon="people-outline" accent />
            <MetricCard label="Masalah / siswa" value={group.average_problems} icon="pulse-outline" />
            <MetricCard label="Total masalah" value={group.total_problems} icon="bar-chart-outline" />
            <MetricCard label="Masalah berat" value={group.total_heavy_problems} icon="warning-outline" />
          </View>
          <AnalysisCard scope="group" identifier={selectedClass.id} refreshKey={refreshKey} />
          <View style={styles.card}>
            <View style={styles.between}><Text style={styles.h3}>Ranking bidang</Text><Text style={styles.caption}>JML masalah</Text></View>
            {[...group.rows].sort((a, b) => b.total - a.total).map((row) => <Bar key={row.domain_code} label={row.domain_code} value={row.total} max={Math.max(...group.rows.map((r) => r.total), 1)} color={colors.brandSecondary} />)}
          </View>
          <View style={styles.card}>
            <Text style={styles.h3}>Tabel hasil kelompok (Tabel 8)</Text>
            <Text style={[styles.caption, { marginTop: 4 }]}>Terendah · Tertinggi · JML · % · Rata-rata · JML berat · Rata berat</Text>
            {group.rows.map((row) => (
              <View key={row.domain_code} style={[styles.listRow, { alignItems: "flex-start" }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.between}><Text style={styles.h3}>{row.domain_code} <Text style={styles.caption}>· {row.domain_name}</Text></Text><Text style={[styles.caption, { fontWeight: "800" }]}>{row.total}</Text></View>
                  <Text style={[styles.caption, { marginTop: 4 }]}>Min {row.lowest} · Max {row.highest} · {row.percentage}% · rata {row.average} · berat {row.heavy_total} (rata {row.heavy_average})</Text>
                </View>
              </View>
            ))}
          </View>
          {group.consultation && (
            <View style={styles.card}>
              <Text style={styles.h3}>Ingin mengkonsultasikan masalah kepada</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {Object.entries(group.consultation).map(([label, count]) => <View key={label} style={[styles.badge, { paddingVertical: 8, backgroundColor: count ? colors.brandTertiary : colors.surfaceTertiary }]}><Text style={[styles.badgeText, count ? { color: colors.onBrandTertiary } : null]}>{label}: {count} orang</Text></View>)}
              </View>
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><SecondaryButton testID="analytics-export-xlsx" title="Export XLSX" icon="document-attach-outline" onPress={() => onExport("xlsx")} /></View>
            <View style={{ flex: 1 }}><SecondaryButton testID="analytics-export-pdf" title="PDF Tabel 8" icon="document-text-outline" onPress={() => onExport("pdf")} /></View>
          </View>
        </>
      ) : <EmptyState icon="bar-chart-outline" title="Belum ada data kelompok" message="Pilih kelas yang sudah memiliki responden untuk menghitung profil masalah." testID="empty-kelas" />)}

      {!loading && mode === "sekolah" && (rekap && activeSchool ? (
        <>
          <View style={styles.metricGrid}>
            <MetricCard label="Responden" value={rekap.respondent_count} icon="people-outline" accent />
            <MetricCard label="Kelas" value={rekap.class_count} icon="layers-outline" />
            <MetricCard label="Total masalah" value={rekap.total_problems} icon="analytics-outline" />
            <MetricCard label="Masalah berat" value={rekap.total_heavy_problems} icon="warning-outline" />
          </View>
          <AnalysisCard scope="school" identifier={activeSchool.id} refreshKey={refreshKey} />
          <View style={styles.card}>
            <Text style={styles.h3}>Distribusi per bidang</Text>
            {rekap.domain_rows.map((r) => <Bar key={r.code} label={r.code} value={r.total} max={Math.max(...rekap.domain_rows.map((d) => d.total), 1)} color={colors.brandSecondary} />)}
            {!rekap.domain_rows.length && <Text style={[styles.body, { marginTop: 8 }]}>Belum ada data.</Text>}
          </View>
          <View style={styles.card}>
            <Text style={styles.h3}>Rekap per kelas</Text>
            {rekap.class_summary.map((c) => (
              <View key={c.class_id} style={styles.listRow}>
                <View style={{ flex: 1 }}><Text style={styles.h3}>{c.name}</Text><Text style={styles.caption}>{c.respondent_count} siswa · total {c.total_problems} · berat {c.total_heavy}</Text></View>
                <View style={styles.badge}><Text style={styles.badgeText}>rata {c.average_problems}</Text></View>
              </View>
            ))}
          </View>
        </>
      ) : <EmptyState icon="school-outline" title="Belum ada data sekolah" message="Tambahkan responden untuk melihat rekap agregat sekolah." testID="empty-sekolah" />)}

      {!loading && mode === "bandingkan" && (comparison && comparison.classes.length ? (
        <View style={styles.card}>
          <Text style={styles.h3}>Bandingkan kelas</Text>
          <Text style={[styles.caption, { marginTop: 4, marginBottom: 8 }]}>Jumlah masalah per bidang per kelas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={{ flexDirection: "row" }}>
                <View style={[styles.tableHeaderCell, { width: 120, borderTopLeftRadius: 12 }]}><Text style={[styles.caption, { fontWeight: "800" }]}>BIDANG</Text></View>
                {comparison.classes.map((c) => <View key={c.id} style={[styles.tableHeaderCell, { width: 92 }]}><Text style={[styles.caption, { fontWeight: "800" }]}>{c.name}</Text></View>)}
              </View>
              {comparison.domains.map((row) => {
                const maxCell = Math.max(...row.cells.map((c) => c.count), 0);
                return (
                  <View key={row.code} style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.divider }}>
                    <View style={[styles.tableCell, { width: 120 }]}><Text style={styles.h3}>{row.code}</Text><Text style={styles.caption} numberOfLines={1}>{row.name}</Text></View>
                    {row.cells.map((cell) => <View key={cell.class_id} style={[styles.tableCell, { width: 92, backgroundColor: cell.count && cell.count === maxCell ? colors.brandTertiary : undefined }]}><Text style={styles.h3}>{cell.count}</Text><Text style={styles.caption}>{cell.respondents} siswa</Text></View>)}
                  </View>
                );
              })}
            </View>
          </ScrollView>
          <Text style={[styles.caption, { marginTop: 10 }]}>Sel berwarna = kelas dengan jumlah tertinggi pada bidang tersebut.</Text>
        </View>
      ) : <EmptyState icon="git-compare-outline" title="Belum ada perbandingan" message="Tambah minimal dua kelas dengan responden." testID="empty-bandingkan" />)}

      {!loading && mode === "tren" && (trend && trend.years.length ? (
        <>
          <View style={styles.card}>
            <Text style={styles.h3}>Ringkasan per tahun ajaran</Text>
            {trend.years.map((y, index) => (
              <View key={y.academic_year} style={styles.listRow}>
                <View style={[styles.legendDot, { backgroundColor: yearColors[index % yearColors.length] }]} />
                <View style={{ flex: 1 }}><Text style={styles.h3}>{y.academic_year}</Text><Text style={styles.caption}>{y.respondent_count} responden · {y.total_problems} masalah · {y.total_heavy} berat</Text></View>
                <View style={styles.badge}><Text style={styles.badgeText}>rata {y.average_problems}</Text></View>
              </View>
            ))}
            {trend.years.length < 2 && <Text style={[styles.caption, { marginTop: 10 }]}>Ubah tahun ajaran sekolah pada tab Data saat memasuki tahun baru; data akan otomatis dibandingkan di sini.</Text>}
          </View>
          <View style={styles.card} testID="trend-chart">
            <Text style={styles.h3}>Rata-rata masalah per siswa per bidang</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
              {trend.years.map((y, index) => <View key={y.academic_year} style={[styles.row, { gap: 6 }]}><View style={[styles.legendDot, { backgroundColor: yearColors[index % yearColors.length] }]} /><Text style={styles.caption}>{y.academic_year}</Text></View>)}
            </View>
            {trend.series.map((s) => {
              const max = Math.max(...trend.series.flatMap((x) => x.points.map((p) => p.average)), 0.1);
              return (
                <View key={s.code} style={{ marginTop: 16 }}>
                  <Text style={styles.h3}>{s.code} <Text style={styles.caption}>· {s.name}</Text></Text>
                  {s.points.map((p, index) => <Bar key={p.academic_year} label={p.academic_year} value={p.average} max={max} color={yearColors[index % yearColors.length]} />)}
                </View>
              );
            })}
          </View>
        </>
      ) : <EmptyState icon="trending-up-outline" title="Belum ada tren" message="Data akan dikelompokkan per tahun ajaran responden secara otomatis." testID="empty-tren" />)}
    </ScrollView>
  );
}

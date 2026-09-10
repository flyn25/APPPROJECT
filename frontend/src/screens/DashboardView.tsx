import { Pressable, ScrollView, Text, View } from "react-native";

import { Dashboard, KonselingBoard, Respondent, School } from "@/src/api";
import { useTheme } from "@/src/theme";
import { Icon, IconButton, MetricCard, PrimaryButton, ScreenHeader, SecondaryButton, useStyles } from "@/src/ui";

type Props = {
  dashboard: Dashboard | null;
  school: School | null;
  userName: string;
  konseling: KonselingBoard | null;
  onNew: () => void;
  onBulk: () => void;
  onData: () => void;
  onRekap: () => void;
  onKonseling: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  onOpenRespondent: (r: Respondent) => void;
};

export function DashboardView({ dashboard, school, userName, konseling, onNew, onBulk, onData, onRekap, onKonseling, onRefresh, onLogout, onOpenRespondent }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const pending = (konseling?.counts?.Belum ?? 0) > 0;
  const pendingCount = konseling?.counts?.Belum ?? 0;
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title={`Halo, ${userName.split(" ")[0] || "Guru BK"}`}
        subtitle="Pantau pekerjaan AUM hari ini"
        right={<View style={[styles.row, { gap: 8 }]}><IconButton testID="refresh-button" icon="refresh-outline" tint={colors.brandPrimary} onPress={onRefresh} /><IconButton testID="logout-button" icon="log-out-outline" tint={colors.error} onPress={onLogout} /></View>}
      />
      <View style={[styles.heroCard, { backgroundColor: colors.brandPrimary }]} testID="active-school-banner">
        <View style={styles.between}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.caption, { color: colors.brandTertiary, fontWeight: "800", letterSpacing: 0.8 }]}>SEKOLAH AKTIF</Text>
            <Text style={[styles.h2, { color: colors.onBrandPrimary, marginTop: 6 }]}>{school?.name || "Belum ada sekolah"}</Text>
            <Text style={[styles.caption, { color: colors.brandTertiary, marginTop: 4 }]}>{school ? `Tahun ajaran ${school.academic_year}` : "Tambahkan sekolah di tab Data"}</Text>
          </View>
          <View style={[styles.iconBubble, { backgroundColor: colors.brandSecondary }]}><Icon name="school-outline" color={colors.onBrandSecondary} size={21} /></View>
        </View>
        <View style={{ flexDirection: "row", gap: 18, marginTop: 20 }}>
          <Pressable onPress={onData} testID="banner-manage-db" style={styles.row}><Text style={[styles.caption, { color: colors.onBrandPrimary, fontWeight: "800" }]}>Kelola database</Text><Icon name="chevron-forward" color={colors.onBrandPrimary} size={16} /></Pressable>
          <Pressable onPress={onRekap} testID="banner-rekap" style={styles.row}><Text style={[styles.caption, { color: colors.onBrandPrimary, fontWeight: "800" }]}>Rekap sekolah</Text><Icon name="chevron-forward" color={colors.onBrandPrimary} size={16} /></Pressable>
        </View>
      </View>
      <View style={styles.metricGrid}>
        <MetricCard testID="metric-respondents" label="Responden" value={dashboard?.respondent_count ?? 0} icon="people-outline" accent />
        <MetricCard testID="metric-classes" label="Kelas aktif" value={dashboard?.class_count ?? 0} icon="layers-outline" />
        <MetricCard testID="metric-problems" label="Total masalah" value={dashboard?.total_problems ?? 0} icon="analytics-outline" />
        <MetricCard testID="metric-heavy" label="Masalah berat" value={dashboard?.total_heavy ?? 0} icon="alert-circle-outline" />
      </View>
      <View style={[styles.card, { marginTop: 8 }]}>
        <View style={styles.between}>
          <View style={{ flex: 1 }}><Text style={styles.h3}>Mulai pengolahan</Text><Text style={[styles.caption, { marginTop: 4 }]}>Satu responden atau satu lembar kelas sekaligus.</Text></View>
          <View style={styles.iconBubble}><Icon name="create-outline" color={colors.onBrandTertiary} /></View>
        </View>
        <View style={{ marginTop: 16, gap: 10 }}>
          <PrimaryButton testID="new-respondent-button" title="Input responden baru" icon="person-add-outline" onPress={onNew} />
          <SecondaryButton testID="bulk-wizard-button" title="Input lembar kelas (banyak siswa)" icon="albums-outline" onPress={onBulk} />
        </View>
      </View>
      <Pressable onPress={onKonseling} testID="dashboard-konseling-card" style={[styles.card, { backgroundColor: pending ? colors.warning : colors.surfaceSecondary, borderColor: pending ? colors.warning : colors.border }]}>
        <View style={styles.between}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.h3, pending && { color: colors.onWarning }]}>Permintaan konseling</Text>
            <Text style={[styles.caption, { marginTop: 4 }, pending && { color: colors.onWarning, opacity: 0.9 }]}>{pending ? `${pendingCount} siswa menunggu tindak lanjut` : "Tidak ada permintaan yang menunggu"}</Text>
          </View>
          <View style={[styles.iconBubble, pending && { backgroundColor: colors.surfaceSecondary }]}><Icon name="chatbubbles-outline" color={pending ? colors.warning : colors.onBrandTertiary} /></View>
        </View>
      </Pressable>
      <View style={styles.card}>
        <View style={styles.between}><Text style={styles.h3}>Aktivitas terbaru</Text><Text style={styles.caption}>{dashboard?.recent.length || 0} data</Text></View>
        {dashboard?.recent?.length ? dashboard.recent.map((item) => (
          <Pressable key={item.id} style={styles.listRow} testID={`recent-${item.id}`} onPress={() => onOpenRespondent(item)}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 1).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.class_name || "Kelas"} · {item.selected_problem_numbers?.length || 0} masalah · {item.heavy_problem_numbers?.length || 0} berat</Text></View>
            <Icon name="chevron-forward" size={17} color={colors.muted} />
          </Pressable>
        )) : <Text style={[styles.body, { marginTop: 14 }]}>Belum ada data responden.</Text>}
      </View>
    </ScrollView>
  );
}

import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuditBreakdown, AuditLog, Respondent } from "@/src/api";
import { useTheme } from "@/src/theme";
import { Icon, IconButton, Notice, ScreenHeader, formatLabel, useStyles } from "@/src/ui";

const ACTION_LABELS: Record<string, string> = {
  score_individual: "Scoring individual",
  bulk_score: "Lembar kelas",
  import_excel: "Import Excel",
  delete_respondent: "Hapus responden",
  delete_class: "Hapus kelas",
  delete_school: "Hapus sekolah",
};

const ACTION_ICONS: Record<string, "calculator-outline" | "albums-outline" | "cloud-upload-outline" | "trash-outline"> = {
  score_individual: "calculator-outline",
  bulk_score: "albums-outline",
  import_excel: "cloud-upload-outline",
  delete_respondent: "trash-outline",
  delete_class: "trash-outline",
  delete_school: "trash-outline",
};

export function AuditView({ audit, respondents, onSelectRespondent }: { audit: AuditLog[]; respondents: Respondent[]; onSelectRespondent: (id: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Audit" subtitle="Jejak perhitungan dan keamanan data" />
      <Notice icon="shield-checkmark-outline" text="Setiap skor berasal dari data mentah dan rumus deterministik yang dapat ditelusuri. Penghapusan data juga tercatat." />
      <View style={styles.card}>
        <Text style={styles.h3}>Telusuri perhitungan individual</Text>
        <Text style={[styles.caption, { marginTop: 4, marginBottom: 6 }]}>Pilih responden untuk melihat rumus per bidang.</Text>
        {respondents.slice(0, 10).map((item) => (
          <Pressable key={item.id} testID={`audit-respondent-${item.id}`} onPress={() => onSelectRespondent(item.id)} style={styles.listRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 1).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.h3}>{item.name}</Text><Text style={styles.caption}>{item.class_name} · {item.selected_problem_numbers.length} masalah</Text></View>
            <Icon name="chevron-forward" size={17} color={colors.muted} />
          </Pressable>
        ))}
        {!respondents.length && <Text style={[styles.body, { marginTop: 8 }]}>Belum ada responden.</Text>}
      </View>
      <View style={styles.card}>
        <Text style={styles.h3}>Log aktivitas</Text>
        {audit.length ? audit.slice(0, 30).map((item) => {
          const isDelete = item.action.startsWith("delete");
          return (
            <View key={item.id} style={[styles.listRow, { alignItems: "flex-start" }]}>
              <View style={[styles.iconBubble, isDelete && { backgroundColor: colors.surfaceTertiary }]}><Icon name={ACTION_ICONS[item.action] || "calculator-outline"} color={isDelete ? colors.error : colors.onBrandTertiary} size={18} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.h3}>{ACTION_LABELS[item.action] || item.action}</Text>
                <Text style={styles.caption}>{new Date(item.created_at).toLocaleString("id-ID")}</Text>
                <Text style={[styles.caption, { marginTop: 6, color: colors.onSurfaceTertiary }]}>{item.details?.formula || "—"}</Text>
              </View>
            </View>
          );
        }) : <Text style={[styles.body, { marginTop: 12 }]}>Log audit masih kosong.</Text>}
      </View>
      <View style={styles.card}>
        <Text style={styles.h3}>Integritas sistem</Text>
        {["Konfigurasi lima format AUM (75/155/200/210/265)", "Validasi nomor & masalah berat sebagai subset", "Data mentah terpisah dari hasil olahan", "Tidak ada kategori diagnosis", "Data terkunci per akun Guru BK"].map((label) => (
          <View key={label} style={[styles.row, { marginTop: 14, gap: 10 }]}><Icon name="checkmark-circle" color={colors.success} size={19} /><Text style={[styles.body, { flex: 1 }]}>{label}</Text></View>
        ))}
      </View>
    </ScrollView>
  );
}

export function AuditDetailView({ data, onClose }: { data: AuditBreakdown; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={[styles.between, { paddingHorizontal: 20, paddingVertical: 12 }]}>
        <IconButton testID="audit-detail-close" icon="arrow-back" onPress={onClose} />
        <Text style={styles.h3}>Audit — {data.respondent.name}</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.heroCard}>
          <Text style={[styles.caption, { color: colors.brandTertiary, fontWeight: "800", letterSpacing: 0.8 }]}>AUDIT PERHITUNGAN · DETERMINISTIK</Text>
          <Text style={[styles.h2, { color: colors.onSurfaceInverse, marginTop: 8 }]}>{data.respondent.name}</Text>
          <Text style={[styles.heroCaption, { marginTop: 4 }]}>{data.respondent.class_name} · {formatLabel(data.format_id)}</Text>
          <View style={[styles.row, { marginTop: 18, gap: 26 }]}>
            <View><Text style={styles.heroNumber}>{data.total_problems}</Text><Text style={styles.heroCaption}>masalah</Text></View>
            <View><Text style={[styles.heroNumber, { color: colors.warning }]}>{data.total_heavy}</Text><Text style={styles.heroCaption}>berat</Text></View>
            <View><Text style={styles.heroNumber}>{data.overall_percentage}%</Text><Text style={styles.heroCaption}>persentase</Text></View>
          </View>
        </View>
        {data.breakdown.map((row) => (
          <View key={row.domain} style={styles.card}>
            <Text style={styles.h3}>{row.domain}</Text>
            <Text style={[styles.caption, { marginTop: 6 }]}>Nomor terpilih: {row.problem_numbers.join(", ") || "—"}</Text>
            <Text style={[styles.caption, { marginTop: 4 }]}>Nomor berat: {row.heavy_numbers.join(", ") || "—"}</Text>
            <View style={[styles.badge, { alignSelf: "flex-start", marginTop: 10, paddingVertical: 8 }]}><Text style={[styles.body, { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }]}>{row.formula}</Text></View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

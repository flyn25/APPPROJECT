import { Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AumFormat, IndividualResult, Respondent } from "@/src/api";
import { AnalysisCard } from "@/src/screens/AnalysisCard";
import { useTheme } from "@/src/theme";
import { Icon, IconButton, Legend, Notice, NumberGrid, SecondaryButton, formatLabel, pad3, useStyles } from "@/src/ui";

type Props = { result: IndividualResult; respondent: Respondent; format?: AumFormat; onClose: () => void; onExport: (format: "xlsx" | "pdf") => void; onDelete: () => void; onAudit: () => void };

export function IndividualResultView({ result, respondent, format, onClose, onExport, onDelete, onAudit }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const step = respondent.third_step || {};
  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={[styles.between, { paddingHorizontal: 20, paddingVertical: 12 }]}>
        <IconButton testID="result-close" icon="arrow-back" onPress={onClose} />
        <Text style={styles.h3}>Hasil AUM Individual</Text>
        <View style={[styles.row, { gap: 8 }]}>
          <IconButton testID="result-delete" icon="trash-outline" tint={colors.error} onPress={onDelete} />
          <IconButton testID="result-share" icon="share-outline" tint={colors.brandPrimary} onPress={() => onExport("pdf")} />
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.heroCard}>
          <Text style={[styles.caption, { color: colors.brandTertiary, fontWeight: "800", letterSpacing: 0.8 }]}>RAHASIA · HASIL DESKRIPTIF</Text>
          <Text style={[styles.h2, { color: colors.onSurfaceInverse, marginTop: 10 }]}>{respondent.name}</Text>
          <Text style={[styles.heroCaption, { marginTop: 5 }]}>{respondent.class_name || "Responden"} · {respondent.respondent_id || "—"} · {formatLabel(respondent.format_id)} · TA {respondent.academic_year || "—"}</Text>
          <View style={[styles.row, { marginTop: 20, gap: 26 }]}>
            <View><Text style={styles.heroNumber}>{result.total_problems}</Text><Text style={styles.heroCaption}>masalah</Text></View>
            <View><Text style={[styles.heroNumber, { color: colors.warning }]}>{result.total_heavy_problems}</Text><Text style={styles.heroCaption}>berat</Text></View>
            <View><Text style={styles.heroNumber}>{result.overall_percentage}%</Text><Text style={styles.heroCaption}>dari {format?.total_items || "—"} item</Text></View>
          </View>
        </View>

        {format && (
          <View style={styles.card} testID="result-number-map">
            <View style={styles.between}><Text style={styles.h3}>Peta nomor yang dipilih</Text><Text style={styles.caption}>{result.total_problems} dari {format.total_items}</Text></View>
            <Legend />
            <NumberGrid total={format.total_items} selected={respondent.selected_problem_numbers} heavy={respondent.heavy_problem_numbers} readOnly testPrefix="map" />
          </View>
        )}

        <AnalysisCard scope="individual" identifier={respondent.id} />

        <View style={styles.card}>
          <Text style={styles.h3}>Per bidang masalah</Text>
          {result.rows.map((row) => (
            <View key={row.domain_code} style={{ marginTop: 18 }}>
              <View style={styles.between}>
                <View style={{ flex: 1 }}><Text style={styles.h3}>{row.domain_code} <Text style={styles.caption}>· {row.domain_name}</Text></Text></View>
                <Text style={[styles.caption, { fontWeight: "800" }]}>{row.count} · {row.percentage}%</Text>
              </View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, Math.max(row.percentage, row.count ? 3 : 0))}%` }]} /></View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {row.problem_numbers.length ? row.problem_numbers.map((n) => {
                  const heavy = row.heavy_problem_numbers.includes(n);
                  return <View key={n} style={[styles.badge, { backgroundColor: heavy ? colors.warning : colors.brandTertiary }]}><Text style={[styles.badgeText, { color: heavy ? colors.onWarning : colors.onBrandTertiary }]}>{pad3(n)}</Text></View>;
                }) : <Text style={styles.caption}>Tidak ada nomor terpilih</Text>}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.h3}>Informasi Langkah 3</Text>
          <View style={[styles.listRow, { borderBottomWidth: 0, paddingBottom: 4 }]}><Icon name="checkmark-done-outline" color={colors.muted} size={18} /><Text style={[styles.body, { flex: 1 }]}>Menggambarkan keseluruhan: <Text style={{ fontWeight: "800" }}>{step.complete || "—"}</Text></Text></View>
          <View style={[styles.listRow, { borderBottomWidth: 0, paddingBottom: 4 }]}><Icon name="chatbubbles-outline" color={colors.muted} size={18} /><Text style={[styles.body, { flex: 1 }]}>Ingin konseling: <Text style={{ fontWeight: "800" }}>{step.want_discussion === "Ya" ? `Ya, kepada ${step.discussion_with || "Guru BK"}` : step.want_discussion || "—"}</Text></Text></View>
          <View style={[styles.listRow, { borderBottomWidth: 0 }]}><Icon name="document-text-outline" color={colors.muted} size={18} /><Text style={[styles.body, { flex: 1 }]}>Masalah lain: {step.other_problems || "—"}</Text></View>
        </View>

        <Notice text="Masalah yang terungkap dapat menjadi bahan pertimbangan Guru BK untuk tindak lanjut. Bukan diagnosis." />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><SecondaryButton testID="result-export-xlsx" title="Excel" icon="document-attach-outline" onPress={() => onExport("xlsx")} /></View>
          <View style={{ flex: 1 }}><SecondaryButton testID="result-export-pdf" title="PDF Tabel 7" icon="document-text-outline" onPress={() => onExport("pdf")} /></View>
        </View>
        <View style={{ marginTop: 10 }}><SecondaryButton testID="result-audit" title="Telusuri rumus perhitungan" icon="calculator-outline" onPress={onAudit} /></View>
        {Platform.OS === "web" && <Text style={[styles.caption, { marginTop: 10, textAlign: "center" }]}>Di web, file akan terbuka pada tab baru.</Text>}
      </ScrollView>
    </View>
  );
}

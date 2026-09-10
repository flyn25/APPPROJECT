import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Analysis, generateAiAnalysis, getAnalysis } from "@/src/api";
import { useTheme } from "@/src/theme";
import { Icon, useStyles } from "@/src/ui";

export function AnalysisCard({ scope, identifier, refreshKey = 0 }: { scope: "individual" | "group" | "school"; identifier: string; refreshKey?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await getAnalysis(scope, identifier)); }
    catch (e) { setError(e instanceof Error ? e.message : "Analisis belum tersedia."); }
    finally { setLoading(false); }
  }, [scope, identifier]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const runAi = async () => {
    setAiLoading(true); setError("");
    try { const response = await generateAiAnalysis(scope, identifier); setData((current) => current ? { ...current, ai_narrative: response.narrative } : current); }
    catch (e) { setError(e instanceof Error ? e.message : "Narasi AI belum dapat dibuat."); }
    finally { setAiLoading(false); }
  };

  if (loading) return <View style={[styles.card, { alignItems: "center", paddingVertical: 22 }]}><ActivityIndicator color={colors.brandPrimary} /><Text style={[styles.caption, { marginTop: 8 }]}>Menyusun analisis...</Text></View>;
  if (!data) return <View style={styles.card}><Text style={styles.h3}>Analisis belum tersedia</Text><Text style={[styles.body, { marginTop: 6 }]}>{error || "Tambahkan data terlebih dahulu."}</Text></View>;

  return (
    <View style={styles.card} testID={`analysis-card-${scope}`}>
      <View style={styles.between}>
        <View style={[styles.row, { gap: 10, flex: 1 }]}>
          <View style={styles.iconBubble}><Icon name="bulb-outline" color={colors.onBrandTertiary} /></View>
          <View style={{ flex: 1 }}><Text style={styles.h3}>Analisis & rekomendasi</Text><Text style={styles.caption}>Deterministik · bukan diagnosis</Text></View>
        </View>
      </View>

      {data.priorities.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {data.priorities.map((p, index) => (
            <View key={p.code} style={[styles.badge, { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: index === 0 ? colors.brandPrimary : colors.brandTertiary }]}>
              <Text style={[styles.badgeText, { color: index === 0 ? colors.onBrandPrimary : colors.onBrandTertiary }]}>{index + 1}. {p.code} · {p.percentage}{scope === "school" ? "/siswa" : "%"}</Text>
              <Text style={[styles.caption, { color: index === 0 ? colors.onBrandPrimary : colors.onBrandTertiary, opacity: 0.85, marginTop: 2 }]}>{p.label}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.label, { marginTop: 16 }]}>TEMUAN</Text>
      {data.highlights.map((line, index) => (
        <View key={index} style={[styles.row, { alignItems: "flex-start", gap: 8, marginTop: 6 }]}><Icon name="ellipse" size={7} color={colors.brandPrimary} /><Text style={[styles.body, { flex: 1, marginTop: -3 }]}>{line}</Text></View>
      ))}

      {data.recommendations.length > 0 && (
        <>
          <Text style={styles.label}>SARAN LAYANAN BK</Text>
          {data.recommendations.map((line, index) => (
            <View key={index} style={[styles.row, { alignItems: "flex-start", gap: 8, marginTop: 6 }]}><Icon name="checkmark-circle-outline" size={17} color={colors.success} /><Text style={[styles.body, { flex: 1 }]}>{line}</Text></View>
          ))}
        </>
      )}

      <View style={styles.divider} />
      <View style={styles.between}>
        <View style={[styles.row, { gap: 8 }]}><Icon name="sparkles-outline" size={17} color={colors.info} /><Text style={styles.h3}>Narasi AI (pendukung)</Text></View>
        <Pressable testID={`analysis-ai-button-${scope}`} onPress={runAi} disabled={aiLoading} style={[styles.chip, { backgroundColor: colors.info, opacity: aiLoading ? 0.6 : 1 }]}>
          {aiLoading ? <ActivityIndicator size="small" color={colors.onInfo} /> : <Icon name={data.ai_narrative ? "refresh-outline" : "sparkles-outline"} size={14} color={colors.onInfo} />}
          <Text style={[styles.chipText, { color: colors.onInfo }]}>{aiLoading ? "Menulis..." : data.ai_narrative ? "Perbarui" : "Buat narasi"}</Text>
        </Pressable>
      </View>
      {data.ai_narrative ? <Text testID={`analysis-ai-text-${scope}`} style={[styles.body, { marginTop: 10 }]}>{data.ai_narrative}</Text> : <Text style={[styles.caption, { marginTop: 8 }]}>Narasi AI ditulis dari temuan deterministik di atas, tidak mengubah skor, dan ikut tercetak pada PDF setelah dibuat.</Text>}
      {error ? <Text style={[styles.caption, { color: colors.error, marginTop: 8 }]}>{error}</Text> : null}

      <Pressable onPress={() => setShowRules(!showRules)} style={[styles.row, { gap: 6, marginTop: 14 }]} testID={`analysis-rules-toggle-${scope}`}>
        <Icon name={showRules ? "chevron-up" : "chevron-down"} size={15} color={colors.muted} /><Text style={styles.caption}>Aturan analisis yang dipakai</Text>
      </Pressable>
      {showRules && data.rules.map((rule, index) => <Text key={index} style={[styles.caption, { marginTop: 4, paddingLeft: 21 }]}>• {rule}</Text>)}
    </View>
  );
}

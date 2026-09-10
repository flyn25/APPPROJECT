import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { KonselingBoard, KonselingItem } from "@/src/api";
import { useTheme } from "@/src/theme";
import { Chip, EmptyState, Field, Icon, IconButton, PrimaryButton, ScreenHeader, SecondaryButton, Sheet, useStyles } from "@/src/ui";

const STATUSES = ["Belum", "Dijadwalkan", "Selesai"] as const;

type Props = { board: KonselingBoard | null; loading: boolean; onRefresh: () => void; onUpdate: (item: KonselingItem, status: string, note: string) => Promise<void>; onOpen: (item: KonselingItem) => void };

export function KonselingView({ board, loading, onRefresh, onUpdate, onOpen }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<string>("Semua");
  const [editing, setEditing] = useState<KonselingItem | null>(null);
  const [status, setStatus] = useState<string>("Belum");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const statusColor = (s: string) => (s === "Selesai" ? colors.success : s === "Dijadwalkan" ? colors.info : colors.warning);
  const items = (board?.items || []).filter((i) => filter === "Semua" || i.status === filter);
  const openEditor = (item: KonselingItem) => { setEditing(item); setStatus(item.status); setNote(item.note || ""); };
  const save = async () => { if (!editing) return; setSaving(true); try { await onUpdate(editing, status, note); setEditing(null); } finally { setSaving(false); } };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Konseling" subtitle="Siswa yang ingin membicarakan masalah (Langkah 3)" right={<IconButton testID="refresh-button" icon="refresh-outline" tint={colors.brandPrimary} onPress={onRefresh} />} />
      <View style={styles.metricGrid}>
        {STATUSES.map((s) => (
          <Pressable key={s} testID={`konseling-count-${s}`} onPress={() => setFilter(filter === s ? "Semua" : s)} style={[styles.metric, { flexBasis: "30%", minHeight: 92, borderColor: filter === s ? statusColor(s) : colors.border }]}>
            <View style={[styles.legendDot, { backgroundColor: statusColor(s) }]} />
            <View><Text style={styles.metricValue}>{board?.counts?.[s] ?? 0}</Text><Text style={styles.metricLabel}>{s}</Text></View>
          </Pressable>
        ))}
      </View>
      <View style={[styles.row, { gap: 8, marginTop: 6, marginBottom: 14 }]}>
        <Chip label="Semua" active={filter === "Semua"} onPress={() => setFilter("Semua")} testID="konseling-filter-all" />
        <Text style={styles.caption}>{items.length} siswa{filter !== "Semua" ? ` · ${filter}` : ""}</Text>
      </View>
      {loading && !board ? <Text style={styles.body}>Memuat papan konseling...</Text> : null}
      {items.map((item) => (
        <View key={item.id} style={[styles.card, { padding: 16 }]} testID={`konseling-item-${item.id}`}>
          <View style={[styles.row, { gap: 12 }]}>
            <Pressable onPress={() => onOpen(item)} style={[styles.row, { flex: 1, gap: 12 }]} testID={`konseling-open-${item.id}`}>
              <View style={[styles.avatar, { backgroundColor: statusColor(item.status) }]}><Text style={[styles.avatarText, { color: colors.onBrandPrimary }]}>{item.name.slice(0, 1).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.h3}>{item.name}</Text>
                <Text style={styles.caption}>{item.class_name || "—"} · {item.total_problems} masalah · {item.total_heavy} berat · TA {item.academic_year || "—"}</Text>
              </View>
            </Pressable>
            <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}><Text style={[styles.badgeText, { color: colors.onBrandPrimary }]}>{item.status}</Text></View>
          </View>
          <View style={[styles.row, { gap: 8, marginTop: 12, flexWrap: "wrap" }]}>
            <View style={[styles.badge, { backgroundColor: colors.brandTertiary }]}><Text style={[styles.badgeText, { color: colors.onBrandTertiary }]}>Kepada: {item.discussion_with || "Guru BK"}</Text></View>
            {item.other_problems ? <View style={styles.badge}><Text style={styles.badgeText} numberOfLines={1}>Catatan siswa: {item.other_problems}</Text></View> : null}
          </View>
          {item.note ? <Text style={[styles.body, { marginTop: 10 }]}><Text style={{ fontWeight: "800" }}>Tindak lanjut:</Text> {item.note}</Text> : null}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {STATUSES.filter((s) => s !== item.status).map((s) => <View key={s} style={{ flex: 1 }}><SecondaryButton testID={`konseling-set-${s}-${item.id}`} title={s} icon={s === "Selesai" ? "checkmark-done-outline" : s === "Dijadwalkan" ? "calendar-outline" : "time-outline"} onPress={() => onUpdate(item, s, item.note)} /></View>)}
            <IconButton testID={`konseling-note-${item.id}`} icon="create-outline" tint={colors.brandPrimary} onPress={() => openEditor(item)} />
          </View>
        </View>
      ))}
      {!loading && !items.length && <EmptyState icon="chatbubbles-outline" title={filter === "Semua" ? "Belum ada permintaan konseling" : `Tidak ada status ${filter}`} message="Siswa yang menjawab 'Ya' pada pertanyaan ingin membicarakan masalah akan muncul di sini." testID="empty-konseling" />}

      <Sheet visible={!!editing} onClose={() => setEditing(null)} testID="konseling-sheet">
        <Text style={styles.h2}>Tindak lanjut · {editing?.name}</Text>
        <Text style={[styles.caption, { marginTop: 4 }]}>Catat jadwal, hasil sesi, atau rujukan. Catatan ini hanya tampak pada akun Anda.</Text>
        <Text style={styles.label}>STATUS</Text>
        <View style={[styles.row, { gap: 8 }]}>{STATUSES.map((s) => <Chip key={s} label={s} active={status === s} onPress={() => setStatus(s)} testID={`konseling-sheet-status-${s}`} />)}</View>
        <Field testID="konseling-note-input" label="CATATAN TINDAK LANJUT" value={note} onChangeText={setNote} placeholder="Contoh: Sesi konseling Senin 10.00 di ruang BK" multiline />
        <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
          <View style={{ flex: 1 }}><SecondaryButton title="Batal" onPress={() => setEditing(null)} /></View>
          <View style={{ flex: 1 }}><PrimaryButton testID="konseling-sheet-save" title={saving ? "Menyimpan..." : "Simpan"} icon="checkmark" onPress={save} disabled={saving} /></View>
        </View>
        <View style={{ height: 8 }} />
        <Text style={[styles.caption, { textAlign: "center" }]}><Icon name="lock-closed-outline" size={11} color={colors.muted} /> Data konseling bersifat rahasia</Text>
      </Sheet>
    </ScrollView>
  );
}

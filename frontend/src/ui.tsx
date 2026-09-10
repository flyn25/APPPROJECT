import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { makeStyles, useTheme } from "@/src/theme";

export type IconName = keyof typeof Ionicons.glyphMap;

export const useStyles = makeStyles((colors) => StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 20, paddingBottom: 124 },
  screenHeader: { paddingTop: 12, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { color: colors.brandPrimary, fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  h1: { color: colors.onSurface, fontSize: 28, fontWeight: "800", letterSpacing: -0.6 },
  h2: { color: colors.onSurface, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  h3: { color: colors.onSurfaceSecondary, fontSize: 15, fontWeight: "700" },
  body: { color: colors.onSurfaceTertiary, fontSize: 14, lineHeight: 21 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  label: { color: colors.onSurfaceTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, marginTop: 16, marginBottom: 6 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 14, ...Platform.select({ web: { boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)" } as object, default: { shadowColor: colors.onSurface, shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 } }) },
  softCard: { backgroundColor: colors.brandTertiary, borderRadius: 22, padding: 18, marginBottom: 14 },
  heroCard: { backgroundColor: colors.surfaceInverse, borderRadius: 26, padding: 22, marginBottom: 18 },
  heroNumber: { color: colors.onSurfaceInverse, fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  heroCaption: { color: colors.onSurfaceInverse, opacity: 0.7, fontSize: 12 },
  primaryButton: { minHeight: 52, paddingHorizontal: 18, borderRadius: 16, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondaryButton: { minHeight: 50, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  dangerButton: { minHeight: 50, paddingHorizontal: 16, borderRadius: 16, backgroundColor: colors.error, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  buttonText: { color: colors.onBrandPrimary, fontSize: 14, fontWeight: "800" },
  secondaryText: { color: colors.onSurfaceSecondary, fontSize: 14, fontWeight: "800" },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 14, color: colors.onSurface, fontSize: 15 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  chipActive: { backgroundColor: colors.brandPrimary },
  chipText: { color: colors.onSurfaceTertiary, fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: colors.onBrandPrimary },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 6 },
  metric: { flexGrow: 1, flexBasis: "46%", minHeight: 104, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, justifyContent: "space-between" },
  metricValue: { color: colors.onSurface, fontSize: 26, fontWeight: "800", letterSpacing: -0.8 },
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center" },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBubble: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  circleButton: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary },
  listRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.onBrandTertiary, fontSize: 15, fontWeight: "800" },
  tabBar: { position: "absolute", left: 14, right: 14, bottom: 12, minHeight: 70, borderRadius: 26, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: 4, ...Platform.select({ web: { boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)" } as object, default: { shadowColor: colors.onSurface, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 } }) },
  tabItem: { flex: 1, minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  tabActive: { backgroundColor: colors.brandTertiary },
  tabLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", marginTop: 3 },
  tabLabelActive: { color: colors.brandPrimary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceTertiary, overflow: "hidden", marginTop: 8 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.brandPrimary },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5, backgroundColor: colors.brandSecondary },
  numberGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 12 },
  number: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  numberSelected: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  numberHeavy: { backgroundColor: colors.warning, borderColor: colors.warning },
  numberText: { color: colors.onSurfaceTertiary, fontSize: 12, fontWeight: "800" },
  numberTextOn: { color: colors.onBrandPrimary },
  stickyAction: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceSecondary },
  notice: { borderRadius: 16, padding: 14, backgroundColor: colors.brandTertiary, flexDirection: "row", gap: 10, marginBottom: 14, alignItems: "flex-start" },
  noticeText: { flex: 1, color: colors.onBrandTertiary, fontSize: 12, lineHeight: 17 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.55)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 36 },
  sheetHandle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 16 },
  segmented: { flexDirection: "row", backgroundColor: colors.surfaceTertiary, borderRadius: 16, padding: 4, marginBottom: 16 },
  segmentedItem: { flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: "center" },
  segmentedActive: { backgroundColor: colors.surfaceSecondary },
  tableCell: { paddingVertical: 10, paddingHorizontal: 8 },
  tableHeaderCell: { paddingVertical: 10, paddingHorizontal: 8, backgroundColor: colors.surfaceTertiary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: colors.surfaceTertiary },
  badgeText: { fontSize: 11, fontWeight: "800", color: colors.onSurfaceTertiary },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },
}));

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function PrimaryButton({ title, icon, onPress, disabled = false, testID }: { title: string; icon?: IconName; onPress: () => void; disabled?: boolean; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}>
      {icon && <Icon name={icon} color={colors.onBrandPrimary} size={18} />}
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, icon, onPress, testID, danger = false }: { title: string; icon?: IconName; onPress: () => void; testID?: string; danger?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tint = danger ? colors.error : colors.onSurfaceSecondary;
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.secondaryButton, danger && { borderColor: colors.error }, { opacity: pressed ? 0.75 : 1 }]}>
      {icon && <Icon name={icon} color={tint} size={18} />}
      <Text style={[styles.secondaryText, { color: tint }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, testID, tint, background }: { icon: IconName; onPress: () => void; testID?: string; tint?: string; background?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.circleButton, background ? { backgroundColor: background } : null, { opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} color={tint || colors.onSurfaceSecondary} />
    </Pressable>
  );
}

export function Chip({ label, active, onPress, testID, icon }: { label: string; active: boolean; onPress: () => void; testID?: string; icon?: IconName }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {icon && <Icon name={icon} size={14} color={active ? colors.onBrandPrimary : colors.onSurfaceTertiary} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, testID, keyboardType, secureTextEntry, autoCapitalize, multiline }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; testID?: string; keyboardType?: "default" | "email-address" | "number-pad" | "numeric"; secureTextEntry?: boolean; autoCapitalize?: "none" | "sentences" | "words"; multiline?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput testID={testID} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} multiline={multiline} style={[styles.input, multiline && { minHeight: 96, paddingTop: 13, textAlignVertical: "top" }]} />
    </>
  );
}

export function MetricCard({ label, value, icon, accent = false, testID }: { label: string; value: string | number; icon: IconName; accent?: boolean; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View testID={testID} style={[styles.metric, accent && { backgroundColor: colors.brandTertiary, borderColor: colors.brandTertiary }]}>
      <Icon name={icon} size={20} color={accent ? colors.onBrandTertiary : colors.muted} />
      <View>
        <Text style={[styles.metricValue, accent && { color: colors.onBrandTertiary }]}>{value}</Text>
        <Text style={[styles.metricLabel, accent && { color: colors.onBrandTertiary, opacity: 0.8 }]}>{label}</Text>
      </View>
    </View>
  );
}

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle: string; right?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.screenHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>AUM Umum BK</Text>
        <Text style={[styles.h1, { marginTop: 4 }]}>{title}</Text>
        <Text style={[styles.caption, { marginTop: 4 }]}>{subtitle}</Text>
      </View>
      {right}
    </View>
  );
}

export function EmptyState({ icon, title, message, testID }: { icon: IconName; title: string; message: string; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View testID={testID} style={[styles.card, { alignItems: "center", paddingVertical: 30 }]}>
      <View style={[styles.iconBubble, { width: 56, height: 56, borderRadius: 20 }]}><Icon name={icon} size={26} color={colors.onBrandTertiary} /></View>
      <Text style={[styles.h3, { marginTop: 14, textAlign: "center" }]}>{title}</Text>
      <Text style={[styles.body, { marginTop: 6, textAlign: "center" }]}>{message}</Text>
    </View>
  );
}

export function Notice({ icon = "information-circle-outline", text }: { icon?: IconName; text: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.notice}>
      <Icon name={icon} color={colors.onBrandTertiary} size={18} />
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
}

export function Loading({ text }: { text: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { alignItems: "center", paddingVertical: 28 }]}>
      <ActivityIndicator color={colors.brandPrimary} />
      <Text style={[styles.body, { marginTop: 12 }]}>{text}</Text>
    </View>
  );
}

export function Sheet({ visible, onClose, children, testID }: { visible: boolean; onClose: () => void; children: ReactNode; testID?: string }) {
  const styles = useStyles();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.modalSheet} testID={testID}>
          <View style={styles.sheetHandle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

export type ConfirmRequest = { title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void | Promise<void> };

export function ConfirmSheet({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Sheet visible={!!request} onClose={onClose} testID="confirm-sheet">
      {request && (
        <>
          <View style={[styles.iconBubble, request.danger && { backgroundColor: colors.error }]}>
            <Icon name={request.danger ? "trash-outline" : "help-circle-outline"} color={request.danger ? colors.onError : colors.onBrandTertiary} />
          </View>
          <Text style={[styles.h2, { marginTop: 14 }]}>{request.title}</Text>
          <Text style={[styles.body, { marginTop: 8 }]}>{request.message}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
            <View style={{ flex: 1 }}><SecondaryButton testID="confirm-cancel" title="Batal" onPress={onClose} /></View>
            <View style={{ flex: 1 }}>
              <Pressable testID="confirm-accept" onPress={async () => { await request.onConfirm(); onClose(); }} style={({ pressed }) => [request.danger ? styles.dangerButton : styles.primaryButton, { opacity: pressed ? 0.8 : 1 }]}>
                <Text style={[styles.buttonText, request.danger && { color: colors.onError }]}>{request.confirmLabel || (request.danger ? "Hapus" : "Lanjutkan")}</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </Sheet>
  );
}

export function NumberGrid({ total, selected, heavy, onPress, filter, testPrefix = "num", readOnly = false }: { total: number; selected: number[]; heavy: number[]; onPress?: (n: number) => void; filter?: string; testPrefix?: string; readOnly?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const numbers = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !filter || String(n).includes(filter));
  return (
    <View style={styles.numberGrid}>
      {numbers.map((n) => {
        const isHeavy = heavy.includes(n);
        const isSelected = selected.includes(n);
        return (
          <Pressable key={n} testID={`${testPrefix}-${n}`} disabled={readOnly} onPress={() => onPress?.(n)} style={[styles.number, readOnly && { width: 40, height: 40, borderRadius: 12 }, isSelected && styles.numberSelected, isHeavy && styles.numberHeavy]}>
            <Text style={[styles.numberText, readOnly && { fontSize: 11 }, (isSelected || isHeavy) && styles.numberTextOn, isHeavy && { color: colors.onWarning }]}>{String(n).padStart(3, "0")}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Legend() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { gap: 16, marginTop: 12 }]}>
      <View style={[styles.row, { gap: 6 }]}><View style={[styles.legendDot, { backgroundColor: colors.brandPrimary }]} /><Text style={styles.caption}>Dipilih</Text></View>
      <View style={[styles.row, { gap: 6 }]}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.caption}>Masalah berat</Text></View>
      <View style={[styles.row, { gap: 6 }]}><View style={[styles.legendDot, { backgroundColor: colors.surfaceTertiary, borderWidth: 1, borderColor: colors.border }]} /><Text style={styles.caption}>Tidak</Text></View>
    </View>
  );
}

export const formatLabel = (formatId: string) => formatId.replace("format_", "Format ");
export const pad3 = (n: number) => String(n).padStart(3, "0");
export const parseNumbers = (text: string): number[] => Array.from(new Set((text.match(/\d+/g) || []).map((v) => parseInt(v, 10)).filter((v) => v > 0))).sort((a, b) => a - b);

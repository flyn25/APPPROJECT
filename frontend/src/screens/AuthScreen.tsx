import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme";
import { Chip, Field, Icon, Notice, PrimaryButton, useStyles } from "@/src/ui";

export function AuthScreen({ onSubmit, loading, error }: { onSubmit: (name: string, email: string, password: string, isRegister: boolean) => void; loading: boolean; error: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.page, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ justifyContent: "center", flexGrow: 1, padding: 24, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.iconBubble, { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.brandPrimary, marginBottom: 20 }]}><Icon name="leaf-outline" size={30} color={colors.onBrandPrimary} /></View>
        <Text style={styles.eyebrow}>Ruang kerja Guru BK</Text>
        <Text style={[styles.h1, { marginTop: 8 }]}>AUM Umum{"\n"}BK Mobile</Text>
        <Text style={[styles.body, { marginTop: 14, maxWidth: 330 }]}>Kelola input, pengolahan, dan profil masalah AUM secara rapi, deterministik, dan rahasia.</Text>
        <View style={{ marginTop: 22 }}><Notice icon="lock-closed-outline" text="Data AUM adalah data rahasia dan tersimpan hanya pada akun Anda. Aplikasi tidak membuat diagnosis psikologis." /></View>
        <View style={[styles.segmented, { marginBottom: 4 }]}>
          <Pressable onPress={() => setIsRegister(false)} testID="auth-tab-login" style={[styles.segmentedItem, !isRegister && styles.segmentedActive]}><Text style={[styles.caption, { fontWeight: "800", color: !isRegister ? colors.brandPrimary : colors.muted }]}>Masuk</Text></Pressable>
          <Pressable onPress={() => setIsRegister(true)} testID="auth-tab-register" style={[styles.segmentedItem, isRegister && styles.segmentedActive]}><Text style={[styles.caption, { fontWeight: "800", color: isRegister ? colors.brandPrimary : colors.muted }]}>Buat akun</Text></Pressable>
        </View>
        {isRegister && <Field testID="auth-name" label="NAMA LENGKAP" value={name} onChangeText={setName} placeholder="Nama Guru BK" autoCapitalize="words" />}
        <Field testID="auth-email" label="EMAIL" value={email} onChangeText={setEmail} placeholder="nama@sekolah.id" keyboardType="email-address" autoCapitalize="none" />
        <Field testID="auth-password" label="KATA SANDI" value={password} onChangeText={setPassword} placeholder="Minimal 8 karakter" secureTextEntry />
        {error ? <Text testID="auth-error" style={{ color: colors.error, marginTop: 12, fontSize: 13 }}>{error}</Text> : null}
        <View style={{ marginTop: 22 }}>
          <PrimaryButton testID="auth-submit" title={loading ? "Memproses..." : isRegister ? "Buat akun aman" : "Masuk ke ruang kerja"} icon={loading ? undefined : "arrow-forward"} onPress={() => onSubmit(name, email, password, isRegister)} disabled={loading} />
        </View>
        {loading && <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 16 }} />}
        <View style={[styles.row, { justifyContent: "center", gap: 8, marginTop: 20 }]}>
          <Chip label={isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"} active={false} onPress={() => setIsRegister(!isRegister)} testID="auth-switch" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

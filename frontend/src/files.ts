import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert, Linking, Platform } from "react-native";

import { getAuthHeaders, getExportUrl, getImportTemplateUrl, uploadImport } from "@/src/api";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function downloadAndShare(url: string, filename: string, mimeType: string) {
  if (Platform.OS === "web") { await Linking.openURL(url); return; }
  const directory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  if (!directory) throw new Error("Folder penyimpanan tidak tersedia.");
  const downloaded = await FileSystem.downloadAsync(url, `${directory}${filename}`, { headers: getAuthHeaders() });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(downloaded.uri, { mimeType });
  else Alert.alert("File siap", downloaded.uri);
}

export async function shareExport(scope: "individual" | "group", identifier: string, format: "xlsx" | "pdf") {
  try {
    await downloadAndShare(getExportUrl(scope, identifier, format), `${scope === "individual" ? "hasil-aum-individual" : "hasil-aum-kelompok"}.${format}`, format === "pdf" ? "application/pdf" : XLSX_MIME);
  } catch (error) { Alert.alert("Export gagal", error instanceof Error ? error.message : "File belum dapat dibuat."); }
}

export async function downloadImportTemplate() {
  try { await downloadAndShare(getImportTemplateUrl(), "template-import-aum.xlsx", XLSX_MIME); }
  catch (error) { Alert.alert("Template gagal", error instanceof Error ? error.message : "Template belum dapat diunduh."); }
}

export async function chooseImport(onSuccess: (message: string) => void) {
  try {
    const picked = await DocumentPicker.getDocumentAsync({ type: [XLSX_MIME, "text/csv"], copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    const formData = new FormData();
    if (Platform.OS === "web" && asset.file) formData.append("file", asset.file);
    else formData.append("file", { uri: asset.uri, name: asset.name, type: asset.mimeType || XLSX_MIME } as unknown as Blob);
    const result = await uploadImport(formData);
    onSuccess(`${result.imported} baris berhasil diimport secara transaksional.`);
  } catch (error) { Alert.alert("Import ditolak", error instanceof Error ? error.message : "Periksa format dan isi file."); }
}

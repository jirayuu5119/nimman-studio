import { supabase } from "./supabase";

export async function uploadSlip(file: File) {
  const ext = file.name.split(".").pop();

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${ext}`;

  const path = `slips/${fileName}`;

  const { error } = await supabase.storage
    .from("slips")
    .upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("slips")
    .getPublicUrl(path);

  return data.publicUrl;
}
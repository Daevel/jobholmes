import "server-only";

import { del, get, put } from "@vercel/blob";

export async function uploadPrivateCvPdf(pathname: string, bytes: Buffer) {
  return put(pathname, bytes, {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
  });
}

export async function getPrivateCvPdf(storagePath: string) {
  const blob = await get(storagePath, { access: "private" });
  return blob && blob.statusCode === 200 ? blob : null;
}

export async function deletePrivateCvPdf(storagePath: string) {
  try {
    await del(storagePath);
  } catch (error) {
    console.error("CV blob delete failed", { storagePath, error });
  }
}

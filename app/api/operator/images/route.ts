import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizePathPart(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "draft-resort"
  );
}

function userError(check: Awaited<ReturnType<typeof verifyAuthenticatedRequest>>) {
  return NextResponse.json({ error: check.ok ? "Unexpected session check state." : check.message }, {
    status: check.ok ? 500 : check.status,
  });
}

export async function POST(request: Request) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folderValue = String(formData.get("folder") ?? "");
  const folder = folderValue === "gallery"
    ? "gallery"
    : folderValue === "hero"
      ? "hero"
      : folderValue === "page-hero"
        ? "page-hero"
        : folderValue === "page-content"
          ? "page-content"
          : null;
  const slug = sanitizePathPart(String(formData.get("slug") ?? ""));

  if (!(file instanceof File) || !folder) {
    return NextResponse.json({ error: "Upload requires a file and a valid folder." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const filePath = `${user.userId}/${slug}/${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from("resort-images").upload(filePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("resort-images").getPublicUrl(filePath);
  return NextResponse.json({ publicUrl: data.publicUrl });
}

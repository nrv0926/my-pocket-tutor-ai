import { notFound } from "next/navigation";
import PreviewGallery from "./gallery";

/**
 * Visual QA for the components that only render behind auth — the worksheet,
 * the progress tiles, the profile form, the nine-section plan. Without this
 * they can only be reviewed by signing in against a live Supabase project.
 *
 * Development only: 404s in production so it never ships as a public route.
 */
export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewGallery />;
}

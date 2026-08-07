import { redirect } from "next/navigation";

/** The Academy always opens on the journey, the way /map opens on a module. */
export default function AcademyIndex() {
  redirect("/academy/journey");
}

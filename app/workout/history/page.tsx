import { redirect } from "next/navigation";

export default function WorkoutHistoryRedirect() {
  redirect("/workout/history/day");
}

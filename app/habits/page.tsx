import { redirect } from 'next/navigation';

export default function HabitsRedirect() {
  redirect('/habits/daily-log');
}

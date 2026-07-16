import { redirect } from 'next/navigation';

export default function ExpensesRedirect() {
  redirect('/expenses/daily-entry');
}

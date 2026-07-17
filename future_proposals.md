# Life OS: Future Pro-Feature Roadmap & Proposals

This document acts as a blueprint and comprehensive checklist for premium, high-utility features to extend the **Personal Operating System**.

---

## 📋 Table of Contents
1. [Recurring Transactions & Subscription Tracker (Finance)](#1-recurring-transactions--subscription-tracker-finance)
2. [Rule-Based Personal Finance Advisor (Finance Insights)](#2-rule-based-personal-finance-advisor-finance-insights)
3. [Preset Routine & Workout Template Builder (Workouts)](#3-preset-routine--workout-template-builder-workouts)
4. [Vehicle Fuel Anomaly Alert (Vehicles)](#4-vehicle-fuel-anomaly-alert-vehicles)
5. [Habit Stacking & Duolingo-style Streak Freeze (Habits)](#5-habit-stacking--duolingo-style-streak-freeze-habits)
6. [Unified "Life Velocity" Index (Unified Performance Score)](#6-unified-life-velocity-index-unified-performance-score)
7. [Side-Hustle Invoice & Payment Ledger (Finance Pro)](#7-side-hustle-invoice--payment-ledger-finance-pro)
8. [Hydration Tracker & Weight Trend Correlation (Health/Wellness)](#8-hydration-tracker--weight-trend-correlation-healthwellness)
9. [Vehicle Trip Log & Business Tax Mileage Calculator (Vehicles Pro)](#9-vehicle-trip-log--business-tax-mileage-calculator-vehicles-pro)
10. [Personal Library, Courses & Media Log (Knowledge Inventory)](#10-personal-library-courses--media-log-knowledge-inventory)
11. [Sidecar Integration: Morning WhatsApp/Telegram Digest](#11-sidecar-integration-morning-whatsapptelegram-digest)
12. [Database Auditor & JSON Export Backups (Admin Panel)](#12-database-auditor--json-export-backups-admin-panel)

---

## 1. 📈 Recurring Transactions & Subscription Tracker (Finance)
- **Concept**: A management ledger and dashboard calendar specifically for tracking fixed recurring expenses (subscriptions, rent, utilities, insurance, EMIs).
- **Core Benefits**:
  - Automatically calculates a **"Commitment Forecast"** showing pre-committed cash outflow for the upcoming month.
  - Highlights unused or forgotten "zombie" subscriptions.
  - Interactive calendar displaying countdowns to renewal days.
- **Database Scope**:
  - `budget_recurring` table: `id`, `name`, `amount`, `billing_cycle` (monthly, annual, quarterly), `next_renewal_date`, `category`, `payment_method`.
- **UI Design**: A timeline card with colored warning badges (e.g., *“Gym expires in 3 days”*).

---

## 2. 🤖 Rule-Based Personal Finance Advisor (Finance Insights)
- **Concept**: A client-side analyzer that evaluates your actual expenses, liquidity margins, and planned budget tables to yield actionable notifications in the Action Center.
- **Example Rules**:
  - *Spend Velocity*: Warns if dining out spends exceed the 4-week average by $> 25\%$.
  - *Emergency Buffer*: Flags when liquidity falls below 6 months of average expenses.
  - *Asset Allocation*: Advises shifting money from low-yield accounts to active assets when liquidity is excessively high.
- **Database Scope**: Runs purely client-side utilizing existing `history_expenses` and `liquidity` datasets.
- **UI Design**: Inline alert banner lists inside the System Action Center.

---

## 3. 🏋️ Preset Routine & Workout Template Builder (Workouts)
- **Concept**: Save preset workout configurations (e.g., *"Push Day A"*, *"Leg Day 5x5"*) with pre-selected exercises, target set counts, and standard weights.
- **Core Benefits**:
  - Avoids manual exercise entry during active gym sessions.
  - Select routine ➔ Auto-populates all sets and weights for the day in one tap.
- **Database Scope**:
  - `workout_routines` table: `id`, `routine_name`, `exercise_name`, `target_sets`, `target_reps`, `target_weight`, `order_index`.
- **UI Design**: Quick-launch routine selector cards at the top of the `/workout` logging screen.

---

## 4. 🚗 Vehicle Fuel Anomaly Alert (Vehicles)
- **Concept**: Run statistical analysis on vehicle fuel log entries. If a vehicle's average KM/L efficiency drops by $> 15\%$ on consecutive fuelings, flag a diagnostic check warning.
- **Core Benefits**:
  - Flags early-stage vehicle health issues (e.g., low tyre pressure, dirty air filter, engine misfires).
- **Database Scope**: Processes existing `vehicle_fuel_logs` records.
- **UI Design**: Action Center warning item (e.g., *“⚠️ Honda City fuel efficiency dropped by 18% compared to baseline. Check tyre pressure.”*).

---

## 5. 🎯 Habit Stacking & Duolingo-style Streak Freeze (Habits)
- **Concept**: 
  - **Habit Stacking**: Trigger tasks associated immediately after completing habits.
  - **Streak Freeze**: Monthly configurable "Joker Days" to skip logs without breaking streaks.
- **Core Benefits**:
  - Builds momentum by creating trigger-habit sequences (e.g. *“Drink green tea”* ➔ stacking *“Write journal”*).
  - Encouraging, realistic streaks that don't reset to zero due to travel or sickness.
- **Database Scope**:
  - Columns added to `habit_config`: `streak_freezes_allowed`, `freezes_used_this_month`, `stacked_habit_id`.
- **UI Design**: Shimmering snowflake indicators on the habits checklist page when a streak freeze is applied.

---

## 6. 🏆 Unified "Life Velocity" Index (Unified Performance Score)
- **Concept**: A composite gamified metric ($0 - 100$) evaluating personal efficiency over the last 7 days.
- **Aggregation Formula**:
  - \(50\%\) Habit Consistency
  - \(20\%\) Task Completion Rate (Outflow / Inflow)
  - \(20\%\) Budget adherence (Actual vs. Planned)
  - \(10\%\) Workout targets met
- **Database Scope**: Runs purely client-side by aggregating active states.
- **UI Design**: Radial gauge chart at the absolute top of the Dashboard home page.

---

## 7. 💼 Side-Hustle Invoice & Payment Ledger (Finance Pro)
- **Concept**: A tracker for side incomes, freelancing invoices, or lease collections.
- **Core Benefits**:
  - Tracks payments statuses: *Draft, Sent, Paid, Overdue*.
  - Marking invoices as **Paid** automatically appends an **Income record** in Expenses.
- **Database Scope**:
  - `invoices` table: `id`, `client_name`, `amount`, `issue_date`, `due_date`, `status`, `notes`.
- **UI Design**: Overdue invoices warnings in the Action Center.

---

## 8. 💧 Hydration Tracker & Weight Trend Correlation (Health/Wellness)
- **Concept**: Tap-to-add water tracker (+250ml, +500ml, etc.) plotted alongside daily body weights.
- **Core Benefits**:
  - Visualizes weight fluctuations in comparison with training intensity and hydration patterns on a unified timeline.
- **Database Scope**:
  - `health_log` table: `id`, `date`, `water_ml`, `body_weight_kg`.
- **UI Design**: Glowing water drop icons with fluid wave progress micro-animations.

---

## 9. 🛣️ Vehicle Trip Log & Business Tax Mileage Calculator (Vehicles Pro)
- **Concept**: Logs journeys for business, tax, or reimbursement tracking.
- **Core Benefits**:
  - Mark logs as *Business* vs. *Personal*.
  - Calculates annual tax write-offs dynamically based on local rates (e.g., $₹8\text{ per KM}$).
- **Database Scope**:
  - `vehicle_trip_logs` table: `id`, `vehicle_id`, `date`, `start_odometer`, `end_odometer`, `purpose`, `is_business`.
- **UI Design**: Trip ledger table with export options.

---

## 10. 📚 Personal Library, Courses & Media Log (Knowledge Inventory)
- **Concept**: Track active books, courses, videos, or skill certifications.
- **Core Benefits**:
  - Tracks reading/learning progress percentages.
  - Direct integration with habits: completing reading habits prompts page updates.
- **Database Scope**:
  - `knowledge_items` table: `id`, `title`, `type` (Book, Course, Video), `progress_percentage`, `status` (Queue, Active, Completed).
- **UI Design**: Visual bookshelf layout cards.

---

## 11. 💬 Sidecar Integration: Morning WhatsApp/Telegram Digest
- **Concept**: A simple scheduler sidecar script triggering a morning summary message.
- **Core Benefits**:
  - Receive today's checklist without opening the app: high priority tasks, habit reminders, pending bills, and next vehicle service.
- **Integration**: Simple cron-driven microservice using Twilio/Telegram Bot APIs.

---

## 12. 💾 Database Auditor & JSON Export Backups (Admin Panel)
- **Concept**: A secure database maintenance tab.
- **Core Benefits**:
  - Shows table size metrics, row counts, and schema health tests.
  - Includes a **"Download Complete Backup"** button that exports all tables as a single JSON file.
- **Database Scope**: Directly queries database system statistics schema.
- **UI Design**: Minimalist server diagnostic dashboard showing checkmarks for each table's connection.

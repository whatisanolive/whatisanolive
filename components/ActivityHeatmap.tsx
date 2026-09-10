import { Activity, Flame, PenLine, TrendingUp } from "lucide-react";

import type { ActivityDay, ActivityStats } from "@/lib/posts";
import { formatDate, pluralize } from "@/lib/utils";

/*
  A hand-rolled calendar rather than `react-activity-calendar`.

  That library lays columns out as fixed seven-day slices of the data array, so
  a month always begins wherever the previous one left off; giving each month
  its own column run is not expressible through its props, and faking it with
  filler entries would mean inventing dates that then show up in tooltips and
  totals. Owning the SVG also means the squares theme from CSS and there is no
  client JavaScript at all — this is a server component.
*/

const BLOCK = 11;
const GAP = 3;
const PITCH = BLOCK + GAP;
/** Blank space inserted between one month's columns and the next. */
const MONTH_GAP = 11;
const LABEL_HEIGHT = 18;
const WEEKDAY_WIDTH = 26;
/** Roughly the width of a three-letter month label at 10px mono. */
const LABEL_WIDTH = 24;
const ROWS = 7;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Row order, Monday first. */
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

/** Parse `YYYY-MM-DD` as a local date; `new Date(str)` would read it as UTC. */
function parseDay(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-first row index. */
function rowOf(date: Date) {
  return (date.getDay() + 6) % 7;
}

type MonthBlock = {
  key: string;
  label: string;
  /** Columns of seven slots; `null` where the month has no day. */
  columns: (ActivityDay | null)[][];
};

/**
 * Group days into months, each starting a fresh run of columns.
 *
 * Within a month the rows still mean weekdays, so a month that opens on a
 * Thursday starts partway down its first column rather than at the top.
 */
function toMonths(data: ActivityDay[]): MonthBlock[] {
  const months: MonthBlock[] = [];
  let current: MonthBlock | null = null;
  let currentKey = "";

  for (const day of data) {
    const date = parseDay(day.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    if (key !== currentKey) {
      currentKey = key;
      current = { key, label: MONTH_NAMES[date.getMonth()], columns: [] };
      months.push(current);
    }
    if (!current) continue;

    const row = rowOf(date);
    let column = current.columns[current.columns.length - 1];
    // Start a new column at the beginning of the month, and on every Monday.
    if (!column || row === 0) {
      column = Array<ActivityDay | null>(ROWS).fill(null);
      current.columns.push(column);
    }
    column[row] = day;
  }

  return months;
}

type PlacedMonth = { month: MonthBlock; originX: number };

/**
 * Lay the month blocks out left to right, remembering where each one starts so
 * its label can sit above it. Kept a pure function rather than an accumulator
 * threaded through `map`, which would mutate across renders.
 */
function layout(months: MonthBlock[]): { placed: PlacedMonth[]; width: number } {
  const placed: PlacedMonth[] = [];
  let x = WEEKDAY_WIDTH;

  for (const month of months) {
    placed.push({ month, originX: x });
    x += month.columns.length * PITCH + MONTH_GAP;
  }

  // A short final month (say four days) is narrower than its own label, which
  // would then be clipped by the SVG viewport — so keep room for the text.
  const columnsEnd = x - MONTH_GAP - GAP;
  const lastLabelEnd = (placed.at(-1)?.originX ?? 0) + LABEL_WIDTH;

  return { placed, width: Math.max(columnsEnd, lastLabelEnd) };
}

function describeDay(day: ActivityDay) {
  const posts = day.count === 0 ? "No posts" : pluralize(day.count, "post");
  return `${posts} on ${formatDate(day.date)}`;
}

export function ActivityHeatmap({
  data,
  stats,
}: {
  data: ActivityDay[];
  stats: ActivityStats;
}) {
  const months = toMonths(data);
  const { placed, width } = layout(months);
  const height = LABEL_HEIGHT + ROWS * PITCH - GAP;

  const summary = [
    { label: "Published", value: stats.totalPosts, icon: PenLine },
    { label: "Active days", value: stats.activeDays, icon: Activity },
    { label: "Current streak", value: `${stats.currentStreakWeeks}w`, icon: Flame },
    { label: "Longest streak", value: `${stats.longestStreakWeeks}w`, icon: TrendingUp },
  ];

  return (
    <section aria-labelledby="consistency-heading">
      <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-edge pb-4">
        <h2 id="consistency-heading" className="display text-2xl text-ink">
          Consistency
        </h2>
        <span className="kicker text-faint">last 12 months</span>
      </div>

      <p className="mb-8 max-w-xl text-sm leading-relaxed text-muted">
        Every square is a day; and boy do I love green.
      </p>

      <div className="-mx-1 overflow-x-auto px-1 pb-2">
        <svg
          className="activity-calendar block"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Posts published per day over the last ${months.length} months`}
        >
          {WEEKDAY_LABELS.map((label, row) =>
            label ? (
              <text
                key={row}
                x={0}
                y={LABEL_HEIGHT + row * PITCH + BLOCK - 1}
                className="activity-calendar__label"
              >
                {label}
              </text>
            ) : null,
          )}

          {placed.map(({ month, originX }) => (
            <g key={month.key}>
              <text x={originX} y={LABEL_HEIGHT - 7} className="activity-calendar__label">
                {month.label}
              </text>
              {month.columns.map((column, columnIndex) =>
                column.map((day, row) =>
                  day ? (
                    <rect
                      key={day.date}
                      x={originX + columnIndex * PITCH}
                      y={LABEL_HEIGHT + row * PITCH}
                      width={BLOCK}
                      height={BLOCK}
                      rx={2}
                      data-level={day.level}
                      data-date={day.date}
                    >
                      <title>{describeDay(day)}</title>
                    </rect>
                  ) : null,
                ),
              )}
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-faint">
        <span>Less</span>
        <svg className="activity-calendar" width={5 * PITCH - GAP} height={BLOCK} aria-hidden>
          {[0, 1, 2, 3, 4].map((level) => (
            <rect
              key={level}
              x={level * PITCH}
              y={0}
              width={BLOCK}
              height={BLOCK}
              rx={2}
              data-level={level}
            />
          ))}
        </svg>
        <span>More</span>
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-edge pt-6 sm:grid-cols-4">
        {summary.map(({ label, value, icon: Icon }) => (
          <div key={label}>
            <dt className="flex items-center gap-1.5 kicker text-faint">
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </dt>
            <dd className="display mt-2 text-3xl text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

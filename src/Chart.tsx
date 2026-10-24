import { useEffect, useRef, useState } from "react";
import { dailySeries, money, dateLabel, type Transaction } from "./domain";
export function CashChart({
  transactions,
  start,
  end,
}: {
  transactions: Transaction[];
  start: string;
  end: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(340);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, entry.contentRect.width)),
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const data = dailySeries(transactions, start, end);
  const high = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const power = Math.pow(10, Math.floor(Math.log10(high)));
  const max = Math.ceil(high / power / 3) * power * 3;
  const left = 48,
    right = width - 8,
    top = 14,
    bottom = 154;
  const bin = (right - left) / data.length;
  const bar = Math.min(12, bin * 0.29);
  const tick = (n: number) =>
    n >= 1e9
      ? `${n / 1e9} M`
      : n >= 1e6
        ? `${n / 1e6} jt`
        : n >= 1e3
          ? `${n / 1e3} rb`
          : String(n);
  return (
    <div className="cash-chart" ref={ref}>
      <div className="legend">
        <span>
          <i className="income-swatch" />
          Pemasukan
        </span>
        <span>
          <i className="expense-swatch" />
          Pengeluaran
        </span>
        <small>Rupiah</small>
      </div>
      <svg
        className="plot"
        width="100%"
        height="186"
        viewBox={`0 0 ${width} 186`}
        role="img"
        aria-label={`Arus kas ${dateLabel(start)} sampai ${dateLabel(end)}. Detail nominal tersedia di bawah grafik.`}
      >
        {[0, 1, 2, 3].map((i) => {
          const y = bottom - ((bottom - top) * i) / 3;
          return (
            <g key={i}>
              <line x1={left} x2={right} y1={y} y2={y} stroke="var(--border)" />
              <text x={left - 8} y={y + 4} textAnchor="end">
                {tick((max * i) / 3)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => (
          <g key={d.date}>
            {(["income", "expense"] as const).map((kind, k) => {
              const h = (d[kind] / max) * (bottom - top);
              return (
                <rect
                  key={kind}
                  x={left + bin * (i + 0.5) + (k ? 1 : -bar - 1)}
                  y={bottom - h}
                  width={bar}
                  height={h}
                  fill={
                    kind === "income" ? "var(--chart)" : "var(--chart-muted)"
                  }
                >
                  <title>
                    {dateLabel(d.date, true)} ·{" "}
                    {kind === "income" ? "Pemasukan" : "Pengeluaran"}{" "}
                    {money(d[kind])}
                  </title>
                </rect>
              );
            })}
            {i % (data.length === 7 ? 2 : 7) === 0 && (
              <text x={left + bin * (i + 0.5)} y={177} textAnchor="middle">
                {new Intl.DateTimeFormat(
                  "id-ID",
                  data.length === 7
                    ? { weekday: "short", timeZone: "UTC" }
                    : { day: "numeric", timeZone: "UTC" },
                ).format(new Date(`${d.date}T12:00:00Z`))}
              </text>
            )}
          </g>
        ))}
      </svg>
      <details className="chart-data">
        <summary>Lihat nominal harian</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Pemasukan</th>
                <th>Pengeluaran</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.date}>
                  <td>{dateLabel(d.date, true)}</td>
                  <td>{money(d.income)}</td>
                  <td>{money(d.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "blue"
}: {
  label: string;
  value: string | number;
  tone?: "blue" | "yellow" | "green" | "red";
}) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

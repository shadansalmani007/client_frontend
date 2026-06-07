const legendItems = [
  { label: "Available", className: "seat-available" },
  { label: "Selected", className: "seat-selected" },
  { label: "Booked", className: "seat-booked" },
  { label: "Blocked", className: "seat-blocked" },
];

export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-4">
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm text-slate-600">
          <span className={`seat-indicator ${item.className}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

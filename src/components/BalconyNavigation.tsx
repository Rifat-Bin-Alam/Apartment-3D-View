export type ActiveArea = 'room' | 'hallway' | 'balcony';

interface BalconyNavigationProps {
  activeArea: ActiveArea;
  onSelectArea: (area: ActiveArea) => void;
  onPreloadArea: (area: ActiveArea) => void;
}

export function BalconyNavigation({
  activeArea,
  onSelectArea,
  onPreloadArea,
}: BalconyNavigationProps) {
  const areas: { id: ActiveArea; label: string }[] = [
    { id: 'room', label: 'Bedroom' },
    { id: 'hallway', label: 'Main Hallway' },
    { id: 'balcony', label: 'Balcony' },
  ];

  return (
    <div
      aria-label="Space Switcher"
      className="flex items-center gap-1 rounded-lg border border-white/12 bg-black/35 p-0.5"
    >
      {areas.map((area) => {
        const isActive = activeArea === area.id;
        return (
          <button
            key={area.id}
            type="button"
            onMouseEnter={() => onPreloadArea(area.id)}
            onFocus={() => onPreloadArea(area.id)}
            onClick={() => {
              if (!isActive) onSelectArea(area.id);
            }}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-purple-400 ${
              isActive
                ? 'bg-purple-600/90 text-white'
                : 'text-zinc-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {area.label}
          </button>
        );
      })}
    </div>
  );
}

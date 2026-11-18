interface RoomTransitionProps {
  visible: boolean;
  label?: string;
}

export function RoomTransition({ visible, label }: RoomTransitionProps) {
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#090d14] transition-opacity duration-500 ease-in-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {label && (
        <div
          className={`flex items-center gap-2.5 rounded-full border border-white/15 bg-[#0f1522]/90 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase text-zinc-100 shadow-2xl transition-all duration-500 ${
            visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" aria-hidden="true" />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import {
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Eye,
  Fan,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';
import { CAMERA_PRESETS, CameraPreset } from '../scene/roomConstants';
import { BALCONY_PRESETS, BalconyPreset, BalconyPresetId } from '../scene/balconyConstants';
import { HALLWAY_PRESETS, HallwayPreset, HallwayPresetId } from '../scene/hallwayConstants';
import { ActiveArea, BalconyNavigation } from './BalconyNavigation';

export type UnifiedPresetId = CameraPreset['id'] | BalconyPresetId | HallwayPresetId;

interface PortfolioOverlayProps {
  activeArea: ActiveArea;
  onSelectArea: (area: ActiveArea) => void;
  onPreloadArea: (area: ActiveArea) => void;
  exploreMode: boolean;
  onToggleExploreMode: () => void;
  activePreset: UnifiedPresetId;
  onSelectPreset: (preset: UnifiedPresetId) => void;
  onResetCamera: () => void;
  roomLightOn: boolean;
  onToggleRoomLight: () => void;
  fanRunning: boolean;
  onToggleFan: () => void;
}

export function PortfolioOverlay({
  activeArea,
  onSelectArea,
  onPreloadArea,
  exploreMode,
  onToggleExploreMode,
  activePreset,
  onSelectPreset,
  onResetCamera,
  roomLightOn,
  onToggleRoomLight,
  fanRunning,
  onToggleFan,
}: PortfolioOverlayProps) {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems: { id: string; label: string; preset?: UnifiedPresetId }[] = [
    { id: 'room-stage', label: 'Overview', preset: 'overview' },
    { id: 'room-stage', label: 'Desk', preset: 'desk' },
    { id: 'portfolio-footer', label: 'Connect' },
  ];

  const presetList: (CameraPreset | BalconyPreset | HallwayPreset)[] =
    activeArea === 'room'
      ? [
          CAMERA_PRESETS.overview,
          CAMERA_PRESETS.front,
          CAMERA_PRESETS.left,
          CAMERA_PRESETS.right,
          CAMERA_PRESETS.back,
          CAMERA_PRESETS.desk,
        ]
      : activeArea === 'hallway'
        ? [
            HALLWAY_PRESETS.overview,
            HALLWAY_PRESETS.front,
            HALLWAY_PRESETS.left,
            HALLWAY_PRESETS.right,
            HALLWAY_PRESETS.back,
          ]
        : [
            BALCONY_PRESETS.overview,
            BALCONY_PRESETS.front,
            BALCONY_PRESETS.right,
            BALCONY_PRESETS.back,
            BALCONY_PRESETS.left,
          ];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (Nav Links) — Zone 3 (Explore Room Action) */}
      <header className="pointer-events-auto mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-xl border border-white/12 bg-[#0b0e16]/85 px-5 py-3 shadow-lg sm:gap-8">
        <button
          type="button"
          onClick={() => {
            onSelectPreset('overview');
            scrollToElement('room-stage');
          }}
          className="font-display cursor-pointer text-base font-semibold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
        >
          Rifat Bin Alam
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.preset) onSelectPreset(item.preset);
                scrollToElement(item.id);
              }}
              className="cursor-pointer border-b border-transparent pb-0.5 text-zinc-300 transition-colors hover:border-purple-400/70 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={onToggleExploreMode}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-500 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{exploreMode ? 'Show Controls' : 'Explore Room'}</span>
        </button>
      </header>

      {/* Collapsible Bottom Room, Hallway & Balcony Controls Dock */}
      {!exploreMode && (
        <div className="pointer-events-none flex flex-col items-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="pointer-events-auto mb-1.5 flex cursor-pointer items-center gap-1.5 rounded-t-lg border border-b-0 border-white/15 bg-[#0b0e16]/90 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-purple-400"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Show Room Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Hide Controls</span>
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="pointer-events-auto flex max-w-[96vw] flex-wrap items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#0b0e16]/90 px-3 py-2 shadow-xl">
              {/* Space Switcher (Bedroom / Main Hallway / Balcony) */}
              <BalconyNavigation
                activeArea={activeArea}
                onSelectArea={onSelectArea}
                onPreloadArea={onPreloadArea}
              />

              <div className="mx-0.5 hidden h-5 w-px bg-white/15 sm:block" aria-hidden="true" />

              {/* Camera Side Presets */}
              <div className="flex flex-wrap items-center gap-1">
                {presetList.map((preset) => {
                  const isSelected = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectPreset(preset.id)}
                      className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-purple-400 ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="mx-0.5 hidden h-5 w-px bg-white/15 sm:block" aria-hidden="true" />

              {/* Functional Room Controls */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={onResetCamera}
                  title="Reset Camera"
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleRoomLight}
                  aria-pressed={roomLightOn}
                  title={
                    activeArea === 'balcony'
                      ? 'Toggle Balcony Light'
                      : activeArea === 'hallway'
                        ? 'Toggle Hallway Lights'
                        : 'Toggle Main Room Light'
                  }
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-purple-400 ${
                    roomLightOn
                      ? 'border-amber-400/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                      : 'border-white/15 bg-zinc-900/80 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                  }`}
                >
                  <Lightbulb
                    className={`h-3.5 w-3.5 transition-colors ${
                      roomLightOn ? 'text-amber-300' : 'text-zinc-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span>Light: {roomLightOn ? 'ON' : 'OFF'}</span>
                </button>

                {(activeArea === 'room' || activeArea === 'hallway') && (
                  <button
                    type="button"
                    onClick={onToggleFan}
                    aria-pressed={fanRunning}
                    title="Toggle Ceiling Fan"
                    className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-purple-400 ${
                      fanRunning
                        ? 'border-purple-400/50 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30'
                        : 'border-white/15 bg-zinc-900/80 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                    }`}
                  >
                    <Fan
                      className={`h-3.5 w-3.5 transition-transform ${
                        fanRunning ? 'animate-spin text-purple-300' : 'text-zinc-500'
                      }`}
                      style={fanRunning ? { animationDuration: '2.4s' } : undefined}
                      aria-hidden="true"
                    />
                    <span>Fan: {fanRunning ? 'ON' : 'OFF'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => scrollToElement('portfolio-footer')}
                  title="Scroll to Portfolio Details"
                  className="flex cursor-pointer items-center gap-1 rounded-md border border-purple-500/35 bg-purple-500/10 px-2.5 py-1.5 text-xs font-medium text-purple-200 transition-colors hover:bg-purple-500/20 whitespace-nowrap shrink-0"
                >
                  <span>Portfolio</span>
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

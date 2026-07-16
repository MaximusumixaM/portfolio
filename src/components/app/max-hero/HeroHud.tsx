import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/peduncle/Button";
import { Helper } from "@/components/peduncle/Typography";

/** Peak parallax angles (degrees) surfaced in the readout — mirrors MaxWordmark's rotation. */
const AZIMUTH_RANGE = 19.5;
const ELEVATION_RANGE = 11.5;

interface Readout {
  azimuth: number;
  elevation: number;
}

function formatAngle(value: number): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${Math.abs(value).toFixed(1).padStart(4, "0")}°`;
}

function scrollToPortfolio() {
  document
    .getElementById("portfolio")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Live pointer-driven azimuth/elevation, throttled to one update per frame. */
function usePointerReadout(): Readout {
  const [readout, setReadout] = useState<Readout>({ azimuth: 0, elevation: 0 });
  const frame = useRef<number | null>(null);

  useEffect(() => {
    function handleMove(event: PointerEvent) {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -((event.clientY / window.innerHeight) * 2 - 1);
        setReadout({ azimuth: x * AZIMUTH_RANGE, elevation: y * ELEVATION_RANGE });
      });
    }
    window.addEventListener("pointermove", handleMove);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  return readout;
}

export function HeroHud() {
  const { azimuth, elevation } = usePointerReadout();

  return (
    <div className="pointer-events-none absolute inset-0 select-none p-m">
      <h1 className="visually-hidden">
        Max Nobell-Cluff — interaction designer
      </h1>

      <div className="absolute left-m top-m">
        <Helper className="block font-mono text-xs uppercase tracking-widest">
          Max Nobell-Cluff
        </Helper>
        <Helper className="block font-mono text-xs uppercase tracking-widest opacity-60">
          Interaction Design
        </Helper>
      </div>

      <Helper className="absolute right-m top-m font-mono text-xs uppercase tracking-widest opacity-60">
        MAX·01
      </Helper>

      <dl className="absolute bottom-m left-m grid grid-cols-[auto_auto] gap-x-s gap-y-xxs font-mono text-xs tabular-nums">
        <dt className="uppercase tracking-widest opacity-60">
          <Helper className="font-mono text-xs">AZ</Helper>
        </dt>
        <dd>
          <Helper className="font-mono text-xs">{formatAngle(azimuth)}</Helper>
        </dd>
        <dt className="uppercase tracking-widest opacity-60">
          <Helper className="font-mono text-xs">EL</Helper>
        </dt>
        <dd>
          <Helper className="font-mono text-xs">{formatAngle(elevation)}</Helper>
        </dd>
      </dl>

      <div className="pointer-events-auto absolute inset-x-0 bottom-l flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollToPortfolio}
          className="font-mono text-xs uppercase tracking-widest opacity-70 hover:opacity-100"
        >
          Enter ↓
        </Button>
      </div>
    </div>
  );
}

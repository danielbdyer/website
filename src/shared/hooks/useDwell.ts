import { useEffect, useState } from 'react';

// Standing still somewhere for a while. The place is a key; `still`
// says the visitor is not on the move; after `ms` of both holding,
// the visitor has dwelled. The reveal is remembered for the place
// (the walk's memory): coming straight back to a place already
// dwelled at finds it revealed. A timer is a subscription to the
// clock — the one legitimate kind of effect.

export function useDwell(at: string, still: boolean, ms: number): boolean {
  const [revealed, setRevealed] = useState<string | null>(null);
  useEffect(() => {
    if (!still) return;
    const timer = setTimeout(() => setRevealed(at), ms);
    return () => clearTimeout(timer);
  }, [at, still, ms]);
  return still && revealed === at;
}

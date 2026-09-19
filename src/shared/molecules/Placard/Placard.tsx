import { LADDER_LENGTH, type SpeedRecord } from '@/shared/scale/records';
import { cn } from '@/shared/utils/cn';

interface PlacardProps {
  record: SpeedRecord;
  /** Units passed since the visitor arrived at this page. */
  count: number;
  className?: string;
}

// The placard beneath the stage: the one line most people will read,
// the facts in small, the counter, the honest clock, and the record's
// place on the ladder. Every word is DOM text — the canvas above is
// hidden from the screen reader, and each page is a real heading. The
// counter is not a live region, or it would announce every banana.
// OBJECTS_OF_SCALE.md §"Anatomy of a page".

const mph = (speedMs: number): string => Math.round(speedMs * 2.236_94).toLocaleString('en-US');
const ms = (speedMs: number): string =>
  speedMs >= 10 ? Math.round(speedMs).toString() : speedMs.toFixed(2);
const rung = (n: number): string => n.toString().padStart(2, '0');

function clockBadge(record: SpeedRecord): string {
  const { mode, factor } = record.clock;
  if (mode === 'real') return 'Real time';
  return mode === 'lapse' ? `Time-lapse ×${factor}` : `Slow motion ÷${factor}`;
}

export function Placard({ record, count, className }: PlacardProps) {
  return (
    <div className={cn('placard', className)}>
      <h2 className="placard__line">{record.line}</h2>
      <p className="placard__facts">
        <span>{record.subject.name}</span>
        <span aria-hidden="true"> · </span>
        <span>
          {ms(record.subject.speedMs)} m/s, {mph(record.subject.speedMs)} mph
        </span>
        <span aria-hidden="true"> · </span>
        <span>
          {record.subject.holder}, {record.subject.asOf}
        </span>
      </p>
      <p className="placard__counter">
        {record.unit.plural} since you got here: <span className="placard__count">{count}</span>
      </p>
      <p className="placard__foot">
        <span className="placard__badge">{clockBadge(record)}</span>
        <span className="placard__index">
          {rung(record.rung)} / {LADDER_LENGTH} · {record.tier}
        </span>
      </p>
    </div>
  );
}

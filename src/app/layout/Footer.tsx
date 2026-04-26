import { Ornament } from '@/shared/molecules/Ornament/Ornament';

export function Footer() {
  return (
    <footer className="spanda-box pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))] leading-tight">
      <Ornament />
      <div className="flex items-center justify-between text-footer text-text-3">
        <span>Danny Dyer</span>
        <span>danielbdyer.com</span>
      </div>
    </footer>
  );
}

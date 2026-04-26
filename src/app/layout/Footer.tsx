import { Ornament } from '@/shared/molecules/Ornament/Ornament';

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[700px] pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))] leading-tight pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(2rem,env(safe-area-inset-left))] sm:pr-[max(2rem,env(safe-area-inset-right))]">
      <Ornament />
      <div className="flex items-center justify-between text-footer text-text-3">
        <span>Danny Dyer</span>
        <span>danielbdyer.com</span>
      </div>
    </footer>
  );
}

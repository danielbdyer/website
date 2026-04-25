import { Ornament } from '@/shared/molecules/Ornament/Ornament';

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[700px] px-5 pb-8 sm:px-6">
      <Ornament />
      <div className="flex items-center justify-between text-[0.72rem] text-text-3">
        <span>Danny Dyer</span>
        <span>danielbdyer.com</span>
      </div>
    </footer>
  );
}

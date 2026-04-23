import { Ornament } from '@/shared/molecules/Ornament/Ornament';

export function Footer() {
  return (
    <footer className="max-w-[700px] mx-auto px-6 pb-8">
      <Ornament />
      <div className="flex justify-between items-center text-[0.72rem] text-text-3">
        <span>Danny Dyer</span>
        <span>danielbdyer.com</span>
      </div>
    </footer>
  );
}

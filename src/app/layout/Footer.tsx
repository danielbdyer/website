import { Ornament } from '@/shared/molecules/Ornament/Ornament';

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-column pb-edge-bottom leading-tight pl-edge pr-edge sm:pl-edge-md sm:pr-edge-md">
      <Ornament />
      <div className="flex items-center justify-between text-footer text-text-3">
        <span>Danny Dyer</span>
        <span>danielbdyer.com</span>
      </div>
    </footer>
  );
}

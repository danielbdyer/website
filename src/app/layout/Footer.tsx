import { Ornament } from '@/shared/molecules/Ornament/Ornament';

export function Footer() {
  return (
    <footer className="max-w-column pb-edge-bottom pl-edge pr-edge sm:pl-edge-md sm:pr-edge-md mx-auto w-full leading-tight">
      <Ornament />
      <div className="text-footer text-text-3 flex items-center justify-between">
        <span>Danny Dyer</span>
        <span>danielbdyer.com</span>
      </div>
    </footer>
  );
}

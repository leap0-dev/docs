import logoLargeDarkUrl from "/logo-large-dark-mode.png";
import logoLargeUrl from "/logo-large.png";

export function Leap0Brand() {
  return (
    <span className="flex w-full items-center justify-center">
      <img src={logoLargeUrl} className="h-10 w-auto object-contain dark:hidden" alt="Leap0" />
      <img src={logoLargeDarkUrl} className="hidden h-10 w-auto object-contain dark:block" alt="Leap0" />
    </span>
  );
}

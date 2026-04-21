export function Leap0Brand() {
  return (
    <span className="flex w-full items-center justify-center">
      <img src="/logo-large.png" className="h-10 w-auto object-contain dark:hidden" alt="Leap0" />
      <img
        src="/logo-large-dark-mode.png"
        className="hidden h-10 w-auto object-contain dark:block"
        alt="Leap0"
      />
    </span>
  );
}

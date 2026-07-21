export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // max-w-sm is still right for the mobile flip card, but the desktop
    // split panel needs real width to read as two panels rather than a
    // squeezed column — widened only at lg+, where AuthCard switches
    // layouts anyway.
    <div className="flex min-h-screen items-center justify-center bg-flour px-4 py-8 dark:bg-char">
      <div className="w-full max-w-sm lg:max-w-3xl">{children}</div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-flour px-4 dark:bg-char">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

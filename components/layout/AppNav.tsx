'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusCircle, GraduationCap, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  emphasized?: boolean;
}

// Implements the "Navigation" section of 06-design-system.md: one 5-item
// list, one mental model — bottom tab bar under 1024px, the same items as a
// left sidebar at 1024px+, never a different nav pattern per breakpoint.
const NAV_ITEMS: NavItem[] = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/recipes/new', label: 'Create', icon: PlusCircle, emphasized: true },
  { href: '/learning', label: 'Learning', icon: GraduationCap },
  { href: '/profile/me', label: 'Profile', icon: User },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-10 flex justify-around border-t border-copper/20 bg-flour pb-[env(safe-area-inset-bottom)] dark:bg-char lg:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
      </nav>

      <nav
        aria-label="Primary"
        className="fixed left-0 top-0 z-10 hidden h-full w-56 flex-col gap-1 border-r border-copper/20 bg-flour p-4 dark:bg-char lg:flex"
      >
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} vertical />
        ))}
      </nav>
    </>
  );
}

function NavItem({
  item,
  active,
  vertical,
}: {
  item: NavItem;
  active: boolean;
  vertical?: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-sm px-3 py-2',
        vertical ? 'flex-row text-sm' : 'flex-col text-[11px]',
        active
          ? 'text-chili'
          : item.emphasized
            ? 'text-chili/80'
            : 'text-[#241E1A]/70 dark:text-flour/70'
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
      <span className={cn(active && 'font-semibold')}>{item.label}</span>
    </Link>
  );
}

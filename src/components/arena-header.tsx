'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_LINKS = [
  { href: '/configure', label: 'New Test' },
  { href: '/history',   label: 'Results' },
  { href: '/guide',     label: 'Guide' },
];

export function ArenaHeader() {
  const pathname = usePathname();

  return (
    <header className="arena-ui-header">
      <div className="arena-ui-header-brand">
        <Link href="/" className="arena-ui-home-badge" aria-label="Swarm Defense Arena home">
          <span className="arena-ui-home-badge-mark">SDA</span>
        </Link>
        <div className="arena-ui-header-copy">
          <p>Swarm Defense Arena</p>
          <span>Adversarial browser-agent evaluation</span>
        </div>
      </div>

      <div className="arena-ui-header-nav">
        <nav className="arena-ui-nav-links" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className={active ? 'active' : ''}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="arena-ui-nav-tools">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

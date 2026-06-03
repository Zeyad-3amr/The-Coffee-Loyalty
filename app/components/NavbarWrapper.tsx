'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

export function NavbarWrapper() {
  const pathname = usePathname();
  const hideNav =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/print-qr') ||
    pathname.startsWith('/display-qr') ||
    pathname.startsWith('/scan/'); // focused customer stamping flow (keeps navbar on bare /scan info page)

  if (hideNav) return null;

  return (
    <>
      <Navbar />
      <div className="h-20 shrink-0" />
    </>
  );
}

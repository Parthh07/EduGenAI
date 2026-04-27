"use client";
import { usePathname } from 'next/navigation';

const noNavPages = ['/', '/login', '/signup'];

export default function NavWrapper({ children }) {
  const pathname = usePathname();
  const hideNav = noNavPages.includes(pathname);

  return (
    <div className={hideNav ? '' : 'md:pl-[72px] pb-20 md:pb-0'}>
      {children}
    </div>
  );
}

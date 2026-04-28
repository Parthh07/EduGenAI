"use client";
import { usePathname } from 'next/navigation';

import { AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';

const noNavPages = ['/', '/login', '/signup'];

export default function NavWrapper({ children }) {
  const pathname = usePathname();
  const hideNav = noNavPages.includes(pathname);

  return (
    <div className={hideNav ? '' : 'md:pl-[72px] pb-20 md:pb-0'}>
      <AnimatePresence mode="wait">
        <PageTransition key={pathname}>
          {children}
        </PageTransition>
      </AnimatePresence>
    </div>
  );
}

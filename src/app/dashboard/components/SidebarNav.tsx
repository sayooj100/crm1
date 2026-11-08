'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, FileText, CreditCard } from 'lucide-react';

export default function SidebarNav() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Services', href: '/dashboard/services', icon: Briefcase },
    { name: 'Submissions', href: '/dashboard/submissions', icon: FileText },
    { name: 'Accounts', href: '/dashboard/accounts', icon: CreditCard },
  ];

  return (
    <ul className="sidebar-menu">
      {menuItems.map((item) => {
        const Icon = item.icon;
        
        // Match exact "/dashboard" or match subpaths like "/dashboard/users/..."
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

        return (
          <li key={item.name} className={`sidebar-item ${isActive ? 'active' : ''}`}>
            <Link href={item.href}>
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

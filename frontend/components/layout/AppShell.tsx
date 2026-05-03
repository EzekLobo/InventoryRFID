"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Cpu, Menu } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Início" },
  { href: "/antenas", label: "Leitores" },
  { href: "/auditoria", label: "Auditoria" },
  { href: "/inconsistencias", label: "Divergências" },
  { href: "/itens", label: "Patrimônio" },
  { href: "/timeline", label: "Timeline" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-copy">
            <strong>COLCIC</strong>
            <small>Inventário RFID</small>
          </span>
        </Link>

        <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)}>
          <Menu size={22} />
        </button>

        <nav className={open ? "nav nav-open" : "nav"}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link className={active ? "nav-link active" : "nav-link"} href={item.href} key={item.href}>
                {item.label}
                {["Leitores", "Auditoria", "Divergências"].includes(item.label) ? <ChevronDown size={15} /> : null}
              </Link>
            );
          })}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <Cpu size={18} />
        <span>Controle operacional dos leitores RFID, auditorias e divergências patrimoniais.</span>
      </footer>
    </div>
  );
}

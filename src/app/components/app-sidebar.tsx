"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  Calculator,
  Factory,
  FileBarChart,
  House,
  LogOut,
  Menu,
  ShieldCheck,
  Tags,
  Truck,
  UsersRound,
  X,
} from "lucide-react";

type Account = {
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  profile: "COOPERADO" | "BALANCEIRO" | "PRESIDENTE";
};

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#dce8d7] text-[#234531]">
        <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="20" fill="#243b2b" />
          <path
            d="M21 19.5c0-1 .8-1.7 1.8-1.4l8.5 2.6c.9-.2 1.8-.3 2.7-.3s1.8.1 2.7.3l8.5-2.6c1-.3 1.8.4 1.8 1.4v9.1c1.4 2.2 2.2 4.7 2.2 7.4 0 8-6.6 13.5-15.2 13.5s-15.2-5.5-15.2-13.5c0-2.7.8-5.2 2.2-7.4v-9.1Z"
            fill="none"
            stroke="#edf0e5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path d="M27.5 34.5v1M39.5 34.5v1" stroke="#edf0e5" strokeLinecap="round" strokeWidth="2" />
          <path d="m29 41 3-2 3 2-3 2-3-2Z" fill="#edf0e5" />
        </svg>
      </span>
      <span>
        <span className="block text-base font-semibold leading-5">EcoCat</span>
        <span className="block text-xs text-white/65">Cooperativa</span>
      </span>
    </div>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [logoutError, setLogoutError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    const updateHash = () => setCurrentHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  function renderLinks() {
    const links = account?.profile === "COOPERADO"
      ? [
          { href: "/", label: "Meu Painel", icon: House },
          { href: "/meus-registros", label: "Meus registros", icon: UsersRound },
        ]
      : account?.profile === "BALANCEIRO"
        ? [
            { href: "/cargas", label: "Cargas", icon: Truck },
            { href: "/geradores", label: "Geradores", icon: Factory },
            { href: "/meus-registros", label: "Registros dos cooperados", icon: UsersRound },
          ]
        : account?.profile === "PRESIDENTE"
          ? [
              { href: "/", label: "Dashboard", icon: House },
              { href: "/geradores", label: "Geradores", icon: Factory },
              { href: "/cooperados", label: "Cooperados", icon: UsersRound },
              { href: "/precos", label: "Tabela de Preços", icon: Tags },
              { href: "/cargas", label: "Cargas", icon: Truck },
              { href: "/meus-registros", label: "Registros dos cooperados", icon: Boxes },
              { href: "/rateio", label: "Rateio", icon: Calculator },
              { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
              { href: "/usuarios", label: "Gerenciar acessos", icon: ShieldCheck },
            ]
          : [];

    return links.map(({ href, label, icon: Icon }) => {
      const pageHref = href.split("#", 1)[0];
      const targetHash = href.includes("#") ? `#${href.split("#")[1]}` : "";
      const isActive =
        pageHref === "/"
          ? pathname === "/"
          : (pathname === pageHref || pathname.startsWith(`${pageHref}/`)) &&
            (!targetHash || currentHash === targetHash);

      return (
        <Link
          key={label}
          href={href}
          onClick={() => setIsOpen(false)}
          aria-current={isActive ? "page" : undefined}
          className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
            isActive
              ? "bg-[#dce8d7] text-[#234531]"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </Link>
      );
    });
  }

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as Account;
      })
      .then((currentAccount) => {
        if (active && currentAccount) {
          setAccount(currentAccount);
        }
      })
      .catch(() => {
        if (active) {
          setAccountError("Não foi possível carregar os dados da conta.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function logOut() {
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        setLogoutError("Não foi possível encerrar a sessão. Tente novamente.");
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("Não foi possível encerrar a sessão. Tente novamente.");
    }
  }

  function renderAccountActions() {
    return (
      <div className="mt-auto border-t border-white/15 px-2 pt-4">
        {account && (
          <div className="mb-3 min-w-0">
            <p className="truncate text-sm font-semibold">{account.name}</p>
            <p className="truncate text-xs text-white/60">{account.email}</p>
            <p className="mt-1 text-xs text-white/60">
              {account.profile === "PRESIDENTE"
                ? "Presidente"
                : account.profile === "BALANCEIRO"
                  ? "Balanceiro"
                  : "Cooperado"}
            </p>
          </div>
        )}
        {accountError && <p role="alert" className="mb-2 text-xs text-rose-200">{accountError}</p>}
        {logoutError && <p role="alert" className="mb-2 text-xs text-rose-200">{logoutError}</p>}
        <button
          type="button"
          onClick={() => void logOut()}
          className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
          Sair
        </button>
        <p className="mt-3 text-xs text-white/55">Painel de operação</p>
      </div>
    );
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#183b2b] px-4 py-6 text-white lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav aria-label="Navegação principal" className="mt-10 min-h-0 flex-1 space-y-1 overflow-y-auto">
          {renderLinks()}
        </nav>
        {renderAccountActions()}
      </aside>

      <div className="lg:hidden">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-[#183b2b] px-4 text-white">
          <Brand />
          <button
            type="button"
            aria-label={isOpen ? "Fechar navegação" : "Abrir navegação"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {isOpen && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Fechar navegação"
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 h-full w-full bg-black/40"
            />
            <aside className="relative flex h-full w-64 flex-col bg-[#183b2b] px-4 py-6 text-white shadow-xl">
              <div className="px-2">
                <Brand />
              </div>
              <nav aria-label="Navegação principal" className="mt-10 min-h-0 flex-1 space-y-1 overflow-y-auto">
                {renderLinks()}
              </nav>
              {renderAccountActions()}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
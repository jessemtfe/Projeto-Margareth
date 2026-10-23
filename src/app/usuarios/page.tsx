"use client";

import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck, UsersRound } from "lucide-react";

type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  profile: "COOPERADO" | "BALANCEIRO" | "PRESIDENTE";
  cooperadoId: number | null;
  active: boolean;
  createdAt: string;
};

type ApiError = {
  error?: string;
};

const roleLabels: Record<ManagedUser["role"], string> = {
  ADMIN: "Administradora",
  EDITOR: "Pode editar",
  VIEWER: "Somente leitura",
};

const profileLabels: Record<ManagedUser["profile"], string> = {
  COOPERADO: "Cooperado",
  BALANCEIRO: "Balanceiro",
  PRESIDENTE: "Presidente",
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadUsers() {
      try {
        const response = await fetch("/api/usuarios", { cache: "no-store" });
        const result: unknown = await response.json();
        if (!isCurrent) {
          return;
        }
        if (!response.ok) {
          const message =
            result !== null &&
            typeof result === "object" &&
            "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "Não foi possível carregar as contas.";
          setError(message);
          return;
        }
        setUsers(result as ManagedUser[]);
      } catch {
        if (isCurrent) {
          setError("Não foi possível conectar ao serviço de contas.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();
    return () => {
      isCurrent = false;
    };
  }, []);

  async function updateUser(
    event: FormEvent<HTMLFormElement>,
    user: ManagedUser,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const role = formData.get("role");
    const profile = formData.get("profile");
    const cooperadoIdValue = formData.get("cooperadoId");
    const active = formData.get("active");
    if (
      (role !== "EDITOR" && role !== "VIEWER") ||
      (profile !== "COOPERADO" && profile !== "BALANCEIRO" && profile !== "PRESIDENTE") ||
      (active !== "true" && active !== "false")
    ) {
      setError("Selecione um perfil e estado válidos.");
      return;
    }

    setError("");
    setUpdatingId(user.id);
    try {
      const response = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          role,
          profile,
          cooperadoId: cooperadoIdValue ? Number(cooperadoIdValue) : null,
          active: active === "true",
        }),
      });
      const result = (await response.json()) as ApiError;
      if (!response.ok) {
        setError(result.error ?? "Não foi possível atualizar a conta.");
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                role: role as ManagedUser["role"],
                profile: profile as ManagedUser["profile"],
                cooperadoId: cooperadoIdValue ? Number(cooperadoIdValue) : null,
                active: active === "true",
              }
            : currentUser,
        ),
      );
    } catch {
      setError("Não foi possível conectar ao serviço de contas.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#526b4c]">
            Administração
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#1e2b20]">Gerenciar acessos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Atribua o perfil funcional e, quando necessário, vincule a conta ao cadastro do Cooperado.
          </p>
        </header>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e8efe3] text-[#42603c]">
              <UsersRound aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#1e2b20]">Contas registradas</h2>
              <p className="text-xs text-slate-500">
                A administradora inicial não pode ser removida nesta tela.
              </p>
            </div>
            <ShieldCheck aria-hidden="true" className="ml-auto h-5 w-5 text-[#42603c]" />
          </div>

          {error && (
            <p role="alert" className="m-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          {isLoading ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">Carregando contas...</p>
          ) : users.length === 0 && !error ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Ainda não há contas cadastradas.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <form
                  key={user.id}
                  onSubmit={(event) => void updateUser(event, user)}
                  className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_180px_150px_auto] sm:items-center sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="truncate text-sm text-slate-500">{user.email}</p>
                  </div>

                  {user.role === "ADMIN" ? (
                    <>
                      <span className="text-sm font-medium text-[#42603c]">
                        {roleLabels.ADMIN}
                      </span>
                      <span className="text-sm text-slate-500">Conta protegida</span>
                    </>
                  ) : (
                    <>
                      <label className="text-xs font-medium text-slate-500">
                        Permissão
                        <select
                          name="profile"
                          defaultValue={user.profile}
                          disabled={updatingId === user.id || !user.active}
                          className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-[#42603c] focus:ring-2 focus:ring-[#42603c]/20 disabled:bg-slate-100"
                        >
                          {Object.entries(profileLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-medium text-slate-500">
                        ID Cooperado (opcional)
                        <input
                          name="cooperadoId"
                          type="number"
                          min="1"
                          defaultValue={user.cooperadoId ?? ""}
                          disabled={updatingId === user.id || !user.active || user.profile !== "COOPERADO"}
                          className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-[#42603c] focus:ring-2 focus:ring-[#42603c]/20 disabled:bg-slate-100"
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-500">
                        Compatibilidade
                        <select
                          name="role"
                          defaultValue={user.role}
                          disabled={updatingId === user.id || !user.active}
                          className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-[#42603c] focus:ring-2 focus:ring-[#42603c]/20 disabled:bg-slate-100"
                        >
                          <option value="VIEWER">Legado: leitura</option>
                          <option value="EDITOR">Legado: edição</option>
                        </select>
                      </label>
                      <label className="text-xs font-medium text-slate-500">
                        Estado
                        <select
                          name="active"
                          defaultValue={String(user.active)}
                          disabled={updatingId === user.id}
                          className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-[#42603c] focus:ring-2 focus:ring-[#42603c]/20 disabled:bg-slate-100"
                        >
                          <option value="true">Ativa</option>
                          <option value="false">Desativada</option>
                        </select>
                      </label>
                    </>
                  )}

                  {user.role !== "ADMIN" && (
                    <button
                      type="submit"
                      disabled={updatingId === user.id}
                      className="min-h-10 rounded-md bg-[#234531] px-4 text-sm font-semibold text-white transition hover:bg-[#183b2b] disabled:cursor-wait disabled:opacity-60"
                    >
                      {updatingId === user.id ? "Salvando..." : "Salvar"}
                    </button>
                  )}
                </form>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

"use client";
import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
import {
  permissions,
  type Permission,
  type BusinessRole,
} from "@/lib/permissions";
import { type Location } from "@/lib/types";
type BusinessUser = {
  id: string;
  email: string;
  owner: boolean;
  role_id: string | null;
  locations: { id: string; role_id: string }[];
};
export function Users({
  subscriptionId,
  userId,
  locations,
  manage,
}: {
  subscriptionId: string;
  userId: string;
  locations: Location[];
  manage: boolean;
}) {
  const [users, setUsers] = useState<BusinessUser[]>([]),
    [roles, setRoles] = useState<BusinessRole[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BusinessUser | null>(null),
    [email, setEmail] = useState(""),
    [roleId, setRoleId] = useState(""),
    [assignments, setAssignments] = useState<Record<string, string>>({});
  const [customId, setCustomId] = useState(""),
    [customName, setCustomName] = useState(""),
    [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
  const load = useCallback(async () => {
    const db = browserClient();
    const [u, r] = await Promise.all([
      db.rpc("list_business_users", { p_subscription: subscriptionId }),
      db
        .from("business_roles")
        .select("*")
        .eq("subscription_id", subscriptionId)
        .order("name"),
    ]);
    if (u.error || r.error)
      throw new Error(
        "We couldn’t load your users and roles. Please try again.",
      );
    setUsers(u.data ?? []);
    const order = ["Manager", "Supervisor", "Lead", "Fulfillment", "Viewer"];
    setRoles(
      (r.data ?? []).sort(
        (a, b) =>
          (order.indexOf(a.name) < 0 ? 99 : order.indexOf(a.name)) -
            (order.indexOf(b.name) < 0 ? 99 : order.indexOf(b.name)) ||
          a.name.localeCompare(b.name),
      ),
    );
  }, [subscriptionId]);
  useEffect(() => {
    void Promise.resolve()
      .then(load)
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, [load]);
  async function save<T = unknown>(
    action: () => PromiseLike<{
      data?: T | null;
      error: { code?: string; message: string } | null;
    }>,
    onSuccess?: (data: T | null | undefined) => void,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await action();
      if (error) {
        setMessage(
          error.code === "P0001"
            ? error.message
            : "We couldn’t save these changes. Please check your choices and try again.",
        );
        return false;
      }
      await load();
      onSuccess?.(data);
      setMessage("Changes saved.");
      return true;
    } catch {
      setMessage("We couldn’t save these changes. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  function edit(u: BusinessUser | null) {
    setEditing(u);
    setEmail(u?.email ?? "");
    setRoleId(u?.role_id ?? roles.find((r) => r.name === "Viewer")?.id ?? "");
    setAssignments(
      Object.fromEntries(u?.locations.map((l) => [l.id, l.role_id]) ?? []),
    );
  }
  function toggle(p: Permission, checked: boolean) {
    setCustomPermissions((old) => {
      let next = checked ? [...old, p] : old.filter((x) => x !== p);
      const area = p.split(".")[0];
      if (checked && !p.endsWith(".view"))
        next.push((area + ".view") as Permission);
      if (!checked && p.endsWith(".view"))
        next = next.filter((x) => !x.startsWith(area + "."));
      return [...new Set(next)];
    });
  }
  return (
    <section className="panel stack">
      <h2>Users</h2>
      <p>
        Subscription roles control shared business tools and user management.
        Choose access and a role separately for each location. The Owner retains
        full access.
      </p>
      <p role="status">{message}</p>
      {loading ? (
        <p>Loading users…</p>
      ) : (
        <div className="table-scroll">
          <table>
            <caption>Configured users</caption>
            <thead>
              <tr>
                <th>User</th>
                <th>Subscription role</th>
                <th>Location access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    {u.owner
                      ? "Owner"
                      : (roles.find((r) => r.id === u.role_id)?.name ??
                        "Legacy employee")}
                  </td>
                  <td>
                    {u.owner
                      ? "All locations"
                      : u.locations
                          .map(
                            (a) =>
                              (locations.find((l) => l.id === a.id)?.name ??
                                "Location") +
                              " — " +
                              (roles.find((r) => r.id === a.role_id)?.name ??
                                "No role"),
                          )
                          .join(", ") || "No locations"}
                  </td>
                  <td>
                    {manage && !u.owner && u.id !== userId ? (
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => edit(u)}
                      >
                        Edit {u.email}
                      </button>
                    ) : u.owner ? (
                      "Protected owner account"
                    ) : (
                      "View only"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details open>
        <summary>Role access — allowed and denied</summary>
        <div className="table-scroll">
          <table>
            <caption>Permissions by role</caption>
            <thead>
              <tr>
                <th>Permission</th>
                <th>Owner</th>
                {roles.map((r) => (
                  <th key={r.id}>{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map(([p, label]) => (
                <tr key={p}>
                  <th>{label}</th>
                  <td>Allowed</td>
                  {roles.map((r) => (
                    <td key={r.id}>
                      {r.permissions.includes(p) ? "Allowed" : "Denied"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {manage && (
        <>
          <h3>{editing ? "Edit user" : "Add a user"}</h3>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              void save(() =>
                browserClient().rpc("save_business_user", {
                  p_subscription: subscriptionId,
                  p_email: email,
                  p_role: roleId,
                  p_locations: Object.entries(assignments)
                    .filter(([, r]) => r)
                    .map(([id, role_id]) => ({ id, role_id })),
                }),
              );
            }}
          >
            <p>
              New team members need an existing Talix account. No invitation
              email is sent yet.
            </p>
            <label>
              User email
              <input
                type="email"
                required
                value={email}
                readOnly={!!editing}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Subscription role
              <select
                required
                aria-label="Subscription role"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">Choose a role</option>
                {roles.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Location access</legend>
              {locations.map((l) => (
                <label key={l.id}>
                  {l.name}
                  <select
                    aria-label={"Role at " + l.name}
                    value={assignments[l.id] ?? ""}
                    onChange={(e) =>
                      setAssignments({ ...assignments, [l.id]: e.target.value })
                    }
                  >
                    <option value="">No access</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </fieldset>
            <div className="actions">
              <button disabled={busy}>Save user</button>
              {editing && (
                <>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => {
                      void save(() =>
                        browserClient().rpc("save_business_user", {
                          p_subscription: subscriptionId,
                          p_email: email,
                          p_role: roleId,
                          p_locations: [],
                          p_remove: true,
                        }),
                      ).then((saved) => {
                        if (saved) edit(null);
                      });
                    }}
                  >
                    Remove user access
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => edit(null)}
                  >
                    Add another user
                  </button>
                </>
              )}
            </div>
          </form>
          <h3>Custom roles</h3>
          <label>
            Choose a custom role
            <select
              aria-label="Choose a custom role"
              value={customId}
              onChange={(e) => {
                const r = roles.find((r) => r.id === e.target.value);
                setCustomId(r?.id ?? "");
                setCustomName(r?.name ?? "");
                setCustomPermissions(r?.permissions ?? []);
              }}
            >
              <option value="">Create a custom role</option>
              {roles
                .filter((r) => !r.predefined)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </label>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              void save<string>(
                () =>
                  browserClient().rpc("save_business_role", {
                    p_subscription: subscriptionId,
                    p_id: customId || null,
                    p_name: customName,
                    p_permissions: customPermissions,
                  }),
                (id) => {
                  if (id) setCustomId(id);
                },
              );
            }}
          >
            <label>
              Role name
              <input
                required
                minLength={2}
                maxLength={60}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </label>
            <fieldset>
              <legend>
                Permissions — checked allows access; unchecked denies it
              </legend>
              {permissions.map(([p, label]) => (
                <label className="permission-option" key={p}>
                  <input
                    type="checkbox"
                    checked={customPermissions.includes(p)}
                    onChange={(e) => toggle(p, e.target.checked)}
                  />
                  {label} —{" "}
                  {customPermissions.includes(p) ? "Allowed" : "Denied"}
                </label>
              ))}
            </fieldset>
            <button disabled={busy}>Save custom role</button>
          </form>
        </>
      )}
    </section>
  );
}

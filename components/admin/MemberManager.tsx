"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMemberRole } from "@/lib/actions";
import { Avatar, Button, Card } from "@/components/ui/Primitives";
import { PROFESSIONAL_CATEGORIES } from "@/lib/config";
import type { MemberRow } from "@/app/admin/members/page";
import type { Profile, ProfessionalCategory } from "@/lib/types";

export function MemberManager({
  query,
  results,
  professionals,
  currentAdminId,
}: {
  query: string;
  results: MemberRow[];
  professionals: Profile[];
  currentAdminId: string;
}) {
  const [term, setTerm] = useState(query);
  const router = useRouter();

  return (
    <div className="mt-8 flex flex-col gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(
            `/admin/members${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ""}`,
          );
        }}
      >
        <label htmlFor="member-search" className="mb-1.5 block text-[14px] font-medium">
          Find a member
        </label>
        <input
          id="member-search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Display name or email"
          className="field"
        />
      </form>

      <section>
        <h2 className="text-[20px]">
          {query ? `Results for "${query}"` : "Recent members"}
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {results.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-[15px] text-muted">No members found.</p>
            </Card>
          ) : (
            results.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isSelf={member.id === currentAdminId}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-[20px]">Professionals</h2>
        <p className="mt-1 text-[14px] text-muted">
          Everyone whose replies carry an expert badge.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {professionals.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-[15px] text-muted">
                Nobody has Professional status yet.
              </p>
            </Card>
          ) : (
            professionals.map((pro) => (
              <Card key={pro.id} className="flex items-center gap-3 p-4">
                <Avatar displayName={pro.display_name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">{pro.display_name}</p>
                  <p className="text-[13px] capitalize text-muted">
                    {pro.professional_category === "other"
                      ? pro.professional_category_other || "Other"
                      : pro.professional_category || "No category set"}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MemberCard({
  member,
  isSelf,
}: {
  member: MemberRow;
  isSelf: boolean;
}) {
  const [category, setCategory] = useState<ProfessionalCategory | "">(
    member.professional_category ?? "",
  );
  const [other, setOther] = useState(member.professional_category_other ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function apply(role: "member" | "professional") {
    setError(null);
    startTransition(async () => {
      const result = await setMemberRole(
        member.id,
        role,
        role === "professional" ? ((category || null) as ProfessionalCategory | null) : null,
        role === "professional" && category === "other" ? other : null,
      );
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  const isProfessional = member.role === "professional";

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Avatar displayName={member.display_name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium">{member.display_name}</p>
          <p className="truncate text-[13px] text-muted">{member.email}</p>
          <p className="mt-0.5 text-[13px] capitalize text-faint">
            {member.role}
          </p>
        </div>
      </div>

      {member.role === "admin" ? (
        <p className="mt-4 text-[13px] text-muted">
          {isSelf
            ? "This is you. Change your own role in the database."
            : "Admin accounts are managed in the database."}
        </p>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1.5 block text-[13px] font-medium">
                Replies as
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ProfessionalCategory | "")
                }
                className="field"
              >
                <option value="">Choose one</option>
                {PROFESSIONAL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {isProfessional ? (
              <Button
                variant="quiet"
                disabled={pending}
                onClick={() => apply("member")}
              >
                Revoke
              </Button>
            ) : null}

            <Button
              disabled={pending || !category}
              onClick={() => apply("professional")}
            >
              {isProfessional ? "Update" : "Make professional"}
            </Button>
          </div>

          {category === "other" ? (
            <input
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Their title"
              maxLength={40}
              className="field mt-2"
            />
          ) : null}

          {error ? (
            <p role="alert" className="mt-2 text-[13px] text-menstrual">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}

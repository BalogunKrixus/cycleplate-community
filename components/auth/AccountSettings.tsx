"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateDisplayName, updateProfessionalCategory } from "@/lib/actions";
import { Avatar, Button, Card } from "@/components/ui/Primitives";
import { PROFESSIONAL_CATEGORIES } from "@/lib/config";
import type { Profile, ProfessionalCategory } from "@/lib/types";

export function AccountSettings({ viewer }: { viewer: Profile }) {
  const router = useRouter();

  const [name, setName] = useState(viewer.display_name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [category, setCategory] = useState<ProfessionalCategory | "">(
    viewer.professional_category ?? "",
  );
  const [other, setOther] = useState(viewer.professional_category_other ?? "");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySaved, setCategorySaved] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  async function saveName() {
    setNameError(null);
    setNameSaved(false);
    setSavingName(true);
    const result = await updateDisplayName(name);
    setSavingName(false);
    if (!result.ok) setNameError(result.error);
    else {
      setNameSaved(true);
      router.refresh();
    }
  }

  async function saveCategory() {
    setCategoryError(null);
    setCategorySaved(false);
    setSavingCategory(true);
    const result = await updateProfessionalCategory(
      category as ProfessionalCategory,
      other || null,
    );
    setSavingCategory(false);
    if (!result.ok) setCategoryError(result.error);
    else {
      setCategorySaved(true);
      router.refresh();
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/community");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Avatar displayName={viewer.display_name} size={48} />
          <div>
            <p className="text-[17px] font-medium">{viewer.display_name}</p>
            <p className="text-[13px] capitalize text-muted">{viewer.role}</p>
          </div>
        </div>

        <div className="mt-6">
          <label
            htmlFor="display-name"
            className="mb-1.5 block text-[14px] font-medium"
          >
            Display name
          </label>
          <p className="mb-2 text-[13px] text-muted">
            {viewer.display_name_changed
              ? "You have already used your one change, so this is now fixed."
              : "You can change this once. Pick something that is not your real name."}
          </p>
          <input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={viewer.display_name_changed}
            maxLength={24}
            className="field disabled:opacity-60"
          />
          {nameError ? (
            <p role="alert" className="mt-2 text-[13px] text-menstrual">
              {nameError}
            </p>
          ) : null}
          {nameSaved ? (
            <p role="status" className="mt-2 text-[13px] text-follicular">
              Saved.
            </p>
          ) : null}
          {!viewer.display_name_changed ? (
            <Button
              onClick={saveName}
              disabled={savingName || name === viewer.display_name}
              className="mt-3"
            >
              {savingName ? "Saving" : "Save name"}
            </Button>
          ) : null}
        </div>
      </Card>

      {viewer.role === "professional" ? (
        <Card className="p-6">
          <h2 className="text-[20px]">How you reply</h2>
          <p className="mt-1 text-[14px] text-muted">
            This shows on every reply you write, so members know who is
            answering.
          </p>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as ProfessionalCategory | "")
            }
            aria-label="Your professional category"
            className="field mt-4"
          >
            <option value="">Choose one</option>
            {PROFESSIONAL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {category === "other" ? (
            <input
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Your title"
              maxLength={40}
              className="field mt-2"
            />
          ) : null}

          {categoryError ? (
            <p role="alert" className="mt-2 text-[13px] text-menstrual">
              {categoryError}
            </p>
          ) : null}
          {categorySaved ? (
            <p role="status" className="mt-2 text-[13px] text-follicular">
              Saved.
            </p>
          ) : null}

          <Button
            onClick={saveCategory}
            disabled={savingCategory || !category}
            className="mt-3"
          >
            {savingCategory ? "Saving" : "Save"}
          </Button>
        </Card>
      ) : null}

      <Card className="p-6">
        <h2 className="text-[20px]">Signing out</h2>
        <p className="mt-1 text-[14px] text-muted">
          You can read the community without an account at any time.
        </p>
        <Button variant="quiet" onClick={signOut} className="mt-4">
          Sign out
        </Button>
      </Card>
    </div>
  );
}

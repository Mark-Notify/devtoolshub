import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";

interface SaveSnippetButtonProps {
  toolKey: string;
  content: string;
  disabled?: boolean;
}

export default function SaveSnippetButton({ toolKey, content, disabled }: SaveSnippetButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!session) return null;

  const handleSave = async () => {
    if (!title.trim() || !content) return;
    setSaving(true);
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolKey, title: title.trim(), content }),
      });
      if (res.ok) {
        setSaved(true);
        setOpen(false);
        setTitle("");
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        className={`btn btn-sm btn-ghost gap-1.5 ${saved ? "text-yellow-500" : ""}`}
        onClick={() => setOpen(true)}
        disabled={disabled || !content}
        title="Save as snippet"
      >
        {saved ? (
          <BookmarkSolidIcon className="w-4 h-4 text-yellow-500" />
        ) : (
          <BookmarkIcon className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">{saved ? "Saved!" : "Save"}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-lg mb-4">Save Snippet</h3>
            <input
              type="text"
              className="input input-bordered w-full mb-4"
              placeholder="Snippet title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving || !title.trim()}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

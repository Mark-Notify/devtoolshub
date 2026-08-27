"use client";
import { useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  LockClosedIcon,
  PaperClipIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { MessageDetail } from "./types";
import { formatBytes, formatDateTime } from "./utils";

type Props = {
  message: MessageDetail;
  onDelete: (id: string) => void;
};

export default function MessageView({ message, onDelete }: Props) {
  const hasHtml = Boolean(message.html.trim());
  const [view, setView] = useState<"rich" | "plain">(hasHtml ? "rich" : "plain");

  // The body is untrusted mail. It renders in an iframe with an empty `sandbox`
  // attribute — no scripts, no forms, no same-origin access — on top of the
  // server-side HTML scrub.
  const srcDoc = useMemo(() => {
    const body = hasHtml
      ? message.html
      : `<pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;margin:0">${message.text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre>`;
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><base target="_blank"><style>
      body{margin:0;padding:16px;font:14px/1.6 Inter,system-ui,sans-serif;color:#1f2937;background:#fff;word-break:break-word}
      img{max-width:100%;height:auto}
      table{max-width:100%}
      a{color:#2563eb}
    </style></head><body>${body}</body></html>`;
  }, [hasHtml, message.html, message.text]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-base-300/60 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base truncate">{message.subject}</h3>
            <p className="text-xs opacity-70 mt-1 truncate">
              <span className="font-medium">{message.fromName || message.fromAddress}</span>
              {message.fromName && <span className="opacity-60"> &lt;{message.fromAddress}&gt;</span>}
            </p>
            <p className="text-[11px] opacity-50 mt-0.5">
              ถึง {message.to} · {formatDateTime(message.receivedAt)} · {formatBytes(message.size)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasHtml && (
              <div className="join">
                <button
                  className={`join-item btn btn-xs ${view === "rich" ? "btn-active" : ""}`}
                  onClick={() => setView("rich")}
                >
                  HTML
                </button>
                <button
                  className={`join-item btn btn-xs ${view === "plain" ? "btn-active" : ""}`}
                  onClick={() => setView("plain")}
                >
                  Text
                </button>
              </div>
            )}
            <button
              className="btn btn-ghost btn-xs btn-square text-error"
              onClick={() => onDelete(message.id)}
              title="ลบอีเมลนี้"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {message.hadAttachments && (
          <div className="mt-3">
            {message.attachmentsLocked ? (
              <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
                <LockClosedIcon className="w-4 h-4 shrink-0 text-warning" />
                <span>
                  อีเมลนี้มีไฟล์แนบ — แผน Free ไม่เก็บไฟล์แนบไว้ ต้องใช้แผน Pro
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((att) => (
                  <a
                    key={att.index}
                    className={`btn btn-xs gap-1 ${att.stored ? "btn-outline" : "btn-disabled opacity-50"}`}
                    href={
                      att.stored
                        ? `/api/temp-mail/attachment/${message.id}?index=${att.index}`
                        : undefined
                    }
                    download={att.stored ? att.filename : undefined}
                    title={att.stored ? att.filename : "ไฟล์ใหญ่เกินกำหนด ไม่ได้เก็บไว้"}
                  >
                    {att.stored ? (
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    ) : (
                      <PaperClipIcon className="w-3.5 h-3.5" />
                    )}
                    <span className="max-w-[160px] truncate">{att.filename}</span>
                    <span className="opacity-60">{formatBytes(att.size)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-white">
        {view === "rich" && hasHtml ? (
          <iframe
            key={`${message.id}-rich`}
            title="message-body"
            sandbox=""
            srcDoc={srcDoc}
            className="w-full h-full border-0"
          />
        ) : (
          <pre className="w-full h-full overflow-auto p-4 text-sm whitespace-pre-wrap break-words text-gray-800">
            {message.text || "(ไม่มีเนื้อหาแบบข้อความ)"}
          </pre>
        )}
      </div>
    </div>
  );
}

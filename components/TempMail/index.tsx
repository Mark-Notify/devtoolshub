"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  ArrowPathIcon,
  ArrowPathRoundedSquareIcon,
  BoltIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  EnvelopeIcon,
  InboxIcon,
  LockClosedIcon,
  PaperClipIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { toastError, toastSuccess } from "../../lib/swal";
import MessageView from "./MessageView";
import type { Mailbox, MessageDetail, MessageSummary, PlanInfo } from "./types";
import { formatCountdown, formatRelative } from "./utils";

const POLL_INTERVAL_MS = 6000;

type ApiError = Error & { code?: string; status?: number };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body
      ? { "Content-Type": "application/json", ...(init?.headers || {}) }
      : init?.headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (data as { message?: string })?.message || `Request failed (${res.status})`
    ) as ApiError;
    err.code = (data as { code?: string })?.code;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export default function TempMail() {
  const { data: session } = useSession();
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [activeAddress, setActiveAddress] = useState<string>("");
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [selected, setSelected] = useState<MessageDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [booting, setBooting] = useState(true);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expired, setExpired] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [domain, setDomain] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const isPro = planInfo?.plan === "pro";
  const activeMailbox = useMemo(
    () => mailboxes.find((m) => m.address === activeAddress) || null,
    [mailboxes, activeAddress]
  );
  const remainingMs = activeMailbox ? new Date(activeMailbox.expiresAt).getTime() - now : 0;

  // Guards against a slow response for a previous mailbox landing after the
  // user has already switched to another one.
  const activeAddressRef = useRef(activeAddress);
  activeAddressRef.current = activeAddress;

  const loadMessages = useCallback(async (address: string) => {
    if (!address) return;
    try {
      const data = await api<{
        messages: MessageSummary[];
        mailbox: { expiresAt: string; expiresInMs: number };
      }>(`/api/temp-mail/messages?address=${encodeURIComponent(address)}`);
      if (activeAddressRef.current !== address) return;
      setMessages(data.messages);
      setExpired(false);
      setMailboxes((prev) =>
        prev.map((m) => (m.address === address ? { ...m, expiresAt: data.mailbox.expiresAt } : m))
      );
    } catch (err) {
      const status = (err as ApiError).status;
      if ((status === 410 || status === 404) && activeAddressRef.current === address) {
        setExpired(true);
      }
    }
  }, []);

  const createMailbox = useCallback(
    async (opts: { prefix?: string; domain?: string; replace?: string } = {}) => {
      setCreating(true);
      try {
        const data = await api<{ mailbox: Mailbox }>("/api/temp-mail/mailbox", {
          method: "POST",
          body: JSON.stringify(opts),
        });
        setMailboxes((prev) => [
          data.mailbox,
          ...prev.filter((m) => m.address !== data.mailbox.address && m.address !== opts.replace),
        ]);
        setActiveAddress(data.mailbox.address);
        setMessages([]);
        setSelected(null);
        setSelectedId("");
        setExpired(false);
        setPrefix("");
        return data.mailbox;
      } catch (err) {
        toastError((err as Error).message);
        return null;
      } finally {
        setCreating(false);
      }
    },
    []
  );

  /**
   * "Change my address": hand the current address to the API as `replace` so the
   * old mailbox is dropped in the same request. Without that, Free's one-mailbox
   * limit would reject the new one.
   */
  const regenerateAddress = useCallback(async () => {
    const current = activeAddressRef.current;
    await createMailbox(current ? { domain, replace: current } : { domain });
  }, [createMailbox, domain]);

  // Boot: resolve the plan, adopt any live mailbox, otherwise mint a fresh one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await api<PlanInfo>("/api/temp-mail/plan");
        if (cancelled) return;
        setPlanInfo(info);
        setDomain(info.domains[0] || "");

        const boxes = await api<{ mailboxes: Mailbox[] }>("/api/temp-mail/mailbox");
        if (cancelled) return;

        if (boxes.mailboxes.length > 0) {
          setMailboxes(boxes.mailboxes);
          setActiveAddress(boxes.mailboxes[0].address);
        } else if (info.domains.length > 0) {
          await createMailbox();
        }
      } catch (err) {
        if (!cancelled) toastError((err as Error).message);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-runs when the account changes: signing in may flip the plan to Pro.
  }, [createMailbox, session?.user?.email]);

  useEffect(() => {
    if (!activeAddress || expired) return;
    loadMessages(activeAddress);
    const poll = setInterval(() => loadMessages(activeAddress), POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [activeAddress, expired, loadMessages]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (activeMailbox && remainingMs <= 0) setExpired(true);
  }, [activeMailbox, remainingMs]);

  const openMessage = async (id: string) => {
    setSelectedId(id);
    try {
      const data = await api<{ message: MessageDetail }>(`/api/temp-mail/message/${id}`);
      setSelected(data.message);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    } catch (err) {
      toastError((err as Error).message);
      setSelectedId("");
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await api(`/api/temp-mail/message/${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) {
        setSelected(null);
        setSelectedId("");
      }
      toastSuccess("ลบอีเมลแล้ว");
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const renewMailbox = async () => {
    if (!activeAddress) return;
    try {
      const data = await api<{ mailbox: Mailbox }>("/api/temp-mail/mailbox", {
        method: "PATCH",
        body: JSON.stringify({ address: activeAddress }),
      });
      setMailboxes((prev) =>
        prev.map((m) => (m.address === data.mailbox.address ? data.mailbox : m))
      );
      setExpired(false);
      toastSuccess("ต่ออายุกล่องแล้ว");
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const deleteMailbox = async (address: string) => {
    try {
      await api(`/api/temp-mail/mailbox?address=${encodeURIComponent(address)}`, {
        method: "DELETE",
      });
      const remaining = mailboxes.filter((m) => m.address !== address);
      setMailboxes(remaining);
      if (activeAddress === address) {
        setActiveAddress(remaining[0]?.address || "");
        setMessages([]);
        setSelected(null);
        setSelectedId("");
      }
      toastSuccess("ลบกล่องแล้ว");
    } catch (err) {
      toastError((err as Error).message);
    }
  };

  const refreshNow = async () => {
    setRefreshing(true);
    await loadMessages(activeAddress);
    setTimeout(() => setRefreshing(false), 400);
  };

  const copyAddress = () => {
    if (!activeAddress) return;
    navigator.clipboard
      .writeText(activeAddress)
      .then(() => toastSuccess("คัดลอกที่อยู่แล้ว"))
      .catch(() => toastError("คัดลอกไม่สำเร็จ"));
  };

  const unreadCount = messages.filter((m) => !m.read).length;
  const noDomainConfigured = planInfo !== null && planInfo.domains.length === 0;

  if (booting) {
    return (
      <div className="h-full flex items-center justify-center opacity-60 text-sm">
        กำลังเตรียมกล่องจดหมาย...
      </div>
    );
  }

  if (noDomainConfigured) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <EnvelopeIcon className="w-12 h-12 mx-auto opacity-40" />
          <h2 className="text-lg font-bold">ยังไม่ได้ตั้งค่าโดเมนรับเมล</h2>
          <p className="text-sm opacity-60">
            ตั้งค่า <code className="text-xs">TEMP_MAIL_DOMAINS</code> บน Vercel แล้วชี้ MX
            ของโดเมนมาที่ Cloudflare Email Routing ตามคู่มือใน{" "}
            <code className="text-xs">workers/temp-mail-inbound</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Address card ────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-base-300/60 bg-base-100 shrink-0 space-y-2">
        <div className="rounded-xl border border-base-300 bg-base-200/40 px-3 py-2.5 flex flex-wrap items-center gap-3">
          <EnvelopeIcon className="w-5 h-5 opacity-40 shrink-0" />

          <div className="flex-1 min-w-[200px]">
            <div className="text-[10px] uppercase tracking-wider opacity-45">
              ที่อยู่ชั่วคราวของคุณ
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeAddress || "empty"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="font-mono text-base sm:text-lg font-semibold truncate select-all leading-snug"
                title={activeAddress}
              >
                {activeAddress || "—"}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono ${
                remainingMs <= 60_000 ? "bg-error/15 text-error" : "bg-base-100"
              }`}
              title="เวลาที่เหลือก่อนกล่องหมดอายุ"
            >
              <ClockIcon className="w-3.5 h-3.5" />
              {formatCountdown(remainingMs)}
            </div>
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold ${
                isPro ? "bg-amber-500/20 text-amber-500" : "bg-base-100 opacity-60"
              }`}
            >
              {isPro ? "PRO" : "FREE"}
            </span>
            <button
              className="btn btn-primary btn-sm gap-1.5"
              onClick={copyAddress}
              disabled={!activeAddress}
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              คัดลอก
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn btn-outline btn-xs gap-1"
            onClick={regenerateAddress}
            disabled={creating}
            title="ทิ้งที่อยู่นี้แล้วสุ่มที่อยู่ใหม่"
          >
            <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
            สุ่มใหม่
          </button>
          <button className="btn btn-ghost btn-xs gap-1" onClick={refreshNow} title="เช็คเมลเดี๋ยวนี้">
            <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            เช็คเมล
          </button>
          <button className="btn btn-ghost btn-xs gap-1" onClick={renewMailbox} title="ต่ออายุกล่องนี้">
            <ClockIcon className="w-3.5 h-3.5" />
            ต่ออายุ
          </button>
          {isPro && (
            <button
              className="btn btn-ghost btn-xs gap-1"
              onClick={() => createMailbox({ domain })}
              disabled={creating}
              title="เปิดกล่องเพิ่มอีกใบ"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              เพิ่มกล่อง
            </button>
          )}
        </div>

        {/* Pro-only controls, rendered locked on Free so the upgrade is discoverable. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              className="input input-bordered input-xs w-40 font-mono"
              placeholder={isPro ? "ตั้งชื่อเอง" : "custom prefix"}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              disabled={!isPro}
            />
            {planInfo && planInfo.domains.length > 1 && (
              <select
                className="select select-bordered select-xs font-mono"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={!isPro}
              >
                {planInfo.domains.map((d) => (
                  <option key={d} value={d}>
                    @{d}
                  </option>
                ))}
              </select>
            )}
            <button
              className="btn btn-outline btn-xs"
              disabled={!isPro || !prefix.trim() || creating}
              onClick={() => createMailbox({ prefix, domain })}
            >
              สร้าง
            </button>
            {!isPro && (
              <span className="flex items-center gap-1 text-[11px] opacity-60">
                <LockClosedIcon className="w-3 h-3" />
                Pro
              </span>
            )}
          </div>

          {mailboxes.length > 1 && (
            <div className="flex items-center gap-1 flex-wrap">
              {mailboxes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveAddress(m.address);
                    setSelected(null);
                    setSelectedId("");
                    setExpired(false);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    m.address === activeAddress
                      ? "border-primary text-primary bg-primary/10"
                      : "border-base-300 opacity-70"
                  }`}
                >
                  {m.address.split("@")[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Inbox + reader ──────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div className="lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-base-300/60 flex flex-col min-h-0 max-h-[45vh] lg:max-h-none">
          <div className="px-3 py-2 flex items-center justify-between text-xs font-semibold border-b border-base-300/40 shrink-0">
            <span className="flex items-center gap-1.5">
              <InboxIcon className="w-4 h-4" /> Inbox
              {unreadCount > 0 && <span className="badge badge-primary badge-xs">{unreadCount}</span>}
            </span>
            {activeMailbox && (
              <button
                className="btn btn-ghost btn-xs btn-square text-error"
                onClick={() => deleteMailbox(activeMailbox.address)}
                title="ลบกล่องนี้"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {expired ? (
              <div className="p-6 text-center text-sm space-y-3">
                <ClockIcon className="w-8 h-8 mx-auto opacity-30" />
                <p className="opacity-60">กล่องนี้หมดอายุแล้ว</p>
                <button className="btn btn-primary btn-xs" onClick={regenerateAddress}>
                  สุ่มที่อยู่ใหม่
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-sm space-y-2">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2.4 }}
                  className="w-10 h-10 mx-auto rounded-full bg-base-200 flex items-center justify-center"
                >
                  <EnvelopeIcon className="w-5 h-5 opacity-50" />
                </motion.div>
                <p className="opacity-60">รออีเมลเข้า...</p>
                <p className="text-xs opacity-40">ระบบเช็คให้อัตโนมัติทุก 6 วินาที</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.button
                    key={m.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => openMessage(m.id)}
                    className={`w-full text-left px-3 py-2.5 border-b border-base-300/40 hover:bg-base-200/60 transition ${
                      selectedId === m.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!m.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      <span
                        className={`text-xs truncate flex-1 ${m.read ? "opacity-60" : "font-semibold"}`}
                      >
                        {m.fromName || m.fromAddress}
                      </span>
                      {m.hadAttachments && <PaperClipIcon className="w-3 h-3 opacity-50 shrink-0" />}
                      <span className="text-[10px] opacity-40 shrink-0">
                        {formatRelative(m.receivedAt)}
                      </span>
                    </div>
                    <div className={`text-sm truncate mt-0.5 ${m.read ? "opacity-70" : "font-medium"}`}>
                      {m.subject}
                    </div>
                    <div className="text-[11px] opacity-45 truncate mt-0.5">{m.preview}</div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>

          {!isPro && <ProUpsell signedIn={Boolean(planInfo?.signedIn)} />}
        </div>

        <div className="flex-1 min-h-0">
          {selected ? (
            <MessageView message={selected} onDelete={deleteMessage} />
          ) : (
            <div className="h-full flex items-center justify-center text-sm opacity-40 p-6 text-center">
              เลือกอีเมลทางซ้ายเพื่ออ่าน
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProUpsell({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="shrink-0 m-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
        <SparklesIcon className="w-4 h-4" /> Pro
      </div>
      <ul className="mt-2 space-y-1 text-[11px] opacity-70">
        <li className="flex items-center gap-1.5">
          <BoltIcon className="w-3 h-3" /> อายุกล่อง 24 ชั่วโมง
        </li>
        <li className="flex items-center gap-1.5">
          <BoltIcon className="w-3 h-3" /> หลาย mailbox พร้อมกัน
        </li>
        <li className="flex items-center gap-1.5">
          <BoltIcon className="w-3 h-3" /> ดาวน์โหลดไฟล์แนบได้
        </li>
        <li className="flex items-center gap-1.5">
          <BoltIcon className="w-3 h-3" /> ตั้งชื่อกล่องเองได้
        </li>
      </ul>
      <p className="mt-2 text-[11px] opacity-50 leading-relaxed">
        ยังไม่เปิดขาย — ตอนนี้ Pro เปิดให้เฉพาะบัญชีที่อยู่ใน whitelist
        {signedIn ? " (บัญชีของคุณยังไม่อยู่ในรายชื่อ)" : ""}
      </p>
      {!signedIn && (
        <button className="btn btn-xs btn-outline w-full mt-2" onClick={() => signIn("google")}>
          เข้าสู่ระบบเพื่อตรวจสอบสิทธิ์
        </button>
      )}
    </div>
  );
}

export type MailPlan = "free" | "pro";

export type PlanLimits = {
  key: MailPlan;
  label: string;
  ttlMinutes: number;
  maxMailboxes: number;
  attachments: boolean;
  customPrefix: boolean;
  maxMessages: number;
  maxAttachmentBytes: number;
  maxTotalAttachmentBytes: number;
};

export type PlanInfo = {
  plan: MailPlan;
  email: string | null;
  signedIn: boolean;
  limits: PlanLimits;
  plans: Record<MailPlan, PlanLimits>;
  domains: string[];
};

export type Mailbox = {
  id: string;
  address: string;
  domain: string;
  plan: MailPlan;
  createdAt: string;
  expiresAt: string;
  expiresInMs: number;
  messageCount: number;
};

export type MessageSummary = {
  id: string;
  fromName: string | null;
  fromAddress: string;
  subject: string;
  preview: string;
  read: boolean;
  size: number;
  hadAttachments: boolean;
  attachmentCount: number;
  receivedAt: string;
};

export type MessageAttachment = {
  index: number;
  filename: string;
  contentType: string;
  size: number;
  stored: boolean;
};

export type MessageDetail = {
  id: string;
  fromName: string | null;
  fromAddress: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  size: number;
  receivedAt: string;
  hadAttachments: boolean;
  attachmentsLocked: boolean;
  attachments: MessageAttachment[];
};

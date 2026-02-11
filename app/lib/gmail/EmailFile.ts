/**
 * EmailFile – read and write an email as if it were a file.
 * Uses the EMAIL_FOLDER_FOR_DATA Gmail label as the "folder"; the email subject is the "name".
 */

import { EMAIL_FOLDER_FOR_DATA } from "../../constants";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const GMAIL_LABELS_URL = `${GMAIL_BASE}/labels`;
const GMAIL_MESSAGES_URL = `${GMAIL_BASE}/messages`;

type GmailLabel = { id: string; name: string };
type GmailMessageListItem = { id: string; threadId: string };
type GmailMessagePart = {
  mimeType?: string;
  filename?: string;
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
};
type GmailMessagePayload = {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
};

function authHeader(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

function base64UrlDecode(base64url: string): string {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function rfc2822Date(): string {
  return new Date().toUTCString().replace("GMT", "+0000");
}

/** Resolve the Gmail label ID for EMAIL_FOLDER_FOR_DATA. */
async function getAppLabelId(accessToken: string): Promise<string | null> {
  const res = await fetch(GMAIL_LABELS_URL, { headers: authHeader(accessToken) });
  if (!res.ok) return null;
  const data = (await res.json()) as { labels?: GmailLabel[] };
  const labels = data.labels ?? [];
  const label = labels.find((l) => l.name === EMAIL_FOLDER_FOR_DATA);
  return label?.id ?? null;
}

/** Extract plain-text body from a message payload (top-level or first part with data). */
function getBodyFromPayload(payload: GmailMessagePayload): string {
  if (payload.body?.data) return base64UrlDecode(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.body?.data) return base64UrlDecode(part.body.data);
      if (part.parts) {
        const nested = getBodyFromPayload(part as GmailMessagePayload);
        if (nested) return nested;
      }
    }
  }
  return "";
}

/**
 * Read an email from the EMAIL_FOLDER_FOR_DATA folder whose subject equals `name`.
 * Returns the email body as a string (e.g. JSON). Returns null if no such email exists.
 */
export async function readEmail(
  name: string,
  accessToken: string
): Promise<string | null> {
  const labelId = await getAppLabelId(accessToken);
  if (!labelId) return null;

  const subjectQuery = name.includes('"') ? `subject:${name.replace(/"/g, '\\"')}` : `subject:"${name}"`;
  const q = encodeURIComponent(subjectQuery);
  const listUrl = `${GMAIL_MESSAGES_URL}?labelIds=${encodeURIComponent(labelId)}&q=${q}&maxResults=1`;
  const listRes = await fetch(listUrl, { headers: authHeader(accessToken) });
  if (!listRes.ok) return null;

  const listData = (await listRes.json()) as { messages?: GmailMessageListItem[] };
  const messages = listData.messages ?? [];
  const first = messages[0];
  if (!first) return null;

  const getUrl = `${GMAIL_MESSAGES_URL}/${first.id}`;
  const getRes = await fetch(getUrl, { headers: authHeader(accessToken) });
  if (!getRes.ok) return null;

  const message = (await getRes.json()) as { payload?: GmailMessagePayload };
  const payload = message.payload;
  if (!payload) return null;

  return getBodyFromPayload(payload);
}

/**
 * Write an email into the EMAIL_FOLDER_FOR_DATA folder with subject `name` and body `content`.
 * If an email with the same subject already exists in that folder, it is deleted first.
 */
export async function writeEmail(
  name: string,
  content: string,
  accessToken: string
): Promise<void> {
  const labelId = await getAppLabelId(accessToken);
  if (!labelId) throw new Error(`Label "${EMAIL_FOLDER_FOR_DATA}" not found`);

  const subjectQuery = name.includes('"') ? `subject:${name.replace(/"/g, '\\"')}` : `subject:"${name}"`;
  const q = encodeURIComponent(subjectQuery);
  const auth = authHeader(accessToken);

  // List and delete all existing emails with this subject (paginate until none left)
  let pageToken: string | undefined;
  do {
    const listParams = new URLSearchParams({
      labelIds: labelId,
      q: subjectQuery,
      maxResults: "500",
    });
    if (pageToken) listParams.set("pageToken", pageToken);
    const listUrl = `${GMAIL_MESSAGES_URL}?${listParams.toString()}`;
    const listRes = await fetch(listUrl, { headers: auth });
    if (!listRes.ok) {
      const err = await listRes.text();
      throw new Error(`Failed to list messages: ${listRes.status} ${err}`);
    }

    const listData = (await listRes.json()) as {
      messages?: GmailMessageListItem[];
      nextPageToken?: string;
    };
    const messages = listData.messages ?? [];
    pageToken = listData.nextPageToken;

    for (const msg of messages) {
      const delRes = await fetch(`${GMAIL_MESSAGES_URL}/${msg.id}`, {
        method: "DELETE",
        headers: auth,
      });
      if (!delRes.ok) {
        const err = await delRes.text();
        throw new Error(`Failed to delete message ${msg.id}: ${delRes.status} ${err}`);
      }
    }
  } while (pageToken);

  const lines = [
    `From: storage@${EMAIL_FOLDER_FOR_DATA}.local`,
    `To: storage@${EMAIL_FOLDER_FOR_DATA}.local`,
    `Subject: ${name.replace(/\r?\n/g, " ")}`,
    `Date: ${rfc2822Date()}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    content,
  ];
  const rawRfc2822 = lines.join("\r\n");
  const raw = base64UrlEncode(rawRfc2822);

  const insertRes = await fetch(GMAIL_MESSAGES_URL, {
    method: "POST",
    headers: {
      ...authHeader(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw, labelIds: [labelId] }),
  });
  if (!insertRes.ok) {
    const err = await insertRes.text();
    throw new Error(`Failed to write email: ${insertRes.status} ${err}`);
  }
}

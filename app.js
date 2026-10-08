import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabaseUrl = window.TUMA_CONFIG?.supabaseUrl || "";
const supabaseAnonKey = window.TUMA_CONFIG?.supabaseAnonKey || "";

function isPublicSupabaseKey(key) {
  if (key.startsWith("sb_publishable_")) return true;
  const payload = key.split(".")[1];
  if (!payload) return false;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(atob(base64)).role === "anon";
  } catch {
    return false;
  }
}

const hasSupabaseSettings = Boolean(supabaseUrl && supabaseAnonKey);
const configured = hasSupabaseSettings && isPublicSupabaseKey(supabaseAnonKey);
const supabase = configured ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
function readLocalValue(key, fallback = "") {
  try { return localStorage.getItem(key) ?? fallback; }
  catch (error) { console.warn("Local preference could not be read", error); return fallback; }
}
function writeLocalValue(key, value) {
  try { localStorage.setItem(key, value); }
  catch (error) { console.warn("Local preference could not be saved", error); }
}
const form = $("#messageForm");
const messageField = $("#messageText");
const formError = $("#formError");
const sendButton = $("#sendButton");
const translations = {
  en: {
    navWall: "Community wall", navHelp: "Get help", navPrivacy: "Privacy", navWrite: "Write anonymously",
    themeToggleLabel: "Switch color theme", menuOpen: "Open menu", menuClose: "Close menu", closeLabel: "Close",
    catSchool: "School", catFamily: "Family", catRelationships: "Relationships", catMoney: "Money", catWork: "Work", catHealth: "Health", catOther: "Other",
    heroEyebrow: "A little room to breathe", noteKicker: "A gentle reminder", noteText: "You don’t have<br>to carry it alone.", heroTitle: "Whatever is on your heart, <em>you can put it here.</em>",
    heroDescription: "Some things are easier to say when nobody knows your name. Share what you’re carrying. You deserve to be heard.",
    heroButton: "Write your message", heroTrust: "No account. No name. Just your words.", promiseTitle: "A kind space, by design",
    promiseCopy: "Your message is private while it’s reviewed. Only approved messages can appear on the community wall.",
    privacyLearn: "How your privacy works", wallLabel: "YOU ARE NOT ALONE", wallTeaser: "A few words can make someone feel less alone.",
    wallLink: "Visit the community wall", backHome: "Back to home", writeKicker: "THIS SPACE IS YOURS", writeTitle: "Write what you need to say.",
    writeIntro: "Take your time. Nothing here asks who you are.", messageLabel: "Your message",
    messagePlaceholder: "Start anywhere. It doesn’t have to be perfect.",
    messagePrivate: "Please don’t include names or details that could identify you or someone else.",
    categoryLabel: "Would a topic help?", optional: "(optional)", categoryNone: "Choose a topic", ruleTitle: "A small community promise",
    ruleCopy: "Be kind. No harassment. Please don’t share another person’s private details.",
    crisisTitle: "It sounds like you may be going through something urgent.",
    crisisCopy: "You deserve immediate support. If you or someone else is in immediate danger, contact your local emergency service or go to the nearest emergency department. If you are under 18, find a child helpline in your country. This space cannot provide emergency care.",
    crisisMore: "See support options", crisisContinue: "I’m safe right now; continue sharing",
    sendButton: "Send anonymously",
    formFootnote: "Your message is reviewed by a moderator before it can appear publicly.",
    sentKicker: "MESSAGE RECEIVED", sentTitle: "Your message was sent anonymously.",
    sentCopy: "Thank you for trusting this space with your words. A moderator will review it before anything appears on the wall.",
    sentHome: "Back to the quiet", sentWall: "Visit the community wall", wallKicker: "WORDS FROM THE COMMUNITY",
    wallTitle: "A place to feel a little less alone.", wallIntro: "Messages are shared here only after a moderator has reviewed them. Leave a little kindness if you’d like.",
    wallRule: "Please be kind. Do not share names or private details.", refresh: "Refresh messages",
    wallLoading: "Finding a little light…", wallEmpty: "There are no approved messages yet. You could be the first to share a kind word.",
    wallNotConfigured: "The community wall is not configured yet. Please come back later.",
    wallError: "The community wall could not load. Please try again.", wallWrite: "Share your words",
    helpKicker: "SUPPORT WHEN YOU NEED IT", helpTitle: "You deserve real support, too.",
    helpIntro: "Tuma250 is a listening space, not a crisis service. If you or someone else may be in immediate danger, please reach out now.",
    urgentLabel: "IF SOMEONE IS IN IMMEDIATE DANGER", urgentTitle: "Contact local emergency services",
    urgentCopy: "Use the emergency number where you are, or go to the nearest emergency department. If calling feels hard, tell someone you trust and ask them to stay with you.",
    youthLabel: "FOR CHILDREN AND YOUNG PEOPLE", youthTitle: "Find a child helpline",
    youthCopy: "If you are under 18, a child helpline in your country can help you find support.",
    childHelplineLink: "Find a child helpline ↗",
    nearbyLabel: "IN YOUR COMMUNITY", nearbyTitle: "Find someone nearby",
    nearbyCopy: "A trusted person, health centre, or hospital can help you find support. You do not have to explain everything at once.",
    healthMinistry: "Find a local crisis helpline ↗",
    helpNote: "Helpline numbers and services vary by country. Choose your country to find a verified local service.",
    privacyKicker: "PLAIN-LANGUAGE PRIVACY", privacyTitle: "Your words. Not your identity.",
    privacyIntro: "You can send a message without creating an account, giving us your name, or sharing an email address.",
    storedTitle: "What is stored",
    storedCopy: "The message you choose to send, an optional topic, the time it was submitted, its review status, and anonymous reaction totals. Replies and any optional report reason are also stored with their related message for moderation. Records stay here until a moderator deletes them.",
    notStoredTitle: "What we do not ask for or store with a message",
    notStoredCopy: "Your name, email, account, or IP address. We do not attach advertising trackers or analytics IDs to messages. Theme and the short send cooldown stay in this browser only; they are not sent with your message. Avoid including names or identifying details in what you write.",
    reviewTitle: "Before anything is public", reviewCopy: "Every message and reply starts private and must be approved by a moderator before it appears on the wall. You can report a public message for another review.",
    limitsTitle: "A note about online services",
    limitsCopy: "The hosting and database providers needed to deliver this site may process technical connection data under their own policies. The app does not save IP addresses in message records. No online service can promise perfect anonymity.",
    privacyUpdated: "If you need urgent help, please visit the support page. This service is not monitored continuously.",
    adminKicker: "MODERATOR SPACE", adminTitle: "Careful words, careful hands.",
    adminIntro: "Sign in with your authorized moderator account to review submissions and reports.",
    emailLabel: "Moderator email", passwordLabel: "Password", adminLogin: "Sign in", adminLogout: "Sign out",
    adminLink: "Moderator access", footerLine: "A quiet space to be heard. Made with care.", cancel: "Cancel",
    category: "TOPIC", support: "Send support", reply: "Reply kindly", report: "Report", reportSent: "Report sent for review.",
    approved: "Approved",
    replyPlaceholder: "Leave a gentle, anonymous reply…", replySend: "Send reply", replySent: "Your reply is private until approved.",
    approve: "Approve", delete: "Delete", reported: "Reported", pending: "Awaiting review", noAdminMessages: "No messages need review.",
    loginFailed: "Sign-in failed. Check your details and moderator access.", loadAdminFailed: "Could not load the moderator queue.",
    noConfig: "This service is not configured yet. Please try again later.",
    invalidPublicKey: "Use the Supabase anon/public or publishable key here. A service-role key is unsafe in browser code.",
    rateWait: "Please wait a little before sending another message.",
    submitFailed: "Your message could not be sent. Please try again in a moment.",
    tooShort: "Please write at least 10 characters.", replyError: "Your reply could not be sent. Please try again.",
    reportError: "Your report could not be sent. Please try again.", approvedToast: "Message approved.",
    deletedToast: "Message deleted.", deleteConfirm: "Delete this message permanently?", actionFailed: "That action could not be completed. Please try again.",
    thanks: "Thank you for being kind.", flagThreat: "Needs safety review", flagAbuse: "Needs kindness review",
  },
};
let communityAction = null;
let communityDialogTrigger = null;
let pendingCrisisMessage = false;
const t = (key) => translations.en[key] || key;
const configurationMessage = () => t(hasSupabaseSettings ? "invalidPublicKey" : "noConfig");
const toast = (text) => {
  const el = $("#toast"); el.textContent = text; el.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { el.hidden = true; }, 3200);
};
const showError = (element, message) => { element.textContent = message; element.hidden = false; };

function applyTranslations() {
  $$("[data-i18n]").forEach((element) => {
    const value = t(element.dataset.i18n);
    if (["heroTitle", "noteText"].includes(element.dataset.i18n)) element.innerHTML = value;
    else if (element.dataset.i18n === "privacyUpdated") {
      element.replaceChildren(document.createTextNode("If you need urgent help, please visit the "));
      const link = document.createElement("a"); link.href = "#help"; link.textContent = t("navHelp"); element.append(link);
      element.append(document.createTextNode(". This service is not monitored continuously."));
    } else if (element.dataset.i18n === "helpNote") {
      element.replaceChildren(document.createTextNode("Helpline numbers and services vary by country. Choose your country to find a verified local service: "));
      const link = document.createElement("a"); link.href = "https://findahelpline.com/"; link.target = "_blank"; link.rel = "noreferrer"; link.textContent = "findahelpline.com"; element.append(link);
      element.append(document.createTextNode("."));
    } else element.textContent = value;
  });
  $$("[data-i18n-aria-label]").forEach((element) => { element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel)); });
  $$("[data-i18n-placeholder]").forEach((element) => { element.placeholder = t(element.dataset.i18nPlaceholder); });
  $("#messageText").setAttribute("aria-label", t("messageLabel"));
  renderWall();
  if (location.hash === "#admin" && supabase) loadAdminQueue();
}
function navigate() {
  const id = location.hash.slice(1) || "home";
  const target = document.getElementById(id);
  const page = target?.classList.contains("page") ? target : $("#home");
  $$(".page").forEach((item) => item.classList.toggle("active", item === page));
  $("#mobileMenu").hidden = true; $("#menuToggle").setAttribute("aria-expanded", "false");
  if (page.id === "wall") loadWall();
  if (page.id === "admin" && supabase) checkAdminSession();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", navigate);
window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dataset.theme = readLocalValue("tuma-theme") || "light";
  $("#themeToggle").innerHTML = document.documentElement.dataset.theme === "dark" ? '<span aria-hidden="true">☀</span>' : '<span aria-hidden="true">☾</span>';
  $("#themeToggle").addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme; writeLocalValue("tuma-theme", theme);
    $("#themeToggle").innerHTML = theme === "dark" ? '<span aria-hidden="true">☀</span>' : '<span aria-hidden="true">☾</span>';
  });
  $("#menuToggle").addEventListener("click", () => { const menu = $("#mobileMenu"); menu.hidden = !menu.hidden; $("#menuToggle").setAttribute("aria-expanded", String(!menu.hidden)); $("#menuToggle").setAttribute("aria-label", t(menu.hidden ? "menuOpen" : "menuClose")); });
  $("#charCount").textContent = `0 / ${messageField.maxLength}`;
  navigate(); applyTranslations();
});

const dangerPattern = /\b(suicid(?:e|al)|kill myself|end my life|hurt myself|self[- ]harm|want to die|don't want to live|can't go on|going to hurt (?:him|her|them)|i will kill)\b/i;
messageField.addEventListener("input", () => {
  $("#charCount").textContent = `${messageField.value.length} / ${messageField.maxLength}`;
  $("#crisisNotice").hidden = true; pendingCrisisMessage = false;
});
$("#continueMessage").addEventListener("click", () => {
  pendingCrisisMessage = true; $("#crisisNotice").hidden = true; form.requestSubmit();
});
form.addEventListener("submit", async (event) => {
  event.preventDefault(); formError.hidden = true;
  if (messageField.value.trim().length < 10) return showError(formError, t("tooShort"));
  if (!pendingCrisisMessage && dangerPattern.test(messageField.value)) {
    $("#crisisNotice").hidden = false; $("#crisisNotice").scrollIntoView({ behavior: "smooth", block: "center" }); return;
  }
  if ($("#website").value) return showError(formError, t("submitFailed"));
  if (!supabase) return showError(formError, configurationMessage());
  const lastSentAt = Number(readLocalValue("tuma-last-submit", "0"));
  if (Date.now() - lastSentAt < 20_000) return showError(formError, t("rateWait"));
  sendButton.disabled = true; sendButton.setAttribute("aria-busy", "true");
  try {
    const { error } = await supabase.functions.invoke("submit-message", {
      body: { kind: "message", content: messageField.value.trim(), category: $("#category").value || null, website: $("#website").value },
    });
    if (error) throw error;
    writeLocalValue("tuma-last-submit", String(Date.now()));
    pendingCrisisMessage = false; form.reset(); $("#charCount").textContent = `0 / ${messageField.maxLength}`;
    location.hash = "confirmation";
  } catch (error) {
    console.error("Message submission failed", error);
    showError(formError, error.context?.status === 429 ? "Please wait a moment before sending another message." : t("submitFailed"));
  } finally {
    sendButton.disabled = false; sendButton.removeAttribute("aria-busy");
  }
});

let wallMessages = [];
let wallLoadState = "idle";
async function loadWall() {
  const grid = $("#wallGrid");
  if (!supabase) { wallMessages = []; wallLoadState = "not-configured"; renderWall(); return; }
  wallMessages = []; wallLoadState = "loading"; renderWall();
  const { data, error } = await supabase.from("messages").select("id, content, category, created_at, reactions, replies(content, created_at)").eq("status", "approved").eq("replies.status", "approved").order("created_at", { ascending: false }).limit(60);
  if (error) { console.error("Wall query failed", error); wallLoadState = "error"; renderWall(); return; }
  wallMessages = data || []; wallLoadState = "ready"; renderWall();
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function renderWall() {
  const grid = $("#wallGrid"); if (!grid) return;
  if (!wallMessages.length) {
    const messageKey = {
      loading: "wallLoading", error: "wallError", "not-configured": "wallNotConfigured", ready: "wallEmpty",
    }[wallLoadState] || (supabase ? "wallEmpty" : "wallNotConfigured");
    grid.innerHTML = `<div class="empty-state">${escapeHtml(t(messageKey))}</div>`; return;
  }
  grid.innerHTML = wallMessages.map((message) => {
    const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(message.created_at));
    return `<article class="wall-card" data-id="${escapeHtml(message.id)}">
      ${message.category ? `<span class="wall-category">${escapeHtml(t(`cat${message.category}`))}</span>` : ""}
      <p class="wall-message">${escapeHtml(message.content)}</p>
      ${(message.replies || []).map((reply) => `<blockquote class="wall-reply">${escapeHtml(reply.content)}</blockquote>`).join("")}
      <div class="wall-card-footer"><span class="wall-date">${escapeHtml(date)}</span><div class="card-actions">
        <button class="small-action react-button" type="button" data-id="${escapeHtml(message.id)}" aria-label="${escapeHtml(t("support"))}">♡ ${Number(message.reactions) || 0}</button>
        <button class="small-action reply-button" type="button" data-id="${escapeHtml(message.id)}">${escapeHtml(t("reply"))}</button>
        <button class="small-action report-button" type="button" data-id="${escapeHtml(message.id)}">${escapeHtml(t("report"))}</button>
      </div></div>
    </article>`;
  }).join("");
  $$(".react-button", grid).forEach((button) => button.addEventListener("click", () => react(button.dataset.id)));
  $$(".report-button", grid).forEach((button) => button.addEventListener("click", () => reportMessage(button.dataset.id)));
  $$(".reply-button", grid).forEach((button) => button.addEventListener("click", () => replyToMessage(button.dataset.id)));
}
async function react(id) {
  if (!supabase) return toast(configurationMessage());
  const { data, error } = await supabase.rpc("send_support", { message_id: id });
  if (error) { console.error("Reaction failed", error); return toast(t("actionFailed")); }
  const item = wallMessages.find((message) => message.id === id);
  if (item) { item.reactions = Number(data) || Number(item.reactions || 0) + 1; renderWall(); }
  toast(t("thanks"));
}
function openCommunityDialog(kind, id) {
  if (!supabase) return toast(configurationMessage());
  communityAction = { kind, id };
  communityDialogTrigger = document.activeElement;
  const isReply = kind === "reply";
  $("#communityDialogTitle").textContent = t(isReply ? "reply" : "report");
  $("#communityDialogLabel").textContent = isReply ? t("replyPlaceholder") : "What concerns you about this message? (optional)";
  $("#communityDialogText").placeholder = t(isReply ? "replyPlaceholder" : "report");
  $("#communityDialogText").required = isReply;
  $("#communityDialogText").maxLength = isReply ? 2000 : 500;
  $("#submitCommunityAction").textContent = t(isReply ? "replySend" : "report");
  $("#communityDialogError").hidden = true;
  $("#communityDialog").hidden = false;
  $("#communityDialogText").focus();
}
function closeCommunityDialog() {
  $("#communityDialog").hidden = true;
  $("#communityActionForm").reset();
  communityAction = null;
  communityDialogTrigger?.focus();
  communityDialogTrigger = null;
}
$("#closeCommunityDialog").addEventListener("click", closeCommunityDialog);
$("#cancelCommunityAction").addEventListener("click", closeCommunityDialog);
$("#communityDialog").addEventListener("click", (event) => { if (event.target === $("#communityDialog")) closeCommunityDialog(); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#communityDialog").hidden) closeCommunityDialog();
});
$("#communityActionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorEl = $("#communityDialogError"); errorEl.hidden = true;
  const content = $("#communityDialogText").value.trim();
  if ($("#communityWebsite").value) return showError(errorEl, t("actionFailed"));
  if (communityAction.kind === "reply" && content.length < 10) return showError(errorEl, t("tooShort"));
  const payload = communityAction.kind === "reply"
    ? { kind: "reply", message_id: communityAction.id, content, website: $("#communityWebsite").value }
    : { kind: "report", message_id: communityAction.id, reason: content, website: $("#communityWebsite").value };
  const submitButton = $("#submitCommunityAction");
  submitButton.disabled = true;
  try {
    const { error } = await supabase.functions.invoke("submit-message", { body: payload });
    if (error) throw error;
    const isReply = communityAction.kind === "reply";
    closeCommunityDialog(); toast(t(isReply ? "replySent" : "reportSent"));
  } catch (error) {
    console.error("Community action failed", error);
    showError(errorEl, t(communityAction.kind === "reply" ? "replyError" : "reportError"));
  } finally {
    submitButton.disabled = false;
  }
});
function reportMessage(id) { openCommunityDialog("report", id); }
function replyToMessage(id) { openCommunityDialog("reply", id); }
$("#refreshWall").addEventListener("click", loadWall);

const loginForm = $("#loginForm");
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault(); const errorEl = $("#loginError"); errorEl.hidden = true;
  if (!supabase) return showError(errorEl, configurationMessage());
  const { error } = await supabase.auth.signInWithPassword({ email: $("#adminEmail").value, password: $("#adminPassword").value });
  if (error) { console.error("Moderator sign-in failed", error); return showError(errorEl, t("loginFailed")); }
  await checkAdminSession();
});
async function checkAdminSession() {
  if (!supabase) return;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) { console.error("Moderator session check failed", error); return; }
  loginForm.hidden = Boolean(session); $("#adminDashboard").hidden = !session;
  if (session) loadAdminQueue();
}
$("#adminLogout").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) { console.error("Moderator sign-out failed", error); return toast(t("actionFailed")); }
  $("#adminDashboard").hidden = true; loginForm.hidden = false;
});
async function loadAdminQueue() {
  if (!supabase) return;
  const { data, error } = await supabase.from("messages").select("id, content, category, created_at, status, moderation_flags, report_count, reports(reason, created_at)").or("status.eq.pending,report_count.gt.0").order("created_at", { ascending: false }).limit(100);
  if (error) { console.error("Moderator queue failed", error); $("#adminStatus").textContent = t("loadAdminFailed"); return; }
  const { data: replies, error: repliesError } = await supabase.from("replies").select("id, message_id, content, created_at, status").eq("status", "pending").order("created_at", { ascending: false }).limit(100);
  if (repliesError) { console.error("Reply review queue failed", repliesError); $("#adminStatus").textContent = t("loadAdminFailed"); return; }
  const host = $("#adminMessages");
  if (!data?.length && !replies?.length) { host.innerHTML = `<div class="empty-state">${escapeHtml(t("noAdminMessages"))}</div>`; return; }
  const messageCards = (data || []).map((item) => `<article class="admin-card"><div class="admin-card-top"><span>${escapeHtml(item.category ? t(`cat${item.category}`) : t("category"))} · ${escapeHtml(t(item.status))}${item.report_count ? ` · ${escapeHtml(t("reported"))}: ${Number(item.report_count)}` : ""}</span><span>${escapeHtml(new Date(item.created_at).toLocaleString())}</span></div><p>${escapeHtml(item.content)}</p>${item.moderation_flags?.length ? `<p>${escapeHtml(item.moderation_flags.map((flag) => t(flag === "possible_threat" ? "flagThreat" : "flagAbuse")).join(", "))}</p>` : ""}${item.reports?.length ? `<div class="report-notes">${item.reports.map((report) => `<p><strong>${escapeHtml(t("reported"))}:</strong> ${escapeHtml(report.reason || "No reason provided")}</p>`).join("")}</div>` : ""}<div class="admin-card-actions">${item.status === "pending" ? `<button class="button button-primary approve-button" data-id="${escapeHtml(item.id)}">${escapeHtml(t("approve"))}</button>` : ""}<button class="button button-outline delete-button" data-id="${escapeHtml(item.id)}">${escapeHtml(t("delete"))}</button></div></article>`).join("");
  const replyCards = (replies || []).map((item) => `<article class="admin-card"><div class="admin-card-top"><span>${escapeHtml(t("reply"))} · ${escapeHtml(t("pending"))}</span><span>${escapeHtml(new Date(item.created_at).toLocaleString())}</span></div><p>${escapeHtml(item.content)}</p><div class="admin-card-actions"><button class="button button-primary approve-reply-button" data-id="${escapeHtml(item.id)}">${escapeHtml(t("approve"))}</button><button class="button button-outline delete-reply-button" data-id="${escapeHtml(item.id)}">${escapeHtml(t("delete"))}</button></div></article>`).join("");
  host.innerHTML = messageCards + replyCards;
  $$(".approve-button", host).forEach((button) => button.addEventListener("click", () => moderateMessage(button.dataset.id, "approved")));
  $$(".delete-button", host).forEach((button) => button.addEventListener("click", () => deleteMessage(button.dataset.id, "messages")));
  $$(".approve-reply-button", host).forEach((button) => button.addEventListener("click", () => moderateReply(button.dataset.id, "approved")));
  $$(".delete-reply-button", host).forEach((button) => button.addEventListener("click", () => deleteMessage(button.dataset.id, "replies")));
}
async function moderateMessage(id, status) {
  const { error } = await supabase.from("messages").update({ status }).eq("id", id);
  if (error) { console.error("Moderation action failed", error); return toast(t("actionFailed")); }
  toast(status === "approved" ? t("approvedToast") : t("deletedToast")); loadAdminQueue();
}
async function deleteMessage(id, table) {
  if (!window.confirm(t("deleteConfirm"))) return;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) { console.error("Delete moderation action failed", error); return toast(t("actionFailed")); }
  toast(t("deletedToast")); loadAdminQueue();
}

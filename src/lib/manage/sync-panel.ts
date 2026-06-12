import { getState } from "../../lib/store";
import { escapeHtml } from "../../lib/helpers";
import { getCurrentUser, onAuthChange, signInWithEmail, signUpWithEmail, signOut, resetPassword } from "../../lib/auth";
import { isConfigured } from "../../lib/supabase";
import { onSyncStatus, getLastSynced, doSync } from "../../lib/sync";
import type { SyncMode } from "../../lib/sync";
import { showToast, saveFocus, restoreFocus } from "./shared";

export function initSyncPanel(): void {
  const stateInfo = document.getElementById("sync-state-info")!;
  const accountInfo = document.getElementById("sync-account-info")!;
  const indicator = document.getElementById("sync-indicator-text")!;
  const lastTime = document.getElementById("sync-last-time")!;
  const storageInfo = document.getElementById("sync-storage-info")!;
  const forceBtn = document.getElementById("sync-force-btn")! as HTMLButtonElement;
  const directionSelect = document.getElementById("sync-direction-select") as HTMLSelectElement;
  const autoToggle = document.getElementById("sync-auto-toggle") as HTMLInputElement;
  const logoutBtn = document.getElementById("sync-logout-btn")! as HTMLButtonElement;
  const loginBtn = document.getElementById("sync-login-btn")! as HTMLButtonElement;
  const signupBtn = document.getElementById("sync-signup-btn")! as HTMLButtonElement;
  const unauthActions = document.getElementById("sync-unauth-actions")!;
  const authActions = document.getElementById("sync-auth-actions")!;
  const unconfiguredDiv = document.getElementById("sync-unconfigured")!;

  const authModal = document.getElementById("sync-auth-modal")!;
  const authTabs = authModal.querySelectorAll<HTMLButtonElement>(".sync-modal-tab");
  const loginPanel = authModal.querySelector<HTMLDivElement>('[data-sync-panel="login"]')!;
  const signupPanel = authModal.querySelector<HTMLDivElement>('[data-sync-panel="signup"]')!;
  const modalLoginBtn = document.getElementById("sync-modal-login-btn")! as HTMLButtonElement;
  const modalSignupBtn = document.getElementById("sync-modal-signup-btn")! as HTMLButtonElement;
  const modalLoginEmail = document.getElementById("sync-modal-email") as HTMLInputElement;
  const modalLoginPw = document.getElementById("sync-modal-password") as HTMLInputElement;
  const modalSignupEmail = document.getElementById("sync-modal-signup-email") as HTMLInputElement;
  const modalSignupPw = document.getElementById("sync-modal-signup-password") as HTMLInputElement;
  const modalLoginError = document.getElementById("sync-modal-error")!;
  const modalSignupError = document.getElementById("sync-modal-signup-error")!;
  const forgotPasswordBtn = document.getElementById("sync-forgot-password")!;
  const resetModal = document.getElementById("sync-reset-modal")!;
  const resetEmail = document.getElementById("sync-reset-email") as HTMLInputElement;
  const resetSendBtn = document.getElementById("sync-reset-send-btn")! as HTMLButtonElement;
  const resetError = document.getElementById("sync-reset-error")!;
  const resetSuccess = document.getElementById("sync-reset-success")!;
  let activeAuthTab: "login" | "signup" = "login";

  let unsubscribeSyncStatus: (() => void) | null = null;
  let unsubscribeAuth: (() => void) | null = null;

  function updateUI() {
    const user = getCurrentUser();
    const configured = isConfigured();
    unauthActions.hidden = true;
    authActions.hidden = true;
    unconfiguredDiv.hidden = true;
    stateInfo.hidden = false;
    accountInfo.hidden = false;

    if (!configured) {
      unconfiguredDiv.hidden = false;
      stateInfo.hidden = true;
      accountInfo.innerHTML = '<div class="sync-account-placeholder">同步未配置</div>';
      indicator.textContent = "未配置";
      indicator.className = "sync-state-value";
      lastTime.textContent = "—";
      storageInfo.textContent = "—";
      return;
    }

    if (!user) {
      unauthActions.hidden = false;
      accountInfo.innerHTML = '<div class="sync-account-placeholder">未登录</div>';
      indicator.textContent = "未登录";
      indicator.className = "sync-state-value";
      lastTime.textContent = "—";
      storageInfo.textContent = "本地存储中";
      return;
    }

    authActions.hidden = false;
    const email = user.email ?? "—";
    accountInfo.innerHTML = `
      <div class="sync-account-signed-in">
        <span class="sync-account-email">${escapeHtml(email)}</span>
      </div>
    `;
    indicator.textContent = "已连接";
    indicator.className = "sync-state-value";

    const last = getLastSynced();
    lastTime.textContent = last ? new Date(last).toLocaleString() : "从未同步";

    const state = getState();
    const localSize = JSON.stringify(state).length;
    storageInfo.textContent = `本地: ${(localSize / 1024).toFixed(1)}KB · 远程: 同步后更新`;
  }

  function openAuthModal(tab: "login" | "signup" = "login") {
    activeAuthTab = tab;
    authTabs.forEach((t) => {
      const isActive = t.dataset.syncTab === tab;
      t.classList.toggle("active", isActive);
      t.setAttribute("aria-selected", String(isActive));
    });
    loginPanel.hidden = tab !== "login";
    signupPanel.hidden = tab !== "signup";
    modalLoginError.hidden = true;
    modalSignupError.hidden = true;
    modalLoginEmail.value = "";
    modalLoginPw.value = "";
    modalSignupEmail.value = "";
    modalSignupPw.value = "";
    authModal.hidden = false;
    saveFocus();
    setTimeout(() => { (tab === "login" ? modalLoginEmail : modalSignupEmail).focus(); }, 0);
  }

  function closeAuthModal() { authModal.hidden = true; restoreFocus(); }

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => openAuthModal(tab.dataset.syncTab as "login" | "signup"));
  });
  authModal.querySelectorAll<HTMLElement>("[data-sync-modal-close]").forEach((el) => {
    el.addEventListener("click", closeAuthModal);
  });

  modalLoginBtn.onclick = async () => {
    const email = modalLoginEmail.value.trim();
    const pw = modalLoginPw.value;
    if (!email || !pw) { modalLoginError.textContent = "请输入邮箱和密码"; modalLoginError.hidden = false; return; }
    modalLoginError.hidden = true;
    modalLoginBtn.disabled = true;
    try {
      const user = await signInWithEmail(email, pw);
      showToast(`已登录：${user?.email ?? email}`, "info");
      closeAuthModal();
      await refreshUser();
      doSync().catch(() => {});
    } catch (e: any) {
      const msg = e?.message ?? "登录失败";
      modalLoginError.textContent = msg;
      modalLoginError.hidden = false;
      showToast(`登录失败：${msg}`, "error");
    }
    modalLoginBtn.disabled = false;
  };

  modalSignupBtn.onclick = async () => {
    const email = modalSignupEmail.value.trim();
    const pw = modalSignupPw.value;
    if (!email || !pw) { modalSignupError.textContent = "请输入邮箱和密码"; modalSignupError.hidden = false; return; }
    if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/.test(pw)) {
      modalSignupError.textContent = "密码需包含字母和数字，且不低于 6 位";
      modalSignupError.hidden = false;
      return;
    }
    modalSignupError.hidden = true;
    modalSignupBtn.disabled = true;
    try {
      await signUpWithEmail(email, pw);
      showToast(`已注册：${email}，请登录`, "info");
      closeAuthModal();
      await refreshUser();
      doSync().catch(() => {});
    } catch (e: any) {
      const msg = e?.message ?? "注册失败";
      modalSignupError.textContent = msg;
      modalSignupError.hidden = false;
      showToast(`注册失败：${msg}`, "error");
    }
    modalSignupBtn.disabled = false;
  };

  forgotPasswordBtn.onclick = () => {
    closeAuthModal();
    resetEmail.value = "";
    resetError.hidden = true;
    resetSuccess.hidden = true;
    resetModal.hidden = false;
    saveFocus();
    setTimeout(() => resetEmail.focus(), 0);
  };

  resetModal.querySelectorAll<HTMLElement>("[data-sync-reset-close]").forEach((el) => {
    el.addEventListener("click", () => { resetModal.hidden = true; restoreFocus(); });
  });

  resetSendBtn.onclick = async () => {
    const email = resetEmail.value.trim();
    if (!email) { resetError.textContent = "请输入邮箱"; resetError.hidden = false; return; }
    resetError.hidden = true;
    resetSuccess.hidden = true;
    resetSendBtn.disabled = true;
    try {
      await resetPassword(email);
      resetSuccess.textContent = `重置邮件已发送到 ${email}，请查收`;
      resetSuccess.hidden = false;
    } catch (e: any) {
      resetError.textContent = e?.message ?? "发送失败";
      resetError.hidden = false;
    }
    resetSendBtn.disabled = false;
  };

  modalLoginEmail.onkeydown = (e) => { if (e.key === "Enter") modalLoginPw.focus(); };
  modalLoginPw.onkeydown = (e) => { if (e.key === "Enter") modalLoginBtn.click(); };
  modalSignupEmail.onkeydown = (e) => { if (e.key === "Enter") modalSignupPw.focus(); };
  modalSignupPw.onkeydown = (e) => { if (e.key === "Enter") modalSignupBtn.click(); };
  resetEmail.onkeydown = (e) => { if (e.key === "Enter") resetSendBtn.click(); };

  loginBtn.onclick = () => openAuthModal("login");
  signupBtn.onclick = () => openAuthModal("signup");

  logoutBtn.onclick = async () => {
    try {
      await signOut();
      showToast("已退出登录", "info");
      await refreshUser();
    } catch (e: any) {
      showToast(`退出失败：${e?.message ?? ""}`, "error");
    }
  };

  const savedDirection = localStorage.getItem("startpage:sync:direction") as SyncMode | null;
  if (savedDirection) directionSelect.value = savedDirection;
  directionSelect.onchange = () => {
    localStorage.setItem("startpage:sync:direction", directionSelect.value);
  };

  forceBtn.onclick = () => {
    indicator.textContent = "同步中...";
    indicator.className = "sync-state-value syncing";
    const mode = directionSelect.value as SyncMode;
    doSync(mode);
  };

  const autoSync = localStorage.getItem("startpage:sync:auto");
  autoToggle.checked = autoSync !== "false";
  autoToggle.onchange = () => {
    localStorage.setItem("startpage:sync:auto", String(autoToggle.checked));
  };

  async function refreshUser() { updateUI(); }

  unsubscribeAuth = onAuthChange(() => refreshUser());

  unsubscribeSyncStatus = onSyncStatus((status) => {
    const labels: Record<string, string> = {
      idle: "就绪", syncing: "同步中...", synced: "已同步",
      error: "同步失败", offline: "离线",
    };
    indicator.textContent = labels[status] ?? status;
    indicator.className = "sync-state-value " + status;
    const last = getLastSynced();
    lastTime.textContent = last ? new Date(last).toLocaleString() : "从未同步";
    const state = getState();
    const localSize = JSON.stringify(state).length;
    storageInfo.textContent = `本地: ${(localSize / 1024).toFixed(1)}KB · 远程: 同步后更新`;
  });

  updateUI();

  // Return cleanup function
  return () => {
    unsubscribeSyncStatus?.();
    unsubscribeAuth?.();
  };
}

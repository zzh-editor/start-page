export type SubKey = "theme" | "bookmarks" | "categories" | "workflows" | "search" | "shortcuts" | "sync";

export const panelState = {
  selectedIds: new Set<string>(),
  editingCatId: null as string | null,
  editingBmId: null as string | null,
  editingWfId: null as string | null,
};

export type ConfirmFn = (title: string, message: string, onConfirm: () => void) => void;
export type ToastFn = (message: string, type?: "info" | "error") => void;
export type FocusFn = () => void;

export let confirm: ConfirmFn = () => {};
export let showToast: ToastFn = () => {};
export let saveFocus: FocusFn = () => {};
export let restoreFocus: FocusFn = () => {};
export let switchSub: (sub: SubKey) => void = () => {};

export function setSharedFns(fns: {
  confirm: ConfirmFn;
  toast: ToastFn;
  saveFocus: FocusFn;
  restoreFocus: FocusFn;
  switchSub: (sub: SubKey) => void;
}): void {
  confirm = fns.confirm;
  showToast = fns.toast;
  saveFocus = fns.saveFocus;
  restoreFocus = fns.restoreFocus;
  switchSub = fns.switchSub;
}

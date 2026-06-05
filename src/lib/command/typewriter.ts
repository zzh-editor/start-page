export const PLACEHOLDER_EXAMPLES = [
  "输入 add <网址> <名称> <分组> 快速添加书签",
  "按 / 聚焦输入框，Tab 切换分组",
  "长按书签可编辑或删除",
  "点击右上角齿轮打开设置面板",
  "输入关键词匹配书签，回车直接打开",
  "Esc 清空 / ↑↓ 浏览历史",
  "wf+名称 或 workflow+名称 批量打开工作流",
  "请输入关键词或直接访问网址",
];

let _typingTimer: ReturnType<typeof setTimeout> | null = null;

export function stopTyping(input: HTMLInputElement): void {
  if (_typingTimer) {
    clearTimeout(_typingTimer);
    _typingTimer = null;
  }
  input.placeholder = "";
}

export function typePlaceholder(input: HTMLInputElement, examples: string[], speed = 50): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    input.placeholder = examples[0];
    return;
  }
  let exampleIndex = 0;
  let charIndex = 0;
  function step() {
    const current = examples[exampleIndex];
    if (charIndex < current.length) {
      input.placeholder += current.charAt(charIndex);
      charIndex++;
      _typingTimer = setTimeout(step, speed);
    } else {
      _typingTimer = setTimeout(() => {
        input.placeholder = "";
        charIndex = 0;
        exampleIndex = (exampleIndex + 1) % examples.length;
        step();
      }, 2000);
    }
  }
  _typingTimer = setTimeout(step, speed);
}

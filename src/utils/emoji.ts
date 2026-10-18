export function insertEmojiAtCursor(
  el: HTMLTextAreaElement | HTMLInputElement | null,
  value: string,
  setValue: (v: string) => void,
  emoji: string,
) {
  if (!el) {
    setValue(value + emoji);
    return;
  }
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  const next = value.slice(0, start) + emoji + value.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + emoji.length, start + emoji.length);
  });
}

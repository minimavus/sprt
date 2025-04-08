export const copyStringToClipboard = async (
  textToCopy: string,
): Promise<void> => {
  if (!navigator?.clipboard) {
    const el = document.createElement("textarea");
    el.value = textToCopy;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  } else {
    await navigator.clipboard.writeText(textToCopy);
  }
};

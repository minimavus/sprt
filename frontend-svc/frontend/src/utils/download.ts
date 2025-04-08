export function download(
  data: string,
  filename: string,
  mime: string = "text/plain",
) {
  const blob = new Blob([data], { type: mime });
  const elem = window.document.createElement("a");
  const href = window.URL.createObjectURL(blob);
  elem.href = href;
  elem.download = filename;
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
  window.URL.revokeObjectURL(href);
}

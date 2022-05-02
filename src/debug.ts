const debugs = new Map<string, string>();
export function debug(name: string, value: any) {
  debugs.set(name, JSON.stringify(value));
}

const el = document.getElementById("debug")!
function renderDebug() {
  let s = "";
  for (const [n, v] of debugs) {
    s += `${n}: ${v}` + "\n";
  }
  el.textContent = s;
  requestAnimationFrame(renderDebug)
}

requestAnimationFrame(renderDebug)

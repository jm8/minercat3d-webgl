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

window.addEventListener('keydown', (e) => {
  if (e.code == 'F3') {
    el.classList.toggle("visible");
  }
  e.preventDefault();
})

requestAnimationFrame(renderDebug)

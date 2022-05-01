const debugs = new Map<string, string>();
export function debug(name: string, value: any) {
  debugs.set(name, JSON.stringify(value));  
  let s = "";
  for (const [n, v] of debugs) {
    s += `${n}: ${v}`+"\n"
  }
  document.getElementById("debug").textContent = s;
}

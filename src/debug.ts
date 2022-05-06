const el = document.getElementById("debug")!
export function debug(it: string) {
  el.textContent = it;
}

window.addEventListener('keydown', (e) => {
  if (e.code == 'F3') {
    el.classList.toggle("visible");
  }
  e.preventDefault();
})


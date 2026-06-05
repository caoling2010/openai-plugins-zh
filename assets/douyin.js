const typedText = document.querySelector("#typedText");
const phrases = [
  "CLI、Figma、SwiftUI...",
  "数据分析、研究、设计...",
  "MCP、Schema、Worktrees...",
  "7 天内新增插件...",
];

let phraseIndex = 0;
let letterIndex = 0;
let deleting = false;

function tick() {
  const phrase = phrases[phraseIndex];
  if (deleting) {
    letterIndex -= 1;
  } else {
    letterIndex += 1;
  }

  typedText.textContent = phrase.slice(0, letterIndex);

  if (!deleting && letterIndex === phrase.length) {
    deleting = true;
    window.setTimeout(tick, 1100);
    return;
  }

  if (deleting && letterIndex === 0) {
    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
  }

  window.setTimeout(tick, deleting ? 34 : 58);
}

window.setTimeout(tick, 600);

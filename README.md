# Lab-8: An AI Coding Challenge 
**Author:** Jameka Haggins 
---

## Reflection Questions
1. Where AI saved time.
2. At least one AI bug you identified and how you fixed it.
3. A code snippet you refactored for clarity.
4. One accessibility improvement you added.
5. What prompt changes improved AI output.
---
So for me, AI saved time with building the scafolding of the project, I didn't have to waste time with the HTML, because I told it exactly what I needed to the T. That is the key, being super specific on what you want the output to be, because computers will do exactly what you tell them to do.

Surprisingly, I didn't really run into any bugs with using AI, it's just the formmatting looked off with the coding, and certain things just didn't translate well. I have to figure out how to impliment certain things, because the AI just didn't do it on it's own. Good example of that is the accessability when it comes to using the keyboard. I figured out how to do it from the example it hard with using the space key to flip cards. It was a headache, but I got something new out of it.

No so much refactoring for clarity, but this is what I added in so that you can use the keyboard keys. 
` if (e.key === 'ArrowLeft') {
        const prevBtn = document.querySelector('.prev');
        if (prevBtn) prevBtn.click();
      } else if (e.key === 'ArrowRight') {
        const nextBtn = document.querySelector('.next');
        if (nextBtn) nextBtn.click();
      }`

      
Can what I did above count for the accessibility improvement? Oh wait I did have something additional I added, a guide that shows you what shortcuts to use on your keyboard.
`<div class="kbd-hint" role="note" aria-live="polite">
      <button class="close-hint" aria-label="Dismiss shortcuts">&times;</button>
      <div class="hint-content">
        <strong>Shortcuts</strong>
        <div>
          <kbd>Space/Enter</kbd> flip • <kbd>←</kbd>/<kbd>→</kbd> prev/next •
          <kbd>j</kbd>/<kbd>k</kbd> decks • <kbd>Ctrl/Cmd + ←/→</kbd> jump decks
        </div>
      </div>
    </div>`
    
Like I said previously, being as descriptive as possible, but you also have to understand what you want to do within javascript and html/css. So making sure to use that terminology properly is what improved AI output drastically.     

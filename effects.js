// ===== Эффект пузырьков (Bubbly Button) =====
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.bubbly-button');
  if (!btn) return;

  e.preventDefault();
  
  // Сбрасываем анимацию, чтобы она проигрывалась заново при каждом клике
  btn.classList.remove('animate');
  void btn.offsetWidth; // Триггер для перерисовки
  btn.classList.add('animate');
  
  setTimeout(() => {
    btn.classList.remove('animate');
  }, 700);
}, true);

// ===== Анимации фона для тем (Космос и Лес) =====
window.LinguaEffects = {
  initCosmosStars: function() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer || starsContainer.hasChildNodes()) return;
    
    const colors = ['', 'gold', 'teal'];
    for (let i = 0; i < 100; i++) {
      const star = document.createElement('i');
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      const size = Math.random() * 2 + 1;
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.animationDuration = (Math.random() * 3 + 2) + 's';
      star.className = colors[Math.floor(Math.random() * colors.length)];
      starsContainer.appendChild(star);
    }
  },
  
  initForestLeaves: function() {
    const leavesContainer = document.getElementById('leaves');
    if (!leavesContainer || leavesContainer.hasChildNodes()) return;
    
    const colors = ["#7fae5e","#5c9448","#c9a24a","#b8ca78","#8a6b3f","#4d8a3f"];
    for (let i = 0; i < 8; i++) {
      const l = document.createElement('i');
      const size = (Math.random() * 8 + 10).toFixed(0);
      const c1 = colors[i % colors.length];
      const c2 = colors[(i + 2) % colors.length];
      l.style.left = (Math.random() * 94 + 3).toFixed(1) + '%';
      l.style.width = size + 'px';
      l.style.height = size + 'px';
      l.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
      l.style.animationDuration = (Math.random() * 10 + 14).toFixed(1) + 's';
      l.style.animationDelay = '-' + (Math.random() * 22).toFixed(1) + 's';
      l.style.opacity = (Math.random() * .3 + .42).toFixed(2);
      leavesContainer.appendChild(l);
    }
  },

  initOceanBubbles: function() {
    const bubblesContainer = document.getElementById('bubbles');
    if (!bubblesContainer || bubblesContainer.hasChildNodes()) return;

    for (let i = 0; i < 14; i++) {
      const b = document.createElement('i');
      const size = (Math.random() * 9 + 5).toFixed(0);
      b.style.left = (Math.random() * 96 + 2).toFixed(1) + '%';
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.animationDuration = (Math.random() * 9 + 9).toFixed(1) + 's';
      b.style.animationDelay = '-' + (Math.random() * 18).toFixed(1) + 's';
      b.style.opacity = (Math.random() * .35 + .35).toFixed(2);
      bubblesContainer.appendChild(b);
    }
  }
};
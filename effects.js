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
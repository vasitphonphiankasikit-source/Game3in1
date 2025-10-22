  // Difficulty & Mode controls
    const modeSelect = document.getElementById('mode-select');
    const levelInput = document.getElementById('level-input');
    const levelValue = document.getElementById('level-value');
    const levelLabel = document.getElementById('level-label');
    const sections = {
      guess: document.getElementById('number-game'),
      memory: document.getElementById('memory-game'),
      recall: document.getElementById('recall-game')
    };

    function levelText(level) {
      if (level <= 3) return 'Easy';
      if (level <= 6) return 'Normal';
      if (level <= 8) return 'Hard';
      return 'Very Hard';
    }

    function updateMode() {
      const mode = modeSelect.value;
      if (mode === 'all') {
        Object.values(sections).forEach(s => s.style.display = '');
      } else {
        Object.keys(sections).forEach(k => {
          sections[k].style.display = (k === mode) ? '' : 'none';
        });
      }
    }

    function updateLevelUI() {
      const lvl = Number(levelInput.value);
      levelValue.innerText = lvl;
      levelLabel.title = `${levelText(lvl)}`;
      levelLabel.innerText = `Level ${lvl} (${levelText(lvl)})`;
      // Update per-game parameters/UI
      updateGuessMax();
      buildMemoryBoard(); // rebuild memory board with new difficulty
    }

    modeSelect.addEventListener('change', updateMode);
    levelInput.addEventListener('input', updateLevelUI);

    // -------------------------------
    // 🎯 Number Guess (scaled by level)
    // -------------------------------
    let secretNumber = 0;
    function guessMaxForLevel() {
      // map level 1..10 to max 10..100
      return Number(levelInput.value) * 10;
    }

    function updateGuessMax() {
      const max = guessMaxForLevel();
      document.getElementById('guess-max').innerText = max;
      // regenerate secret number when level changes
      secretNumber = Math.floor(Math.random() * max) + 1;
      document.getElementById('result').innerText = '';
    }

    function checkGuess() {
      const guess = parseInt(document.getElementById('guess').value);
      const result = document.getElementById('result');
      if (isNaN(guess)) {
        result.innerText = '⛔ Please enter a number';
        return;
      }
      if (guess === secretNumber) {
        result.innerText = '🎉 Correct! (new number generated)';
        // generate new secret keeping same max
        const max = guessMaxForLevel();
        secretNumber = Math.floor(Math.random() * max) + 1;
      } else if (guess < secretNumber) {
        result.innerText = '🔼 Higher';
      } else {
        result.innerText = '🔽 Lower';
      }
    }

    // -------------------------------
    // 🧠 Memory Game (grid size by level)
    // -------------------------------
    const board = document.querySelector('.game-board');
    let flippedCards = [];
    let matched = [];
    let currentPairs = 2;

    function buildMemoryBoard() {
      // grid size: level 1 -> 4x4, level 2 -> 5x5, ... level 10 -> 13x13
      const lvl = Number(levelInput.value);
      const gridSize = Math.min(13, Math.max(4, lvl + 3)); // clamp 4..13
      const totalCards = gridSize * gridSize;
      const pairs = Math.floor(totalCards / 2);

      // show grid size
      document.getElementById('memory-pairs').innerText = `${gridSize}×${gridSize}`;

      matched = [];
      flippedCards = [];
      board.innerHTML = '';

      // build faces: numeric labels for uniqueness (safe for large grids)
      const faces = [];
      for (let i = 1; i <= pairs; i++) {
        faces.push(String(i));
      }

      // assemble card faces (pairs) and add a single special card if odd total
      const cardFaces = [...faces, ...faces];
      const hasSingle = (totalCards % 2 === 1);
      if (hasSingle) cardFaces.push('★'); // one unmatched special

      // shuffle
      for (let i = cardFaces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardFaces[i], cardFaces[j]] = [cardFaces[j], cardFaces[i]];
      }

      // dynamic sizing for different grid sizes
      const maxBoardWidth = 520; // px available for tiles
      const tileSize = Math.max(28, Math.floor(maxBoardWidth / gridSize)); // ensure readable minimum
      const gap = Math.max(6, Math.floor(tileSize / 8));

      board.style.gridTemplateColumns = `repeat(${gridSize}, ${tileSize}px)`;
      board.style.gap = `${gap}px`;
      board.style.justifyContent = 'center';

      cardFaces.forEach((face, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.face = face;
        card.dataset.index = index;
        card.innerText = '';
        // set size/style inline to adapt to grid
        card.style.width = `${tileSize}px`;
        card.style.height = `${tileSize}px`;
        card.style.fontSize = `${Math.max(12, Math.floor(tileSize / 2.2))}px`;
        card.style.lineHeight = '1';
        board.appendChild(card);

        card.addEventListener('click', () => {
          // single special card never matches any other card
          if (
            flippedCards.length < 2 &&
            !card.classList.contains('flipped') &&
            !matched.includes(card)
          ) {
            card.classList.add('flipped');
            card.innerText = face;
            flippedCards.push(card);

            if (flippedCards.length === 2) {
              const [first, second] = flippedCards;
              const f1 = first.dataset.face;
              const f2 = second.dataset.face;

              // only consider a match when faces equal and not the lone special
              if (f1 === f2 && f1 !== '★') {
                matched.push(first, second);
                flippedCards = [];
                if (matched.length === pairs * 2) {
                  document.getElementById('memory-result').innerText = '🎉 All pairs matched!';
                } else {
                  document.getElementById('memory-result').innerText = '';
                }
              } else {
                setTimeout(() => {
                  first.classList.remove('flipped');
                  second.classList.remove('flipped');
                  first.innerText = '';
                  second.innerText = '';
                  flippedCards = [];
                }, 800);
              }
            }
          }
        });
      });

      document.getElementById('memory-result').innerText = '';
    }

    // -------------------------------
    // 🧮 Number Recall (scaled by level)
    // -------------------------------
    let recallSequence = [];
    let recallAttempts = 0;

    function recallLengthForLevel() {
      // level 1 -> 3 digits, level 10 -> 12 digits
      return Number(levelInput.value) + 2;
    }

    function recallDisplayMsForLevel() {
      // level 1 -> 3000ms, level10 -> 3000 - 9*250 = 750ms (min 500)
      const ms = 3000 - (Number(levelInput.value) - 1) * 250;
      return Math.max(500, ms);
    }

    function startRecallGame() {
      recallSequence = Array.from({ length: recallLengthForLevel() }, () => Math.floor(Math.random() * 10));
      document.getElementById('number-sequence').innerText = recallSequence.join(' ');
      document.getElementById('recall-result').innerText = '';
      document.getElementById('recall-input').value = '';
      recallAttempts = 0;

      const displayMs = recallDisplayMsForLevel();
      setTimeout(() => {
        document.getElementById('number-sequence').innerText = '';
      }, displayMs);
    }

    function submitRecall() {
      const input = document.getElementById('recall-input').value.trim().replace(/\s+/g, '');
      const result = document.getElementById('recall-result');

      if (input === recallSequence.join('')) {
        result.innerText = '✅ Correct!';
      } else {
        recallAttempts++;
        if (recallAttempts >= 3) {
          result.innerText = `❌ 3 incorrect attempts! Answer: ${recallSequence.join('')}`;
        } else {
          result.innerText = `❌ Incorrect (${recallAttempts}/3). Try again.`;
        }
      }
    }

    // --- handle Enter key for number & recall games ---
    const guessInput = document.getElementById('guess');
    const recallInput = document.getElementById('recall-input');

    // Enter while focused on inputs
    guessInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        checkGuess();
      }
    });
    recallInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitRecall();
      }
    });

    // Global Enter behavior depending on selected mode
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const mode = modeSelect.value;
      // if a specific input is focused, prefer that
      const active = document.activeElement;
      if (active === guessInput) {
        e.preventDefault();
        checkGuess();
        return;
      }
      if (active === recallInput) {
        e.preventDefault();
        submitRecall();
        return;
      }
      // otherwise trigger by mode
      if (mode === 'guess') {
        e.preventDefault();
        checkGuess();
      } else if (mode === 'recall') {
        e.preventDefault();
        submitRecall();
      }
    });

    // --- Theme (dark/light) toggle with persistence ---
    const themeToggle = document.getElementById('theme-toggle');

    function applyTheme(theme){
      if(theme === 'light') {
        document.body.classList.add('light');
        themeToggle.checked = true;
      } else {
        document.body.classList.remove('light');
        themeToggle.checked = false;
      }
    }

    // load stored preference or use system preference
    const storedTheme = localStorage.getItem('jj_theme');
    if(storedTheme){
      applyTheme(storedTheme);
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }

    themeToggle.addEventListener('change', () => {
      const theme = themeToggle.checked ? 'light' : 'dark';
      applyTheme(theme);
      localStorage.setItem('jj_theme', theme);
    });

    // initialize UI & games
    updateMode();
    updateLevelUI();
    // ensure guess secret generated
    updateGuessMax();
    // build memory board initially
    buildMemoryBoard();
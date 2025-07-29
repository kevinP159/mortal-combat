document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const player1 = document.querySelector('.player1');
    const player2 = document.querySelector('.player2');
    const player1HealthBar = document.querySelector('.player1-health');
    const player2HealthBar = document.querySelector('.player2-health');
    const timerElement = document.querySelector('.timer');
    const fightAnnouncement = document.querySelector('.fight-announcement');
    const roundAnnouncement = document.querySelector('.round-announcement');
    const gameScreen = document.querySelector('.game-screen');
    const bloodEffect = document.querySelector('.blood-effect');
    const comboDisplay = document.querySelector('.combo-display');
    const startScreen = document.querySelector('.start-screen');
    const startButton = document.querySelector('.start-button');
    const characterOptions = document.querySelectorAll('.character-option');
    
    // Audio elements
    const punchSound = document.getElementById('punch-sound');
    const kickSound = document.getElementById('kick-sound');
    const specialSound = document.getElementById('special-sound');
    const backgroundMusic = document.getElementById('background-music');
    
    // Game state
    const game = {
        player1: {
            health: 100,
            position: 100,
            isJumping: false,
            isAttacking: false,
            direction: 'right',
            character: 'scorpion',
            comboCount: 0,
            lastAttackTime: 0
        },
        player2: {
            health: 100,
            position: 600,
            isJumping: false,
            isAttacking: false,
            direction: 'left',
            character: 'subzero',
            comboCount: 0,
            lastAttackTime: 0
        },
        time: 99,
        round: 1,
        maxRounds: 3,
        gameInterval: null,
        timerInterval: null,
        isGameOver: false,
        isGameStarted: false,
        keysPressed: {}
    };
    
    // Initialize game
    function init() {
        // Set up event listeners
        startButton.addEventListener('click', startGame);
        characterOptions.forEach(option => {
            option.addEventListener('click', () => selectCharacter(option));
        });
        
        // Set up keyboard listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Show start screen
        startScreen.style.display = 'flex';
    }
    
    // Start the game
    function startGame() {
        startScreen.style.display = 'none';
        game.isGameStarted = true;
        
        // Play background music
        backgroundMusic.volume = 0.3;
        backgroundMusic.play();
        
        // Show round announcement
        roundAnnouncement.textContent = `ROUND ${game.round}`;
        roundAnnouncement.style.animation = 'none';
        void roundAnnouncement.offsetWidth;
        roundAnnouncement.style.animation = 'fadeInOut 2s';
        
        // After round announcement, show fight announcement
        setTimeout(() => {
            fightAnnouncement.style.animation = 'none';
            void fightAnnouncement.offsetWidth;
            fightAnnouncement.style.animation = 'fadeInOut 2s';
            
            // Start game after announcements
            setTimeout(() => {
                game.gameInterval = setInterval(gameLoop, 20);
                game.timerInterval = setInterval(updateTimer, 1000);
            }, 2000);
        }, 2000);
    }
    
    // Select character
    function selectCharacter(option) {
        const character = option.getAttribute('data-character');
        const player = option.classList.contains('player1-select') ? 'player1' : 'player2';
        game[player].character = character;
        
        // Update visual selection
        characterOptions.forEach(opt => {
            opt.style.backgroundColor = '';
            opt.style.boxShadow = '';
        });
        option.style.backgroundColor = 'rgba(139, 0, 0, 0.5)';
        option.style.boxShadow = '0 0 10px #E74C3C';
    }
    
    // Main game loop
    function gameLoop() {
        updatePlayerPositions();
        checkAttacks();
        checkGameOver();
    }
    
    // Update timer
    function updateTimer() {
        game.time--;
        timerElement.textContent = game.time;
        
        if (game.time <= 0) {
            endRound();
        }
        
        // Flash timer when low
        if (game.time <= 10) {
            timerElement.style.animation = 'none';
            void timerElement.offsetWidth;
            timerElement.style.animation = 'pulse 0.5s infinite';
        }
    }
    
    // Update player positions based on input
    function updatePlayerPositions() {
        // Player 1 movement
        if (game.keysPressed['a'] && game.player1.position > 0) {
            game.player1.position -= 5;
            game.player1.direction = 'left';
            player1.style.transform = 'scaleX(1)';
        }
        if (game.keysPressed['d'] && game.player1.position < 700) {
            game.player1.position += 5;
            game.player1.direction = 'right';
            player1.style.transform = 'scaleX(1)';
        }
        
        // Player 2 movement
        if (game.keysPressed['ArrowLeft'] && game.player2.position > 0) {
            game.player2.position -= 5;
            game.player2.direction = 'left';
            player2.style.transform = 'scaleX(-1)';
        }
        if (game.keysPressed['ArrowRight'] && game.player2.position < 700) {
            game.player2.position += 5;
            game.player2.direction = 'right';
            player2.style.transform = 'scaleX(-1)';
        }
        
        // Update DOM positions
        player1.style.left = `${game.player1.position}px`;
        player2.style.left = `${game.player2.position}px`;
    }
    
    // Check for attacks and collisions
    function checkAttacks() {
        const distance = Math.abs(game.player1.position - game.player2.position);
        
        if (distance < 120) { // Increased hit range
            // Player 1 attacks
            if (game.player1.isAttacking && !game.player2.isAttacking) {
                const damage = game.player1.attackType === 'special' ? 20 : 
                             game.player1.attackType === 'kick' ? 12 : 8;
                hitPlayer('player2', damage, game.player1.attackType);
            }
            
            // Player 2 attacks
            if (game.player2.isAttacking && !game.player1.isAttacking) {
                const damage = game.player2.attackType === 'special' ? 20 : 
                             game.player2.attackType === 'kick' ? 12 : 8;
                hitPlayer('player1', damage, game.player2.attackType);
            }
        }
    }
    
    // Handle player hit
    function hitPlayer(player, damage, attackType) {
        game[player].health -= damage;
        updateHealthBars();
        
        // Show blood effect
        bloodEffect.style.opacity = '0.7';
        setTimeout(() => {
            bloodEffect.style.opacity = '0';
        }, 300);
        
        // Create hit effect
        const hitEffect = document.createElement('div');
        hitEffect.classList.add('hit-effect');
        hitEffect.style.left = `${game[player].position + 60}px`;
        hitEffect.style.bottom = '100px';
        gameScreen.appendChild(hitEffect);
        
        // Play sound
        if (attackType === 'punch') punchSound.play();
        if (attackType === 'kick') kickSound.play();
        if (attackType === 'special') specialSound.play();
        
        // Remove hit effect after animation
        setTimeout(() => {
            hitEffect.remove();
        }, 300);
        
        // Knockback effect
        if (player === 'player1') {
            game.player1.position = Math.max(0, game.player1.position - (damage * 1.5));
        } else {
            game.player2.position = Math.min(700, game.player2.position + (damage * 1.5));
        }
        
        // Combo system
        const attacker = player === 'player1' ? 'player2' : 'player1';
        const now = Date.now();
        
        if (now - game[attacker].lastAttackTime < 500) { // Combo window
            game[attacker].comboCount++;
            showCombo(attacker, game[attacker].comboCount);
        } else {
            game[attacker].comboCount = 1;
        }
        
        game[attacker].lastAttackTime = now;
    }
    
    // Show combo display
    function showCombo(player, count) {
        comboDisplay.textContent = `${count} HIT${count > 1 ? 'S' : ''}!`;
        comboDisplay.style.color = player === 'player1' ? '#E74C3C' : '#3498DB';
        comboDisplay.style.opacity = '1';
        comboDisplay.style.transform = 'translate(-50%, -120%) scale(1.2)';
        
        setTimeout(() => {
            comboDisplay.style.opacity = '0';
            comboDisplay.style.transform = 'translate(-50%, -100%) scale(1)';
        }, 800);
    }
    
    // Update health bars
    function updateHealthBars() {
        player1HealthBar.style.width = `${Math.max(0, game.player1.health)}%`;
        player2HealthBar.style.width = `${Math.max(0, game.player2.health)}%`;
        
        // Flash health bar when low
        if (game.player1.health <= 25) {
            player1HealthBar.style.animation = 'pulse 0.5s infinite';
        }
        if (game.player2.health <= 25) {
            player2HealthBar.style.animation = 'pulse 0.5s infinite';
        }
    }
    
    // Check if game is over
    function checkGameOver() {
        if (game.player1.health <= 0 || game.player2.health <= 0) {
            endRound();
        }
    }
    
    // End the current round
    function endRound() {
        clearInterval(game.gameInterval);
        clearInterval(game.timerInterval);
        
        let winner = '';
        if (game.player1.health <= 0 && game.player2.health <= 0) {
            winner = 'DRAW!';
        } else if (game.player1.health <= 0) {
            winner = 'SUB-ZERO WINS!';
            game.player2.wins = (game.player2.wins || 0) + 1;
        } else if (game.player2.health <= 0) {
            winner = 'SCORPION WINS!';
            game.player1.wins = (game.player1.wins || 0) + 1;
        } else {
            winner = 'TIME OVER!';
        }
        
        fightAnnouncement.textContent = winner;
        fightAnnouncement.style.animation = 'none';
        void fightAnnouncement.offsetWidth;
        fightAnnouncement.style.animation = 'fadeInOut 3s forwards';
        
        // Check if match is over or go to next round
        setTimeout(() => {
            if (game.round < game.maxRounds && 
                (game.player1.wins || 0) < 2 && 
                (game.player2.wins || 0) < 2) {
                nextRound();
            } else {
                endGame();
            }
        }, 3000);
    }
    
    // Start next round
    function nextRound() {
        game.round++;
        game.time = 99;
        game.player1.health = 100;
        game.player2.health = 100;
        game.player1.position = 100;
        game.player2.position = 600;
        game.player1.isAttacking = false;
        game.player2.isAttacking = false;
        game.player1.isJumping = false;
        game.player2.isJumping = false;
        
        updateHealthBars();
        timerElement.textContent = game.time;
        timerElement.style.animation = '';
        player1HealthBar.style.animation = '';
        player2HealthBar.style.animation = '';
        
        startGame();
    }
    
    // End the entire game
    function endGame() {
        game.isGameOver = true;
        backgroundMusic.pause();
        
        // Show final results
        setTimeout(() => {
            startScreen.style.display = 'flex';
            startButton.textContent = 'PLAY AGAIN';
            
            const resultText = document.createElement('div');
            resultText.className = 'result-text';
            resultText.innerHTML = `
                <h2>FINAL RESULTS</h2>
                <p>SCORPION: ${game.player1.wins || 0} WINS</p>
                <p>SUB-ZERO: ${game.player2.wins || 0} WINS</p>
            `;
            startScreen.appendChild(resultText);
            
            // Reset game state
            game.round = 1;
            game.time = 99;
            game.player1.health = 100;
            game.player2.health = 100;
            game.player1.wins = 0;
            game.player2.wins = 0;
            game.isGameOver = false;
        }, 3000);
    }
    
    // Handle keyboard input
    function handleKeyDown(e) {
        if (!game.isGameStarted || game.isGameOver) return;
        
        game.keysPressed[e.key] = true;
        
        // Player 1 actions
        if (e.key.toLowerCase() === 'w' && !game.player1.isJumping) {
            jump('player1');
        }
        if (e.key.toLowerCase() === 'f') {
            punch('player1');
        }
        if (e.key.toLowerCase() === 'g') {
            kick('player1');
        }
        if (e.key.toLowerCase() === 'v') {
            specialMove('player1');
        }
        
        // Player 2 actions
        if (e.key === 'ArrowUp' && !game.player2.isJumping) {
            jump('player2');
        }
        if (e.key.toLowerCase() === 'l') {
            punch('player2');
        }
        if (e.key.toLowerCase() === 'k') {
            kick('player2');
        }
        if (e.key.toLowerCase() === 'n') {
            specialMove('player2');
        }
    }
    
    function handleKeyUp(e) {
        game.keysPressed[e.key] = false;
    }
    
    // Jump action
    function jump(player) {
        if (game[player].isJumping) return;
        
        game[player].isJumping = true;
        const fighterElement = player === 'player1' ? player1 : player2;
        
        fighterElement.style.animation = 'none';
        void fighterElement.offsetWidth;
        fighterElement.style.animation = 'jump 0.8s ease-in-out';
        
        setTimeout(() => {
            game[player].isJumping = false;
        }, 800);
    }
    
    // Punch action
    function punch(player) {
        if (game[player].isAttacking) return;
        
        game[player].isAttacking = true;
        game[player].attackType = 'punch';
        const fighterElement = player === 'player1' ? player1 : player2;
        
        fighterElement.style.animation = 'none';
        void fighterElement.offsetWidth;
        fighterElement.style.animation = 'punch 0.3s ease-in-out';
        
        setTimeout(() => {
            game[player].isAttacking = false;
        }, 300);
    }
    
    // Kick action
    function kick(player) {
        if (game[player].isAttacking) return;
        
        game[player].isAttacking = true;
        game[player].attackType = 'kick';
        const fighterElement = player === 'player1' ? player1 : player2;
        
        fighterElement.style.animation = 'none';
        void fighterElement.offsetWidth;
        fighterElement.style.animation = 'kick 0.4s ease-in-out';
        
        setTimeout(() => {
            game[player].isAttacking = false;
        }, 400);
    }
    
    // Special move
    function specialMove(player) {
        if (game[player].isAttacking) return;
        
        game[player].isAttacking = true;
        game[player].attackType = 'special';
        const fighterElement = player === 'player1' ? player1 : player2;
        
        // Create special effect
        const specialEffect = document.createElement('div');
        specialEffect.classList.add('special-effect');
        specialEffect.style.left = `${game[player].position - 40}px`;
        specialEffect.style.bottom = '50px';
        gameScreen.appendChild(specialEffect);
        
        fighterElement.style.animation = 'none';
        void fighterElement.offsetWidth;
        fighterElement.style.animation = 'specialMove 0.6s ease-in-out';
        
        // Play sound
        specialSound.play();
        
        setTimeout(() => {
            game[player].isAttacking = false;
            specialEffect.remove();
        }, 600);
    }
    
    // Start the game
    init();
});
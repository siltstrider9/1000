function generateDiceTextures(scene) {
    // Увеличиваем базовое разрешение текстур в 2 раза для Full HD
    const size = 128; 
    const dotRadius = 12;
    const offset = 30; 
    
    const g = scene.make.graphics({x: 0, y: 0, add: false});

    for (let val = 1; val <= 6; val++) {
        g.clear();
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(4, 4, size - 8, size - 8, 24);
        
        g.lineStyle(6, 0x333333, 1);
        g.strokeRoundedRect(4, 4, size - 8, size - 8, 24);

        g.fillStyle(0x111111, 1);
        const cx = size / 2;
        const cy = size / 2;

        if (val % 2 !== 0) g.fillCircle(cx, cy, dotRadius); 
        
        if (val > 1) { 
            g.fillCircle(cx - offset, cy - offset, dotRadius);
            g.fillCircle(cx + offset, cy + offset, dotRadius);
        }
        if (val > 3) { 
            g.fillCircle(cx + offset, cy - offset, dotRadius);
            g.fillCircle(cx - offset, cy + offset, dotRadius);
        }
        if (val === 6) { 
            g.fillCircle(cx - offset, cy, dotRadius);
            g.fillCircle(cx + offset, cy, dotRadius);
        }

        g.generateTexture(`dice${val}`, size, size);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create(data) {
        generateDiceTextures(this);

        let players = (data && data.playerNames) ? data.playerNames : ['Игрок 1', 'Игрок 2'];
        let useBarrel = this.registry.get('useBarrel');
        this.gameState = new GameState(players, useBarrel);

        // --- ТАБЛИЦА СЧЕТА (Левый верхний угол) ---
        this.scoreboardContainer = this.add.container(40, 40).setDepth(50);
        
        let bgHeight = 60 + (this.gameState.players.length * 45);
        let scoreBg = this.add.rectangle(0, 0, 400, bgHeight, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setStrokeStyle(3, 0x555555);
        this.scoreboardContainer.add(scoreBg);

        this.scoreboardContainer.add(this.add.text(20, 15, 'ИГРОК', { fontSize: '22px', fill: '#aaa' }));
        this.scoreboardContainer.add(this.add.text(220, 15, 'ОЧКИ', { fontSize: '22px', fill: '#aaa' }));
        this.scoreboardContainer.add(this.add.text(310, 15, 'БОЛТЫ', { fontSize: '22px', fill: '#aaa' }));

        this.scoreRows = [];
        
        this.gameState.players.forEach((p, index) => {
            let yPos = 55 + index * 45;
            
            let nameTxt = this.add.text(20, yPos, p.name.substring(0, 10), { fontSize: '28px', fill: '#fff' });
            let scoreTxt = this.add.text(220, yPos, '0', { fontSize: '28px', fill: '#fff' });
            let boltsTxt = this.add.text(310, yPos, '-', { fontSize: '28px', fill: '#fff' });
            
            this.scoreRows.push({ name: nameTxt, score: scoreTxt, bolts: boltsTxt });
            this.scoreboardContainer.add([nameTxt, scoreTxt, boltsTxt]);
        });

        // --- БАНК ХОДА (Центр экрана, сверху) ---
        this.turnScoreContainer = this.add.container(960, 150); 
        
        let turnScoreBg = this.add.rectangle(0, 0, 300, 100, 0x000000, 0.7)
            .setStrokeStyle(3, 0xffea00); 
        this.turnScoreContainer.add(turnScoreBg);

        this.add.text(960, 110, 'БАНК ХОДА', { fontSize: '24px', fill: '#aaaaaa' }).setOrigin(0.5);

        this.turnScoreValue = this.add.text(960, 160, '0', { 
            fontSize: '64px', 
            fill: '#ffea00', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);

        // Информационное сообщение (по центру, над кубиками)
        this.messageText = this.add.text(960, 300, '', { fontSize: '48px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        
        // --- КУБИКИ ---
        this.diceGroup = [];
        // Широко раскидываем 5 кубиков по центру: 960 (центр) - 400 = 560 старт
        for (let i = 0; i < 5; i++) {
            let die = new Dice(this, 560 + i * 200, 540, 'dice1');
            die.setScale(1.2); // Текстуры уже большие, чуть-чуть дотягиваем масштаб
            this.diceGroup.push(die);
        }

        // --- НИЖНИЕ КНОПКИ ---
        this.rollBtn = this.add.text(600, 900, '[ БРОСИТЬ ]', { fontSize: '48px', fill: '#00ff00' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', this.rollActiveDice, this);

        this.bankBtn = this.add.text(1320, 900, '[ В БАНК ]', { fontSize: '48px', fill: '#ffffff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', this.bankAndPass, this);

        this.updateUI();

        // --- ИГРОВОЕ МЕНЮ И ОКНА ---

        // 1. Окно подтверждения выхода
        this.confirmContainer = this.add.container(0, 0).setDepth(200).setVisible(false);

        let overlayBg = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.85).setInteractive();
        this.confirmContainer.add(overlayBg);

        let confirmBox = this.add.rectangle(960, 540, 600, 250, 0x222222).setStrokeStyle(4, 0xff4444);
        this.confirmContainer.add(confirmBox);

        let confirmText = this.add.text(960, 480, 'Точно выйти в меню?\nПрогресс будет утерян.', { fontSize: '36px', fill: '#fff', align: 'center' }).setOrigin(0.5);
        this.confirmContainer.add(confirmText);

        let btnYes = this.add.text(800, 600, '[ ДА ]', { fontSize: '40px', fill: '#ff4444' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.start('MainMenu'); 
            });
        this.confirmContainer.add(btnYes);

        let btnNo = this.add.text(1120, 600, '[ НЕТ ]', { fontSize: '40px', fill: '#0f0' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.confirmContainer.setVisible(false); 
            });
        this.confirmContainer.add(btnNo);

        // 2. Выпадающее меню под кнопкой
        this.menuContainer = this.add.container(1850, 100).setDepth(100).setVisible(false);

        let menuBg = this.add.rectangle(0, 0, 300, 220, 0x222222, 0.95).setOrigin(1, 0).setStrokeStyle(3, 0x00ff00);
        this.menuContainer.add(menuBg);

        let settingsBtn = this.add.text(-150, 50, 'НАСТРОЙКИ', { fontSize: '28px', fill: '#fff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.menuContainer.setVisible(false);
                
                let toast = this.add.text(960, 540, 'Настройки в разработке!', { 
                    fontSize: '36px', fill: '#ffea00', backgroundColor: '#333', padding: {x: 20, y: 15} 
                }).setOrigin(0.5).setDepth(300);
                
                this.tweens.add({ targets: toast, alpha: 0, y: 400, duration: 1500, onComplete: () => toast.destroy() });
            });
        this.menuContainer.add(settingsBtn);

        let exitBtn = this.add.text(-150, 110, 'ВЫХОД В МЕНЮ', { fontSize: '28px', fill: '#ff4444' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.menuContainer.setVisible(false);
                this.confirmContainer.setVisible(true); 
            });
        this.menuContainer.add(exitBtn);

        let closeMenuBtn = this.add.text(-150, 170, '[ закрыть ]', { fontSize: '24px', fill: '#aaaaaa' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.menuContainer.setVisible(false);
            });
        this.menuContainer.add(closeMenuBtn);

        // 3. Сама кнопка ☰ МЕНЮ в углу экрана
        this.add.text(1870, 30, '☰ МЕНЮ', { fontSize: '36px', fill: '#ffffff', backgroundColor: '#111111', padding: { x: 15, y: 10 } })
            .setOrigin(1, 0)
            .setDepth(99)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.menuContainer.setVisible(!this.menuContainer.visible);
            });
    }

    rollActiveDice() {
        if (this.isBoltScreen || this.isSamosvalScreen) {
            if (this.isBoltScreen) {
                this.gameState.registerBolt(); 
            }
            if (this.isSamosvalScreen) {
                let player = this.gameState.getCurrentPlayer();
                player.totalScore = 0; 
                player.bolts = 0;      
                this.gameState.endTurn(); 
            }

            this.isBoltScreen = false;
            this.isSamosvalScreen = false;

            this.resetTable();             
            this.messageText.setText('');
            this.messageText.setColor('#ffffff'); 
            this.updateUI();               
            return;                        
        }

        if (this.diceGroup.some(die => die.isRolling)) return;

        let activeDice = this.diceGroup.filter(die => !die.locked);
        if (activeDice.length === 0) {
            this.diceGroup.forEach(die => die.reset());
            activeDice = this.diceGroup; 
        }

        this.messageText.setText(''); 

        activeDice.forEach(die => {
            let randomValue = Phaser.Math.Between(1, 6);
            die.roll(randomValue); 
        });

        this.time.delayedCall(650, this.evaluateBoard, [], this);
    }

     evaluateBoard() {
        let activeDice = this.diceGroup.filter(die => !die.locked);
        let currentRollValues = activeDice.map(die => die.value);

        let result = RulesEngine.evaluateRoll(currentRollValues);

        if (result.score === 0) {
            this.messageText.setText('БОЛТ!');
            this.messageText.setColor('#ff4444'); 
            this.isBoltScreen = true; 
        } else {
            this.gameState.addTurnScore(result.score);
            let player = this.gameState.getCurrentPlayer();
            
            if (player.totalScore + this.gameState.currentTurnScore === 555) {
                this.messageText.setText('САМОСВАЛ!');
                this.messageText.setColor('#ff4444');
                this.isSamosvalScreen = true; 
                
                result.scoringDice.forEach(index => {
                    let die = activeDice[index];
                    if (!die.locked) die.toggleLock();
                });
            } else {
                this.messageText.setText(`+${result.score}`);
                this.messageText.setColor('#ffffff'); 
                
                result.scoringDice.forEach(index => {
                    let die = activeDice[index];
                    if (!die.locked) die.toggleLock();
                });
            }
        }

        this.updateUI();
    }       

    bankAndPass() {
        if (this.gameState.currentTurnScore === 0 || this.isBoltScreen || this.isSamosvalScreen) return;

        let allLocked = this.diceGroup.every(die => die.locked);
        if (allLocked) {
            this.messageText.setText('Все 5 сыграли! Обязательный бросок');
            return; 
        }

        let isSuccess = this.gameState.bankScore();

        if (this.gameState.isGameOver) {
            this.updateUI(); 
            this.showVictoryScreen(); 
            return; 
        }
        
        if (isSuccess) {
            this.messageText.setText('Очки записаны!');
            this.resetTable(); 
        } else {
            let player = this.gameState.getCurrentPlayer();
            
            if (!player.isOpened) {
                if (player.totalScore > 0) {
                    let needed = 50 - player.totalScore;
                    this.messageText.setText(`Нужно добить открытие: еще ${needed}!`);
                } else {
                    this.messageText.setText('Для открытия нужно 50!');
                }
            } else if (this.gameState.isInPit(player.totalScore)) {
                this.messageText.setText('Не хватает для выхода из ямы!');
            }
        }

        this.updateUI();
    }

    resetTable() {
        this.diceGroup.forEach(die => die.reset());
    }

    updateUI() {
        let player = this.gameState.getCurrentPlayer();

        if (this.gameState.isGameOver) {
            this.messageText.setText(`${player.name} ПОБЕДИЛ!`);
            this.rollBtn.disableInteractive();
            this.bankBtn.disableInteractive();
        }
        
        let activePlayer = this.gameState.getCurrentPlayer();

        this.gameState.players.forEach((player, index) => {
            let row = this.scoreRows[index];
            
            row.score.setText(player.totalScore.toString());
            row.bolts.setText(player.bolts > 0 ? 'X'.repeat(player.bolts) : '-');

            if (player.id === activePlayer.id) {
                row.name.setColor('#00ff00');
                row.score.setColor('#00ff00');
                row.bolts.setColor('#00ff00');
            } else {
                row.name.setColor('#ffffff');
                row.score.setColor('#ffffff');
                row.bolts.setColor(player.bolts === 2 ? '#ff4444' : '#ffffff');
            }
        });

        let currentBank = this.gameState.currentTurnScore;
        
        if (this.turnScoreValue.text !== currentBank.toString()) {
            this.turnScoreValue.setText(currentBank.toString());
            
            this.turnScoreValue.setColor(currentBank === 0 ? '#ff4444' : '#ffea00');

            this.tweens.add({
                targets: this.turnScoreValue,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 100,
                yoyo: true, 
                ease: 'Sine.easeInOut'
            });
        }
    }

    showVictoryScreen() {
        let winner = this.gameState.getCurrentPlayer();

        let overlay = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.9)
            .setInteractive()
            .setDepth(500); 

        let victoryContainer = this.add.container(960, 540).setDepth(501);

        let title = this.add.text(0, -120, 'ИГРА ОКОНЧЕНА!', { 
            fontSize: '80px', fill: '#ffea00', fontStyle: 'bold', stroke: '#ff0000', strokeThickness: 6 
        }).setOrigin(0.5);
        
        let subtitle = this.add.text(0, 0, `ПОБЕДИТЕЛЬ: ${winner.name}`, { 
            fontSize: '56px', fill: '#00ff00' 
        }).setOrigin(0.5);
        
        let scoreText = this.add.text(0, 80, `Счет: ${winner.totalScore}`, { 
            fontSize: '40px', fill: '#ffffff' 
        }).setOrigin(0.5);

        let exitBtn = this.add.text(0, 200, '[ В ГЛАВНОЕ МЕНЮ ]', { 
            fontSize: '48px', fill: '#ffffff', backgroundColor: '#cc0000', padding: {x: 30, y: 15} 
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.start('MainMenu');
            });
            
        exitBtn.on('pointerover', () => exitBtn.setScale(1.1));
        exitBtn.on('pointerout', () => exitBtn.setScale(1));

        victoryContainer.add([title, subtitle, scoreText, exitBtn]);
        
        victoryContainer.setScale(0);
        this.tweens.add({
            targets: victoryContainer,
            scale: 1,
            duration: 600,
            ease: 'Back.easeOut'
        });
    }
}

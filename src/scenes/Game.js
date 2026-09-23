function generateDiceTextures(scene) {
    const size = 64;
    const dotRadius = 6;
    const offset = 15; 
    
    const g = scene.make.graphics({x: 0, y: 0, add: false});

    for (let val = 1; val <= 6; val++) {
        g.clear();
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(2, 2, size - 4, size - 4, 12);
        
        g.lineStyle(3, 0x333333, 1);
        g.strokeRoundedRect(2, 2, size - 4, size - 4, 12);

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
        // Рисуем текстуры в память
        generateDiceTextures(this);

        let players = (data && data.playerNames) ? data.playerNames : ['Игрок 1', 'Игрок 2'];
        let useBarrel = this.registry.get('useBarrel');
        this.gameState = new GameState(players, useBarrel);
        // --- ТАБЛИЦА СЧЕТА (Левый верхний угол) ---
        this.scoreboardContainer = this.add.container(20, 20).setDepth(50);
        
        // Динамическая высота фона в зависимости от числа игроков
        let bgHeight = 45 + (this.gameState.players.length * 30);
        let scoreBg = this.add.rectangle(0, 0, 260, bgHeight, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0x555555);
        this.scoreboardContainer.add(scoreBg);

        // Заголовки колонок
        this.scoreboardContainer.add(this.add.text(10, 10, 'ИГРОК', { fontSize: '14px', fill: '#aaa' }));
        this.scoreboardContainer.add(this.add.text(150, 10, 'ОЧКИ', { fontSize: '14px', fill: '#aaa' }));
        this.scoreboardContainer.add(this.add.text(210, 10, 'БОЛТЫ', { fontSize: '14px', fill: '#aaa' }));

        // Массив для хранения текстовых строк таблицы
        this.scoreRows = [];
        
        this.gameState.players.forEach((p, index) => {
            let yPos = 35 + index * 30;
            
            // Создаем три отдельных текста для каждой колонки
            let nameTxt = this.add.text(10, yPos, p.name.substring(0, 10), { fontSize: '18px', fill: '#fff' });
            let scoreTxt = this.add.text(150, yPos, '0', { fontSize: '18px', fill: '#fff' });
            let boltsTxt = this.add.text(210, yPos, '-', { fontSize: '18px', fill: '#fff' });
            
            this.scoreRows.push({ name: nameTxt, score: scoreTxt, bolts: boltsTxt });
            this.scoreboardContainer.add([nameTxt, scoreTxt, boltsTxt]);
        });

        // --- БАНК ХОДА (Счетчик раунда по центру) ---
        this.turnScoreContainer = this.add.container(400, 90); // Центр экрана, чуть сверху
        
        // Темный фон с золотой рамкой
        let turnScoreBg = this.add.rectangle(0, 0, 200, 60, 0x000000, 0.7)
            .setStrokeStyle(2, 0xffea00); // Желтая обводка
        this.turnScoreContainer.add(turnScoreBg);

        // Подпись мелкими буквами
        this.add.text(400, 70, 'БАНК ХОДА', { fontSize: '14px', fill: '#aaaaaa' }).setOrigin(0.5);

        // Сами очки (крупно)
        this.turnScoreValue = this.add.text(400, 98, '0', { 
            fontSize: '36px', 
            fill: '#ffea00', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);

        this.turnText = this.add.text(20, 20, '', { fontSize: '24px', fill: '#fff' });
        this.bankText = this.add.text(20, 60, '', { fontSize: '24px', fill: '#ffea00' });
        this.messageText = this.add.text(400, 150, '', { fontSize: '32px', fill: '#ff0000' }).setOrigin(0.5);
        

        this.diceGroup = [];
        for (let i = 0; i < 5; i++) {
            let die = new Dice(this, 150 + i * 125, 350, 'dice1');
            this.diceGroup.push(die);
        }

        this.rollBtn = this.add.text(250, 500, '[ БРОСИТЬ ]', { fontSize: '32px', fill: '#0f0' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', this.rollActiveDice, this);

        this.bankBtn = this.add.text(500, 500, '[ В БАНК ]', { fontSize: '32px', fill: '#fff' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', this.bankAndPass, this);

        this.updateUI();
            // --- ИГРОВОЕ МЕНЮ И ОКНА (Внутриигровые, без браузерных окон) ---

        // 1. Окно подтверждения выхода (создаем заранее, скрываем)
        this.confirmContainer = this.add.container(0, 0).setDepth(200).setVisible(false);

        // Темный фон на весь экран (блокирует клики по игре)
        let overlayBg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85).setInteractive();
        this.confirmContainer.add(overlayBg);

        // Сама плашка
        let confirmBox = this.add.rectangle(400, 300, 400, 180, 0x222222).setStrokeStyle(2, 0xff4444);
        this.confirmContainer.add(confirmBox);

        // Текст подтверждения
        let confirmText = this.add.text(400, 260, 'Точно выйти в меню?\nПрогресс будет утерян.', { fontSize: '24px', fill: '#fff', align: 'center' }).setOrigin(0.5);
        this.confirmContainer.add(confirmText);

        // Кнопка [ ДА ]
        let btnYes = this.add.text(280, 340, '[ ДА ]', { fontSize: '28px', fill: '#ff4444' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.start('MainMenu'); // Уходим в меню
            });
        this.confirmContainer.add(btnYes);

        // Кнопка [ НЕТ ]
        let btnNo = this.add.text(520, 340, '[ НЕТ ]', { fontSize: '28px', fill: '#0f0' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.confirmContainer.setVisible(false); // Просто прячем окно
            });
        this.confirmContainer.add(btnNo);


        // 2. Выпадающее меню под кнопкой
        this.menuContainer = this.add.container(780, 70).setDepth(100).setVisible(false);

        // Фон меню
        let menuBg = this.add.rectangle(0, 0, 220, 160, 0x222222, 0.95).setOrigin(1, 0).setStrokeStyle(2, 0x00ff00);
        this.menuContainer.add(menuBg);

        // Кнопка "Настройки" 
        let settingsBtn = this.add.text(-110, 40, 'НАСТРОЙКИ', { fontSize: '20px', fill: '#fff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.menuContainer.setVisible(false);
                
                // Делаем красивое всплывающее сообщение вместо alert()
                let toast = this.add.text(400, 300, 'Настройки в разработке!', { 
                    fontSize: '24px', fill: '#ffea00', backgroundColor: '#333', padding: {x: 15, y: 10} 
                }).setOrigin(0.5).setDepth(300);
                
                // Анимация: текст поднимается вверх и исчезает
                this.tweens.add({ targets: toast, alpha: 0, y: 200, duration: 1500, onComplete: () => toast.destroy() });
            });
        this.menuContainer.add(settingsBtn);

        // Кнопка "В главное меню"
        let exitBtn = this.add.text(-110, 90, 'ВЫХОД В МЕНЮ', { fontSize: '20px', fill: '#ff4444' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.menuContainer.setVisible(false);
                this.confirmContainer.setVisible(true); // Показываем наше кастомное окно
            });
        this.menuContainer.add(exitBtn);

        // Кнопка закрытия меню
        let closeMenuBtn = this.add.text(-110, 130, '[ закрыть ]', { fontSize: '16px', fill: '#aaaaaa' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.menuContainer.setVisible(false);
            });
        this.menuContainer.add(closeMenuBtn);


        // 3. Сама кнопка ☰ МЕНЮ в углу экрана
        this.add.text(780, 20, '☰ МЕНЮ', { fontSize: '24px', fill: '#ffffff', backgroundColor: '#111111', padding: { x: 10, y: 5 } })
            .setOrigin(1, 0)
            .setDepth(99)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.menuContainer.setVisible(!this.menuContainer.visible);
            });
    }

    rollActiveDice() {
        // 1. Проверяем экраны принудительной передачи хода
        if (this.isBoltScreen || this.isSamosvalScreen) {
            
            if (this.isBoltScreen) {
                this.gameState.registerBolt(); 
            }
            
            if (this.isSamosvalScreen) {
                let player = this.gameState.getCurrentPlayer();
                player.totalScore = 0; // Обнуляем счет
                player.bolts = 0;      // Прощаем старые болты, раз уж упали на дно
                this.gameState.endTurn(); // Принудительно передаем ход
            }

            // Сбрасываем флаги
            this.isBoltScreen = false;
            this.isSamosvalScreen = false;

            this.resetTable();             
            this.messageText.setText('');
            this.messageText.setColor('#ffffff'); 
            this.updateUI();               
            return;                        
        }

        // 2. Старый код броска
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
            
            // --- НОВОЕ: МГНОВЕННАЯ ПРОВЕРКА НА САМОСВАЛ ---
            if (player.totalScore + this.gameState.currentTurnScore === 555) {
                this.messageText.setText('САМОСВАЛ!');
                this.messageText.setColor('#ff4444');
                this.isSamosvalScreen = true; // Ставим новый флаг
                
                // Блокируем кубики, чтобы показать выпавшую комбинацию
                result.scoringDice.forEach(index => {
                    let die = activeDice[index];
                    if (!die.locked) die.toggleLock();
                });
            } else {
                // Стандартное поведение, если самосвала нет
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

        // ПРОВЕРКА НА ОБЯЗАТЕЛЬНЫЙ БРОСОК
        // Если все 5 кубиков отложены (сыграли), по правилам банк закрыт — нужно бросать!
        let allLocked = this.diceGroup.every(die => die.locked);
        if (allLocked) {
            this.messageText.setText('Все 5 сыграли! Обязательный бросок');
            return; // Прерываем выполнение, очки не записываются
        }

        let isSuccess = this.gameState.bankScore();

        if (this.gameState.isGameOver) {
            this.updateUI(); // Обновляем стату, чтобы красиво горела 1000
            this.showVictoryScreen(); // Вызываем экран победы
            return; // Прерываем функцию, ход больше не передается
        }
        
        if (isSuccess) {
            this.messageText.setText('Очки записаны!');
            this.resetTable(); 
        } else {
            let player = this.gameState.getCurrentPlayer();
            
            if (!player.isOpened) {
                if (player.totalScore > 0) {
                    // Если игрок уже вылез из минуса, но еще не набрал 50
                    let needed = 50 - player.totalScore;
                    this.messageText.setText(`Нужно добить открытие: еще ${needed}!`);
                } else {
                    // Обычный старт с нуля
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
        
        //this.turnText.setText(`Ходит: ${player.name} | Счет: ${player.totalScore} | Болты: ${player.bolts}`);
        //this.bankText.setText(`В банке хода: ${this.gameState.currentTurnScore}`);

        if (this.gameState.isGameOver) {
            this.messageText.setText(`${player.name} ПОБЕДИЛ!`);
            this.rollBtn.disableInteractive();
            this.bankBtn.disableInteractive();
        }
        // --- ОБНОВЛЕНИЕ ТАБЛИЦЫ СЧЕТА ---
        let activePlayer = this.gameState.getCurrentPlayer();

        this.gameState.players.forEach((player, index) => {
            let row = this.scoreRows[index];
            
            // Обновляем значения
            row.score.setText(player.totalScore.toString());
            // Рисуем крестики для болтов: 1 болт = X, 2 болта = XX. Если 0 — ставим прочерк.
            row.bolts.setText(player.bolts > 0 ? 'X'.repeat(player.bolts) : '-');

            // Подсвечиваем активного игрока зеленым, остальных делаем белыми
            if (player.id === activePlayer.id) {
                row.name.setColor('#00ff00');
                row.score.setColor('#00ff00');
                row.bolts.setColor('#00ff00');
            } else {
                row.name.setColor('#ffffff');
                row.score.setColor('#ffffff');
                // Маленькая фича: подсветим болты красным, если их уже 2 (опасность!)
                row.bolts.setColor(player.bolts === 2 ? '#ff4444' : '#ffffff');
            }
        });
        // --- ОБНОВЛЕНИЕ БАНКА ХОДА ---
        let currentBank = this.gameState.currentTurnScore;
        
        // Если счет изменился, обновляем текст и делаем красивый "вздув" (анимацию)
        if (this.turnScoreValue.text !== currentBank.toString()) {
            this.turnScoreValue.setText(currentBank.toString());
            
            // Если банк сгорел (болт) - красим в красный, иначе желтый
            this.turnScoreValue.setColor(currentBank === 0 ? '#ff4444' : '#ffea00');

            // Анимация пульсации цифр
            this.tweens.add({
                targets: this.turnScoreValue,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 100,
                yoyo: true, // Возвращает масштаб обратно
                ease: 'Sine.easeInOut'
            });
        }
        
    }
    showVictoryScreen() {
        // Поскольку при победе ход не передался (мы пропустили endTurn), 
        // getCurrentPlayer() вернет именно победителя!
        let winner = this.gameState.getCurrentPlayer();

        // Темный полупрозрачный фон на весь экран (блокирует все клики по столу)
        let overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9)
            .setInteractive()
            .setDepth(500); // Ставим поверх всего

        // Контейнер для текста и кнопок
        let victoryContainer = this.add.container(400, 300).setDepth(501);

        let title = this.add.text(0, -80, 'ИГРА ОКОНЧЕНА!', { 
            fontSize: '56px', fill: '#ffea00', fontStyle: 'bold', stroke: '#ff0000', strokeThickness: 4 
        }).setOrigin(0.5);
        
        let subtitle = this.add.text(0, 0, `ПОБЕДИТЕЛЬ: ${winner.name}`, { 
            fontSize: '36px', fill: '#00ff00' 
        }).setOrigin(0.5);
        
        let scoreText = this.add.text(0, 60, `Счет: ${winner.totalScore}`, { 
            fontSize: '28px', fill: '#ffffff' 
        }).setOrigin(0.5);

        // Кнопка выхода в главное меню
        let exitBtn = this.add.text(0, 150, '[ В ГЛАВНОЕ МЕНЮ ]', { 
            fontSize: '32px', fill: '#ffffff', backgroundColor: '#cc0000', padding: {x: 20, y: 10} 
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.start('MainMenu');
            });
            
        // Анимация наведения для кнопки
        exitBtn.on('pointerover', () => exitBtn.setScale(1.1));
        exitBtn.on('pointerout', () => exitBtn.setScale(1));

        victoryContainer.add([title, subtitle, scoreText, exitBtn]);
        
        // Красивое появление окна (увеличивается из центра)
        victoryContainer.setScale(0);
        this.tweens.add({
            targets: victoryContainer,
            scale: 1,
            duration: 600,
            ease: 'Back.easeOut'
        });
    }
}
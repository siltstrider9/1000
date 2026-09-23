class UIHelper {
    static showPrompt(defaultValue, callback) {
        let overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; justify-content: center; align-items: center;';
        
        let input = document.createElement('input');
        input.type = 'text'; 
        input.value = defaultValue;
        // Увеличиваем размер поля и шрифта под пальцы
        input.style.cssText = 'width: 60%; max-width: 600px; padding: 25px; font-size: 48px; border-radius: 12px; border: 4px solid #0f0; text-align: center; background: #222; color: #ffea00; outline: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5);';
        
        input.onkeydown = (e) => { 
            if (e.key === 'Enter') {
                callback(input.value); 
                document.body.removeChild(overlay); 
            }
            if (e.key === 'Escape') {
                document.body.removeChild(overlay); 
            }
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };

        overlay.appendChild(input);
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            input.focus();
            input.select(); // Сразу выделяем старое имя, чтобы легко стирать
        }, 50);
    }
}

class Lobby extends Phaser.Scene {
    constructor() {
        super('Lobby');
    }

    create() {
        this.players = ['Игрок 1'];
        this.maxPlayers = 6;
        
        this.playerTextObjects = []; 

        // Центр теперь по X = 960
        this.add.text(960, 150, 'ТЫСЯЧА', { fontSize: '100px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(960, 240, '(Нажмите на имя, чтобы изменить)', { fontSize: '32px', fill: '#aaa' }).setOrigin(0.5);

        // Кнопка [+ ИГРОК] слева
        this.add.text(600, 850, '[ + ИГРОК ]', { fontSize: '48px', fill: '#0f0' })
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5)
            .on('pointerdown', () => {
                if (this.players.length < this.maxPlayers) {
                    this.players.push(`Игрок ${this.players.length + 1}`);
                    this.renderPlayerList();
                }
            });

        // Кнопка [- ИГРОК] справа
        this.add.text(1320, 850, '[ - ИГРОК ]', { fontSize: '48px', fill: '#f00' })
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5)
            .on('pointerdown', () => {
                if (this.players.length > 1) {
                    this.players.pop();
                    this.renderPlayerList();
                }
            });

        // Огромная кнопка "Начать" снизу по центру
        let startBtn = this.add.text(960, 1000, '>> НАЧАТЬ ИГРУ <<', { fontSize: '64px', fill: '#ffea00', fontStyle: 'bold' })
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.scene.start('GameScene', { playerNames: this.players });
            });

        startBtn.on('pointerover', () => startBtn.setScale(1.1));
        startBtn.on('pointerout', () => startBtn.setScale(1));

        this.renderPlayerList();
    }

    renderPlayerList() {
        this.playerTextObjects.forEach(textObj => textObj.destroy());
        this.playerTextObjects = [];

        // Имена начинаются ниже заголовка
        let startY = 380;
        let spacing = 70; // Шаг между именами

        this.players.forEach((name, index) => {
            let pText = this.add.text(960, startY + (index * spacing), name, { fontSize: '48px', fill: '#ffea00' })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    UIHelper.showPrompt(name, (newName) => {
                        if (newName && newName.trim() !== '') {
                            this.players[index] = newName.trim().substring(0, 12);
                            this.renderPlayerList();
                        }
                    });
                });

            // Эффект наведения, чтобы понятно было, что можно кликать
            pText.on('pointerover', () => pText.setColor('#ffffff'));
            pText.on('pointerout', () => pText.setColor('#ffea00'));

            this.playerTextObjects.push(pText);
        });
    }
}

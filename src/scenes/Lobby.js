class UIHelper {
    static showPrompt(defaultValue, callback) {
        let overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center;';
        
        let input = document.createElement('input');
        input.type = 'text'; 
        input.value = defaultValue;
        input.style.cssText = 'width: 250px; padding: 15px; font-size: 24px; border-radius: 8px; border: 2px solid #0f0; text-align: center; background: #222; color: #ffea00; outline: none;';
        
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
        
        setTimeout(() => input.focus(), 50);
    }
}

class Lobby extends Phaser.Scene {
    constructor() {
        super('Lobby');
    }

    create() {
        this.players = ['Игрок 1'];
        this.maxPlayers = 6;
        
        // Массив для хранения отдельных строк с именами
        this.playerTextObjects = []; 

        this.add.text(400, 80, 'ТЫСЯЧА', { fontSize: '64px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 140, '(Нажмите на имя, чтобы изменить)', { fontSize: '20px', fill: '#aaa' }).setOrigin(0.5);

        this.add.text(250, 460, '[ + ИГРОК ]', { fontSize: '32px', fill: '#0f0' })
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5)
            .on('pointerdown', () => {
                if (this.players.length < this.maxPlayers) {
                    this.players.push(`Игрок ${this.players.length + 1}`);
                    this.renderPlayerList();
                }
            });

        this.add.text(550, 460, '[ - ИГРОК ]', { fontSize: '32px', fill: '#f00' })
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5)
            .on('pointerdown', () => {
                if (this.players.length > 1) {
                    this.players.pop();
                    this.renderPlayerList();
                }
            });

        this.add.text(400, 540, '>> НАЧАТЬ ИГРУ <<', { fontSize: '48px', fill: '#fff' })
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.scene.start('GameScene', { playerNames: this.players });
            });

        this.renderPlayerList();
    }

    renderPlayerList() {
        // Удаляем старые имена перед перерисовкой
        this.playerTextObjects.forEach(textObj => textObj.destroy());
        this.playerTextObjects = [];

        let startY = 200;
        let spacing = 40;

        // Создаем каждое имя как отдельный кликабельный элемент
        this.players.forEach((name, index) => {
            let pText = this.add.text(400, startY + (index * spacing), name, { fontSize: '32px', fill: '#ffea00' })
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

            this.playerTextObjects.push(pText);
        });
    }
}
class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        // Задаем настройку по умолчанию (Бочка выключена)
        if (this.registry.get('useBarrel') === undefined) {
            this.registry.set('useBarrel', false);
        }

        // Заголовок стал огромным
        this.add.text(960, 300, 'ТЫСЯЧА', { fontSize: '120px', fill: '#ffea00', fontStyle: 'bold' }).setOrigin(0.5);

        // Кнопка [ НАЧАТЬ ИГРУ ]
        let startBtn = this.add.text(960, 600, '[ НАЧАТЬ ИГРУ ]', { fontSize: '64px', fill: '#00ff00' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('Lobby'));
            
        startBtn.on('pointerover', () => startBtn.setScale(1.1));
        startBtn.on('pointerout', () => startBtn.setScale(1));

        // --- ОКНО НАСТРОЕК (Скрытое по умолчанию) ---
        this.settingsContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
        
        // Фон на весь экран 1920x1080
        let overlay = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.9).setInteractive(); 
        this.settingsContainer.add(overlay);
        
        this.settingsContainer.add(this.add.text(960, 250, 'НАСТРОЙКИ', { fontSize: '80px', fill: '#fff' }).setOrigin(0.5));

        // Кнопка переключения бочки
        let getBarrelText = () => this.registry.get('useBarrel') ? 'Правило "Бочки": ВКЛ' : 'Правило "Бочки": ВЫКЛ';
        let barrelBtn = this.add.text(960, 450, getBarrelText(), { fontSize: '56px', fill: '#ffea00' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                let current = this.registry.get('useBarrel');
                this.registry.set('useBarrel', !current); // Инвертируем значение
                barrelBtn.setText(getBarrelText());
            });
        this.settingsContainer.add(barrelBtn);

        // Кнопка закрытия настроек
        let closeBtn = this.add.text(960, 800, '[ ЗАКРЫТЬ ]', { fontSize: '48px', fill: '#aaa' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.settingsContainer.setVisible(false));
        this.settingsContainer.add(closeBtn);

        // --- КНОПКА ВЫЗОВА НАСТРОЕК ---
        let settingsBtn = this.add.text(960, 750, '[ НАСТРОЙКИ ]', { fontSize: '64px', fill: '#ffffff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.settingsContainer.setVisible(true));
            
        settingsBtn.on('pointerover', () => settingsBtn.setScale(1.1));
        settingsBtn.on('pointerout', () => settingsBtn.setScale(1));
    }
}

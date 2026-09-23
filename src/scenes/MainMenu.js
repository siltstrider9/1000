class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        // Задаем настройку по умолчанию (Бочка выключена)
        if (this.registry.get('useBarrel') === undefined) {
            this.registry.set('useBarrel', false);
        }

        this.add.text(400, 200, 'ТЫСЯЧА', { fontSize: '64px', fill: '#ffea00', fontStyle: 'bold' }).setOrigin(0.5);

        this.add.text(400, 350, '[ НАЧАТЬ ИГРУ ]', { fontSize: '32px', fill: '#00ff00' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('Lobby'));

        // --- ОКНО НАСТРОЕК (Скрытое по умолчанию) ---
        this.settingsContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
        
        let overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9).setInteractive(); // Блокирует клики
        this.settingsContainer.add(overlay);
        this.settingsContainer.add(this.add.text(400, 150, 'НАСТРОЙКИ', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5));

        // Кнопка переключения бочки
        let getBarrelText = () => this.registry.get('useBarrel') ? 'Правило "Бочки": ВКЛ' : 'Правило "Бочки": ВЫКЛ';
        let barrelBtn = this.add.text(400, 260, getBarrelText(), { fontSize: '28px', fill: '#ffea00' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                let current = this.registry.get('useBarrel');
                this.registry.set('useBarrel', !current); // Инвертируем значение
                barrelBtn.setText(getBarrelText());
            });
        this.settingsContainer.add(barrelBtn);

        // Кнопка закрытия настроек
        let closeBtn = this.add.text(400, 450, '[ ЗАКРЫТЬ ]', { fontSize: '24px', fill: '#aaa' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.settingsContainer.setVisible(false));
        this.settingsContainer.add(closeBtn);

        // --- КНОПКА ВЫЗОВА НАСТРОЕК ---
        this.add.text(400, 420, '[ НАСТРОЙКИ ]', { fontSize: '32px', fill: '#ffffff' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.settingsContainer.setVisible(true));
    }
}
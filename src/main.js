
const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,

    scale: {
        // FIT - растянет игру на весь экран, но сохранит пропорции (не обрежет края)
        mode: Phaser.Scale.FIT,
        // Центрируем канвас по горизонтали и вертикали
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    parent: 'game-container',
    backgroundColor: '#2d6a4f',    
    scene: [MainMenu, Lobby, GameScene] 
};

const game = new Phaser.Game(config);

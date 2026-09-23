
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2d6a4f',    
    scene: [MainMenu, Lobby, GameScene] 
};

const game = new Phaser.Game(config);
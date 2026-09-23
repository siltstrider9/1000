class Dice extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, textureKey) {
        super(scene, x, y, textureKey); 
        
        this.scene.add.existing(this);     

        this.value = 1;      
        this.locked = false; 
        this.isRolling = false; 
        this.baseY = y;
    }

    toggleLock() {
        if (this.isRolling) return;

        this.locked = !this.locked;
        
        if (this.locked) {
            this.setAlpha(0.6);
            this.scene.tweens.add({ targets: this, y: this.baseY - 50, duration: 200, ease: 'Power2' });
        } else {
            this.setAlpha(1);
            this.scene.tweens.add({ targets: this, y: this.baseY, duration: 200, ease: 'Power2' });
        }
    }

    roll(finalValue) {
        if (this.locked) return;

        this.isRolling = true;
        this.value = finalValue;
        
        this.scene.time.addEvent({
            delay: 100, 
            repeat: 5,  
            callback: () => {
                let randomVal = Phaser.Math.Between(1, 6);
                this.setTexture(`dice${randomVal}`);
            },
            callbackScope: this
        });

        this.scene.time.delayedCall(600, () => {
            this.setTexture(`dice${this.value}`); 
            this.isRolling = false;
        }, [], this);
    }

    reset() {
        this.locked = false;
        this.setAlpha(1);
        this.y = this.baseY;
    }
}
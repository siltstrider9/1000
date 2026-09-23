class GameState {
    constructor(playerNames, useBarrel = false) {
        this.useBarrel = useBarrel;
        this.players = playerNames.map((name, index) => ({
            id: index,
            name: name,
            totalScore: 0,
            bolts: 0,
            isOpened: false,    // Открыл ли игру (набрал 50)
            onBarrel: false,    // Сидит ли на бочке
            barrelAttempts: 0,  // Попытки выиграть с бочки
            barrelFalls: 0      // Количество падений с бочки
        }));

        this.currentPlayerIndex = 0;
        this.currentTurnScore = 0;
        this.isGameOver = false;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    addTurnScore(points) {
        this.currentTurnScore += points;
    }

    bankScore() {
        let player = this.getCurrentPlayer();
        let newTotal = player.totalScore + this.currentTurnScore;

        // 1. Правило обязательного открытия
        if (!player.isOpened) {
            if (player.totalScore < 0) {
                if (newTotal >= 50) {
                    player.isOpened = true; 
                }
            } else {
                if (newTotal < 50) return false; 
                player.isOpened = true;
            }
        }
        
        // 2. Проверка ЯМ (200-300 и 600-700)
        if (this.isInPit(player.totalScore)) {
            let pitTop = player.totalScore <= 300 ? 300 : 700;            
            if (newTotal <= pitTop) return false; 
        }

        // 3. ПРОВЕРКА НА ПОБЕДУ / БОЧКУ
        if (this.useBarrel) {
            // Если бочка включена 
            if (player.onBarrel) {
                if (this.currentTurnScore >= 120) { // Мягкое правило: 120 или больше
                    this.isGameOver = true;
                    player.totalScore = 1000;
                    return true;
                } else {
                    player.barrelAttempts++;
                    if (player.barrelAttempts >= 3) this.fallFromBarrel(player);
                    this.endTurn();
                    return true;
                }
            }
            if (newTotal >= 880) {
                this.climbBarrel(player);
                this.endTurn();
                return true;
            }
        } else {
            // Если бочка выключена - просто идем до 1000
            if (newTotal >= 1000) {
                this.isGameOver = true;
                player.totalScore = newTotal; 
                return true;
            }
        }       

        // 4. Правило Обгона (штраф 50 очков обгоняемому)       
        this.players.forEach(p => {
            if (p.id !== player.id && p.totalScore > player.totalScore && p.totalScore < newTotal) {
                p.totalScore -= 50; 
            }
        });

        // 5. Применяем новые очки
        player.totalScore = newTotal;
        player.bolts = 0;

        // 6. Самосвал
        if (player.totalScore === 555) {
            player.totalScore = 0;
        }

        this.endTurn();
        return true;
    }

    registerBolt() {
        let player = this.getCurrentPlayer();

        if (this.useBarrel && player.onBarrel) {
            player.barrelAttempts++;
            if (player.barrelAttempts >= 3) this.fallFromBarrel(player);
            this.currentTurnScore = 0;
            this.endTurn();
            return;
        }
        
        player.bolts++;
        
        // Проверяем достижение 3-х болтов
        if (player.bolts === 3) {
            player.totalScore -= 100; // Штраф 100 очков (если на бочке 880 -> 780)
            player.bolts = 0;         // Обнуляем счетчик болтов
            
            // Если игрок был на бочке, он с нее падает из-за болтов
            if (player.onBarrel) {
                player.onBarrel = false;
                player.barrelAttempts = 0; 
            }
        }
        
        this.currentTurnScore = 0;
        this.endTurn();
    }

    // --- Вспомогательные методы ---

    isInPit(score) {
        return (score >= 200 && score <= 300) || (score >= 600 && score <= 700);
    }

    climbBarrel(player) {
        player.totalScore = 880; // Остановка на входе в бочку
        player.onBarrel = true;
        player.barrelAttempts = 0;

        // Сбрасываем других игроков с бочки (на бочке может сидеть только один)
        this.players.forEach(p => {
            if (p.id !== player.id && p.onBarrel) {
                this.fallFromBarrel(p);
            }
        });
    }

    fallFromBarrel(player) {
        player.onBarrel = false;
        player.totalScore -= 100;
        player.barrelFalls++;
        
        if (player.barrelFalls >= 3) {
            player.totalScore = 0; // Третье падение = сброс до нуля
            player.barrelFalls = 0;
        }
    }

    endTurn() {
        this.currentTurnScore = 0;
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
}
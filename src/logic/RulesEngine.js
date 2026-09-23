class RulesEngine {
    static evaluateRoll(diceArray) {
        let score = 0;
        let scoringDice = []; 

        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        diceArray.forEach(val => counts[val]++);

        // 1. Стриты (по классике: 1-5 = 125, 2-6 = 250)
        if (counts[1] && counts[2] && counts[3] && counts[4] && counts[5]) {
            return { score: 125, scoringDice: [0, 1, 2, 3, 4] };
        }
        if (counts[2] && counts[3] && counts[4] && counts[5] && counts[6]) {
            return { score: 250, scoringDice: [0, 1, 2, 3, 4] };
        }

        // 2. Комбинации (3 и более одинаковых)
        for (let i = 1; i <= 6; i++) {
            if (counts[i] >= 3) {
                // База за 3 кубика (единицы = 100, остальные = номинал * 10)
                let comboScore = (i === 1) ? 100 : i * 10;
                
                // 4 кубика = база * 2, 5 кубиков = база * 10
                if (counts[i] === 4) comboScore *= 2;
                if (counts[i] === 5) comboScore *= 10;
                
                score += comboScore;
                
                diceArray.forEach((val, index) => {
                    if (val === i) scoringDice.push(index);
                });
                
                counts[i] = 0; 
            }
        }

        // 3. Одиночные 1 (10 очков) и 5 (5 очков)
        if (counts[1] > 0) {
            score += counts[1] * 10;
            diceArray.forEach((val, index) => {
                if (val === 1 && !scoringDice.includes(index)) scoringDice.push(index);
            });
        }
        
        if (counts[5] > 0) {
            score += counts[5] * 5;
            diceArray.forEach((val, index) => {
                if (val === 5 && !scoringDice.includes(index)) scoringDice.push(index);
            });
        }

        return { score, scoringDice };
    }
}
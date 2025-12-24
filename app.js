// ==================== КОНФИГУРАЦИЯ ====================
const CONFIG = {
    // Режим работы
    DEMO_MODE: true, // true - демо, false - реальные платежи
    
    // Ваш Telegram ID для админки (узнать: @userinfobot)
    ADMIN_TELEGRAM_IDS: [7531962231],
    
    // Стартовый баланс
    INITIAL_BALANCE: 0, // Ноль как вы просили
    
    // Игровые настройки
    MIN_BET: 5,
    MAX_BET: 1000,
    HOUSE_EDGE: 0.10, // 10% комиссия казино
    
    // Настройки удачи (очень маленькая как просили)
    LUCK_SETTINGS: {
        baseWinChance: 0.15, // 15% базовый шанс
        jackpotChance: 0.001, // 0.1% шанс на джекпот
        minMultiplier: 2, // Минимальный выигрыш 2x
        maxMultiplier: 100, // Джекпот 100x
    },
    
    // Платежные настройки
    PAYMENTS: {
        MIN_DEPOSIT: 10,
        MAX_DEPOSIT: 10000,
        MIN_WITHDRAWAL: 10,
        MAX_WITHDRAWAL: 5000,
        WITHDRAWAL_FEE: 0.03, // 3% комиссия на вывод
        
        // Доступные криптовалюты
        CRYPTOCURRENCIES: {
            TON: {
                name: 'TON',
                icon: 'fab fa-telegram',
                color: '#0088cc',
                minAmount: 1,
                decimals: 2
            },
            USDT: {
                name: 'USDT',
                icon: 'fas fa-dollar-sign',
                color: '#26a17b',
                minAmount: 10,
                decimals: 2
            },
            BTC: {
                name: 'Bitcoin',
                icon: 'fab fa-bitcoin',
                color: '#f7931a',
                minAmount: 0.0001,
                decimals: 8
            },
            ETH: {
                name: 'Ethereum',
                icon: 'fab fa-ethereum',
                color: '#627eea',
                minAmount: 0.001,
                decimals: 6
            },
            SOL: {
                name: 'Solana',
                icon: 'fas fa-fire',
                color: '#9945ff',
                minAmount: 0.1,
                decimals: 4
            }
        },
        
        // Платежные методы
        METHODS: {
            CRYPTO_BOT: {
                name: 'Crypto Bot',
                icon: 'fab fa-telegram',
                color: '#0088cc',
                fee: 0.01, // 1% комиссия
                minTime: '1 min',
                maxTime: '15 min'
            },
            TON_MAKER: {
                name: 'TON Maker',
                icon: 'fas fa-bolt',
                color: '#34c759',
                fee: 0.005, // 0.5% комиссия
                minTime: '5 min',
                maxTime: '30 min'
            },
            DIRECT_TRANSFER: {
                name: 'Direct Transfer',
                icon: 'fas fa-exchange-alt',
                color: '#ff9500',
                fee: 0,
                minTime: '10 min',
                maxTime: '60 min'
            }
        }
    },
    
    // Игры
    GAMES: [
        {
            id: 'dice',
            name: 'Dice',
            icon: 'fas fa-dice',
            color: '#FF9500',
            description: 'Predict dice roll',
            minMultiplier: 2,
            maxMultiplier: 50,
            baseRTP: 95
        },
        {
            id: 'slots',
            name: 'Slots',
            icon: 'fas fa-sliders-h',
            color: '#34C759',
            description: 'Spin to win',
            minMultiplier: 1,
            maxMultiplier: 100, // Джекпот 100x
            baseRTP: 94
        },
        {
            id: 'plinko',
            name: 'Plinko',
            icon: 'fas fa-bullseye',
            color: '#007AFF',
            description: 'Drop the ball',
            minMultiplier: 1.5,
            maxMultiplier: 75,
            baseRTP: 93
        },
        {
            id: 'mines',
            name: 'Mines',
            icon: 'fas fa-bomb',
            color: '#FF3B30',
            description: 'Find diamonds',
            minMultiplier: 1.2,
            maxMultiplier: 60,
            baseRTP: 96
        },
        {
            id: 'roulette',
            name: 'Roulette',
            icon: 'fas fa-circle',
            color: '#AF52DE',
            description: 'Classic casino',
            minMultiplier: 2,
            maxMultiplier: 35,
            baseRTP: 97
        },
        {
            id: 'coinflip',
            name: 'Coinflip',
            icon: 'fas fa-coins',
            color: '#FFCC00',
            description: 'Heads or tails',
            minMultiplier: 1.95,
            maxMultiplier: 2.05,
            baseRTP: 98
        }
    ]
};

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentPlayer = null;
let tg = null;
let gameActive = false;
let selectedCurrency = 'TON';
let selectedPaymentMethod = 'CRYPTO_BOT';

// ==================== ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing TON Play...');
    
    try {
        // 1. Инициализация Telegram
        await initTelegram();
        
        // 2. Инициализация игрока
        await initPlayer();
        
        // 3. Загрузка интерфейса
        initUI();
        
        // 4. Инициализация игр
        initGames();
        
        // 5. Инициализация платежей
        initPayments();
        
        // 6. Обновление онлайн статистики
        startLiveUpdates();
        
        console.log('✅ System ready!');
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showNotification('Error loading application', 'error');
    }
});

// ==================== 1. TELEGRAM ИНИЦИАЛИЗАЦИЯ ====================
async function initTelegram() {
    if (typeof Telegram !== 'undefined') {
        tg = Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Настройка темы
        tg.setHeaderColor('#0a0a0a');
        tg.setBackgroundColor('#0a0a0a');
        
        console.log('Telegram Web App initialized');
        return true;
    }
    
    console.log('Demo mode (Telegram not found)');
    return false;
}

// ==================== 2. ИГРОК ====================
async function initPlayer() {
    let playerData = null;
    let telegramUser = null;
    
    if (tg && tg.initDataUnsafe?.user) {
        telegramUser = tg.initDataUnsafe.user;
        const playerId = `tg_${telegramUser.id}`;
        const savedData = localStorage.getItem(`player_${playerId}`);
        
        if (savedData) {
            playerData = JSON.parse(savedData);
            playerData.last_login = new Date().toISOString();
        } else {
            playerData = {
                id: playerId,
                telegram_id: telegramUser.id,
                username: telegramUser.username || `user_${telegramUser.id}`,
                first_name: telegramUser.first_name || 'Player',
                
                // Балансы для разных криптовалют
                balances: {
                    TON: CONFIG.INITIAL_BALANCE,
                    USDT: 0,
                    BTC: 0,
                    ETH: 0,
                    SOL: 0
                },
                
                // Статистика
                games_played: 0,
                total_won: 0,
                total_lost: 0,
                total_deposited: 0,
                total_withdrawn: 0,
                
                // Системные данные
                registration_date: new Date().toISOString(),
                last_login: new Date().toISOString(),
                is_admin: CONFIG.ADMIN_TELEGRAM_IDS.includes(telegramUser.id),
                
                // Настройки удачи (очень маленькая)
                luck_multiplier: 0.9,
                
                // История транзакций
                transactions: []
            };
            
            showNotification(`Welcome, ${playerData.first_name}! Balance: 0`, 'info');
        }
    } else {
        // Демо режим
        playerData = {
            id: 'demo_guest',
            username: 'Guest',
            first_name: 'Guest',
            
            balances: {
                TON: 0,
                USDT: 0,
                BTC: 0,
                ETH: 0,
                SOL: 0
            },
            
            games_played: 0,
            total_won: 0,
            total_lost: 0,
            total_deposited: 0,
            total_withdrawn: 0,
            
            registration_date: new Date().toISOString(),
            last_login: new Date().toISOString(),
            is_admin: false,
            luck_multiplier: 0.8,
            transactions: []
        };
        
        showNotification('Demo mode. Register via Telegram for real play', 'warning');
    }
    
    currentPlayer = playerData;
    savePlayerData();
    return playerData;
}

function savePlayerData() {
    if (!currentPlayer) return;
    localStorage.setItem(`player_${currentPlayer.id}`, JSON.stringify(currentPlayer));
}

// ==================== 3. ИНТЕРФЕЙС ====================
function initUI() {
    if (!currentPlayer) return;
    
    // Обновляем данные пользователя
    updateUserInfo();
    
    // Обновляем баланс
    updateBalance();
    
    // Настройка валюты
    initCurrencySelect();
    
    // Обновляем статистику
    updateStats();
}

function updateUserInfo() {
    document.getElementById('username').textContent = currentPlayer.first_name;
    document.getElementById('userId').textContent = `ID: ${currentPlayer.id.substring(3, 8)}`;
    
    // Аватар
    const avatar = document.getElementById('userAvatar');
    if (currentPlayer.telegram_id) {
        avatar.className = 'fas fa-user-check';
        avatar.style.color = '#34C759';
    }
}

function updateBalance() {
    const balance = currentPlayer.balances[selectedCurrency] || 0;
    document.getElementById('balanceAmount').textContent = balance.toFixed(
        CONFIG.PAYMENTS.CRYPTOCURRENCIES[selectedCurrency]?.decimals || 2
    );
    document.getElementById('balanceCurrency').textContent = selectedCurrency;
    
    // Обновляем конвертированный баланс
    updateConvertedBalance();
}

function updateConvertedBalance() {
    // Демо курс конвертации
    const rates = {
        TON: 2.5,
        USDT: 1,
        BTC: 45000,
        ETH: 2500,
        SOL: 100
    };
    
    const balance = currentPlayer.balances[selectedCurrency] || 0;
    const usdValue = balance * (rates[selectedCurrency] || 1);
    
    document.getElementById('convertedBalance').textContent = `≈ $${usdValue.toFixed(2)} USD`;
}

function initCurrencySelect() {
    const select = document.getElementById('currencySelect');
    select.innerHTML = '';
    
    Object.keys(CONFIG.PAYMENTS.CRYPTOCURRENCIES).forEach(currency => {
        const option = document.createElement('option');
        option.value = currency;
        option.textContent = currency;
        option.selected = currency === selectedCurrency;
        select.appendChild(option);
    });
    
    select.onchange = function() {
        selectedCurrency = this.value;
        updateBalance();
    };
}

function updateStats() {
    document.getElementById('gamesPlayed').textContent = currentPlayer.games_played;
    
    const winRate = currentPlayer.games_played > 0 
        ? Math.round((currentPlayer.total_won / currentPlayer.games_played) * 100) 
        : 0;
    document.getElementById('winRate').textContent = `${winRate}%`;
    
    document.getElementById('totalWins').textContent = currentPlayer.total_won;
}

// ==================== 4. ИГРЫ ====================
function initGames() {
    const gamesGrid = document.getElementById('gamesGrid');
    gamesGrid.innerHTML = '';
    
    CONFIG.GAMES.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="game-header">
                <div class="game-icon" style="background: ${game.color}">
                    <i class="${game.icon}"></i>
                </div>
                <div class="game-rtp">
                    <span class="rtp-badge">RTP ${game.baseRTP}%</span>
                </div>
            </div>
            <div class="game-title">${game.name}</div>
            <div class="game-description">${game.description}</div>
            <div class="game-multipliers">
                <span class="min-multiplier">${game.minMultiplier}x</span>
                <span class="max-multiplier">${game.maxMultiplier}x</span>
            </div>
            <div class="game-actions">
                <button class="btn btn-play" onclick="startGame('${game.id}')">
                    <i class="fas fa-play"></i>
                    <span>Play</span>
                </button>
            </div>
        `;
        gamesGrid.appendChild(card);
    });
}

async function startGame(gameId) {
    if (gameActive) {
        showNotification("Wait for current game to finish", "warning");
        return;
    }
    
    const game = CONFIG.GAMES.find(g => g.id === gameId);
    if (!game) return;
    
    // Проверяем баланс
    const currentBalance = currentPlayer.balances[selectedCurrency] || 0;
    if (currentBalance < CONFIG.MIN_BET) {
        showNotification(`Minimum ${CONFIG.MIN_BET} ${selectedCurrency} required`, "error");
        return;
    }
    
    // Показываем выбор ставки
    const betAmount = await showBetModal(game);
    if (!betAmount) return;
    
    // Проверяем баланс
    if (betAmount > currentBalance) {
        showNotification("Insufficient funds", "error");
        return;
    }
    
    // Запускаем игру
    try {
        gameActive = true;
        const result = await playGame(gameId, betAmount);
        
        // Показываем результат
        showGameResult(result);
        
    } catch (error) {
        console.error("Game error:", error);
        showNotification("Game error", "error");
    } finally {
        gameActive = false;
    }
}

function showBetModal(game) {
    return new Promise((resolve) => {
        const currentBalance = currentPlayer.balances[selectedCurrency] || 0;
        const minBet = CONFIG.MIN_BET;
        const maxBet = Math.min(CONFIG.MAX_BET, currentBalance);
        
        const modalHTML = `
            <div class="modal-overlay" onclick="closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3><i class="${game.icon}" style="color: ${game.color}"></i> ${game.name}</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="bet-amount-section">
                            <h4>Your bet (${selectedCurrency})</h4>
                            <div class="amount-input">
                                <input type="number" id="betAmountInput" 
                                       value="${minBet}" 
                                       min="${minBet}" 
                                       max="${maxBet}"
                                       step="10">
                                <span class="currency">${selectedCurrency}</span>
                            </div>
                            
                            <div class="quick-bets">
                                <button class="quick-bet-btn" onclick="setQuickBet(${minBet})">${minBet}</button>
                                <button class="quick-bet-btn" onclick="setQuickBet(${minBet * 5})">${minBet * 5}</button>
                                <button class="quick-bet-btn" onclick="setQuickBet(${minBet * 10})">${minBet * 10}</button>
                                <button class="quick-bet-btn" onclick="setQuickBet(${maxBet})">MAX</button>
                            </div>
                            
                            <div class="balance-info">
                                <span>Available:</span>
                                <span>${currentBalance} ${selectedCurrency}</span>
                            </div>
                        </div>
                        
                        <div class="game-info">
                            <div class="info-row">
                                <span>Min win:</span>
                                <span>${game.minMultiplier}x</span>
                            </div>
                            <div class="info-row">
                                <span>Max win:</span>
                                <span>${game.maxMultiplier}x</span>
                            </div>
                            <div class="info-row">
                                <span>RTP:</span>
                                <span>${game.baseRTP}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-cancel" onclick="closeModal()">Cancel</button>
                        <button class="btn btn-confirm" onclick="confirmBet()">Play ${game.minMultiplier}x - ${game.maxMultiplier}x</button>
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        window.setQuickBet = function(amount) {
            const input = document.getElementById('betAmountInput');
            if (input) {
                input.value = Math.min(maxBet, Math.max(minBet, amount));
            }
        };
        
        window.confirmBet = function() {
            const input = document.getElementById('betAmountInput');
            const amount = parseInt(input.value) || minBet;
            closeModal();
            resolve(amount);
        };
        
        window.closeModal = function() {
            modal.remove();
            resolve(null);
        };
        
        // Фокус на инпуте
        setTimeout(() => {
            const input = document.getElementById('betAmountInput');
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
    });
}

async function playGame(gameId, betAmount) {
    const game = CONFIG.GAMES.find(g => g.id === gameId);
    if (!game) return null;
    
    // Шанс выигрыша (очень маленький как просили)
    let winChance = CONFIG.LUCK_SETTINGS.baseWinChance;
    winChance *= currentPlayer.luck_multiplier; // Учитываем удачу игрока
    
    // Дополнительно снижаем шанс
    winChance = Math.max(0.4, Math.min(0.5, winChance * 0.9));
    
    // Генерация результата
    const isWin = Math.random() < winChance;
    let multiplier = 0;
    let isJackpot = false;
    
    if (isWin) {
        // Проверяем джекпот (0.1% шанс)
        isJackpot = Math.random() < CONFIG.LUCK_SETTINGS.jackpotChance;
        
        if (isJackpot) {
            // Джекпот 100x
            multiplier = 100;
        } else {
            // Обычный выигрыш (минимальный 2x как просили)
            const minMultiplier = Math.max(2, game.minMultiplier);
            const maxMultiplier = game.maxMultiplier;
            
            // Генерируем множитель (ближе к минимальному)
            const randomFactor = Math.pow(Math.random(), 2); // Квадрат для смещения к меньшим значениям
            multiplier = minMultiplier + (maxMultiplier - minMultiplier) * randomFactor * 0.3; // Только 30% от диапазона
            multiplier = parseFloat(multiplier.toFixed(2));
            
            // Гарантируем минимум 2x
            multiplier = Math.max(CONFIG.LUCK_SETTINGS.minMultiplier, multiplier);
        }
    }
    
    // Расчет выигрыша
    let winAmount = 0;
    
    if (isWin) {
        const grossWin = betAmount * multiplier;
        const houseFee = grossWin * CONFIG.HOUSE_EDGE;
        winAmount = parseFloat((grossWin - houseFee).toFixed(8));
        
        // Обновляем баланс
        currentPlayer.balances[selectedCurrency] -= betAmount;
        currentPlayer.balances[selectedCurrency] += winAmount;
        currentPlayer.total_won += winAmount;
    } else {
        // Проигрыш
        currentPlayer.balances[selectedCurrency] -= betAmount;
        currentPlayer.total_lost += betAmount;
    }
    
    // Обновляем статистику
    currentPlayer.games_played++;
    
    // Сохраняем транзакцию
    const transaction = {
        id: `game_${Date.now()}`,
        type: 'game',
        game: gameId,
        bet: betAmount,
        win: winAmount,
        multiplier: multiplier,
        currency: selectedCurrency,
        timestamp: new Date().toISOString(),
        result: isWin ? 'win' : 'loss',
        jackpot: isJackpot
    };
    
    currentPlayer.transactions.unshift(transaction);
    if (currentPlayer.transactions.length > 100) {
        currentPlayer.transactions = currentPlayer.transactions.slice(0, 100);
    }
    
    // Сохраняем данные
    savePlayerData();
    updateBalance();
    updateStats();
    
    return {
        game: gameId,
        bet: betAmount,
        win: winAmount,
        multiplier: multiplier,
        isWin: isWin,
        isJackpot: isJackpot,
        newBalance: currentPlayer.balances[selectedCurrency]
    };
}

function showGameResult(result) {
    if (result.isJackpot) {
        showNotification(`🎉 JACKPOT! ${result.multiplier}x WIN! +${result.win} ${selectedCurrency}`, 'success');
        
        // Анимация джекпота
        const jackpotEffect = document.createElement('div');
        jackpotEffect.className = 'jackpot-effect';
        jackpotEffect.innerHTML = `
            <div class="jackpot-content">
                <i class="fas fa-trophy"></i>
                <h2>JACKPOT 100x!</h2>
                <p>+${result.win} ${selectedCurrency}</p>
            </div>
        `;
        document.body.appendChild(jackpotEffect);
        
        setTimeout(() => {
            jackpotEffect.remove();
        }, 5000);
        
    } else if (result.isWin) {
        showNotification(`🎊 Win ${result.multiplier}x! +${result.win} ${selectedCurrency}`, 'success');
    } else {
        const messages = [
            "Better luck next time!",
            "Almost! Try again",
            "Luck wasn't on your side"
        ];
        showNotification(messages[Math.floor(Math.random() * messages.length)], 'warning');
    }
}

// ==================== 5. ПЛАТЕЖНАЯ СИСТЕМА ====================
function initPayments() {
    // Привязываем кнопки
    document.querySelector('.btn-deposit').onclick = openDeposit;
    document.querySelector('.btn-withdraw').onclick = openWithdraw;
}

function openDeposit() {
    showDepositModal();
}

function openWithdraw() {
    const balance = currentPlayer.balances[selectedCurrency] || 0;
    if (balance < CONFIG.PAYMENTS.MIN_WITHDRAWAL) {
        showNotification(`Minimum ${CONFIG.PAYMENTS.MIN_WITHDRAWAL} ${selectedCurrency} for withdrawal`, 'error');
        return;
    }
    
    showWithdrawModal();
}

function showDepositModal() {
    const modalHTML = `
        <div class="modal-overlay" onclick="closePaymentModal()">
            <div class="modal-content payment-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3><i class="fas fa-wallet"></i> Deposit</h3>
                    <button class="modal-close" onclick="closePaymentModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="currency-selection">
                        <h4>Select cryptocurrency:</h4>
                        <div class="currency-grid">
                            ${Object.entries(CONFIG.PAYMENTS.CRYPTOCURRENCIES).map(([key, crypto]) => `
                                <div class="currency-card ${selectedCurrency === key ? 'selected' : ''}" 
                                     onclick="selectPaymentCurrency('${key}')">
                                    <div class="currency-icon" style="background: ${crypto.color}">
                                        <i class="${crypto.icon}"></i>
                                    </div>
                                    <div class="currency-name">${crypto.name}</div>
                                    <div class="currency-balance">
                                        ${(currentPlayer.balances[key] || 0).toFixed(crypto.decimals)}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="amount-section">
                        <h4>Deposit amount:</h4>
                        <div class="amount-input">
                            <input type="number" id="depositAmount" 
                                   value="${CONFIG.PAYMENTS.MIN_DEPOSIT}" 
                                   min="${CONFIG.PAYMENTS.MIN_DEPOSIT}" 
                                   max="${CONFIG.PAYMENTS.MAX_DEPOSIT}"
                                   step="10">
                            <span class="currency">${selectedCurrency}</span>
                        </div>
                        
                        <div class="quick-amounts">
                            <button class="quick-amount" onclick="setDepositAmount(${CONFIG.PAYMENTS.MIN_DEPOSIT})">
                                ${CONFIG.PAYMENTS.MIN_DEPOSIT}
                            </button>
                            <button class="quick-amount" onclick="setDepositAmount(${CONFIG.PAYMENTS.MIN_DEPOSIT * 10})">
                                ${CONFIG.PAYMENTS.MIN_DEPOSIT * 10}
                            </button>
                            <button class="quick-amount" onclick="setDepositAmount(${CONFIG.PAYMENTS.MIN_DEPOSIT * 100})">
                                ${CONFIG.PAYMENTS.MIN_DEPOSIT * 100}
                            </button>
                            <button class="quick-amount" onclick="setDepositAmount(${CONFIG.PAYMENTS.MAX_DEPOSIT})">
                                MAX
                            </button>
                        </div>
                    </div>
                    
                    <div class="method-selection">
                        <h4>Payment method:</h4>
                        <div class="method-grid">
                            ${Object.entries(CONFIG.PAYMENTS.METHODS).map(([key, method]) => `
                                <div class="method-card ${selectedPaymentMethod === key ? 'selected' : ''}" 
                                     onclick="selectPaymentMethod('${key}')">
                                    <div class="method-icon" style="color: ${method.color}">
                                        <i class="${method.icon}"></i>
                                    </div>
                                    <div class="method-name">${method.name}</div>
                                    <div class="method-fee">Fee: ${(method.fee * 100)}%</div>
                                    <div class="method-time">${method.minTime}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="payment-summary">
                        <div class="summary-row">
                            <span>Amount:</span>
                            <span id="summaryAmount">${CONFIG.PAYMENTS.MIN_DEPOSIT} ${selectedCurrency}</span>
                        </div>
                        <div class="summary-row">
                            <span>Fee:</span>
                            <span id="summaryFee">0 ${selectedCurrency}</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total:</span>
                            <span id="summaryTotal">${CONFIG.PAYMENTS.MIN_DEPOSIT} ${selectedCurrency}</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-cancel" onclick="closePaymentModal()">Cancel</button>
                    <button class="btn btn-confirm" onclick="processDeposit()">
                        <i class="fas fa-arrow-right"></i>
                        Proceed to payment
                    </button>
                </div>
                
                <div class="payment-note">
                    <i class="fas fa-info-circle"></i>
                    Funds arrive in ${CONFIG.PAYMENTS.METHODS[selectedPaymentMethod].minTime}-${CONFIG.PAYMENTS.METHODS[selectedPaymentMethod].maxTime}
                </div>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
    
    // Обновляем сводку при изменении
    const amountInput = document.getElementById('depositAmount');
    if (amountInput) {
        amountInput.addEventListener('input', updateDepositSummary);
    }
    
    updateDepositSummary();
}

function showWithdrawModal() {
    const balance = currentPlayer.balances[selectedCurrency] || 0;
    const crypto = CONFIG.PAYMENTS.CRYPTOCURRENCIES[selectedCurrency];
    const minAmount = Math.max(CONFIG.PAYMENTS.MIN_WITHDRAWAL, crypto.minAmount);
    
    const modalHTML = `
        <div class="modal-overlay" onclick="closePaymentModal()">
            <div class="modal-content payment-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3><i class="fas fa-money-bill-wave"></i> Withdraw</h3>
                    <button class="modal-close" onclick="closePaymentModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="balance-info">
                        <span>Available:</span>
                        <span class="available-balance">${balance.toFixed(crypto.decimals)} ${selectedCurrency}</span>
                    </div>
                    
                    <div class="amount-section">
                        <h4>Withdraw amount:</h4>
                        <div class="amount-input">
                            <input type="number" id="withdrawAmount" 
                                   value="${minAmount}" 
                                   min="${minAmount}" 
                                   max="${Math.min(CONFIG.PAYMENTS.MAX_WITHDRAWAL, balance)}"
                                   step="10">
                            <span class="currency">${selectedCurrency}</span>
                        </div>
                        
                        <div class="quick-percentages">
                            <button class="quick-percent" onclick="setWithdrawPercent(0.25)">25%</button>
                            <button class="quick-percent" onclick="setWithdrawPercent(0.5)">50%</button>
                            <button class="quick-percent" onclick="setWithdrawPercent(0.75)">75%</button>
                            <button class="quick-percent" onclick="setWithdrawPercent(1)">100%</button>
                        </div>
                    </div>
                    
                    <div class="wallet-section">
                        <h4>Wallet address:</h4>
                        <div class="wallet-input">
                            <input type="text" id="walletAddress" 
                                   placeholder="Enter your ${selectedCurrency} wallet address">
                        </div>
                        <div class="wallet-note">
                            <i class="fas fa-exclamation-triangle"></i>
                            Double-check the address. Transactions cannot be reversed.
                        </div>
                    </div>
                    
                    <div class="payment-summary">
                        <div class="summary-row">
                            <span>Amount:</span>
                            <span id="withdrawSummaryAmount">${minAmount} ${selectedCurrency}</span>
                        </div>
                        <div class="summary-row">
                            <span>Fee (${CONFIG.PAYMENTS.WITHDRAWAL_FEE * 100}%):</span>
                            <span id="withdrawFee">${(minAmount * CONFIG.PAYMENTS.WITHDRAWAL_FEE).toFixed(crypto.decimals)} ${selectedCurrency}</span>
                        </div>
                        <div class="summary-row total">
                            <span>You receive:</span>
                            <span id="withdrawReceive">${(minAmount * (1 - CONFIG.PAYMENTS.WITHDRAWAL_FEE)).toFixed(crypto.decimals)} ${selectedCurrency}</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-cancel" onclick="closePaymentModal()">Cancel</button>
                    <button class="btn btn-confirm" onclick="processWithdrawal()">
                        <i class="fas fa-paper-plane"></i>
                        Request withdrawal
                    </button>
                </div>
                
                <div class="payment-note">
                    <i class="fas fa-clock"></i>
                    Processing time: 1-24 hours
                </div>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
    
    // Обновляем сводку
    const amountInput = document.getElementById('withdrawAmount');
    if (amountInput) {
        amountInput.addEventListener('input', updateWithdrawSummary);
    }
    
    updateWithdrawSummary();
}

function updateDepositSummary() {
    const amountInput = document.getElementById('depositAmount');
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.value) || CONFIG.PAYMENTS.MIN_DEPOSIT;
    const method = CONFIG.PAYMENTS.METHODS[selectedPaymentMethod];
    const fee = amount * method.fee;
    const total = amount + fee;
    
    document.getElementById('summaryAmount').textContent = `${amount} ${selectedCurrency}`;
    document.getElementById('summaryFee').textContent = `${fee.toFixed(6)} ${selectedCurrency}`;
    document.getElementById('summaryTotal').textContent = `${total.toFixed(6)} ${selectedCurrency}`;
}

function updateWithdrawSummary() {
    const amountInput = document.getElementById('withdrawAmount');
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.value) || CONFIG.PAYMENTS.MIN_WITHDRAWAL;
    const fee = amount * CONFIG.PAYMENTS.WITHDRAWAL_FEE;
    const receive = amount - fee;
    const crypto = CONFIG.PAYMENTS.CRYPTOCURRENCIES[selectedCurrency];
    
    document.getElementById('withdrawSummaryAmount').textContent = `${amount.toFixed(crypto.decimals)} ${selectedCurrency}`;
    document.getElementById('withdrawFee').textContent = `${fee.toFixed(crypto.decimals)} ${selectedCurrency}`;
    document.getElementById('withdrawReceive').textContent = `${receive.toFixed(crypto.decimals)} ${selectedCurrency}`;
}

function selectPaymentCurrency(currency) {
    selectedCurrency = currency;
    document.querySelectorAll('.currency-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`.currency-card[onclick*="${currency}"]`).classList.add('selected');
    updateDepositSummary();
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.method-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`.method-card[onclick*="${method}"]`).classList.add('selected');
    updateDepositSummary();
}

function setDepositAmount(amount) {
    const input = document.getElementById('depositAmount');
    if (input) {
        input.value = amount;
        updateDepositSummary();
    }
}

function setWithdrawPercent(percent) {
    const balance = currentPlayer.balances[selectedCurrency] || 0;
    const maxAmount = Math.min(CONFIG.PAYMENTS.MAX_WITHDRAWAL, balance);
    const amount = Math.floor(maxAmount * percent);
    const minAmount = Math.max(CONFIG.PAYMENTS.MIN_WITHDRAWAL, 
                             CONFIG.PAYMENTS.CRYPTOCURRENCIES[selectedCurrency].minAmount);
    
    const input = document.getElementById('withdrawAmount');
    if (input) {
        input.value = Math.max(minAmount, amount);
        updateWithdrawSummary();
    }
}

function processDeposit() {
    const amountInput = document.getElementById('depositAmount');
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.value) || CONFIG.PAYMENTS.MIN_DEPOSIT;
    
    if (amount < CONFIG.PAYMENTS.MIN_DEPOSIT) {
        showNotification(`Minimum deposit: ${CONFIG.PAYMENTS.MIN_DEPOSIT} ${selectedCurrency}`, 'error');
        return;
    }
    
    if (amount > CONFIG.PAYMENTS.MAX_DEPOSIT) {
        showNotification(`Maximum deposit: ${CONFIG.PAYMENTS.MAX_DEPOSIT} ${selectedCurrency}`, 'error');
        return;
    }
    
    // В демо режиме сразу зачисляем
    if (CONFIG.DEMO_MODE) {
        currentPlayer.balances[selectedCurrency] += amount;
        currentPlayer.total_deposited += amount;
        
        const transaction = {
            id: `deposit_${Date.now()}`,
            type: 'deposit',
            amount: amount,
            currency: selectedCurrency,
            method: selectedPaymentMethod,
            status: 'completed',
            timestamp: new Date().toISOString()
        };
        
        currentPlayer.transactions.unshift(transaction);
        savePlayerData();
        updateBalance();
        
        showNotification(`✅ Deposit ${amount} ${selectedCurrency} completed!`, 'success');
        closePaymentModal();
    } else {
        // В реальном режиме показываем реквизиты
        showPaymentDetails(amount, 'deposit');
    }
}

function processWithdrawal() {
    const amountInput = document.getElementById('withdrawAmount');
    const walletInput = document.getElementById('walletAddress');
    
    if (!amountInput || !walletInput) return;
    
    const amount = parseFloat(amountInput.value) || CONFIG.PAYMENTS.MIN_WITHDRAWAL;
    const wallet = walletInput.value.trim();
    
    if (!wallet) {
        showNotification('Please enter wallet address', 'error');
        return;
    }
    
    if (amount > currentPlayer.balances[selectedCurrency]) {
        showNotification('Insufficient funds', 'error');
        return;
    }
    
    const minAmount = Math.max(CONFIG.PAYMENTS.MIN_WITHDRAWAL, 
                             CONFIG.PAYMENTS.CRYPTOCURRENCIES[selectedCurrency].minAmount);
    
    if (amount < minAmount) {
        showNotification(`Minimum withdrawal: ${minAmount} ${selectedCurrency}`, 'error');
        return;
    }
    
    // В демо режиме сразу обрабатываем
    if (CONFIG.DEMO_MODE) {
        const fee = amount * CONFIG.PAYMENTS.WITHDRAWAL_FEE;
        const receive = amount - fee;
        
        currentPlayer.balances[selectedCurrency] -= amount;
        currentPlayer.total_withdrawn += amount;
        
        const transaction = {
            id: `withdraw_${Date.now()}`,
            type: 'withdrawal',
            amount: amount,
            receive: receive,
            fee: fee,
            currency: selectedCurrency,
            wallet: wallet,
            status: 'completed',
            timestamp: new Date().toISOString()
        };
        
        currentPlayer.transactions.unshift(transaction);
        savePlayerData();
        updateBalance();
        
        showNotification(`✅ Withdrawal ${receive.toFixed(6)} ${selectedCurrency} sent!`, 'success');
        closePaymentModal();
    } else {
        // В реальном режиме показываем подтверждение
        showPaymentDetails(amount, 'withdraw', wallet);
    }
}

function showPaymentDetails(amount, type, wallet = '') {
    const method = CONFIG.PAYMENTS.METHODS[selectedPaymentMethod];
    const crypto = CONFIG.PAYMENTS.CRYPTOCURRENCIES[selectedCurrency];
    
    let title = '';
    let content = '';
    
    if (type === 'deposit') {
        title = 'Payment Details';
        content = `
            <div class="payment-details">
                <div class="detail-item">
                    <span>Amount:</span>
                    <span>${amount} ${selectedCurrency}</span>
                </div>
                <div class="detail-item">
                    <span>Method:</span>
                    <span>${method.name}</span>
                </div>
                <div class="detail-item">
                    <span>Fee:</span>
                    <span>${(amount * method.fee).toFixed(6)} ${selectedCurrency}</span>
                </div>
                
                ${selectedPaymentMethod === 'CRYPTO_BOT' ? `
                    <div class="crypto-bot-instructions">
                        <h4><i class="fab fa-telegram"></i> Crypto Bot Instructions:</h4>
                        <ol>
                            <li>Open @CryptoBot in Telegram</li>
                            <li>Send command /start</li>
                            <li>Choose "Deposit"</li>
                            <li>Select ${selectedCurrency}</li>
                            <li>Send ${amount} ${selectedCurrency}</li>
                            <li>Funds will be added automatically</li>
                        </ol>
                    </div>
                ` : ''}
                
                ${selectedPaymentMethod === 'TON_MAKER' ? `
                    <div class="ton-maker-instructions">
                        <h4><i class="fas fa-bolt"></i> TON Maker Instructions:</h4>
                        <div class="wallet-address">
                            <span>Send to:</span>
                            <code>EQABD1234567890abcdefghijklmnopqrstuvwxyzABCDEF</code>
                            <button class="btn-copy" onclick="copyToClipboard('EQABD1234567890abcdefghijklmnopqrstuvwxyzABCDEF')">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <p>Send ${amount} ${selectedCurrency} to this address</p>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        title = 'Withdrawal Request';
        const fee = amount * CONFIG.PAYMENTS.WITHDRAWAL_FEE;
        const receive = amount - fee;
        
        content = `
            <div class="payment-details">
                <div class="detail-item">
                    <span>Amount:</span>
                    <span>${amount} ${selectedCurrency}</span>
                </div>
                <div class="detail-item">
                    <span>Fee:</span>
                    <span>${fee.toFixed(6)} ${selectedCurrency}</span>
                </div>
                <div class="detail-item">
                    <span>You receive:</span>
                    <span>${receive.toFixed(6)} ${selectedCurrency}</span>
                </div>
                <div class="detail-item">
                    <span>Wallet:</span>
                    <code class="wallet-code">${wallet}</code>
                </div>
                
                <div class="withdrawal-notice">
                    <i class="fas fa-info-circle"></i>
                    Withdrawal will be processed within 24 hours. Check transaction status in history.
                </div>
            </div>
        `;
    }
    
    const modalHTML = `
        <div class="modal-overlay" onclick="closePaymentModal()">
            <div class="modal-content payment-details-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3><i class="fas fa-info-circle"></i> ${title}</h3>
                    <button class="modal-close" onclick="closePaymentModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    ${content}
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-confirm" onclick="closePaymentModal()">
                        OK
                    </button>
                </div>
            </div>
        </div>
    `;
    
    closePaymentModal();
    
    const modal = document.createElement('div');
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
}

function closePaymentModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// ==================== 6. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ====================
function startLiveUpdates() {
    // Обновляем онлайн счетчик каждые 30 секунд
    setInterval(() => {
        const onlineCount = document.getElementById('onlineCount');
        if (onlineCount) {
            const current = parseInt(onlineCount.textContent) || 15842;
            const change = Math.floor(Math.random() * 21) - 10;
            const newValue = Math.max(15000, current + change);
            onlineCount.textContent = newValue.toLocaleString();
        }
    }, 30000);
}

function showNotification(message, type = 'info') {
    const container = document.querySelector('.notifications-container') || 
                     document.createElement('div');
    
    if (!document.querySelector('.notifications-container')) {
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                  type === 'error' ? 'exclamation-circle' : 
                                  type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
        <div class="notification-message">${message}</div>
    `;
    
    container.appendChild(notification);
    
    // Автоудаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard', 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showNotification('Copy failed', 'error');
    });
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
window.startGame = startGame;
window.openDeposit = openDeposit;
window.openWithdraw = openWithdraw;
window.closePaymentModal = closePaymentModal;
window.selectPaymentCurrency = selectPaymentCurrency;
window.selectPaymentMethod = selectPaymentMethod;
window.setDepositAmount = setDepositAmount;
window.setWithdrawPercent = setWithdrawPercent;
window.processDeposit = processDeposit;
window.processWithdrawal = processWithdrawal;
window.copyToClipboard = copyToClipboard;

// Вкладки
window.switchTab = function(tab) {
    showNotification(`Switched to ${tab}`, 'info');
};

// Настройки
window.openSettings = function() {
    if (currentPlayer.is_admin) {
        showNotification('Admin panel: Triple click on logo', 'info');
    } else {
        showNotification('Settings coming soon', 'info');
    }
};

// Клик по лого для админки
window.handleLogoClick = function() {
    if (currentPlayer.is_admin) {
        showNotification('Admin: Change luck in game engine settings', 'info');
    }
};
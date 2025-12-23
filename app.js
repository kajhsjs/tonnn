// ==================== КОНФИГУРАЦИЯ ====================
const CONFIG = {
    // Режим: true - демо (все работает), false - для реального использования
    DEMO_MODE: true,
    
    // Ваш Telegram ID для админки (замените на свой)
    // Узнать ID: @userinfobot в Telegram
    ADMIN_TELEGRAM_IDS: [123456789], 
    
    // Игровые настройки
    INITIAL_BALANCE: 1000,        // Стартовый баланс
    MIN_BET: 10,                  // Минимальная ставка
    MAX_BET: 1000,                // Максимальная ставка
    HOUSE_EDGE: 0.03,             // Комиссия казино 3%
    
    // Платежные настройки
    PAYMENTS: {
        MIN_DEPOSIT: 10,
        MAX_DEPOSIT: 10000,
        MIN_WITHDRAWAL: 10,
        MAX_WITHDRAWAL: 5000,
        WITHDRAWAL_FEE: 0.03      // 3%
    },
    
    // Админ настройки
    ADMIN_CLICK_COUNT: 3,         // Кликов для открытия админки
    ADMIN_CLICK_TIMEOUT: 1000,    // 1 секунда между кликами
    
    // Игры
    GAMES: {
        dice: {
            name: "Кости",
            icon: "fas fa-dice",
            color: "#FF9500",
            description: "Угадай результат броска",
            minWin: 1.5,
            maxWin: 10,
            baseWinChance: 0.49,
            rtp: 97
        },
        slots: {
            name: "Слоты",
            icon: "fas fa-sliders-h",
            color: "#34C759",
            description: "Крути барабаны и выигрывай",
            minWin: 1,
            maxWin: 100,
            baseWinChance: 0.45,
            rtp: 96
        },
        plinko: {
            name: "Плинко",
            icon: "fas fa-bullseye",
            color: "#007AFF",
            description: "Шар катится по пирамиде",
            minWin: 1.2,
            maxWin: 50,
            baseWinChance: 0.48,
            rtp: 95
        },
        mines: {
            name: "Мины",
            icon: "fas fa-bomb",
            color: "#FF3B30",
            description: "Найди алмазы, избегая мин",
            minWin: 1.1,
            maxWin: 30,
            baseWinChance: 0.47,
            rtp: 98
        }
    }
};

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentPlayer = null;
let tg = null;
let gameActive = false;
let adminClickCount = 0;
let lastAdminClickTime = 0;
let gameHistory = [];
let paymentSystem = null;

// ==================== ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log("🚀 Инициализация TON Play...");
    
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
        
        // 6. Загрузка истории
        loadHistory();
        
        console.log("✅ Система готова!");
        
    } catch (error) {
        console.error("❌ Ошибка инициализации:", error);
        showNotification("Ошибка загрузки приложения", "error");
    }
});

// ==================== 1. TELEGRAM ====================
async function initTelegram() {
    if (typeof Telegram !== 'undefined') {
        tg = Telegram.WebApp;
        tg.ready();
        tg.expand();
        console.log("Telegram Web App подключен");
        return true;
    }
    console.log("Режим демо (Telegram не найден)");
    return false;
}

// ==================== 2. ИГРОК ====================
async function initPlayer() {
    let playerData = null;
    
    if (tg && tg.initDataUnsafe?.user) {
        // Регистрация через Telegram
        const user = tg.initDataUnsafe.user;
        const playerId = `tg_${user.id}`;
        const saved = localStorage.getItem(`player_${playerId}`);
        
        if (saved) {
            playerData = JSON.parse(saved);
            playerData.last_login = new Date().toISOString();
            console.log("Игрок загружен");
        } else {
            playerData = {
                id: playerId,
                telegram_id: user.id,
                username: user.username || `user_${user.id}`,
                first_name: user.first_name,
                balance: CONFIG.INITIAL_BALANCE,
                games_played: 0,
                total_won: 0,
                total_lost: 0,
                registration_date: new Date().toISOString(),
                last_login: new Date().toISOString(),
                is_admin: CONFIG.ADMIN_TELEGRAM_IDS.includes(user.id),
                luck_multiplier: 1.0
            };
            console.log("Новый игрок создан");
            showNotification(`Добро пожаловать, ${user.first_name}!`, "success");
        }
    } else {
        // Демо режим
        playerData = {
            id: 'demo_guest',
            username: 'Гость',
            first_name: 'Гость',
            balance: 5000,
            games_played: 0,
            total_won: 0,
            total_lost: 0,
            registration_date: new Date().toISOString(),
            last_login: new Date().toISOString(),
            is_admin: false,
            luck_multiplier: 1.0
        };
        showNotification("Демо режим. Для полного функционала откройте через Telegram", "warning");
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
    
    // Обновляем данные
    document.getElementById('username').textContent = currentPlayer.first_name;
    document.getElementById('userId').textContent = `ID: ${currentPlayer.id.substring(3, 8)}`;
    updateBalance();
    
    // Приветствие
    const messages = [
        `С возвращением, ${currentPlayer.first_name}!`,
        `Удачи в играх, ${currentPlayer.first_name}!`,
        `${currentPlayer.first_name}, готов выиграть?`
    ];
    document.getElementById('welcomeMessage').textContent = 
        messages[Math.floor(Math.random() * messages.length)];
    
    // Аватар
    const avatar = document.getElementById('userAvatar');
    if (currentPlayer.telegram_id) {
        avatar.className = 'fas fa-user-check';
        avatar.style.color = '#34C759';
    }
    
    // Клик по лого для админки
    document.querySelector('.logo').addEventListener('click', handleAdminClick);
}

function updateBalance() {
    if (!currentPlayer) return;
    const balanceEl = document.getElementById('currentBalance');
    const balance = currentPlayer.balance || 0;
    balanceEl.textContent = balance.toLocaleString('ru-RU');
    
    // Также обновляем в userBalance если есть
    const userBalanceEl = document.getElementById('userBalance');
    if (userBalanceEl) userBalanceEl.textContent = balance.toLocaleString('ru-RU');
}

// ==================== 4. ИГРЫ ====================
function initGames() {
    const gamesGrid = document.getElementById('gamesGrid');
    gamesGrid.innerHTML = '';
    
    Object.entries(CONFIG.GAMES).forEach(([gameId, game]) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="game-header">
                <div class="game-icon" style="background: ${game.color}">
                    <i class="${game.icon}"></i>
                </div>
                <div class="game-rtp">
                    <span class="rtp-badge">RTP ${game.rtp}%</span>
                </div>
            </div>
            <div class="game-title">${game.name}</div>
            <div class="game-description">${game.description}</div>
            <div class="game-stats">
                <div class="stat">
                    <i class="fas fa-users"></i>
                    <span>1.2K онлайн</span>
                </div>
                <div class="stat">
                    <i class="fas fa-trophy"></i>
                    <span>Джекпот 5K TON</span>
                </div>
            </div>
            <div class="game-actions">
                <button class="btn btn-play" onclick="startGame('${gameId}')">
                    <i class="fas fa-play"></i>
                    <span>Играть</span>
                </button>
                <button class="btn btn-info" onclick="showGameInfo('${gameId}')">
                    <i class="fas fa-info"></i>
                </button>
            </div>
        `;
        gamesGrid.appendChild(card);
    });
}

// Запуск игры
async function startGame(gameId) {
    if (gameActive) {
        showNotification("Дождитесь окончания игры", "warning");
        return;
    }
    
    if (!currentPlayer || currentPlayer.balance < CONFIG.MIN_BET) {
        showNotification(`Минимум ${CONFIG.MIN_BET} TON для игры`, "error");
        return;
    }
    
    try {
        gameActive = true;
        
        // Показываем выбор ставки
        const betAmount = await showBetModal(gameId);
        if (!betAmount) {
            gameActive = false;
            return;
        }
        
        // Проверяем баланс
        if (betAmount > currentPlayer.balance) {
            showNotification("Недостаточно средств", "error");
            gameActive = false;
            return;
        }
        
        // Играем
        const result = await playGame(gameId, betAmount);
        
        // Показываем результат
        showGameResult(result);
        
    } catch (error) {
        console.error("Ошибка игры:", error);
        showNotification("Ошибка игры", "error");
    } finally {
        gameActive = false;
    }
}

// Модальное окно ставки
function showBetModal(gameId) {
    return new Promise((resolve) => {
        const game = CONFIG.GAMES[gameId];
        const modalHTML = `
            <div class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="${game.icon}" style="color: ${game.color}"></i> ${game.name}</h3>
                        <button class="close-modal" onclick="closeModal(null)">&times;</button>
                    </div>
                    <div class="bet-section">
                        <h4>Ваша ставка (TON)</h4>
                        <div class="bet-buttons">
                            <button class="bet-btn" onclick="setBet(10)">10</button>
                            <button class="bet-btn" onclick="setBet(50)">50</button>
                            <button class="bet-btn" onclick="setBet(100)">100</button>
                            <button class="bet-btn" onclick="setBet(500)">500</button>
                        </div>
                        <div class="bet-input">
                            <input type="number" id="betInput" value="50" 
                                   min="${CONFIG.MIN_BET}" max="${CONFIG.MAX_BET}">
                            <span>TON</span>
                        </div>
                        <div class="balance-info">
                            <span>Баланс:</span>
                            <span>${currentPlayer.balance} TON</span>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-cancel" onclick="closeModal(null)">Отмена</button>
                        <button class="btn btn-confirm" onclick="confirmBet()">Играть</button>
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        window.setBet = function(amount) {
            document.getElementById('betInput').value = amount;
        };
        
        window.confirmBet = function() {
            const amount = parseInt(document.getElementById('betInput').value) || 50;
            closeModal(amount);
        };
        
        window.closeModal = function(result) {
            modal.remove();
            resolve(result);
        };
        
        // Фокус на инпуте
        setTimeout(() => {
            const input = document.getElementById('betInput');
            if (input) input.focus();
        }, 100);
    });
}

// Игровой движок
async function playGame(gameId, betAmount) {
    const game = CONFIG.GAMES[gameId];
    
    // Шанс выигрыша с учетом удачи
    const baseChance = game.baseWinChance;
    const luck = currentPlayer.luck_multiplier || 1.0;
    const winChance = Math.min(0.95, Math.max(0.05, baseChance * luck));
    
    // Результат
    const isWin = Math.random() < winChance;
    let winAmount = 0;
    let multiplier = 0;
    
    if (isWin) {
        // Выигрыш
        const min = game.minWin;
        const max = game.maxWin;
        multiplier = min + Math.random() * (max - min);
        multiplier = parseFloat(multiplier.toFixed(2));
        
        const grossWin = betAmount * multiplier;
        const fee = grossWin * CONFIG.HOUSE_EDGE;
        winAmount = Math.floor(grossWin - fee);
        
        // Обновляем баланс
        currentPlayer.balance = currentPlayer.balance - betAmount + winAmount;
        currentPlayer.total_won += winAmount;
        currentPlayer.games_won++;
    } else {
        // Проигрыш
        currentPlayer.balance -= betAmount;
        currentPlayer.total_lost += betAmount;
        currentPlayer.games_lost++;
    }
    
    currentPlayer.games_played++;
    
    // Сохраняем историю
    const gameRecord = {
        id: `game_${Date.now()}`,
        gameId: gameId,
        gameName: game.name,
        betAmount: betAmount,
        result: isWin ? 'win' : 'loss',
        winAmount: winAmount,
        multiplier: multiplier,
        profit: isWin ? winAmount - betAmount : -betAmount,
        timestamp: new Date().toISOString(),
        balance_after: currentPlayer.balance
    };
    
    gameHistory.push(gameRecord);
    if (gameHistory.length > 100) gameHistory = gameHistory.slice(-100);
    localStorage.setItem(`history_${currentPlayer.id}`, JSON.stringify(gameHistory));
    
    // Сохраняем игрока
    savePlayerData();
    updateBalance();
    updateHistoryDisplay();
    
    return gameRecord;
}

// Показать результат
function showGameResult(result) {
    const game = CONFIG.GAMES[result.gameId];
    
    if (result.result === 'win') {
        const messages = [
            `🎉 Выигрыш ${result.winAmount} TON! ×${result.multiplier}`,
            `💰 +${result.winAmount} TON! Поздравляем!`,
            `🔥 Крупно! ${result.winAmount} TON ваши!`
        ];
        showNotification(messages[Math.floor(Math.random() * messages.length)], "success");
        
        // Вибрация в Telegram
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('heavy');
        }
    } else {
        const messages = [
            "😔 Не повезло...",
            "💫 Почти получилось!",
            "🎲 Попробуйте еще раз"
        ];
        showNotification(messages[Math.floor(Math.random() * messages.length)], "warning");
    }
}

// ==================== 5. ПЛАТЕЖИ ====================
function initPayments() {
    paymentSystem = {
        showDepositModal: function() {
            showNotification("Пополнение: в демо режиме баланс меняется в игре", "info");
            
            // В реальном режиме покажем модалку
            if (!CONFIG.DEMO_MODE) {
                showPaymentModal('deposit');
            }
        },
        
        showWithdrawModal: function() {
            if (currentPlayer.balance < CONFIG.PAYMENTS.MIN_WITHDRAWAL) {
                showNotification(`Минимум ${CONFIG.PAYMENTS.MIN_WITHDRAWAL} TON для вывода`, "error");
                return;
            }
            showNotification("Вывод: в демо режиме используйте игру", "info");
            
            if (!CONFIG.DEMO_MODE) {
                showPaymentModal('withdraw');
            }
        }
    };
    
    // Привязываем кнопки
    document.querySelector('.btn-deposit').onclick = () => paymentSystem.showDepositModal();
    document.querySelector('.btn-withdraw').onclick = () => paymentSystem.showWithdrawModal();
}

// Модальное окно платежей (для реального режима)
function showPaymentModal(type) {
    const isDeposit = type === 'deposit';
    const title = isDeposit ? "Пополнение баланса" : "Вывод средств";
    const icon = isDeposit ? "fa-wallet" : "fa-money-bill-wave";
    
    const modalHTML = `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas ${icon}"></i> ${title}</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="payment-content">
                    <p>Для ${isDeposit ? 'пополнения' : 'вывода'} средств:</p>
                    <ol>
                        <li>Напишите в поддержку @your_support_bot</li>
                        <li>Укажите ваш ID: <strong>${currentPlayer.id}</strong></li>
                        <li>${isDeposit ? 'Отправьте TON на наш кошелек' : 'Укажите ваш TON кошелек'}</li>
                        <li>Ожидайте подтверждения</li>
                    </ol>
                    <div class="payment-notice">
                        <i class="fas fa-info-circle"></i>
                        В реальном режиме здесь будет платежная система
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ==================== 6. ИСТОРИЯ ====================
function loadHistory() {
    try {
        const saved = localStorage.getItem(`history_${currentPlayer.id}`);
        if (saved) {
            gameHistory = JSON.parse(saved);
        } else {
            // Демо история
            gameHistory = [
                {
                    id: 'game_1',
                    gameId: 'dice',
                    gameName: 'Кости',
                    betAmount: 50,
                    result: 'win',
                    winAmount: 85,
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    profit: 35
                }
            ];
        }
        updateHistoryDisplay();
    } catch (error) {
        console.error("Ошибка загрузки истории:", error);
        gameHistory = [];
    }
}

function updateHistoryDisplay() {
    const container = document.getElementById('gameHistory');
    if (!container) return;
    
    container.innerHTML = '';
    
    const recent = gameHistory.slice(-5).reverse();
    
    if (recent.length === 0) {
        container.innerHTML = '<div class="empty-history">История игр пуста</div>';
        return;
    }
    
    recent.forEach(game => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const gameConfig = CONFIG.GAMES[game.gameId] || CONFIG.GAMES.dice;
        const resultClass = game.result === 'win' ? 'win' : 'loss';
        const resultIcon = game.result === 'win' ? 'fa-arrow-up' : 'fa-arrow-down';
        const resultText = game.result === 'win' ? `+${game.profit}` : `${game.profit}`;
        
        item.innerHTML = `
            <div class="history-game">
                <div class="history-icon" style="background: ${gameConfig.color}">
                    <i class="${gameConfig.icon}"></i>
                </div>
                <div class="history-details">
                    <div class="history-name">${game.gameName}</div>
                    <div class="history-time">${formatTime(game.timestamp)}</div>
                </div>
            </div>
            <div class="history-result ${resultClass}">
                <i class="fas ${resultIcon}"></i>
                <span>${resultText} TON</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Только что';
    if (diff < 3600000) return `${Math.floor(diff/60000)} мин назад`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)} ч назад`;
    return date.toLocaleDateString('ru-RU');
}

// ==================== АДМИН ПАНЕЛЬ ====================
function handleAdminClick() {
    const now = Date.now();
    
    if (now - lastAdminClickTime > CONFIG.ADMIN_CLICK_TIMEOUT) {
        adminClickCount = 0;
    }
    
    adminClickCount++;
    lastAdminClickTime = now;
    
    if (adminClickCount >= CONFIG.ADMIN_CLICK_COUNT) {
        toggleAdminPanel();
        adminClickCount = 0;
    }
}

function toggleAdminPanel() {
    if (!currentPlayer.is_admin) {
        showNotification("Нет доступа к админке", "error");
        return;
    }
    
    const adminHTML = `
        <div class="admin-panel">
            <div class="admin-header">
                <h2><i class="fas fa-crown"></i> Админ панель</h2>
                <button class="btn btn-close" onclick="closeAdmin()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="admin-section">
                <h3><i class="fas fa-user"></i> Текущий игрок</h3>
                <div class="admin-info">
                    <p>ID: ${currentPlayer.id}</p>
                    <p>Баланс: ${currentPlayer.balance} TON</p>
                    <p>Игр: ${currentPlayer.games_played}</p>
                </div>
            </div>
            
            <div class="admin-section">
                <h3><i class="fas fa-sliders-h"></i> Управление</h3>
                <div class="admin-controls">
                    <div class="control">
                        <label>Удача игрока:</label>
                        <input type="range" id="adminLuck" min="0.5" max="1.5" step="0.1" 
                               value="${currentPlayer.luck_multiplier || 1.0}"
                               onchange="updatePlayerLuck(this.value)">
                        <span id="luckValue">${(currentPlayer.luck_multiplier || 1.0).toFixed(1)}x</span>
                    </div>
                    
                    <div class="control">
                        <label>Изменить баланс:</label>
                        <input type="number" id="adminBalance" value="100">
                        <button class="btn btn-small" onclick="addBalance()">+</button>
                        <button class="btn btn-small" onclick="removeBalance()">-</button>
                    </div>
                </div>
            </div>
            
            <div class="admin-section">
                <h3><i class="fas fa-history"></i> Статистика</h3>
                <div class="admin-stats">
                    <div class="stat">
                        <span>Всего игр:</span>
                        <span>${currentPlayer.games_played}</span>
                    </div>
                    <div class="stat">
                        <span>Выиграно:</span>
                        <span>${currentPlayer.total_won} TON</span>
                    </div>
                    <div class="stat">
                        <span>Проиграно:</span>
                        <span>${currentPlayer.total_lost} TON</span>
                    </div>
                </div>
            </div>
            
            <div class="admin-actions">
                <button class="btn btn-admin" onclick="resetPlayer()">
                    <i class="fas fa-redo"></i> Сбросить игрока
                </button>
                <button class="btn btn-admin" onclick="exportData()">
                    <i class="fas fa-download"></i> Экспорт данных
                </button>
            </div>
        </div>
    `;
    
    const panel = document.createElement('div');
    panel.innerHTML = adminHTML;
    panel.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.95);
        color: white;
        z-index: 10000;
        padding: 20px;
        overflow-y: auto;
    `;
    
    document.body.appendChild(panel);
}

function closeAdmin() {
    const panel = document.querySelector('.admin-panel');
    if (panel) {
        panel.parentElement.remove();
    }
}

function updatePlayerLuck(value) {
    currentPlayer.luck_multiplier = parseFloat(value);
    document.getElementById('luckValue').textContent = value + 'x';
    savePlayerData();
}

function addBalance() {
    const amount = parseInt(document.getElementById('adminBalance').value) || 100;
    currentPlayer.balance += amount;
    savePlayerData();
    updateBalance();
    showNotification(`+${amount} TON добавлено`, "success");
}

function removeBalance() {
    const amount = parseInt(document.getElementById('adminBalance').value) || 100;
    currentPlayer.balance = Math.max(0, currentPlayer.balance - amount);
    savePlayerData();
    updateBalance();
    showNotification(`-${amount} TON списано`, "warning");
}

function resetPlayer() {
    if (confirm("Сбросить статистику игрока?")) {
        currentPlayer.balance = CONFIG.INITIAL_BALANCE;
        currentPlayer.games_played = 0;
        currentPlayer.total_won = 0;
        currentPlayer.total_lost = 0;
        currentPlayer.luck_multiplier = 1.0;
        gameHistory = [];
        
        savePlayerData();
        localStorage.removeItem(`history_${currentPlayer.id}`);
        
        updateBalance();
        updateHistoryDisplay();
        showNotification("Статистика сброшена", "success");
        closeAdmin();
    }
}

function exportData() {
    const data = {
        player: currentPlayer,
        history: gameHistory,
        export_date: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tonplay_data_${currentPlayer.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification("Данные экспортированы", "success");
}

// ==================== УТИЛИТЫ ====================
function showNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#34C759' : 
                     type === 'error' ? '#FF3B30' : 
                     type === 'warning' ? '#FF9500' : '#007AFF'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(notification);
    
    // Автоскрытие
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Добавляем стили анимации
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }
}

function showGameInfo(gameId) {
    const game = CONFIG.GAMES[gameId];
    showNotification(`${game.name}: ${game.description} (RTP: ${game.rtp}%)`, "info");
}

// ==================== ЭКСПОРТ ФУНКЦИЙ ====================
// Делаем функции доступными глобально
window.startGame = startGame;
window.showGameInfo = showGameInfo;
window.showDepositModal = () => paymentSystem.showDepositModal();
window.showWithdrawModal = () => paymentSystem.showWithdrawModal();
window.switchTab = function(tabName) {
    showNotification(`Переключено на: ${tabName === 'games' ? 'Игры' : 
                    tabName === 'history' ? 'Историю' : 
                    tabName === 'profile' ? 'Профиль' : 'Поддержку'}`, "info");
};
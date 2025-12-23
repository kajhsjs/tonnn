// ==================== ПЛАТЕЖНАЯ СИСТЕМА ====================
class PaymentSystem {
    constructor() {
        this.pendingTransactions = new Map();
        this.withdrawalRequests = new Map();
        this.initialize();
    }
    
    initialize() {
        console.log("Платежная система инициализирована");
        
        // Загружаем транзакции из localStorage
        this.loadTransactions();
        
        // Проверяем статусы pending транзакций
        this.checkPendingTransactions();
    }
    
    // ==================== ПОПОЛНЕНИЕ ====================
    
    // Показать модальное окно пополнения
    showDepositModal() {
        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-wallet"></i>
                        Пополнение баланса
                    </h3>
                    <button class="close-modal" onclick="paymentSystem.closeModal()">&times;</button>
                </div>
                
                <div class="deposit-section">
                    <h4>Сумма пополнения (TON)</h4>
                    
                    <div class="amount-buttons">
                        <button class="amount-btn" onclick="paymentSystem.setDepositAmount(100)">
                            100 TON
                        </button>
                        <button class="amount-btn" onclick="paymentSystem.setDepositAmount(500)">
                            500 TON
                        </button>
                        <button class="amount-btn" onclick="paymentSystem.setDepositAmount(1000)">
                            1,000 TON
                        </button>
                        <button class="amount-btn" onclick="paymentSystem.setDepositAmount(5000)">
                            5,000 TON
                        </button>
                    </div>
                    
                    <div class="amount-input">
                        <input type="number" id="depositAmount" 
                               value="100" 
                               min="${CONFIG.PAYMENTS.MIN_DEPOSIT}" 
                               max="${CONFIG.PAYMENTS.MAX_DEPOSIT}">
                        <span>TON</span>
                    </div>
                    
                    <div class="balance-info">
                        <span>Текущий баланс:</span>
                        <span class="current-balance">${currentPlayer.balance} TON</span>
                    </div>
                </div>
                
                <div class="payment-methods">
                    <h4>Выберите способ оплаты</h4>
                    
                    <div class="method-cards">
                        <div class="method-card active" data-method="crypto_bot">
                            <div class="method-icon">
                                <i class="fab fa-telegram"></i>
                            </div>
                            <div class="method-info">
                                <h5>Crypto Bot</h5>
                                <p>Через Telegram бота</p>
                                <small>Мгновенное зачисление</small>
                            </div>
                            <div class="method-check">
                                <i class="fas fa-check"></i>
                            </div>
                        </div>
                        
                        <div class="method-card" data-method="ton_wallet">
                            <div class="method-icon">
                                <i class="fas fa-coins"></i>
                            </div>
                            <div class="method-info">
                                <h5>TON Wallet</h5>
                                <p>Прямой перевод</p>
                                <small>1-3 подтверждения сети</small>
                            </div>
                        </div>
                        
                        <div class="method-card" data-method="bank_card">
                            <div class="method-icon">
                                <i class="fas fa-credit-card"></i>
                            </div>
                            <div class="method-info">
                                <h5>Банковская карта</h5>
                                <p>Visa/Mastercard</p>
                                <small>Комиссия 5%</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="deposit-summary">
                    <div class="summary-row">
                        <span>Сумма пополнения:</span>
                        <span id="summaryAmount">100 TON</span>
                    </div>
                    <div class="summary-row">
                        <span>Комиссия:</span>
                        <span id="summaryFee">0 TON</span>
                    </div>
                    <div class="summary-row total">
                        <span>Итого к оплате:</span>
                        <span id="summaryTotal">100 TON</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-cancel" onclick="paymentSystem.closeModal()">
                        Отмена
                    </button>
                    <button class="btn btn-confirm" onclick="paymentSystem.processDeposit()">
                        <i class="fas fa-arrow-right"></i>
                        Перейти к оплате
                    </button>
                </div>
                
                <div class="payment-notice">
                    <small>
                        <i class="fas fa-info-circle"></i>
                        Средства зачисляются в течение 1-15 минут после подтверждения платежа
                    </small>
                </div>
            </div>
        `;
        
        this.showModal(modalHTML, 'depositModal');
        this.initializeDepositListeners();
    }
    
    // Показать модальное окно вывода
    showWithdrawModal() {
        // Проверяем минимальный баланс
        if (currentPlayer.balance < CONFIG.PAYMENTS.MIN_WITHDRAWAL) {
            showNotification(
                `Минимальная сумма для вывода: ${CONFIG.PAYMENTS.MIN_WITHDRAWAL} TON`,
                "error"
            );
            return;
        }
        
        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-money-bill-wave"></i>
                        Вывод средств
                    </h3>
                    <button class="close-modal" onclick="paymentSystem.closeModal()">&times;</button>
                </div>
                
                <div class="withdraw-section">
                    <div class="balance-info">
                        <span>Доступно для вывода:</span>
                        <span class="available-balance">${currentPlayer.balance} TON</span>
                    </div>
                    
                    <h4>Сумма вывода (TON)</h4>
                    
                    <div class="amount-input">
                        <input type="number" id="withdrawAmount" 
                               value="${CONFIG.PAYMENTS.MIN_WITHDRAWAL}" 
                               min="${CONFIG.PAYMENTS.MIN_WITHDRAWAL}" 
                               max="${Math.min(CONFIG.PAYMENTS.MAX_WITHDRAWAL, currentPlayer.balance)}">
                        <span>TON</span>
                    </div>
                    
                    <div class="amount-slider">
                        <input type="range" id="withdrawSlider" 
                               min="${CONFIG.PAYMENTS.MIN_WITHDRAWAL}" 
                               max="${Math.min(CONFIG.PAYMENTS.MAX_WITHDRAWAL, currentPlayer.balance)}" 
                               value="${CONFIG.PAYMENTS.MIN_WITHDRAWAL}"
                               oninput="paymentSystem.updateWithdrawAmount(this.value)">
                    </div>
                    
                    <div class="amount-percentages">
                        <button onclick="paymentSystem.setWithdrawPercent(0.25)">25%</button>
                        <button onclick="paymentSystem.setWithdrawPercent(0.5)">50%</button>
                        <button onclick="paymentSystem.setWithdrawPercent(0.75)">75%</button>
                        <button onclick="paymentSystem.setWithdrawPercent(1)">100%</button>
                    </div>
                </div>
                
                <div class="withdraw-methods">
                    <h4>Куда вывести</h4>
                    
                    <div class="method-options">
                        <div class="method-option active" data-method="crypto_bot">
                            <i class="fab fa-telegram"></i>
                            <div class="method-details">
                                <span>Crypto Bot</span>
                                <small>На ваш Telegram ID</small>
                            </div>
                        </div>
                        
                        <div class="method-option" data-method="ton_wallet">
                            <i class="fas fa-wallet"></i>
                            <div class="method-details">
                                <span>TON Wallet</span>
                                <small>Введите адрес кошелька</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="method-fields" id="methodFields">
                        <div class="method-field" data-for="ton_wallet">
                            <input type="text" id="tonAddress" 
                                   placeholder="EQABD... (Ваш TON адрес)"
                                   class="wallet-input">
                            <small class="field-hint">Убедитесь, что адрес правильный</small>
                        </div>
                    </div>
                </div>
                
                <div class="withdraw-summary">
                    <div class="summary-row">
                        <span>Сумма вывода:</span>
                        <span id="withdrawSummaryAmount">${CONFIG.PAYMENTS.MIN_WITHDRAWAL} TON</span>
                    </div>
                    <div class="summary-row">
                        <span>Комиссия (${(CONFIG.PAYMENTS.WITHDRAWAL_FEE * 100)}%):</span>
                        <span id="withdrawFee">${(CONFIG.PAYMENTS.MIN_WITHDRAWAL * CONFIG.PAYMENTS.WITHDRAWAL_FEE).toFixed(2)} TON</span>
                    </div>
                    <div class="summary-row total">
                        <span>Вы получите:</span>
                        <span id="withdrawReceive">${(CONFIG.PAYMENTS.MIN_WITHDRAWAL * (1 - CONFIG.PAYMENTS.WITHDRAWAL_FEE)).toFixed(2)} TON</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-cancel" onclick="paymentSystem.closeModal()">
                        Отмена
                    </button>
                    <button class="btn btn-confirm" onclick="paymentSystem.processWithdrawal()">
                        <i class="fas fa-paper-plane"></i>
                        Заказать вывод
                    </button>
                </div>
                
                <div class="withdraw-notice">
                    <small>
                        <i class="fas fa-clock"></i>
                        Вывод обычно занимает 1-24 часа. Минимальная сумма: ${CONFIG.PAYMENTS.MIN_WITHDRAWAL} TON
                    </small>
                </div>
            </div>
        `;
        
        this.showModal(modalHTML, 'withdrawModal');
        this.initializeWithdrawListeners();
    }
    
    // ==================== ОБРАБОТКА ПЛАТЕЖЕЙ ====================
    
    // Пополнение через Crypto Bot
    async depositViaCryptoBot(amount) {
        try {
            showNotification("Перенаправление в Crypto Bot...", "info");
            
            // В реальном приложении здесь будет API вызов к Crypto Bot
            // Для демо создаем симуляцию
            
            const transactionId = `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            
            const transaction = {
                id: transactionId,
                playerId: currentPlayer.id,
                type: 'deposit',
                method: 'crypto_bot',
                amount: amount,
                status: 'pending',
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 15 * 60000).toISOString(), // 15 минут
                invoice_url: 'https://t.me/CryptoBot?start=invoice_demo',
                description: `Пополнение баланса на ${amount} TON`
            };
            
            // Сохраняем транзакцию
            this.saveTransaction(transaction);
            
            // Показываем статус
            this.showTransactionStatus(transaction);
            
            // В демо режиме автоматически подтверждаем через 5 секунд
            if (CONFIG.DEMO_MODE) {
                setTimeout(() => {
                    this.completeDeposit(transactionId, amount);
                }, 5000);
            }
            
            return transaction;
            
        } catch (error) {
            console.error("Ошибка Crypto Bot платежа:", error);
            throw new Error("Не удалось создать счет для оплаты");
        }
    }
    
    // Пополнение через TON Wallet
    async depositViaTON(amount, walletAddress) {
        try {
            const transactionId = `ton_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            
            // Генерируем QR код для оплаты
            const paymentData = {
                address: "EQABD1234567890abcdefghijklmnopqrstuvwxyzABCDEF", // Демо адрес
                amount: amount * 1000000000, // В нанотонах
                comment: `Deposit for ${currentPlayer.id}`,
                payload: transactionId
            };
            
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`ton://transfer/${paymentData.address}?amount=${paymentData.amount}&text=${paymentData.comment}`)}`;
            
            const transaction = {
                id: transactionId,
                playerId: currentPlayer.id,
                type: 'deposit',
                method: 'ton_wallet',
                amount: amount,
                status: 'pending',
                created_at: new Date().toISOString(),
                wallet_address: paymentData.address,
                qr_code: qrCodeUrl,
                payment_link: `ton://transfer/${paymentData.address}?amount=${paymentData.amount}&text=${paymentData.comment}`,
                description: `TON перевод на ${amount} TON`
            };
            
            this.saveTransaction(transaction);
            
            // Показываем QR код для оплаты
            this.showTONDeposit(transaction);
            
            return transaction;
            
        } catch (error) {
            console.error("Ошибка TON платежа:", error);
            throw error;
        }
    }
    
    // Обработка вывода
    async processWithdrawalRequest(amount, method, details = {}) {
        try {
            // Проверяем баланс
            if (amount > currentPlayer.balance) {
                throw new Error("Недостаточно средств на балансе");
            }
            
            // Проверяем минимальную сумму
            if (amount < CONFIG.PAYMENTS.MIN_WITHDRAWAL) {
                throw new Error(`Минимальная сумма вывода: ${CONFIG.PAYMENTS.MIN_WITHDRAWAL} TON`);
            }
            
            // Рассчитываем комиссию
            const fee = amount * CONFIG.PAYMENTS.WITHDRAWAL_FEE;
            const receiveAmount = amount - fee;
            
            const withdrawalId = `wd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            
            const withdrawal = {
                id: withdrawalId,
                playerId: currentPlayer.id,
                amount: amount,
                receive_amount: receiveAmount,
                fee: fee,
                method: method,
                details: details,
                status: 'pending',
                created_at: new Date().toISOString(),
                player_balance_before: currentPlayer.balance
            };
            
            // Резервируем сумму
            currentPlayer.balance -= amount;
            currentPlayer.pending_withdrawal = (currentPlayer.pending_withdrawal || 0) + amount;
            savePlayerData();
            updateBalanceDisplay();
            
            // Сохраняем заявку
            this.saveWithdrawalRequest(withdrawal);
            
            // Показываем подтверждение
            showNotification(`Заявка на вывод создана. ID: ${withdrawalId}`, "success");
            
            // В демо режиме автоматически выполняем через 3 секунды
            if (CONFIG.DEMO_MODE) {
                setTimeout(() => {
                    this.completeWithdrawal(withdrawalId);
                }, 3000);
            }
            
            return withdrawal;
            
        } catch (error) {
            console.error("Ошибка создания заявки на вывод:", error);
            throw error;
        }
    }
    
    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================
    
    // Загрузка транзакций из localStorage
    loadTransactions() {
        try {
            const savedTransactions = localStorage.getItem('transactions');
            const savedWithdrawals = localStorage.getItem('withdrawals');
            
            if (savedTransactions) {
                const transactions = JSON.parse(savedTransactions);
                transactions.forEach(tx => {
                    if (tx.status === 'pending' && tx.playerId === currentPlayer.id) {
                        this.pendingTransactions.set(tx.id, tx);
                    }
                });
            }
            
            if (savedWithdrawals) {
                const withdrawals = JSON.parse(savedWithdrawals);
                withdrawals.forEach(wd => {
                    if (wd.status === 'pending' && wd.playerId === currentPlayer.id) {
                        this.withdrawalRequests.set(wd.id, wd);
                    }
                });
            }
            
            console.log(`Загружено ${this.pendingTransactions.size} pending транзакций и ${this.withdrawalRequests.size} заявок на вывод`);
            
        } catch (error) {
            console.error("Ошибка загрузки транзакций:", error);
        }
    }
    
    // Сохранение транзакции
    saveTransaction(transaction) {
        try {
            // Добавляем в память
            this.pendingTransactions.set(transaction.id, transaction);
            
            // Сохраняем в localStorage
            let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            transactions.push(transaction);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            
            console.log("Транзакция сохранена:", transaction.id);
            
        } catch (error) {
            console.error("Ошибка сохранения транзакции:", error);
        }
    }
    
    // Сохранение заявки на вывод
    saveWithdrawalRequest(withdrawal) {
        try {
            this.withdrawalRequests.set(withdrawal.id, withdrawal);
            
            let withdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
            withdrawals.push(withdrawal);
            localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
            
            console.log("Заявка на вывод сохранена:", withdrawal.id);
            
        } catch (error) {
            console.error("Ошибка сохранения заявки на вывод:", error);
        }
    }
    
    // Проверка pending транзакций
    checkPendingTransactions() {
        // В реальном приложении здесь будет проверка статусов через API
        // В демо режиме просто логируем
        console.log(`Проверка ${this.pendingTransactions.size} pending транзакций...`);
    }
    
    // Завершение пополнения (демо)
    completeDeposit(transactionId, amount) {
        const transaction = this.pendingTransactions.get(transactionId);
        
        if (transaction && transaction.status === 'pending') {
            transaction.status = 'completed';
            transaction.completed_at = new Date().toISOString();
            
            // Зачисляем средства
            currentPlayer.balance += amount;
            currentPlayer.total_deposited += amount;
            savePlayerData();
            updateBalanceDisplay();
            
            // Обновляем транзакцию
            this.saveTransaction(transaction);
            
            // Уведомление
            showNotification(`✅ Пополнение на ${amount} TON успешно зачислено!`, "success");
            
            // Обновляем интерфейс
            this.updateTransactionStatus(transaction);
        }
    }
    
    // Завершение вывода (демо)
    completeWithdrawal(withdrawalId) {
        const withdrawal = this.withdrawalRequests.get(withdrawalId);
        
        if (withdrawal && withdrawal.status === 'pending') {
            withdrawal.status = 'completed';
            withdrawal.completed_at = new Date().toISOString();
            
            // Обновляем статистику
            currentPlayer.total_withdrawn += withdrawal.amount;
            currentPlayer.pending_withdrawal -= withdrawal.amount;
            savePlayerData();
            
            // Обновляем заявку
            this.saveWithdrawalRequest(withdrawal);
            
            // Уведомление
            showNotification(`✅ Вывод ${withdrawal.receive_amount} TON выполнен!`, "success");
        }
    }
    
    // ==================== ИНТЕРФЕЙС ====================
    
    // Показать модальное окно
    showModal(content, modalId) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = modalId;
        modal.innerHTML = content;
        document.body.appendChild(modal);
    }
    
    // Закрыть модальное окно
    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
    }
    
    // Инициализация слушателей для пополнения
    initializeDepositListeners() {
        // Выбор метода оплаты
        document.querySelectorAll('.method-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.method-card').forEach(c => {
                    c.classList.remove('active');
                });
                card.classList.add('active');
                this.updateDepositSummary();
            });
        });
        
        // Изменение суммы
        const amountInput = document.getElementById('depositAmount');
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                this.updateDepositSummary();
            });
            
            amountInput.addEventListener('change', () => {
                let value = parseInt(amountInput.value) || CONFIG.PAYMENTS.MIN_DEPOSIT;
                value = Math.max(CONFIG.PAYMENTS.MIN_DEPOSIT, 
                               Math.min(CONFIG.PAYMENTS.MAX_DEPOSIT, value));
                amountInput.value = value;
                this.updateDepositSummary();
            });
        }
        
        // Кнопки быстрого выбора суммы
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.textContent);
                if (amountInput && !isNaN(amount)) {
                    amountInput.value = amount;
                    this.updateDepositSummary();
                }
            });
        });
        
        // Инициализация сводки
        this.updateDepositSummary();
    }
    
    // Инициализация слушателей для вывода
    initializeWithdrawListeners() {
        // Выбор метода вывода
        document.querySelectorAll('.method-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.method-option').forEach(o => {
                    o.classList.remove('active');
                });
                option.classList.add('active');
                this.updateWithdrawFields();
            });
        });
        
        // Слайдер суммы
        const amountInput = document.getElementById('withdrawAmount');
        const slider = document.getElementById('withdrawSlider');
        
        if (amountInput && slider) {
            amountInput.addEventListener('input', () => {
                const value = parseInt(amountInput.value) || CONFIG.PAYMENTS.MIN_WITHDRAWAL;
                const max = Math.min(CONFIG.PAYMENTS.MAX_WITHDRAWAL, currentPlayer.balance);
                const validValue = Math.max(CONFIG.PAYMENTS.MIN_WITHDRAWAL, Math.min(max, value));
                
                amountInput.value = validValue;
                slider.value = validValue;
                this.updateWithdrawSummary();
            });
            
            slider.addEventListener('input', () => {
                amountInput.value = slider.value;
                this.updateWithdrawSummary();
            });
        }
        
        // Инициализация сводки
        this.updateWithdrawSummary();
        this.updateWithdrawFields();
    }
    
    // Обновление сводки пополнения
    updateDepositSummary() {
        const amountInput = document.getElementById('depositAmount');
        if (!amountInput) return;
        
        const amount = parseInt(amountInput.value) || CONFIG.PAYMENTS.MIN_DEPOSIT;
        const methodElement = document.querySelector('.method-card.active');
        const method = methodElement ? methodElement.dataset.method : 'crypto_bot';
        
        // Расчет комиссии (в демо 0%)
        const fee = 0;
        const total = amount + fee;
        
        // Обновляем отображение
        const summaryAmount = document.getElementById('summaryAmount');
        const summaryFee = document.getElementById('summaryFee');
        const summaryTotal = document.getElementById('summaryTotal');
        
        if (summaryAmount) summaryAmount.textContent = `${amount} TON`;
        if (summaryFee) summaryFee.textContent = `${fee} TON`;
        if (summaryTotal) summaryTotal.textContent = `${total} TON`;
    }
    
    // Обновление сводки вывода
    updateWithdrawSummary() {
        const amountInput = document.getElementById('withdrawAmount');
        if (!amountInput) return;
        
        const amount = parseInt(amountInput.value) || CONFIG.PAYMENTS.MIN_WITHDRAWAL;
        const fee = amount * CONFIG.PAYMENTS.WITHDRAWAL_FEE;
        const receiveAmount = amount - fee;
        
        // Обновляем отображение
        const summaryAmount = document.getElementById('withdrawSummaryAmount');
        const summaryFee = document.getElementById('withdrawFee');
        const summaryReceive = document.getElementById('withdrawReceive');
        
        if (summaryAmount) summaryAmount.textContent = `${amount} TON`;
        if (summaryFee) summaryFee.textContent = `${fee.toFixed(2)} TON`;
        if (summaryReceive) summaryReceive.textContent = `${receiveAmount.toFixed(2)} TON`;
    }
    
    // Обновление полей метода вывода
    updateWithdrawFields() {
        const methodElement = document.querySelector('.method-option.active');
        const method = methodElement ? methodElement.dataset.method : 'crypto_bot';
        const fieldsContainer = document.getElementById('methodFields');
        
        if (!fieldsContainer) return;
        
        // Показываем только нужные поля
        document.querySelectorAll('.method-field').forEach(field => {
            field.style.display = 'none';
        });
        
        const targetField = document.querySelector(`.method-field[data-for="${method}"]`);
        if (targetField) {
            targetField.style.display = 'block';
        }
    }
    
    // Обработка пополнения
    processDeposit() {
        const amountInput = document.getElementById('depositAmount');
        const methodElement = document.querySelector('.method-card.active');
        
        if (!amountInput || !methodElement) return;
        
        const amount = parseInt(amountInput.value) || CONFIG.PAYMENTS.MIN_DEPOSIT;
        const method = methodElement.dataset.method;
        
        // Проверка суммы
        if (amount < CONFIG.PAYMENTS.MIN_DEPOSIT) {
            showNotification(`Минимальная сумма пополнения: ${CONFIG.PAYMENTS.MIN_DEPOSIT} TON`, "error");
            return;
        }
        
        if (amount > CONFIG.PAYMENTS.MAX_DEPOSIT) {
            showNotification(`Максимальная сумма пополнения: ${CONFIG.PAYMENTS.MAX_DEPOSIT} TON`, "error");
            return;
        }
        
        // Подтверждение
        if (tg && tg.showConfirm) {
            tg.showConfirm(
                `Пополнить баланс на ${amount} TON через ${methodElement.querySelector('h5').textContent}?`,
                (confirmed) => {
                    if (confirmed) {
                        this.executeDeposit(amount, method);
                    }
                }
            );
        } else {
            if (confirm(`Пополнить баланс на ${amount} TON через ${methodElement.querySelector('h5').textContent}?`)) {
                this.executeDeposit(amount, method);
            }
        }
    }
    
    // Выполнение пополнения
    async executeDeposit(amount, method) {
        try {
            this.closeModal();
            
            let transaction;
            
            switch(method) {
                case 'crypto_bot':
                    transaction = await this.depositViaCryptoBot(amount);
                    break;
                    
                case 'ton_wallet':
                    transaction = await this.depositViaTON(amount);
                    break;
                    
                case 'bank_card':
                    showNotification("Оплата картой временно недоступна", "warning");
                    return;
                    
                default:
                    throw new Error("Неизвестный метод оплаты");
            }
            
            if (transaction) {
                showNotification(`Счет на оплату создан. Следуйте инструкциям.`, "info");
            }
            
        } catch (error) {
            console.error("Ошибка пополнения:", error);
            showNotification(`Ошибка: ${error.message}`, "error");
        }
    }
    
    // Обработка вывода
    processWithdrawal() {
        const amountInput = document.getElementById('withdrawAmount');
        const methodElement = document.querySelector('.method-option.active');
        
        if (!amountInput || !methodElement) return;
        
        const amount = parseInt(amountInput.value) || CONFIG.PAYMENTS.MIN_WITHDRAWAL;
        const method = methodElement.dataset.method;
        
        // Проверка баланса
        if (amount > currentPlayer.balance) {
            showNotification("Недостаточно средств на балансе", "error");
            return;
        }
        
        // Сбор деталей
        let details = {};
        
        if (method === 'ton_wallet') {
            const addressInput = document.getElementById('tonAddress');
            if (!addressInput || addressInput.value.length < 48) {
                showNotification("Введите корректный TON адрес", "error");
                return;
            }
            details.wallet_address = addressInput.value;
        }
        
        // Подтверждение
        const fee = amount * CONFIG.PAYMENTS.WITHDRAWAL_FEE;
        const receiveAmount = amount - fee;
        
        const confirmMessage = method === 'crypto_bot' 
            ? `Вывести ${amount} TON в Crypto Bot? Вы получите ${receiveAmount.toFixed(2)} TON (комиссия ${fee.toFixed(2)} TON)`
            : `Вывести ${amount} TON на TON кошелек? Вы получите ${receiveAmount.toFixed(2)} TON (комиссия ${fee.toFixed(2)} TON)`;
        
        if (tg && tg.showConfirm) {
            tg.showConfirm(confirmMessage, (confirmed) => {
                if (confirmed) {
                    this.executeWithdrawal(amount, method, details);
                }
            });
        } else {
            if (confirm(confirmMessage)) {
                this.executeWithdrawal(amount, method, details);
            }
        }
    }
    
    // Выполнение вывода
    async executeWithdrawal(amount, method, details) {
        try {
            this.closeModal();
            
            const withdrawal = await this.processWithdrawalRequest(amount, method, details);
            
            if (withdrawal) {
                showNotification(`Заявка на вывод создана. ID: ${withdrawal.id}`, "success");
            }
            
        } catch (error) {
            console.error("Ошибка вывода:", error);
            showNotification(`Ошибка: ${error.message}`, "error");
        }
    }
    
    // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
    
    setDepositAmount(amount) {
        const input = document.getElementById('depositAmount');
        if (input) {
            input.value = amount;
            this.updateDepositSummary();
        }
    }
    
    setWithdrawPercent(percent) {
        const maxAmount = Math.min(CONFIG.PAYMENTS.MAX_WITHDRAWAL, currentPlayer.balance);
        const amount = Math.floor(maxAmount * percent);
        
        const input = document.getElementById('withdrawAmount');
        const slider = document.getElementById('withdrawSlider');
        
        if (input && slider) {
            input.value = amount;
            slider.value = amount;
            this.updateWithdrawSummary();
        }
    }
    
    updateWithdrawAmount(value) {
        const input = document.getElementById('withdrawAmount');
        if (input) {
            input.value = value;
            this.updateWithdrawSummary();
        }
    }
    
    // Показ статуса транзакции
    showTransactionStatus(transaction) {
        const statusHTML = `
            <div class="transaction-status">
                <div class="status-header">
                    <h4><i class="fas fa-clock"></i> Ожидание оплаты</h4>
                    <button class="btn-close-status" onclick="this.parentElement.parentElement.remove()">
                        &times;
                    </button>
                </div>
                
                <div class="status-details">
                    <div class="detail-row">
                        <span>Сумма:</span>
                        <span class="detail-value">${transaction.amount} TON</span>
                    </div>
                    <div class="detail-row">
                        <span>Метод:</span>
                        <span class="detail-value">${this.getMethodName(transaction.method)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Статус:</span>
                        <span class="detail-value status-pending">В обработке</span>
                    </div>
                </div>
                
                ${transaction.invoice_url ? `
                <div class="status-actions">
                    <a href="${transaction.invoice_url}" target="_blank" class="btn btn-pay">
                        <i class="fas fa-external-link-alt"></i>
                        Перейти к оплате
                    </a>
                </div>
                ` : ''}
                
                <div class="status-footer">
                    <small>ID: ${transaction.id}</small>
                </div>
            </div>
        `;
        
        const statusElement = document.createElement('div');
        statusElement.innerHTML = statusHTML;
        statusElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-bg);
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid var(--warning);
            z-index: 10000;
            max-width: 300px;
            box-shadow: var(--shadow);
        `;
        
        document.body.appendChild(statusElement);
        
        // Автоматическое скрытие через 30 секунд
        setTimeout(() => {
            if (statusElement.parentElement) {
                statusElement.remove();
            }
        }, 30000);
    }
    
    // Показ TON депозита
    showTONDeposit(transaction) {
        const depositHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-coins"></i>
                        Оплата TON переводом
                    </h3>
                    <button class="close-modal" onclick="paymentSystem.closeTONDeposit()">&times;</button>
                </div>
                
                <div class="ton-deposit-content">
                    <div class="qr-code">
                        <img src="${transaction.qr_code}" alt="QR Code for TON payment">
                    </div>
                    
                    <div class="deposit-info">
                        <div class="info-item">
                            <span>Сумма:</span>
                            <span class="info-value">${transaction.amount} TON</span>
                        </div>
                        
                        <div class="info-item">
                            <span>Адрес кошелька:</span>
                            <div class="wallet-address">
                                <code>${transaction.wallet_address}</code>
                                <button class="btn-copy" onclick="paymentSystem.copyToClipboard('${transaction.wallet_address}')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <span>Комментарий:</span>
                            <div class="payment-comment">
                                <code>${transaction.description}</code>
                            </div>
                        </div>
                    </div>
                    
                    <div class="deposit-instructions">
                        <h4>Инструкция:</h4>
                        <ol>
                            <li>Откройте ваш TON кошелек (TON Keeper, Ton Wallet)</li>
                            <li>Отсканируйте QR код или скопируйте адрес</li>
                            <li>Отправьте <strong>${transaction.amount} TON</strong> на указанный адрес</li>
                            <li>Добавьте комментарий из поля выше</li>
                            <li>Средства зачислятся после 1-3 подтверждений сети</li>
                        </ol>
                    </div>
                    
                    <div class="deposit-actions">
                        <a href="${transaction.payment_link}" class="btn btn-open-wallet">
                            <i class="fas fa-external-link-alt"></i>
                            Открыть в кошельке
                        </a>
                        
                        <button class="btn btn-check-payment" onclick="paymentSystem.checkTONPayment('${transaction.id}')">
                            <i class="fas fa-sync"></i>
                            Проверить платеж
                        </button>
                    </div>
                    
                    <div class="deposit-notice">
                        <small>
                            <i class="fas fa-info-circle"></i>
                            Обычно платеж обрабатывается за 1-15 минут
                        </small>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal(depositHTML, 'tonDepositModal');
    }
    
    closeTONDeposit() {
        const modal = document.getElementById('tonDepositModal');
        if (modal) {
            modal.remove();
        }
    }
    
    checkTONPayment(transactionId) {
        showNotification("Проверка платежа... В демо режиме платежи обрабатываются автоматически", "info");
        
        // В демо режиме автоматически завершаем
        if (CONFIG.DEMO_MODE) {
            this.completeDeposit(transactionId, 100); // Демо сумма
        }
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showNotification("Скопировано в буфер обмена", "success");
            })
            .catch(err => {
                console.error("Ошибка копирования:", err);
                showNotification("Не удалось скопировать", "error");
            });
    }
    
    getMethodName(method) {
        const names = {
            'crypto_bot': 'Crypto Bot',
            'ton_wallet': 'TON Wallet',
            'bank_card': 'Банковская карта'
        };
        return names[method] || method;
    }
    
    updateTransactionStatus(transaction) {
        // Обновление статуса транзакции в интерфейсе
        const statusElement = document.querySelector('.transaction-status');
        if (statusElement) {
            const statusValue = statusElement.querySelector('.status-pending');
            if (statusValue && transaction.status === 'completed') {
                statusValue.textContent = 'Завершено';
                statusValue.className = 'detail-value status-completed';
                statusElement.style.borderLeftColor = 'var(--success)';
            }
        }
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПЛАТЕЖНОЙ СИСТЕМЫ ====================

// Глобальная переменная
let paymentSystem = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        paymentSystem = new PaymentSystem();
        
        // Переопределяем функции из app.js
        if (window.showDepositModal) {
            window.showDepositModal = () => paymentSystem.showDepositModal();
        }
        
        if (window.showWithdrawModal) {
            window.showWithdrawModal = () => paymentSystem.showWithdrawModal();
        }
        
        console.log("Платежная система готова");
    }, 1000);
});

// Экспортируем для использования в HTML
window.paymentSystem = window.paymentSystem || {
    showDepositModal: () => console.log("Payment system not initialized"),
    showWithdrawModal: () => console.log("Payment system not initialized")
};
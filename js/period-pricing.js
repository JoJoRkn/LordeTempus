document.addEventListener('DOMContentLoaded', function() {
    const periodButtons = document.querySelectorAll('.period-btn');
    const planCards = document.querySelectorAll('.plan-card');
    
    // Preços originais dos planos
    const originalPrices = {
        'minuta': 29.99,
        'minutos': 49.99,
        'relogio': 79.99,
        'lorde': 119.99,
        'nobreza': 199.99,
        'familiareal': 349.99,
        'pracadotempo': 499.99,
        'atemporal': 999.99,
        'cronomante': 1499.99
    };

    // Descontos por período
    const discounts = {
        'monthly': 0,
        'quarterly': 0.10,
        'semiannual': 0.15,
        'annual': 0.30
    };

    // Função para atualizar os preços
    function updatePrices(period) {
        const discount = discounts[period];
        
        planCards.forEach(card => {
            const planType = card.dataset.plan;
            const originalPrice = originalPrices[planType];
            const discountedPrice = originalPrice * (1 - discount);
            
            const priceValue = card.querySelector('.price-value');
            const pricePeriod = card.querySelector('.price-period');
            
            // Atualiza o preço
            priceValue.textContent = `R$${discountedPrice.toFixed(2).replace('.', ',')}`;
            
            // Atualiza o período
            switch(period) {
                case 'quarterly':
                    pricePeriod.textContent = '/3 meses';
                    break;
                case 'semiannual':
                    pricePeriod.textContent = '/6 meses';
                    break;
                case 'annual':
                    pricePeriod.textContent = '/12 meses';
                    break;
                default:
                    pricePeriod.textContent = '/mês';
            }
        });
    }

    // Adiciona eventos aos botões
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove a classe active de todos os botões
            periodButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adiciona a classe active ao botão clicado
            this.classList.add('active');
            
            // Atualiza os preços
            updatePrices(this.dataset.period);
        });
    });
}); 
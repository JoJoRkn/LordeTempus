// ===================================== //
//         CAMPANHAS.JS - LORDE TEMPUS  //
//     Funcionalidades de Campanhas     //
// ===================================== //

// Estado global
let campanhasCache = [];
let userIsAdmin = false;
let userHasPlano = false;
let userPlano = null;
let filtrosAplicados = false;
let db, auth;

// ==================== CONSTANTES ==================== //
// Importar sistema de configuração segura
// ADMIN_EMAILS removido por segurança - usar isAdminEmail() do config-secure.js

// Sistema de planos unificado - HIERARQUIA CORRETA
const PLANOS_SISTEMA = {
    gratis: {
        nome: 'Sem plano',
        preco: 0,
        beneficios: ['Acesso básico', 'Navegação limitada'],
        permiteRequisitar: false,
        cor: '#6b7280',
        nivel: 0
    },
    minuta: {
        nome: 'Minuta',
        preco: 29.99,
        beneficios: ['Conteúdos introdutórios', 'Sorteios', 'Acesso a campanhas grátis'],
        permiteRequisitar: true,
        cor: '#3b82f6',
        nivel: 1
    },
    minutos: {
        nome: 'Minutos',
        preco: 49.99,
        beneficios: ['Prioridade em reservas', 'Eventos especiais', 'Campanhas pagas'],
        permiteRequisitar: true,
        cor: '#8b5cf6',
        nivel: 2
    },
    relogio: {
        nome: 'Relógio',
        preco: 109.99,
        beneficios: ['Campanhas ilimitadas', 'Suporte prioritário', 'Eventos VIP'],
        permiteRequisitar: true,
        cor: '#10b981',
        popular: true,
        nivel: 3
    },
    lorde: {
        nome: 'Lorde',
        preco: 119.99,
        beneficios: ['Atendimento VIP', 'Suporte 24/7', 'Acesso completo'],
        permiteRequisitar: true,
        cor: '#f59e0b',
        nivel: 4
    },
    nobreza: {
        nome: 'Nobreza',
        preco: 199.99,
        beneficios: ['Mesa exclusiva', 'Suporte premium', 'Eventos VIP'],
        permiteRequisitar: true,
        cor: '#8b5cf6',
        nivel: 5
    },
    familiareal: {
        nome: 'Família Real',
        preco: 399.99,
        beneficios: ['Campanhas familiares', 'Atendimento personalizado', 'Acesso VIP'],
        permiteRequisitar: true,
        cor: '#ec4899',
        nivel: 6
    },
    pracadotempo: {
        nome: 'Praça do Tempo',
        preco: 599.99,
        beneficios: ['Mesa exclusiva personalizada', 'Atendimento individual', 'Prioridade máxima'],
        permiteRequisitar: true,
        cor: '#ec4899',
        nivel: 7
    },
    atemporal: {
        nome: 'Atemporal',
        preco: 999.99,
        beneficios: ['3 campanhas simultâneas', 'Acesso aos fundadores', 'Benefícios exclusivos'],
        permiteRequisitar: true,
        cor: '#6366f1',
        nivel: 8
    },
    cronomante: {
        nome: 'Cronomante',
        preco: 1999.99,
        beneficios: ['Acesso total', 'Campanhas ilimitadas', 'Privilégios máximos'],
        permiteRequisitar: true,
        cor: '#8b5cf6',
        nivel: 9
    },
    administrador: {
        nome: 'Administrador',
        preco: 0,
        beneficios: ['Acesso total', 'Gerenciamento completo', 'Privilégios de admin'],
        permiteRequisitar: true,
        cor: '#ef4444',
        nivel: 10
    }
};

// Array de planos válidos para verificações rápidas
const PLANOS_VALIDOS = Object.keys(PLANOS_SISTEMA).filter(plano => plano !== 'gratis');

// ==================== ELEMENTOS DOM ==================== //
let campanhasLista, loadingState, emptyState, totalCampanhasEl, totalJogadoresEl;
let filtroSistema, filtroVagas, filtroDia, filtroHorario, aplicarFiltrosBtn, limparFiltrosBtn;

// ==================== INICIALIZAÇÃO ==================== //
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎲 Inicializando módulo de campanhas...');
    
    // Aguardar um pouco para garantir que o DOM está totalmente carregado
    setTimeout(() => {
        inicializarElementos();
        inicializarFirebase();
        configurarEventListeners();
        configurarAnimacoes();
    }, 100);
});

function inicializarElementos() {
    // Elementos DOM
    campanhasLista = document.getElementById('campanhas-lista');
    loadingState = document.getElementById('loading-campanhas');
    emptyState = document.getElementById('empty-state');
    totalCampanhasEl = document.getElementById('totalCampanhas');
    totalJogadoresEl = document.getElementById('totalJogadores');

    // Elementos de filtro
    filtroSistema = document.getElementById('filtro-sistema');
    filtroVagas = document.getElementById('filtro-vagas');
    filtroDia = document.getElementById('filtro-dia');
    filtroHorario = document.getElementById('filtro-horario');
    aplicarFiltrosBtn = document.getElementById('aplicar-filtros');
    limparFiltrosBtn = document.getElementById('limpar-filtros');
    
    console.log('📋 Elementos DOM inicializados');
}

async function inicializarFirebase() {
    try {
        // Importações Firebase
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js");
        const { 
            getFirestore, 
            collection, 
            query, 
            orderBy, 
            onSnapshot, 
            doc, 
            getDoc, 
            setDoc 
        } = await import("https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js");
        const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js");

        // Importar configuração segura do Firebase
        const { getFirebaseConfig, isAdminEmail, isSpecialEmail } = await import('./config-secure.js');
        const firebaseConfig = getFirebaseConfig();

        // Inicialização Firebase
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        // Salvar módulos globalmente para uso posterior
        window.firestoreModules = { 
            collection, query, orderBy, onSnapshot, doc, getDoc, setDoc 
        };
        
        // Salvar funções seguras globalmente para uso posterior
        window.secureConfigFunctions = { isAdminEmail, isSpecialEmail };
        
        console.log('🔥 Firebase inicializado com sucesso');
        
        // Configurar autenticação
        onAuthStateChanged(auth, handleAuthChange);
        
        // Carregar campanhas imediatamente, independente da autenticação
        // Com um delay menor para garantir que seja executado primeiro
        setTimeout(() => {
            carregarCampanhas();
        }, 100);
        
        // Backup: se por algum motivo não carregar na primeira tentativa
        setTimeout(() => {
            if (campanhasCache.length === 0 && db) {
                console.log('🔄 Tentativa backup de carregamento de campanhas...');
                carregarCampanhas();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        mostrarLoading(false);
        mostrarEmptyState(true, 'Erro ao conectar com o servidor. Recarregue a página.');
    }
}

function configurarEventListeners() {
    // Filtros
    aplicarFiltrosBtn?.addEventListener('click', aplicarFiltros);
    limparFiltrosBtn?.addEventListener('click', limparFiltros);
    
    // Menu mobile - usar função global do main.js
    // A função configurarMenuMobile já está sendo chamada no main.js
    
    // Back to top
    configurarBackToTop();
    
    // Navbar scroll
    configurarNavbarScroll();
    
    // Modals
    configurarModals();
    
    // Listener para atualizações de plano vindas do perfil
    window.addEventListener('planoAtualizado', function(event) {
        const { email, plano } = event.detail;
        console.log('📢 Recebida atualização de plano:', { email, plano });
        
        // Se for o usuário atual, atualizar permissões
        if (auth?.currentUser && auth.currentUser.email.toLowerCase() === email.toLowerCase()) {
            console.log('🔄 Atualizando permissões do usuário atual');
            
            // Atualizar estado global - NOVA LISTA DE PLANOS
            const planosComBeneficios = ['minuta', 'minutos', 'relogio', 'lorde', 'nobreza', 'familiareal', 'pracadotempo', 'atemporal', 'cronomante', 'administrador'];
            
            if (plano && planosComBeneficios.includes(plano)) {
                userHasPlano = true;
                userPlano = plano;
            } else {
                userHasPlano = false;
                userPlano = plano;
            }
            
            // Recarregar campanhas para atualizar botões
            renderizarCampanhas();
        }
    });
    
    console.log('🎯 Event listeners configurados');
}

// ==================== CAMPANHAS CORE ==================== //
function carregarCampanhas() {
    console.log('📡 Tentando carregar campanhas...', {
        dbExists: !!db,
        firestoreModules: !!window.firestoreModules
    });
    
    if (!db || !window.firestoreModules) {
        console.log('⏳ Aguardando Firebase ou módulos...');
        setTimeout(carregarCampanhas, 500);
        return;
    }
    
    console.log('🔄 Iniciando carregamento de campanhas...');
    mostrarLoading(true);
    
    try {
        const { collection, query, orderBy, onSnapshot } = window.firestoreModules;
        
        // Tentar query simples primeiro, sem orderBy se houver problemas
        let q;
        try {
            q = query(collection(db, 'campanhas'), orderBy('criadaEm', 'desc'));
        } catch (orderError) {
            console.log('⚠️ Erro com orderBy, usando query simples:', orderError);
            q = collection(db, 'campanhas');
        }
        
        onSnapshot(q, (snapshot) => {
            console.log('📊 Snapshot recebido:', {
                size: snapshot.size,
                empty: snapshot.empty
            });
            
            campanhasCache = [];
            let sistemasSet = new Set();
            let vagasSet = new Set();
            let diasSet = new Set();
            let horariosSet = new Set();
            let totalJogadores = 0;
            
            snapshot.forEach(docSnap => {
                const campanha = docSnap.data();
                campanha.id = docSnap.id;
                campanhasCache.push(campanha);
                
                // Coletar dados para filtros
                if (campanha.sistema) sistemasSet.add(campanha.sistema);
                if (campanha.vagas) vagasSet.add(campanha.vagas.toString());
                if (campanha.dia) diasSet.add(campanha.dia);
                if (campanha.horario) horariosSet.add(campanha.horario);
                
                // Contar jogadores
                if (campanha.jogadores && Array.isArray(campanha.jogadores)) {
                    totalJogadores += campanha.jogadores.length;
                }
            });
            
            console.log('📋 Campanhas processadas:', {
                total: campanhasCache.length,
                totalJogadores,
                userPlano,
                userIsAdmin,
                userHasPlano
            });
            
            // Atualizar filtros
            atualizarFiltros(
                Array.from(sistemasSet).sort(),
                Array.from(vagasSet).sort(),
                Array.from(diasSet).sort(),
                Array.from(horariosSet).sort()
            );
            
            // Atualizar estatísticas
            atualizarEstatisticas(campanhasCache.length, totalJogadores);
            
            // Renderizar campanhas
            renderizarCampanhas();
            mostrarLoading(false);
            
            console.log(`✅ ${campanhasCache.length} campanhas carregadas e renderizadas`);
        }, (error) => {
            console.error('❌ Erro ao carregar campanhas:', error);
            
            // Tratar diferentes tipos de erro
            if (error.code === 'permission-denied') {
                console.error('🚫 Erro de permissão: Verifique as regras do Firestore');
                mostrarEmptyState(true, 'Erro de acesso ao banco de dados. Tente recarregar a página.');
            } else if (error.code === 'unavailable') {
                console.error('📡 Firebase indisponível: Problemas de conexão');
                mostrarEmptyState(true, 'Problemas de conexão. Verifique sua internet e tente novamente.');
            } else {
                console.error('🔧 Erro genérico:', error.message);
                mostrarEmptyState(true, 'Erro ao carregar campanhas. Tente recarregar a página.');
            }
            
            mostrarLoading(false);
        });
    } catch (error) {
        console.error('❌ Erro ao configurar listener de campanhas:', error);
        mostrarLoading(false);
        
        if (error.code === 'permission-denied') {
            mostrarEmptyState(true, 'Erro de permissões. Verifique sua conexão e tente novamente.');
        } else {
            mostrarEmptyState(true, 'Erro ao conectar com o banco de dados. Recarregue a página.');
        }
    }
}

function renderizarCampanhas() {
    console.log('🎨 Renderizando campanhas...', {
        campanhasCacheLength: campanhasCache.length,
        userPlano,
        userIsAdmin,
        userHasPlano,
        currentUser: auth?.currentUser?.email || 'não logado'
    });
    
    if (!campanhasCache.length) {
        console.log('📭 Nenhuma campanha no cache, mostrando empty state');
        mostrarEmptyState(true);
        return;
    }
    
    const campanhasFiltradas = aplicarFiltrosCampanhas();
    console.log('🔍 Campanhas após filtros:', campanhasFiltradas.length);
    
    if (!campanhasFiltradas.length) {
        console.log('🚫 Nenhuma campanha após filtros, mostrando empty state');
        mostrarEmptyState(true, 'Nenhuma campanha encontrada com os filtros aplicados');
        return;
    }
    
    let html = '';
    const user = auth?.currentUser;
    const userEmail = user ? user.email : null;
    
    campanhasFiltradas.forEach((campanha, index) => {
        const jaInscrito = user && usuarioEstaInscrito(campanha, userEmail);
        const podeRequisitar = verificarPermissaoRequisicao(campanha);
        
        html += criarCardCampanha(campanha, jaInscrito, podeRequisitar, index);
    });
    
    console.log('🎯 HTML gerado para campanhas:', html.length > 0 ? 'OK' : 'VAZIO');
    
    if (campanhasLista) {
        campanhasLista.innerHTML = html;
        campanhasLista.classList.remove('hidden');
        console.log('✅ Campanhas inseridas no DOM');
    } else {
        console.error('❌ Elemento campanhas-lista não encontrado!');
    }
    
    mostrarEmptyState(false);
    
    // Configurar eventos dos cards
    setTimeout(() => {
        configurarEventosCards();
        animarCards();
    }, 100);
}

function criarCardCampanha(campanha, jaInscrito, podeRequisitar, index) {
    const user = auth?.currentUser;
    const delay = Math.min(index * 100, 500);
    
    return `
        <div class="campanha-card card-campanha-clicavel animate-fadeInUp" style="animation-delay: ${delay}ms" data-campanha-id="${campanha.id}">
            ${campanha.imagem ? `
                <div class="campanha-image">
                    <img src="${campanha.imagem}" alt="${campanha.nome}" class="campanha-img">
                    ${criarBadgeCampanha(campanha)}
                </div>
            ` : ''}
            <div class="campanha-header ${campanha.imagem ? 'with-image' : ''}">
                ${!campanha.imagem ? `
                    <div class="campanha-icon">
                        <i class="fas fa-dungeon"></i>
                    </div>
                ` : ''}
                <h3 class="campanha-nome">
                    ${campanha.visibilidade?.nome !== false ? campanha.nome : '<span class="text-muted">(Nome oculto)</span>'}
                </h3>
                ${!campanha.imagem ? criarBadgeCampanha(campanha) : ''}
            </div>
            
            <div class="campanha-body">
                <p class="campanha-descricao">
                    ${campanha.visibilidade?.descricao !== false ? (campanha.descricao || 'Sem descrição disponível') : 'Descrição oculta'}
                </p>
                
                <div class="campanha-detalhes">
                    <div class="detalhe-item">
                        <i class="fas fa-gamepad"></i>
                        <span>Sistema: ${campanha.visibilidade?.sistema !== false ? campanha.sistema : 'Oculto'}</span>
                    </div>
                    <div class="detalhe-item">
                        <i class="fas fa-users"></i>
                        <span>Vagas: ${campanha.visibilidade?.vagas !== false ? criarInfoVagas(campanha) : 'Oculto'}</span>
                    </div>
                    <div class="detalhe-item">
                        <i class="fas fa-calendar"></i>
                        <span>Dia: ${campanha.visibilidade?.dia !== false ? campanha.dia : 'Oculto'}</span>
                    </div>
                    <div class="detalhe-item">
                        <i class="fas fa-clock"></i>
                        <span>Horário: ${campanha.visibilidade?.horario !== false ? campanha.horario : 'Oculto'}</span>
                    </div>
                    <div class="detalhe-item">
                        <i class="fas fa-crown"></i>
                        <span>Plano: ${formatarPlano(campanha)}</span>
                    </div>
                </div>
            </div>
            
            <div class="campanha-actions" onclick="event.stopPropagation()">
                ${criarBotoesCampanha(campanha, jaInscrito, podeRequisitar, user)}
            </div>
        </div>
    `;
}

function criarBadgeCampanha(campanha) {
    let badges = '';
    
    // Badge de vagas lotadas
    if (campanha.vagas && campanha.jogadores && campanha.jogadores.length >= campanha.vagas) {
        badges += '<div class="campanha-badge campanha-lotada"><i class="fas fa-lock"></i> Lotada</div>';
    }
    
    // Outros badges
    if (campanha.destaque) {
        badges += '<div class="campanha-badge campanha-destaque"><i class="fas fa-star"></i> Destaque</div>';
    }
    if (campanha.novo) {
        badges += '<div class="campanha-badge campanha-nova"><i class="fas fa-sparkles"></i> Nova</div>';
    }
    
    return badges;
}

function criarInfoVagas(campanha) {
    if (!campanha.vagas) return 'Não especificado';
    
    const totalVagas = parseInt(campanha.vagas) || 0;
    const vagasOcupadas = campanha.jogadores ? campanha.jogadores.length : 0;
    const vagasDisponiveis = Math.max(0, totalVagas - vagasOcupadas);
    
    // Criar indicador visual das vagas
    let indicador = '';
    if (vagasDisponiveis === 0) {
        indicador = `<span class="vagas-status vagas-lotada">${vagasOcupadas}/${totalVagas} (Lotada)</span>`;
    } else if (vagasDisponiveis <= 2) {
        indicador = `<span class="vagas-status vagas-poucas">${vagasOcupadas}/${totalVagas} (${vagasDisponiveis} restante${vagasDisponiveis !== 1 ? 's' : ''})</span>`;
    } else {
        indicador = `<span class="vagas-status vagas-disponiveis">${vagasOcupadas}/${totalVagas} (${vagasDisponiveis} restante${vagasDisponiveis !== 1 ? 's' : ''})</span>`;
    }
    
    return indicador;
}

function verificarVagasDisponiveis(campanha) {
    if (!campanha.vagas) return true; // Se não especificado, considera como disponível
    
    const totalVagas = parseInt(campanha.vagas) || 0;
    const vagasOcupadas = campanha.jogadores ? campanha.jogadores.length : 0;
    
    return vagasOcupadas < totalVagas;
}

function criarBotoesCampanha(campanha, jaInscrito, podeRequisitar, user) {
    let botoes = '';
    const temVagasDisponiveis = verificarVagasDisponiveis(campanha);
    
    console.log('🔧 Criando botões para campanha:', {
        campanhaId: campanha.id,
        campanhaNome: campanha.nome,
        user: user ? user.email : 'não logado',
        userIsAdmin,
        userHasPlano,
        userPlano,
        jaInscrito,
        podeRequisitar,
        temVagasDisponiveis
    });
    
    // Botão admin para gerenciar jogadores
    if (userIsAdmin) {
        botoes += `
            <button class="lorde-btn campanha-btn-admin" data-gerenciar-campanha-id="${campanha.id}">
                <i class="fas fa-users"></i>
                Gerenciar Jogadores
            </button>
        `;
    }
    
    // Botões principais
    if (!user || (!userHasPlano && !userIsAdmin)) {
        // Usuário não logado ou sem plano
        console.log('📋 Exibindo botão Selecionar Plano - motivo:', !user ? 'usuário não logado' : 'usuário sem plano');
        botoes += `
            <button class="accent-btn campanha-btn-plano" data-apenas-assinantes="true">
                <i class="fas fa-crown"></i>
                Selecionar Plano
            </button>
        `;
    } else if (userIsAdmin || podeRequisitar) {
        // Usuário pode participar
        if (jaInscrito) {
            botoes += `
                <button class="success-btn campanha-btn-ver" data-ver-campanha-id="${campanha.id}">
                    <i class="fas fa-eye"></i>
                    Ver Campanha
                </button>
            `;
        } else if (!temVagasDisponiveis) {
            // Mesa lotada - usuário não pode mais entrar
            botoes += `
                <button class="disabled-btn" disabled title="Mesa lotada - não há vagas disponíveis">
                    <i class="fas fa-lock"></i>
                    Mesa Lotada
                </button>
            `;
        } else {
            // Pode requisitar vaga
            botoes += `
                <button class="lorde-btn campanha-btn-requisitar" data-campanha-id="${campanha.id}">
                    <i class="fas fa-plus"></i>
                    Requisitar Vaga
                </button>
            `;
        }
    } else {
        // Usuário sem permissão
        botoes += `
            <button class="disabled-btn" disabled>
                <i class="fas fa-lock"></i>
                Entre em contato no Discord
            </button>
        `;
    }
    
    return botoes;
}

function formatarPlano(campanha) {
    if (campanha.visibilidade?.plano === false) return 'Oculto';
    if (!campanha.plano) return 'Não especificado';
    
    const planoInfo = PLANOS_SISTEMA[campanha.plano];
    return planoInfo ? planoInfo.nome : campanha.plano.charAt(0).toUpperCase() + campanha.plano.slice(1);
}

// ==================== FILTROS ==================== //
function atualizarFiltros(sistemas, vagas, dias, horarios) {
    if (!filtroSistema) return;
    
    // Atualizar select de sistemas
    filtroSistema.innerHTML = '<option value="">Todos os sistemas</option>' + 
        sistemas.map(s => `<option value="${s}">${s}</option>`).join('');
    
    // Atualizar select de vagas
    filtroVagas.innerHTML = '<option value="">Todas as vagas</option>' + 
        vagas.map(v => `<option value="${v}">${v}</option>`).join('');
    
    // Atualizar select de dias
    filtroDia.innerHTML = '<option value="">Todos os dias</option>' + 
        dias.map(d => `<option value="${d}">${d}</option>`).join('');
    
    // Atualizar select de horários
    filtroHorario.innerHTML = '<option value="">Todos os horários</option>' + 
        horarios.map(h => `<option value="${h}">${h}</option>`).join('');
}

function aplicarFiltros() {
    filtrosAplicados = true;
    renderizarCampanhas();
    
    // Feedback visual
    if (aplicarFiltrosBtn) {
        aplicarFiltrosBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Filtros Aplicados';
        setTimeout(() => {
            aplicarFiltrosBtn.innerHTML = '<i class="fas fa-filter mr-2"></i>Aplicar Filtros';
        }, 2000);
    }
}

function limparFiltros() {
    if (filtroSistema) filtroSistema.value = '';
    if (filtroVagas) filtroVagas.value = '';
    if (filtroDia) filtroDia.value = '';
    if (filtroHorario) filtroHorario.value = '';
    
    filtrosAplicados = false;
    renderizarCampanhas();
    
    console.log('Filtros removidos');
}

function aplicarFiltrosCampanhas() {
    if (!filtrosAplicados && !temFiltrosAtivos()) {
        return campanhasCache;
    }
    
    const sistema = filtroSistema?.value || '';
    const vagas = filtroVagas?.value || '';
    const dia = filtroDia?.value || '';
    const horario = filtroHorario?.value || '';
    
    return campanhasCache.filter(campanha => {
        if (sistema && campanha.sistema && 
            campanha.sistema.toString().toLowerCase().trim() !== sistema.toString().toLowerCase().trim()) {
            return false;
        }
        
        if (vagas && campanha.vagas && 
            campanha.vagas.toString() !== vagas.toString()) {
            return false;
        }
        
        if (dia && campanha.dia && 
            campanha.dia.toString().toLowerCase().trim() !== dia.toString().toLowerCase().trim()) {
            return false;
        }
        
        if (horario && campanha.horario && 
            campanha.horario !== horario) {
            return false;
        }
        
        return true;
    });
}

function temFiltrosAtivos() {
    return (filtroSistema?.value || '') || (filtroVagas?.value || '') || 
           (filtroDia?.value || '') || (filtroHorario?.value || '');
}

// ==================== EVENTOS DOS CARDS ==================== //
function configurarEventosCards() {
    // Clique nos cards para abrir detalhes
    document.querySelectorAll('.card-campanha-clicavel').forEach(card => {
        card.addEventListener('click', (e) => {
            // Evitar abrir modal se clicou em um botão
            if (e.target.closest('.campanha-actions')) {
                return;
            }
            
            const campanhaId = card.getAttribute('data-campanha-id');
            if (campanhaId) {
                console.log('🎯 Abrindo detalhes da campanha:', campanhaId);
                abrirModalDetalhesCampanha(campanhaId);
            }
        });
    });
    
    // Botões "Selecionar Plano"
    document.querySelectorAll('[data-apenas-assinantes="true"]').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'index.html#planos';
        });
    });
    
    // Botões "Gerenciar Jogadores" (admin)
    document.querySelectorAll('[data-gerenciar-campanha-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const campanhaId = btn.getAttribute('data-gerenciar-campanha-id');
            abrirModalGerenciarJogadores(campanhaId);
        });
    });
    
    // Botões "Requisitar Vaga"
    document.querySelectorAll('.campanha-btn-requisitar[data-campanha-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const campanhaId = btn.getAttribute('data-campanha-id');
            const campanhaCard = btn.closest('.campanha-card');
            const campanhaNome = campanhaCard.querySelector('.campanha-nome').textContent.trim();
            
            console.log('🎯 Usuário clicou em Requisitar Vaga:', {
                campanhaId,
                campanhaNome,
                userHasPlano,
                userIsAdmin,
                userPlano
            });
            
            if (!userHasPlano && !userIsAdmin) {
                console.log('❌ Usuário não pode requisitar: sem plano válido');
                showNotification('Você precisa de um plano para requisitar vaga.', 'error');
                return;
            }
            
            // Buscar dados da campanha para verificação adicional
            const campanha = campanhasCache.find(c => c.id === campanhaId);
            if (campanha) {
                const podeRequisitar = verificarPermissaoRequisicao(campanha);
                console.log('🔐 Verificação final de permissão:', {
                    podeRequisitar,
                    campanhaPlano: campanha.plano,
                    userPlano
                });
                
                if (!podeRequisitar) {
                    console.log('❌ Usuário não atende aos requisitos da campanha');
                    showNotification(`Esta campanha requer plano ${campanha.plano} ou superior. Seu plano atual: ${userPlano}`, 'error');
                    return;
                }
            }
            
            console.log('✅ Abrindo modal para requisitar vaga');
            abrirModalRequisitarVaga(campanhaId, campanhaNome);
        });
    });
    
    // Botões "Ver Campanha"
    document.querySelectorAll('[data-ver-campanha-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.setItem('perfilUltimaAba', 'mesas');
            window.location.href = 'perfil.html';
        });
    });
}

// ==================== BACK TO TOP ==================== //
function configurarBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 500) {
            backToTopBtn?.classList.add('visible');
        } else {
            backToTopBtn?.classList.remove('visible');
        }
    });
    
    backToTopBtn?.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ==================== NAVBAR SCROLL ==================== //
function configurarNavbarScroll() {
    const navbar = document.getElementById('navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        if (scrollTop > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
}

// ==================== MODALS ==================== //
function configurarModals() {
    // Modal requisitar vaga
    const modalRequisitar = document.getElementById('modal-requisitar-vaga');
    const fecharRequisitar = document.getElementById('fechar-modal-requisitar');
    
    fecharRequisitar?.addEventListener('click', () => {
        modalRequisitar?.classList.remove('active');
    });
    
    modalRequisitar?.addEventListener('click', (e) => {
        if (e.target === modalRequisitar) {
            modalRequisitar?.classList.remove('active');
        }
    });
    
    // Modal gerenciar jogadores
    const modalGerenciar = document.getElementById('modal-gerenciar-jogadores');
    const fecharGerenciar = document.getElementById('fechar-modal-gerenciar');
    
    fecharGerenciar?.addEventListener('click', () => {
        modalGerenciar?.classList.remove('active');
    });
    
    modalGerenciar?.addEventListener('click', (e) => {
        if (e.target === modalGerenciar) {
            modalGerenciar?.classList.remove('active');
        }
    });
    
    // Modal detalhes da campanha
    const modalDetalhes = document.getElementById('modal-detalhes-campanha');
    const fecharDetalhes = document.getElementById('fechar-modal-detalhes');
    
    fecharDetalhes?.addEventListener('click', () => {
        modalDetalhes?.classList.remove('active');
    });
    
    modalDetalhes?.addEventListener('click', (e) => {
        if (e.target === modalDetalhes) {
            modalDetalhes?.classList.remove('active');
        }
    });
}

function abrirModalDetalhesCampanha(campanhaId) {
    const campanha = campanhasCache.find(c => c.id === campanhaId);
    if (!campanha) {
        console.error('Campanha não encontrada:', campanhaId);
        return;
    }

    const modal = document.getElementById('modal-detalhes-campanha');
    const modalTitulo = document.getElementById('modal-detalhes-titulo');
    const modalBody = document.getElementById('modal-body-detalhes');
    
    if (!modal || !modalTitulo || !modalBody) {
        console.error('Elementos do modal não encontrados');
        return;
    }

    // Atualizar título do modal
    modalTitulo.textContent = campanha.visibilidade?.nome !== false ? campanha.nome : 'Campanha';

    // Verificar permissões do usuário
    const user = auth?.currentUser;
    const jaInscrito = user ? usuarioEstaInscrito(campanha, user.email) : false;
    const podeRequisitar = verificarPermissaoRequisicao(campanha);
    const temVagasDisponiveis = verificarVagasDisponiveis(campanha);

    // Criar badges da campanha
    let badges = '';
    if (campanha.vagas && campanha.jogadores && campanha.jogadores.length >= campanha.vagas) {
        badges += '<div class="detalhes-badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;"><i class="fas fa-lock mr-1"></i> Lotada</div>';
    }
    if (campanha.destaque) {
        badges += '<div class="detalhes-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;"><i class="fas fa-star mr-1"></i> Destaque</div>';
    }
    if (campanha.novo) {
        badges += '<div class="detalhes-badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981;"><i class="fas fa-sparkles mr-1"></i> Nova</div>';
    }

    // Criar seção de informações básicas
    const informacoesBasicas = `
        <div class="detalhes-info-item">
            <i class="fas fa-gamepad"></i>
            <div class="detalhes-info-label">Sistema:</div>
            <div class="detalhes-info-valor">${campanha.visibilidade?.sistema !== false ? (campanha.sistema || 'Não especificado') : 'Oculto'}</div>
        </div>
        <div class="detalhes-info-item">
            <i class="fas fa-users"></i>
            <div class="detalhes-info-label">Vagas:</div>
            <div class="detalhes-info-valor">${campanha.visibilidade?.vagas !== false ? criarInfoVagas(campanha) : 'Oculto'}</div>
        </div>
        <div class="detalhes-info-item">
            <i class="fas fa-calendar"></i>
            <div class="detalhes-info-label">Dia:</div>
            <div class="detalhes-info-valor">${campanha.visibilidade?.dia !== false ? (campanha.dia || 'Não especificado') : 'Oculto'}</div>
        </div>
        <div class="detalhes-info-item">
            <i class="fas fa-clock"></i>
            <div class="detalhes-info-label">Horário:</div>
            <div class="detalhes-info-valor">${campanha.visibilidade?.horario !== false ? (campanha.horario || 'Não especificado') : 'Oculto'}</div>
        </div>
        <div class="detalhes-info-item">
            <i class="fas fa-crown"></i>
            <div class="detalhes-info-label">Plano:</div>
            <div class="detalhes-info-valor">${formatarPlano(campanha)}</div>
        </div>
    `;

    // Criar seção de requisitos (se existir)
    let requisitosSection = '';
    if (campanha.requisitos && campanha.visibilidade?.requisitos !== false) {
        const requisitos = Array.isArray(campanha.requisitos) ? campanha.requisitos : [campanha.requisitos];
        requisitosSection = `
            <div class="detalhes-secao">
                <h3 class="detalhes-secao-titulo">
                    <i class="fas fa-list-check"></i>
                    Requisitos
                </h3>
                <div class="detalhes-secao-conteudo">
                    <ul class="detalhes-lista">
                        ${requisitos.map(req => `<li><i class="fas fa-chevron-right"></i> ${req}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // Criar seção de regras (se existir)
    let regrasSection = '';
    if (campanha.regras && campanha.visibilidade?.regras !== false) {
        const regras = Array.isArray(campanha.regras) ? campanha.regras : [campanha.regras];
        regrasSection = `
            <div class="detalhes-secao">
                <h3 class="detalhes-secao-titulo">
                    <i class="fas fa-gavel"></i>
                    Regras
                </h3>
                <div class="detalhes-secao-conteudo">
                    <ul class="detalhes-lista">
                        ${regras.map(regra => `<li><i class="fas fa-chevron-right"></i> ${regra}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // Criar seção de descrição
    const descricaoSection = `
        <div class="detalhes-secao">
            <h3 class="detalhes-secao-titulo">
                <i class="fas fa-scroll"></i>
                Descrição
            </h3>
            <div class="detalhes-secao-conteudo">
                <div class="detalhes-descricao">
                    ${campanha.visibilidade?.descricao !== false ? (campanha.descricao || 'Nenhuma descrição disponível.') : 'Descrição oculta'}
                </div>
            </div>
        </div>
    `;

    // Criar seção de informações básicas
    const informacoesSection = `
        <div class="detalhes-secao">
            <h3 class="detalhes-secao-titulo">
                <i class="fas fa-info-circle"></i>
                Informações
            </h3>
            <div class="detalhes-secao-conteudo">
                ${informacoesBasicas}
            </div>
        </div>
    `;

    // Criar botões de ação
    let botoesAcao = '';
    if (!user || (!userHasPlano && !userIsAdmin)) {
        botoesAcao = `
            <button class="accent-btn" onclick="window.location.href='index.html#planos'">
                <i class="fas fa-crown mr-2"></i>Selecionar Plano
            </button>
        `;
    } else if (userIsAdmin) {
        botoesAcao = `
            <button class="lorde-btn" onclick="abrirModalGerenciarJogadores('${campanha.id}')">
                <i class="fas fa-users mr-2"></i>Gerenciar Jogadores
            </button>
        `;
        if (jaInscrito) {
            botoesAcao += `
                <button class="success-btn" onclick="localStorage.setItem('perfilUltimaAba', 'mesas'); window.location.href = 'perfil.html';">
                    <i class="fas fa-eye mr-2"></i>Ver Campanha
                </button>
            `;
        } else if (temVagasDisponiveis) {
            botoesAcao += `
                <button class="secondary-btn" onclick="abrirModalRequisitarVaga('${campanha.id}', '${campanha.nome}')">
                    <i class="fas fa-plus mr-2"></i>Requisitar Vaga
                </button>
            `;
        }
    } else if (podeRequisitar) {
        if (jaInscrito) {
            botoesAcao = `
                <button class="success-btn" onclick="localStorage.setItem('perfilUltimaAba', 'mesas'); window.location.href = 'perfil.html';">
                    <i class="fas fa-eye mr-2"></i>Ver Campanha
                </button>
            `;
        } else if (!temVagasDisponiveis) {
            botoesAcao = `
                <button class="disabled-btn" disabled>
                    <i class="fas fa-lock mr-2"></i>Mesa Lotada
                </button>
            `;
        } else {
            botoesAcao = `
                <button class="lorde-btn" onclick="abrirModalRequisitarVaga('${campanha.id}', '${campanha.nome}')">
                    <i class="fas fa-plus mr-2"></i>Requisitar Vaga
                </button>
            `;
        }
    } else {
        botoesAcao = `
            <button class="disabled-btn" disabled>
                <i class="fas fa-lock mr-2"></i>Entre em contato no Discord
            </button>
            <a href="https://discord.gg/BHgQ2XZ89Y" target="_blank" rel="noopener" class="discord-btn">
                <i class="fab fa-discord mr-2"></i>Discord
            </a>
        `;
    }

    // Montar o conteúdo do modal
    modalBody.innerHTML = `
        <div class="detalhes-campanha">
            <div class="detalhes-campanha-header ${campanha.imagem ? 'com-imagem' : 'sem-imagem'}" 
                 ${campanha.imagem ? `style="background-image: url('${campanha.imagem}')"` : ''}>
                <div>
                    <h1 class="detalhes-campanha-titulo">
                        ${campanha.visibilidade?.nome !== false ? campanha.nome : 'Nome da Campanha Oculto'}
                    </h1>
                    <div class="detalhes-campanha-sistema">
                        <i class="fas fa-gamepad mr-2"></i>
                        ${campanha.visibilidade?.sistema !== false ? (campanha.sistema || 'Sistema não especificado') : 'Sistema oculto'}
                    </div>
                    ${badges ? `<div class="detalhes-badges">${badges}</div>` : ''}
                </div>
            </div>
            
            <div class="detalhes-conteudo">
                <div class="detalhes-grid">
                    ${descricaoSection}
                    ${informacoesSection}
                </div>
                
                ${requisitosSection || regrasSection ? `<div class="detalhes-grid">${requisitosSection}${regrasSection}</div>` : ''}
            </div>
            
            <div class="detalhes-acoes">
                <div class="detalhes-btn-group">
                    ${botoesAcao}
                </div>
            </div>
        </div>
    `;

    // Mostrar o modal
    modal.classList.add('active');
}

function abrirModalRequisitarVaga(campanhaId, campanhaNome) {
    const modal = document.getElementById('modal-requisitar-vaga');
    const modalBody = document.getElementById('modal-body-requisitar');
    
    if (!modal || !modalBody) return;
    
    // Limpar listeners antigos para evitar duplicação
    const btnCancelar = document.getElementById('btn-cancelar-requisitar');
    const btnConfirmar = document.getElementById('btn-confirmar-requisitar');
    
    if (btnCancelar) {
        btnCancelar.replaceWith(btnCancelar.cloneNode(true));
    }
    if (btnConfirmar) {
        btnConfirmar.replaceWith(btnConfirmar.cloneNode(true));
    }
    
    // Verificar se a campanha ainda tem vagas disponíveis
    const campanha = campanhasCache.find(c => c.id === campanhaId);
    if (campanha && !verificarVagasDisponiveis(campanha)) {
        modalBody.innerHTML = `
            <div class="modal-content-inner">
                <div class="modal-error">
                    <i class="fas fa-lock text-4xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">Mesa Lotada</h3>
                    <p class="modal-text">
                        Infelizmente a campanha <strong class="text-primary">${campanhaNome}</strong> 
                        não possui mais vagas disponíveis.
                    </p>
                    <p class="text-sm text-muted mt-2">
                        ${criarInfoVagas(campanha)}
                    </p>
                </div>
                
                <div class="modal-actions">
                    <button id="btn-fechar-lotada" class="lorde-btn">
                        <i class="fas fa-check mr-2"></i>Entendi
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        
        document.getElementById('btn-fechar-lotada').onclick = () => {
            modal.classList.remove('active');
        };
        
        return;
    }
    
    modalBody.innerHTML = `
        <div class="modal-content-inner">
            <p class="modal-text">
                Deseja realmente requisitar vaga para a campanha 
                <strong class="text-primary">${campanhaNome}</strong>?
            </p>
            
            ${campanha ? `
                <div class="modal-info-vagas">
                    <i class="fas fa-users mr-2"></i>
                    ${criarInfoVagas(campanha)}
                </div>
            ` : ''}
            
            <div class="form-group">
                <label for="input-discord-requisitar" class="form-label">
                    <i class="fab fa-discord mr-2"></i>Seu Discord
                </label>
                <input 
                    type="text" 
                    id="input-discord-requisitar" 
                    class="form-input" 
                    placeholder="Seu nick do Discord (ex: usuario#1234)"
                    required
                >
                <small class="form-help">
                    <i class="fas fa-info-circle mr-1"></i>
                    Seu Discord será atualizado automaticamente no seu perfil
                </small>
            </div>
            
            <div class="modal-actions">
                <button id="btn-cancelar-requisitar" class="secondary-btn">
                    <i class="fas fa-times mr-2"></i>Cancelar
                </button>
                <button id="btn-confirmar-requisitar" class="lorde-btn">
                    <i class="fas fa-check mr-2"></i>Confirmar
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Event listeners
    document.getElementById('btn-cancelar-requisitar').onclick = () => {
        modal.classList.remove('active');
    };
    
    document.getElementById('btn-confirmar-requisitar').onclick = async (e) => {
        const btn = e.target;
        const discord = document.getElementById('input-discord-requisitar').value.trim();
        
        if (!discord) {
            showNotification('Por favor, informe seu Discord.', 'warning');
            return;
        }
        
        // Desabilitar botão durante processamento
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processando...';
        
        try {
            await requisitarVaga(campanhaId, discord);
            modal.classList.remove('active');
        } catch (error) {
            console.error('Erro no handler do botão:', error);
        } finally {
            // Reabilitar botão
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Confirmar';
        }
    };
    
    // Pré-preencher Discord se disponível e focar no input
    setTimeout(async () => {
        const inputDiscord = document.getElementById('input-discord-requisitar');
        if (inputDiscord && auth?.currentUser) {
            console.log('🔍 Carregando Discord do perfil para pré-preenchimento...');
            try {
                const { doc, getDoc } = window.firestoreModules;
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const userSnap = await getDoc(userRef);
                
                console.log('📋 Dados do usuário carregados:', {
                    exists: userSnap.exists(),
                    uid: auth.currentUser.uid
                });
                
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    console.log('👤 Discord no perfil:', userData.discord);
                    
                    if (userData.discord && userData.discord.trim() !== '') {
                        inputDiscord.value = userData.discord;
                        inputDiscord.placeholder = 'Discord carregado do seu perfil';
                        console.log('✅ Discord pré-preenchido:', userData.discord);
                    } else {
                        console.log('ℹ️ Usuário não tem Discord cadastrado no perfil');
                    }
                } else {
                    console.log('ℹ️ Documento do usuário não existe');
                }
            } catch (error) {
                console.error('❌ Erro ao carregar Discord do perfil:', error);
            }
        }
        inputDiscord?.focus();
    }, 300);
}

function abrirModalGerenciarJogadores(campanhaId) {
    const modal = document.getElementById('modal-gerenciar-jogadores');
    const modalBody = document.getElementById('modal-body-gerenciar');
    
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = `
        <div class="modal-content-inner">
            <div id="lista-jogadores-gerenciar" class="jogadores-lista">
                <div class="loading-small">
                    <i class="fas fa-spinner fa-spin"></i>
                    Carregando jogadores...
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    if (!window.firestoreModules) return;
    
    const { doc, onSnapshot, setDoc, getDoc } = window.firestoreModules;
    
    // Escutar mudanças em tempo real
    const campanhaRef = doc(db, 'campanhas', campanhaId);
    const unsubscribe = onSnapshot(campanhaRef, (snap) => {
        if (!snap.exists()) return;
        
        const data = snap.data();
        const jogadores = Array.isArray(data.jogadores) ? data.jogadores : [];
        const lista = document.getElementById('lista-jogadores-gerenciar');
        
        if (!lista) return;
        
        if (jogadores.length === 0) {
            lista.innerHTML = `
                <div class="empty-jogadores">
                    <i class="fas fa-users text-4xl text-muted mb-4"></i>
                    <p>Nenhum jogador inscrito ainda.</p>
                </div>
            `;
        } else {
            lista.innerHTML = jogadores.map((jogador, index) => `
                <div class="jogador-item">
                    <div class="jogador-info">
                        <div class="jogador-nome">
                            <i class="fab fa-discord mr-2"></i>
                            ${jogador.discord || jogador.nome || '(Sem Discord)'}
                        </div>
                        <div class="jogador-email">${jogador.email || ''}</div>
                        <div class="jogador-plano">Plano: ${jogador.plano || 'Não especificado'}</div>
                    </div>

                </div>
            `).join('');
            
            // Adicionar event listeners para os botões de remover
            lista.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const campanhaId = this.getAttribute('data-campanha-id');
                    const jogadorIndex = parseInt(this.getAttribute('data-jogador-index'));
                    
                    if (!confirm('Tem certeza que deseja remover este jogador da campanha?')) return;
                    
                    try {
                        const { doc, getDoc, setDoc } = window.firestoreModules;
                        const campanhaRef = doc(db, 'campanhas', campanhaId);
                        const snap = await getDoc(campanhaRef);
                        
                        if (snap.exists()) {
                            const data = snap.data();
                            const jogadores = Array.isArray(data.jogadores) ? [...data.jogadores] : [];
                            
                            if (jogadorIndex >= 0 && jogadorIndex < jogadores.length) {
                                jogadores.splice(jogadorIndex, 1);
                                await setDoc(campanhaRef, { jogadores }, { merge: true });
                                console.log('Jogador removido com sucesso!');
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao remover jogador:', error);
                        console.log('Erro ao remover jogador!');
                    }
                });
            });
        }
    });
    
    // Limpar listener quando modal fechar
    modal.addEventListener('transitionend', function handler(e) {
        if (e.target === modal && !modal.classList.contains('active')) {
            unsubscribe();
            modal.removeEventListener('transitionend', handler);
        }
    });
}

// ==================== REQUISITAR VAGA ==================== //
// Variável para controlar se uma requisição está em andamento
let requisicaoEmAndamento = false;

async function requisitarVaga(campanhaId, discordManual) {
    // Prevenir múltiplas requisições simultâneas
    if (requisicaoEmAndamento) {
        console.log('⚠️ Requisição já em andamento, ignorando nova tentativa');
        return;
    }
    
    requisicaoEmAndamento = true;
    
    try {
        const user = auth?.currentUser;
        if (!user) {
            showNotification('Você precisa estar logado para requisitar uma vaga.', 'error');
            return;
        }
        
        const { doc, getDoc, setDoc } = window.firestoreModules;
        
        // Buscar dados do usuário
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        // Verificar plano válido
        if (!userData.plano || typeof userData.plano !== 'string' || userData.plano.trim().length === 0) {
            showNotification('Você precisa ter um plano ativo para requisitar vaga.', 'error');
            return;
        }
        
        console.log('🎯 Iniciando requisição de vaga:', {
            campanhaId,
            userEmail: user.email,
            discordFornecido: !!discordManual
        });
        
        // PRIMEIRO: Atualizar Discord no perfil do usuário (se fornecido)
        let discordAtualizado = userData.discord || '';
        if (discordManual && discordManual.trim() !== '') {
            const discordNovo = discordManual.trim();
            const discordAtual = userData.discord || '';
            
            if (discordNovo !== discordAtual) {
                console.log('🔄 Salvando Discord no perfil ANTES de requisitar vaga...');
                
                try {
                    const updateData = { 
                        discord: discordNovo,
                        discordAtualizadoEm: new Date()
                    };
                    
                    await setDoc(userRef, updateData, { merge: true });
                    discordAtualizado = discordNovo;
                    
                    console.log('✅ Discord salvo no perfil com sucesso!');
                    
                    // Aguardar um pouco para garantir que o salvamento foi concluído
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.error('❌ Erro ao salvar Discord no perfil:', error);
                    return; // Parar aqui se não conseguir salvar o Discord
                }
            } else {
                console.log('ℹ️ Discord não precisa ser atualizado');
                discordAtualizado = discordAtual;
            }
        }
        
        // SEGUNDO: Buscar e validar campanha
        const campanhaRef = doc(db, 'campanhas', campanhaId);
        const campanhaSnap = await getDoc(campanhaRef);
        
        if (!campanhaSnap.exists()) {
            showNotification('Campanha não encontrada.', 'error');
            return;
        }
        
        const campanha = campanhaSnap.data();
        let jogadores = Array.isArray(campanha.jogadores) ? [...campanha.jogadores] : [];
        
        // Verificar se já está inscrito
        const jaInscrito = jogadores.some(j => j.email === user.email);
        
        if (jaInscrito) {
            showNotification('Você já está inscrito nesta campanha!', 'warning');
            return;
        }
        
        // Verificar se há vagas disponíveis
        if (campanha.vagas) {
            const totalVagas = parseInt(campanha.vagas) || 0;
            const vagasOcupadas = jogadores.length;
            
            if (vagasOcupadas >= totalVagas) {
                showNotification('Esta campanha não possui mais vagas disponíveis.', 'error');
                return;
            }
        }
        
        // TERCEIRO: Adicionar usuário à campanha
        const novoJogador = {
            uid: user.uid,
            email: user.email,
            discord: discordAtualizado,
            plano: userData.plano || '',
            nome: userData.displayName || user.displayName || '',
            inscritoEm: new Date().toISOString()
        };
        
        jogadores.push(novoJogador);
        
        console.log('📝 Salvando jogador na campanha...', {
            campanhaId,
            jogadorEmail: user.email,
            discord: discordAtualizado,
            totalJogadores: jogadores.length
        });
        
        await setDoc(campanhaRef, { jogadores }, { merge: true });
        
        console.log('✅ Vaga requisitada com sucesso!');
        
        // Aguardar um pouco antes de mostrar notificação final
        setTimeout(() => {
            showNotification('Vaga requisitada com sucesso!', 'success');
        }, 200);
        
        // Atualizar interface
        renderizarCampanhas();
        
    } catch (error) {
        console.error('❌ Erro ao requisitar vaga:', error);
        
        let mensagemErro = 'Erro ao requisitar vaga. Tente novamente.';
        
        if (error.code === 'permission-denied') {
            mensagemErro = 'Permissão insuficiente para requisitar vaga. Verifique seu plano.';
        } else if (error.code === 'unavailable') {
            mensagemErro = 'Serviço temporariamente indisponível. Tente novamente em alguns segundos.';
        } else if (error.message && error.message.includes('Maximum call stack')) {
            mensagemErro = 'Erro interno do sistema. Tente recarregar a página.';
            console.error('🔄 Loop detectado, evitando notificação');
        } else if (error.message) {
            mensagemErro = `Erro: ${error.message}`;
        }
        
        // Tentar mostrar notificação apenas se não for erro de stack
        if (!error.message || !error.message.includes('Maximum call stack')) {
            setTimeout(() => {
                showNotification(mensagemErro, 'error');
            }, 100);
        } else {
            console.log(`❌ ${mensagemErro}`);
        }
    } finally {
        // Sempre resetar o controle, independente de sucesso ou erro
        requisicaoEmAndamento = false;
    }
}

// ==================== AUTENTICAÇÃO ==================== //
function handleAuthChange(user) {
    // Reset state
    userIsAdmin = false;
    userHasPlano = false;
    userPlano = null;
    
    if (user) {
        // Usuário autenticado com sucesso
        verificarPermissoesUsuario(user);
    } else {
        // Usuário não está autenticado
        // Garantir que as campanhas sejam sempre exibidas para usuários não logados
        userPlano = 'gratis';
        userHasPlano = false;
        userIsAdmin = false;
        
        // NÃO chamar renderizarCampanhas aqui, pois será chamado automaticamente 
        // quando os dados chegarem em carregarCampanhas()
        // Estado configurado para usuário não autenticado
    }
}

async function verificarPermissoesUsuario(user) {
    try {
        const { doc, getDoc, setDoc } = window.firestoreModules;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        let userData = userSnap.exists() ? userSnap.data() : {};
        
        console.log('👤 Dados do usuário carregados:', {
            email: user.email,
            uid: user.uid,
            planoNoBanco: userData.plano,
            dadosCompletos: userData
        });
        
        // Obter funções seguras do escopo global
        const { isAdminEmail, isSpecialEmail } = window.secureConfigFunctions || {};
        
        // Verificar se as funções estão disponíveis
        if (!isAdminEmail || !isSpecialEmail) {
            console.warn('⚠️ Funções seguras não disponíveis, usando verificação local');
            // Verificação local como fallback
            const adminEmails = ["raiokan3223br@gmail.com", "alef.midrei@gmail.com", "guigaxpxp@gmail.com", "suporte@lordetempus.com"];
            const specialEmail = "baneagorarito@gmail.com";
            
            const userEmail = user.email.toLowerCase();
            
            // Verificar admin com lista local
            if (adminEmails.includes(userEmail)) {
                userIsAdmin = true;
                userHasPlano = true;
                userPlano = 'administrador';
                console.log('👑 Admin verificado com lista local');
            }
            // Verificar email especial
            else if (userEmail === specialEmail) {
                if (!userData.plano || userData.plano !== 'lorde') {
                    console.log('👑 Configurando plano especial Lorde (local)');
                    await setDoc(userRef, { plano: 'lorde' }, { merge: true });
                    userData.plano = 'lorde';
                }
                userPlano = 'lorde';
                userHasPlano = true;
            } else {
                userPlano = userData.plano || 'gratis';
                const planoInfo = PLANOS_SISTEMA[userPlano];
                userHasPlano = planoInfo?.permiteRequisitar || false;
            }
        } else {
            // Verificar se é admin usando função segura
            if (isAdminEmail && isAdminEmail(user.email)) {
            userIsAdmin = true;
            userHasPlano = true;
            userPlano = 'administrador';
            // Usuário tem permissões de administrador
        }
        // Verificar plano especial usando função segura
        else if (isSpecialEmail && isSpecialEmail(user.email)) {
            if (!userData.plano || userData.plano !== 'lorde') {
                console.log('👑 Configurando plano especial Lorde para usuário especial');
                await setDoc(userRef, { plano: 'lorde' }, { merge: true });
                userData.plano = 'lorde';
            }
            userPlano = 'lorde';
            userHasPlano = true;
            console.log('👑 Plano especial: Lorde configurado');
        }
            else {
                userPlano = userData.plano || 'gratis';
                const planoInfo = PLANOS_SISTEMA[userPlano];
                userHasPlano = planoInfo?.permiteRequisitar || false;
                
                console.log('📋 Plano do usuário:', {
                    plano: userPlano,
                    planoInfo,
                    permiteRequisitar: planoInfo?.permiteRequisitar,
                    userHasPlano
                });
            }
        }
        
        console.log('🔒 Permissões finais verificadas (Campanhas):', {
            email: user.email,
            isAdmin: userIsAdmin,
            plano: userPlano,
            planoInfo: PLANOS_SISTEMA[userPlano],
            hasPlano: userHasPlano,
            podeRequisitar: userHasPlano || userIsAdmin
        });
        
        // Forçar renderização das campanhas com novos dados
        setTimeout(() => {
            renderizarCampanhas();
        }, 500);
        
    } catch (error) {
        console.error('❌ Erro ao verificar permissões do usuário:', error);
        userIsAdmin = false;
        userHasPlano = false;
        userPlano = 'gratis';
    }
}

// ==================== UTILITÁRIOS ==================== //
function usuarioEstaInscrito(campanha, userEmail) {
    if (!campanha.jogadores || !Array.isArray(campanha.jogadores)) return false;
    return campanha.jogadores.some(j => j.email === userEmail);
}

function verificarPermissaoRequisicao(campanha) {
    console.log('🔍 Verificando permissão para requisitar campanha:', {
        campanhaId: campanha.id,
        campanhaNome: campanha.nome,
        campanhaPlano: campanha.plano,
        userPlano: userPlano,
        userIsAdmin: userIsAdmin,
        userHasPlano: userHasPlano
    });
    
    // Admin sempre pode requisitar
    if (userIsAdmin) {
        console.log('✅ Permissão concedida: Usuário é admin');
        return true;
    }
    
    // Se não tem plano válido, não pode requisitar
    if (!userPlano || userPlano === 'gratis') {
        console.log('❌ Permissão negada: Usuário não tem plano válido');
        return false;
    }
    
    // Verificar se o plano permite requisitar campanhas
    const planoInfo = PLANOS_SISTEMA[userPlano];
    if (!planoInfo || !planoInfo.permiteRequisitar) {
        console.log('❌ Permissão negada: Plano não permite requisitar campanhas');
        return false;
    }
    
    // Verificar requisitos específicos da campanha
    if (campanha.plano) {
        console.log('🎯 Campanha tem requisito de plano:', campanha.plano);
        
        // Se a campanha exige um plano específico
        if (campanha.plano === 'gratis') {
            // Campanha grátis - qualquer plano válido pode participar
            console.log('✅ Permissão concedida: Campanha grátis, qualquer plano pode participar');
            return true;
        } else if (campanha.plano === userPlano) {
            // Plano exato do usuário
            console.log('✅ Permissão concedida: Plano exato do usuário');
            return true;
        } else {
            // Verificar hierarquia de planos usando níveis numéricos
            const planoRequirido = PLANOS_SISTEMA[campanha.plano];
            const planoUsuario = PLANOS_SISTEMA[userPlano];
            
            if (!planoRequirido || !planoUsuario) {
                console.log('❌ Permissão negada: Plano não encontrado no sistema');
                return false;
            }
            
            const nivelRequirido = planoRequirido.nivel;
            const nivelUsuario = planoUsuario.nivel;
            
            console.log('🔢 Verificando hierarquia por níveis:', {
                campanhaPlano: campanha.plano,
                nivelRequirido,
                userPlano,
                nivelUsuario,
                podeParticipar: nivelUsuario >= nivelRequirido
            });
            
            // Usuário com plano de nível superior ou igual pode acessar campanhas de planos inferiores
            const podeParticipar = nivelUsuario >= nivelRequirido;
            
            if (podeParticipar) {
                console.log('✅ Permissão concedida: Usuário tem plano de nível superior ou igual');
                return true;
            } else {
                console.log('❌ Permissão negada: Usuário tem plano de nível inferior ao requisito');
                return false;
            }
        }
    }
    
    // Se não há requisito específico, qualquer plano válido pode requisitar
    console.log('✅ Permissão concedida: Não há requisito específico de plano');
    return true;
}

function atualizarEstatisticas(totalCampanhas, totalJogadores) {
    if (totalCampanhasEl) {
        animarNumero(totalCampanhasEl, totalCampanhas);
    }
    if (totalJogadoresEl) {
        animarNumero(totalJogadoresEl, totalJogadores);
    }
}

function animarNumero(elemento, valorFinal) {
    // Usar a função segura global se disponível
    if (window.safeAnimateNumber && typeof window.safeAnimateNumber === 'function') {
        window.safeAnimateNumber(elemento, valorFinal, { preserveFormat: true });
        return;
    }
    
    // Fallback seguro se a função global não estiver disponível
    const originalText = elemento.textContent.trim();
    
    // Verificar se é seguro animar (apenas números e +)
    if (!/^\d+\+?$/.test(originalText)) {
        console.log('🛡️ Proteção campanhas: Elemento não será animado:', originalText);
        return;
    }
    
    const valorAtual = parseInt(originalText.replace(/\D/g, '')) || 0;
    const target = parseInt(valorFinal) || 0;
    
    if (isNaN(target) || target === valorAtual) {
        elemento.textContent = target.toString();
        return;
    }
    
    const incremento = Math.max(1, Math.ceil(Math.abs(target - valorAtual) / 20));
    
    function animar() {
        const novoValor = parseInt(elemento.textContent.replace(/\D/g, '')) || 0;
        if ((target > valorAtual && novoValor < target) || (target < valorAtual && novoValor > target)) {
            const proximoValor = target > valorAtual ? novoValor + incremento : novoValor - incremento;
            elemento.textContent = Math.min(Math.max(proximoValor, 0), target).toString();
            requestAnimationFrame(animar);
        } else {
            elemento.textContent = target.toString();
        }
    }
    
    animar();
}

// ==================== UI STATES ==================== //
function mostrarLoading(show) {
    if (show) {
        loadingState?.classList.remove('hidden');
        campanhasLista?.classList.add('hidden');
        emptyState?.classList.add('hidden');
    } else {
        loadingState?.classList.add('hidden');
    }
}

function mostrarEmptyState(show, mensagem = null) {
    if (show) {
        emptyState?.classList.remove('hidden');
        campanhasLista?.classList.add('hidden');
        
        if (mensagem) {
            const emptyText = emptyState?.querySelector('p');
            if (emptyText) emptyText.textContent = mensagem;
        }
    } else {
        emptyState?.classList.add('hidden');
    }
}

// ==================== ANIMAÇÕES ==================== //
function configurarAnimacoes() {
    // Intersection Observer para animações
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, observerOptions);
    
    // Observar elementos existentes
    document.querySelectorAll('.animate-fadeInUp, .animate-slideInLeft, .animate-slideInRight').forEach(element => {
        observer.observe(element);
    });
    
    // Guardar observer para uso posterior
    window.campanhasObserver = observer;
}

function animarCards() {
    const cards = document.querySelectorAll('.campanha-card');
    
    if (window.campanhasObserver) {
        cards.forEach(card => {
            window.campanhasObserver.observe(card);
        });
    }
}

// ==================== FUNÇÃO DE NOTIFICAÇÃO ==================== //
// Cache para evitar notificações duplicadas
let ultimaNotificacao = { message: '', timestamp: 0 };
let processandoNotificacao = false;

function showNotification(message, type = 'info') {
    // Prevenir loops infinitos
    if (processandoNotificacao) {
        console.log('🔒 Notificação bloqueada para evitar loop:', message);
        return;
    }
    
    // Prevenir notificações duplicadas em curto período
    const agora = Date.now();
    if (ultimaNotificacao.message === message && (agora - ultimaNotificacao.timestamp) < 2000) {
        console.log('🛡️ Notificação duplicada ignorada:', message);
        return;
    }
    
    processandoNotificacao = true;
    ultimaNotificacao = { message, timestamp: agora };
    
    try {
        // Usar função global se disponível, senão usar console
        if (window.showNotification && typeof window.showNotification === 'function' && window.showNotification !== showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Criar notificação visual simples se não houver função global
            try {
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 10000;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: opacity 0.3s ease;
                    max-width: 300px;
                    word-wrap: break-word;
                `;
                notification.textContent = message;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    if (notification && notification.parentElement) {
                        notification.style.opacity = '0';
                        setTimeout(() => {
                            if (notification && notification.parentElement) {
                                notification.remove();
                            }
                        }, 300);
                    }
                }, 4000);
            } catch (domError) {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }
    } catch (error) {
        console.log(`[${type.toUpperCase()}] ${message}`);
    } finally {
        processandoNotificacao = false;
    }
}

console.log('🎲 Módulo de campanhas carregado com sucesso!'); 
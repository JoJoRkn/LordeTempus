// ===================================== //
//         PERFIL.JS - LORDE TEMPUS     //
//     Funcionalidades do Perfil        //
// ===================================== //

// Variáveis globais para Firebase (serão inicializadas dinamicamente)
let auth = null;
let db = null;
let firebaseModules = null;
let isAdminEmail = null;

// ==================== CONSTANTES ==================== //
// Configuração de administradores removida por segurança
// Uso: isAdminEmail(email) para verificar se é admin

// Sistema de planos unificado - HIERARQUIA CORRETA (sincronizado com campanhas.js)
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
        beneficios: ['Voto em vídeos do YouTube', 'Escolha de vídeo do TikTok', 'Acesso ao Discord'],
        permiteRequisitar: true,
        cor: '#3b82f6',
        nivel: 1
    },
    minutos: {
        nome: 'Minutos',
        preco: 49.99,
        beneficios: ['Todas as vantagens da Minuta', '12h mensais no Foundry VTT', 'Sistemas e módulos LT'],
        permiteRequisitar: true,
        cor: '#8b5cf6',
        nivel: 2
    },
    relogio: {
        nome: 'Relógio',
        preco: 79.99,
        beneficios: ['Foundry VTT ilimitado', '1h/semana de suporte', 'Todos os recursos LT'],
        permiteRequisitar: true,
        cor: '#10b981',
        popular: true,
        nivel: 3
    },
    lorde: {
        nome: 'Lorde',
        preco: 119.99,
        beneficios: ['Acesso ilimitado às campanhas', 'Suporte prioritário 24/7', 'Todas as vantagens anteriores'],
        permiteRequisitar: true,
        cor: '#f59e0b',
        nivel: 4
    },
    nobreza: {
        nome: 'Nobreza',
        preco: 199.99,
        beneficios: ['Acesso para 2 jogadores', 'Ideal para duplas', 'Todas as vantagens anteriores'],
        permiteRequisitar: true,
        cor: '#a855f7',
        nivel: 5
    },
    familiareal: {
        nome: 'Família Real',
        preco: 349.99,
        beneficios: ['Acesso para 3 jogadores', 'Perfeito para grupos', 'Todas as vantagens anteriores'],
        permiteRequisitar: true,
        cor: '#ec4899',
        nivel: 6
    },
    pracadotempo: {
        nome: 'Praça do Tempo',
        preco: 499.99,
        beneficios: ['Mesa exclusiva personalizada', 'Cenário sob medida', 'Experiência premium'],
        permiteRequisitar: true,
        cor: '#06b6d4',
        nivel: 7
    },
    atemporal: {
        nome: 'Atemporal',
        preco: 999.99,
        beneficios: ['2 mesas exclusivas personalizadas', '1 mesa pública personalizada', 'Acesso máximo'],
        permiteRequisitar: true,
        cor: '#6366f1',
        nivel: 8
    },
    cronomante: {
        nome: 'Cronomante',
        preco: 0, // Sob consulta
        beneficios: ['Mesa pessoal com Lorde Tempus', 'Narrativa exclusiva da criadora', 'Acesso direto'],
        permiteRequisitar: true,
        cor: '#7c3aed',
        especial: true,
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

// Disponibilizar PLANOS_SISTEMA globalmente para uso em outros módulos
window.PLANOS_SISTEMA = PLANOS_SISTEMA;

// Estado global
let currentUser = null;
let isAdmin = false;
let userPlano = null;
let hasPlano = false; // Adicionar variável que estava faltando

// ==================== INICIALIZAÇÃO ==================== //
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎭 Inicializando módulo de perfil...');
    
    // Inicializar Firebase primeiro
    inicializarFirebase().then(() => {
        inicializarEventListeners();
        configurarAbas();
        configurarModais();
        
        // Observador de autenticação (só após Firebase estar pronto)
        if (auth && firebaseModules) {
            firebaseModules.onAuthStateChanged(auth, handleAuthChange);
        }
    }).catch(error => {
        console.error('❌ Erro ao inicializar Firebase no perfil:', error);
        showNotification('Erro ao conectar com o servidor. Recarregue a página.', 'error');
    });
});

// ==================== INICIALIZAÇÃO DO FIREBASE ==================== //
async function inicializarFirebase() {
    try {
        console.log('🚀 Inicializando Firebase no módulo de perfil...');
        
        // Importações dinâmicas do Firebase
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js");
        const authModules = await import("https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js");
        const firestoreModules = await import("https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js");
        
        // Importar configuração segura
        const configModule = await import('./config-secure.js');
        const firebaseConfig = configModule.getFirebaseConfig();
        isAdminEmail = configModule.isAdminEmail;
        
        // Configuração do Firebase já está fixa no código
        
        console.log('🔥 Inicializando aplicação Firebase no perfil...');
        
        // Inicializar Firebase
        const app = initializeApp(firebaseConfig);
        auth = authModules.getAuth(app);
        db = firestoreModules.getFirestore(app);
        
        // Salvar módulos para uso posterior
        firebaseModules = {
            ...authModules,
            ...firestoreModules
        };
        
        console.log('✅ Firebase inicializado com sucesso no perfil!');
        
        return { auth, db, firebaseModules };
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase no perfil:', error);
        
        // Tratamento específico de erros
        let mensagemUsuario = 'Erro ao conectar com o servidor. ';
        
        if (error.message.includes('API Key')) {
            mensagemUsuario += 'Configuração de API inválida. ';
        } else if (error.code === 'auth/invalid-api-key') {
            mensagemUsuario += 'Chave de API do Firebase inválida. ';
        }
        
        mensagemUsuario += 'Recarregue a página.';
        
        throw new Error(mensagemUsuario);
    }
}

// ==================== EVENT LISTENERS ==================== //
function inicializarEventListeners() {
    // Login Google
    const googleBtn = document.getElementById('google-sign-in-button');
    if (googleBtn) {
        googleBtn.addEventListener('click', signInWithGoogle);
    }
    
    // Logout
    const logoutBtn = document.getElementById('sign-out-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOutUser);
    }
    
    // Formulário de perfil
    const updateForm = document.getElementById('updateAccountForm');
    if (updateForm) {
        updateForm.addEventListener('submit', salvarPerfil);
    }
    
    // Formulário de endereço
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        addressForm.addEventListener('submit', salvarEndereco);
    }
    
    console.log('🎯 Event listeners do perfil configurados');
}

// ==================== AUTENTICAÇÃO ==================== //
async function signInWithGoogle() {
    if (!auth || !firebaseModules) {
        showNotification('Firebase ainda não foi inicializado. Aguarde...', 'warning');
        return;
    }
    
    const provider = new firebaseModules.GoogleAuthProvider();
    try {
        await firebaseModules.signInWithPopup(auth, provider);
        showNotification('Login realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro no login:', error);
        showNotification('Erro ao fazer login. Tente novamente.', 'error');
    }
}

async function signOutUser() {
    if (!auth || !firebaseModules) {
        showNotification('Firebase ainda não foi inicializado. Aguarde...', 'warning');
        return;
    }
    
    try {
        await firebaseModules.signOut(auth);
        showNotification('Logout realizado com sucesso!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Erro no logout:', error);
        showNotification('Erro ao sair. Tente novamente.', 'error');
    }
}

async function handleAuthChange(user) {
    const loginOptions = document.getElementById('loginOptions');
    const userInfo = document.getElementById('userInfo');
    
    if (user) {
        // Usuário autenticado com sucesso
        currentUser = user;
        
        // Marcar que visitou o perfil (já que está na página de perfil)
        if (window.location.pathname.includes('perfil.html')) {
            localStorage.setItem('visitouPerfil', 'true');
        }
        
        // Simular alguns eventos básicos se for a primeira vez
        if (!localStorage.getItem('eventosSimulados')) {
            simularEventosBasicos();
            localStorage.setItem('eventosSimulados', 'true');
        }
        
        // Mostrar perfil, esconder login
        if (loginOptions) loginOptions.style.display = 'none';
        if (userInfo) userInfo.style.display = 'block';
        
        // Atualizar dados do usuário
        await atualizarDadosUsuario(user);
        await verificarPermissoes(user);
        
        // Atualizar dados das abas
        await carregarDadosPerfil();
        await carregarEndereco();
        await carregarPlanos();
        await carregarMesas();
        await carregarTrofeus();
        
        // Inicializar eventos automáticos
        inicializarEventosAutomaticos();
        
    } else {
        // Usuário não está autenticado
        currentUser = null;
        isAdmin = false;
        userPlano = null;
        
        // Mostrar login, esconder perfil
        if (loginOptions) loginOptions.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        
        limparDadosInterface();
    }
}

async function atualizarDadosUsuario(user) {
    // Atualizar interface
    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-email');
    const photoEl = document.getElementById('user-photo');
    const logoutBtn = document.getElementById('sign-out-button');
    
    if (nameEl) nameEl.textContent = user.displayName || 'Usuário';
    if (emailEl) emailEl.textContent = user.email || '';
    if (photoEl) photoEl.src = user.photoURL || 'images/avatar-default.png';
    if (logoutBtn) logoutBtn.style.display = 'block';
    
    // Usar sistema anti-duplicação se disponível, senão usar método tradicional
    try {
        if (window.authUtils && window.authUtils.criarOuAtualizarUsuario) {
            console.log('🔄 Usando sistema anti-duplicação do auth.js...');
            const resultado = await window.authUtils.criarOuAtualizarUsuario(user);
            console.log('✅ Resultado:', resultado);
            
            // Mostrar notificação se houve mesclagem
            if (resultado.tipo === 'mesclada' && resultado.contasDeletadas > 0) {
                setTimeout(() => {
                    showNotification(
                        `Dados unificados! ${resultado.contasDeletadas} conta(s) duplicada(s) foram mescladas.`, 
                        'success'
                    );
                }, 1000);
            }
        } else {
            // Fallback para método tradicional
            console.log('⚠️ Sistema anti-duplicação não disponível, usando método tradicional');
            const userRef = firebaseModules.doc(db, 'users', user.uid);
            await firebaseModules.setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email.toLowerCase(),
                photoURL: user.photoURL,
                lastLogin: new Date()
            }, { merge: true });
        }
    } catch (error) {
        console.error('Erro ao salvar dados do usuário:', error);
        
        // Fallback final
        try {
            const userRef = firebaseModules.doc(db, 'users', user.uid);
            await firebaseModules.setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email.toLowerCase(),
                photoURL: user.photoURL,
                lastLogin: new Date(),
                erroAntiDuplicacao: true
            }, { merge: true });
        } catch (fallbackError) {
            console.error('Erro no fallback:', fallbackError);
        }
    }
}

// ==================== VERIFICAÇÃO DE PERMISSÕES ==================== //
async function verificarPermissoes(user) {
    try {
        const emailUsuario = user.email.toLowerCase();
        
        // Verificação de admin será feita através das regras do Firestore
        // Verificar se é admin através da função do auth.js
        if (window.authUtils && window.authUtils.verificarSeEAdmin) {
            isAdmin = await window.authUtils.verificarSeEAdmin();
        } else {
            isAdmin = false;
        }
        
        // Verificação de permissões realizada com segurança
    
    // Buscar plano do usuário
    const userRef = firebaseModules.doc(db, 'users', user.uid);
    try {
        const userSnap = await firebaseModules.getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        // Para admins, usar o plano real salvo no banco
        userPlano = userData.plano || 'gratis';
        hasPlano = !!userPlano && userPlano !== 'gratis';
        
        // Se é admin, garantir que tem plano de administrador
        if (isAdmin && userPlano !== 'administrador') {
            userPlano = 'administrador';
            hasPlano = true;
            
            // Atualizar no banco se necessário
            if (window.authUtils && window.authUtils.configurarPlanoAdmin) {
                await window.authUtils.configurarPlanoAdmin();
            }
        }
        
        // Chamar configurarAbas novamente para garantir que a aba Admin apareça
        configurarAbas();
        
        return { isAdmin, userPlano };
    } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        return { isAdmin: false, userPlano: 'gratis' };
    }
    } catch (error) {
        console.error('Erro crítico na verificação de permissões:', error);
        isAdmin = false;
        userPlano = 'gratis';
        hasPlano = false;
        return { isAdmin: false, userPlano: 'gratis' };
    }
}

function limparDadosInterface() {
    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-email');
    const photoEl = document.getElementById('user-photo');
    const logoutBtn = document.getElementById('sign-out-button');
    
    if (nameEl) nameEl.textContent = 'Nome do Usuário';
    if (emailEl) emailEl.textContent = 'email@exemplo.com';
    if (photoEl) photoEl.src = 'images/avatar-default.png';
    if (logoutBtn) logoutBtn.style.display = 'none';
}

// ==================== SISTEMA DE ABAS ==================== //
function configurarAbas() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const adminTabBtn = document.getElementById('adminTabBtn');
    
    // Exibir aba Admin se for admin
    if (isAdmin && adminTabBtn) {
        adminTabBtn.classList.remove('hidden');
        adminTabBtn.classList.remove('tab-btn-admin-destaque'); // Remover destaque especial
        adminTabBtn.innerHTML = '<i class="fas fa-cogs mr-2"></i>Admin';
    } else if (adminTabBtn) {
        adminTabBtn.classList.add('hidden');
    }
    
    function ativarAba(tabName) {
        // Remover classes ativas
        tabBtns.forEach(btn => {
            btn.classList.remove('border-[#00FCC8]', 'text-[#00FCC8]', 'active');
        });
        tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        
        // Ativar aba selecionada
        const btn = Array.from(tabBtns).find(b => b.dataset.tab === tabName);
        const content = document.getElementById('tab-' + tabName);
        
        if (btn && content) {
            btn.classList.add('border-[#00FCC8]', 'text-[#00FCC8]', 'active');
            content.classList.remove('hidden');
            
            // Salvar última aba
            localStorage.setItem('perfilUltimaAba', tabName);
            
            // Marcar aba como visitada e registrar evento
            const abasVisitadas = JSON.parse(localStorage.getItem('abasVisitadas') || '[]');
            if (!abasVisitadas.includes(tabName)) {
                abasVisitadas.push(tabName);
                localStorage.setItem('abasVisitadas', JSON.stringify(abasVisitadas));
            }
            
            // Registrar evento no Firebase
            if (currentUser) {
                registrarEvento('abas_visitadas', [tabName]);
            }
            
            // Carregar dados específicos da aba
            carregarDadosAba(tabName);
        }
    }
    
    // Event listeners das abas
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            ativarAba(btn.dataset.tab);
        });
    });
    
    // Ativar aba inicial
    const ultimaAba = localStorage.getItem('perfilUltimaAba');
    if (ultimaAba && Array.from(tabBtns).some(b => b.dataset.tab === ultimaAba)) {
        ativarAba(ultimaAba);
    } else if (tabBtns.length) {
        ativarAba(tabBtns[0].dataset.tab);
    }
    
    // Remover estilo especial da aba admin, se existir
    const styleAdmin = document.querySelector('style#adminTabStyle');
    if (styleAdmin) styleAdmin.remove();
}

function carregarDadosAba(tabName) {
    // Limpar listener de mensagens se estiver saindo da aba de mensagens
    if (tabName !== 'mensagens') {
        limparListenerTempoReal();
    }
    
    switch (tabName) {
        case 'perfil':
            carregarDadosPerfil();
            break;
        case 'planos':
            carregarPlanos();
            break;
        case 'endereco':
            carregarEndereco();
            break;
        case 'mesas':
            carregarMesas();
            break;
        case 'trofeus':
            carregarTrofeus();
            break;
        case 'mensagens':
            carregarMensagens();
            break;
        case 'admin':
            if (isAdmin) carregarPainelAdmin();
            break;
    }
}

// ==================== DADOS DO PERFIL ==================== //
async function carregarDadosPerfil() {
    if (!currentUser) return;
    
    const userRef = firebaseModules.doc(db, 'users', currentUser.uid);
    try {
        const userSnap = await firebaseModules.getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        // Preencher formulário
        const accountName = document.getElementById('accountName');
        const accountEmail = document.getElementById('accountEmail');
        const accountDiscord = document.getElementById('accountDiscord');
        const accountAge = document.getElementById('accountAge');
        const accountPhone = document.getElementById('accountPhone');
        
        if (accountName) accountName.value = userData.displayName || currentUser.displayName || '';
        if (accountEmail) accountEmail.value = currentUser.email || '';
        if (accountDiscord) accountDiscord.value = userData.discord || '';
        if (accountAge) accountAge.value = userData.age || '';
        if (accountPhone) accountPhone.value = userData.phone || '';
        
    } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
    }
}

async function salvarPerfil(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Você precisa estar logado para salvar o perfil.', 'error');
        return;
    }
    
    const userRef = firebaseModules.doc(db, 'users', currentUser.uid);
    const perfilData = {
        displayName: document.getElementById('accountName').value.trim(),
        discord: document.getElementById('accountDiscord').value.trim(),
        age: document.getElementById('accountAge').value.trim(),
        phone: document.getElementById('accountPhone').value.trim(),
        perfilAtualizadoEm: new Date()
    };
    
    try {
        await firebaseModules.setDoc(userRef, perfilData, { merge: true });
        showPerfilMsg('Perfil salvo com sucesso!', 'success');
        
        // Marcar que salvou dados do perfil
        localStorage.setItem('salvouPerfil', 'true');
        
        // Registrar eventos no Firebase
        registrarEvento('perfil_completo', true);
        if (perfilData.discord) {
            registrarEvento('primeira_mensagem', true);
        }
        
        // Atualizar nome na interface
        const nameEl = document.getElementById('user-display-name');
        if (nameEl && perfilData.displayName) {
            nameEl.textContent = perfilData.displayName;
        }
        
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        showPerfilMsg('Erro ao salvar perfil. Tente novamente.', 'error');
    }
}

// ==================== ENDEREÇO ==================== //
async function carregarEndereco() {
    if (!currentUser) return;
    
    const userRef = firebaseModules.doc(db, 'users', currentUser.uid);
    try {
        const userSnap = await firebaseModules.getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const address = userData.address || {};
        
        const addressStreet = document.getElementById('addressStreet');
        const addressNumber = document.getElementById('addressNumber');
        const addressCity = document.getElementById('addressCity');
        const addressState = document.getElementById('addressState');
        const addressZip = document.getElementById('addressZip');
        
        if (addressStreet) addressStreet.value = address.street || '';
        if (addressNumber) addressNumber.value = address.number || '';
        if (addressCity) addressCity.value = address.city || '';
        if (addressState) addressState.value = address.state || '';
        if (addressZip) addressZip.value = address.zip || '';
        
    } catch (error) {
        console.error('Erro ao carregar endereço:', error);
    }
}

async function salvarEndereco(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Você precisa estar logado para salvar o endereço.', 'error');
        return;
    }
    
    const userRef = firebaseModules.doc(db, 'users', currentUser.uid);
    const enderecoData = {
        address: {
            street: document.getElementById('addressStreet').value.trim(),
            number: document.getElementById('addressNumber').value.trim(),
            city: document.getElementById('addressCity').value.trim(),
            state: document.getElementById('addressState').value.trim(),
            zip: document.getElementById('addressZip').value.trim()
        },
        enderecoAtualizadoEm: new Date()
    };
    
    try {
        await firebaseModules.setDoc(userRef, enderecoData, { merge: true });
        showNotification('Endereço salvo com sucesso!', 'success');
        
        // Marcar que cadastrou endereço
        localStorage.setItem('cadastrouEndereco', 'true');
        
        // Registrar evento no Firebase
        registrarEvento('endereco_cadastrado', true);
        
    } catch (error) {
        console.error('Erro ao salvar endereço:', error);
        showNotification('Erro ao salvar endereço. Tente novamente.', 'error');
    }
}

// ==================== PLANOS ==================== //
async function carregarPlanos() {
    const planosContainer = document.getElementById('planosContainer');
    if (!planosContainer) return;
    
    const planoAtual = userPlano || 'gratis';
    const planoInfo = PLANOS_SISTEMA[planoAtual];
    
    // Para admins, mostrar badge e benefícios extras, mas exibir o plano real
    const planoDescricao = isAdmin 
        ? `Você tem acesso total como administrador + benefícios do plano ${planoInfo.nome}`
        : (planoAtual === 'gratis' ? 'Você está no plano gratuito' : 'R$ ' + planoInfo.preco.toFixed(2).replace('.', ',') + '/mês');
    
    const planoEmoji = isAdmin ? '👑' : (planoAtual === 'gratis' ? '🆓' : '💎');
    
    // Função para renderizar badge do plano com novas classes CSS
    function renderizarBadgePlanoAtual(plano, isAdminUser) {
        let classesCSS = 'plano-badge plano-gratis';
        let emoji = '🆓';
        let nome = planoInfo.nome;
        
        if (isAdminUser) {
            classesCSS = 'plano-badge plano-administrador';
            emoji = '👑';
            nome = 'Administrador';
        } else {
            switch(plano) {
                case 'minuta':
                    classesCSS = 'plano-badge plano-minuta';
                    emoji = '🕰️';
                    break;
                case 'minutos':
                    classesCSS = 'plano-badge plano-minutos';
                    emoji = '⏱️';
                    break;
                case 'relogio':
                    classesCSS = 'plano-badge plano-relogio popular';
                    emoji = '⏰';
                    break;
                case 'lorde':
                    classesCSS = 'plano-badge plano-lorde';
                    emoji = '👑';
                    break;
                case 'nobreza':
                    classesCSS = 'plano-badge plano-nobreza';
                    emoji = '🏰';
                    break;
                case 'familiareal':
                    classesCSS = 'plano-badge plano-familiareal';
                    emoji = '👨‍👩‍👧‍👦';
                    break;
                case 'pracadotempo':
                    classesCSS = 'plano-badge plano-pracadotempo';
                    emoji = '🧭';
                    break;
                case 'atemporal':
                    classesCSS = 'plano-badge plano-atemporal';
                    emoji = '🔱';
                    break;
                case 'cronomante':
                    classesCSS = 'plano-badge plano-cronomante';
                    emoji = '🌀';
                    break;
                default:
                    classesCSS = 'plano-badge plano-gratis';
                    emoji = '🆓';
            }
        }
        
        return `<span class="${classesCSS}">
            <span class="plano-emoji">${emoji}</span>
            ${nome}
            ${isAdminUser ? '<span class="admin-badge">ADMIN</span>' : ''}
        </span>`;
    }
    
    let html = `
        <!-- Status do Plano Atual - Design Profissional -->
        <div class="plano-status-principal ${isAdmin ? 'admin' : ''}">
            <div class="plano-header-info">
                <div class="plano-info-left">
                    <h3>Seu Plano Atual</h3>
                    <div class="plano-nome-container">
                        <div class="plano-indicador" style="background-color: ${planoInfo.cor}"></div>
                        <div class="plano-badge-container">
                            ${renderizarBadgePlanoAtual(planoAtual, isAdmin)}
                        </div>
                    </div>
                    <div class="plano-badges">
                        ${planoInfo.popular ? '<span class="badge-popular">POPULAR</span>' : ''}
                    </div>
                    <p class="plano-descricao">${planoDescricao}</p>
                    ${isAdmin ? `<p class="plano-descricao-extra"><i class="fas fa-crown"></i>Acesso total + benefícios de admin</p>` : ''}
                </div>
                <div class="plano-info-right">
                    <div class="plano-emoji">${planoEmoji}</div>
                </div>
            </div>
        </div>
        
        <!-- Detalhes do Plano Atual - Design Profissional -->
        <div class="plano-beneficios-card">
            <h4 class="beneficios-titulo">✨ Benefícios do Seu Plano</h4>
            
            <!-- Benefícios -->
            <div class="beneficios-lista">
                <h6 class="beneficios-subtitulo">🎯 Incluído no seu plano:</h6>
    `;
    
    // Adicionar benefícios do plano atual
    for (const beneficio of planoInfo.beneficios) {
        html += `
            <div class="beneficio-item">
                <i class="fas fa-check-circle beneficio-icone"></i>
                <span class="beneficio-texto">${beneficio}</span>
            </div>
        `;
    }
    
    // Se for admin, adicionar benefícios extras de admin (sem duplicar)
    if (isAdmin) {
        const beneficiosAdmin = PLANOS_SISTEMA['administrador'].beneficios;
        for (const beneficio of beneficiosAdmin) {
            if (!planoInfo.beneficios.includes(beneficio)) {
                html += `
                    <div class="beneficio-item">
                        <i class="fas fa-check-circle beneficio-icone"></i>
                        <span class="beneficio-texto">${beneficio}<span class="beneficio-extra">Admin</span></span>
                    </div>
                `;
            }
        }
    }
    
    html += `
            </div>
            
            <!-- Permissões -->
            <div class="permissoes-container">
                <div class="permissoes-conteudo">
                    <i class="fas fa-check-circle permissoes-icone"></i>
                    <span class="permissoes-texto">
                        ${isAdmin ? 'Acesso total como administrador' : (planoInfo.permiteRequisitar ? 'Pode requisitar campanhas' : 'Não pode requisitar campanhas')}
                    </span>
                </div>
                ${isAdmin ? '<p class="permissoes-detalhe">Você pode criar campanhas, gerenciar usuários e acessar todas as funcionalidades</p>' : ''}
            </div>
        </div>
        
        <!-- Ações dos Planos - Design Profissional -->
        <div class="planos-acoes-grid">
            <!-- Ver Todos os Planos -->
            <div class="acao-card destacado">
                <div class="acao-emoji">🏆</div>
                <h4 class="acao-titulo">Explorar Outros Planos</h4>
                <p class="acao-descricao">
                    ${isAdmin ? 'Veja todos os planos disponíveis para seus usuários' : 'Descubra todos os planos disponíveis e encontre o perfeito para você'}
                </p>
                <button onclick="window.location.href='index.html#planos'" class="acao-botao">
                    <i class="fas fa-external-link-alt"></i>
                    Ver Todos os Planos
                </button>
            </div>
            
            <!-- Upgrade/Downgrade -->
            <div class="acao-card">
                <div class="acao-emoji">⚡</div>
                <h4 class="acao-titulo">${isAdmin ? 'Gerenciar Planos' : 'Mudar de Plano'}</h4>
                <p class="acao-descricao">
                    ${isAdmin ? 'Gerencie planos de usuários no painel admin' : (planoAtual === 'gratis' ? 'Faça upgrade para desbloquear mais recursos' : 'Gerencie sua assinatura')}
                </p>
                <button onclick="${isAdmin ? 'ativarAba(\'admin\')' : 'window.location.href=\'index.html#planos\''}" class="acao-botao ${isAdmin ? 'secundario' : ''}">
                    <i class="fas ${isAdmin ? 'fa-cogs' : 'fa-sync-alt'}"></i>
                    ${isAdmin ? 'Ir para Admin' : (planoAtual === 'gratis' ? 'Fazer Upgrade' : 'Gerenciar Plano')}
                </button>
            </div>
            
            <!-- Dúvidas sobre o Plano -->
            <div class="acao-card">
                <div class="acao-emoji">💬</div>
                <h4 class="acao-titulo">Dúvidas sobre seu plano?</h4>
                <p class="acao-descricao">
                    Entre em contato conosco no Discord para tirar todas as suas dúvidas
                </p>
                <button onclick="window.open('https://discord.gg/BHgQ2XZ89Y', '_blank')" class="acao-botao">
                    <i class="fab fa-discord"></i>
                    Falar com a Equipe
                </button>
            </div>
        </div>
        
        <!-- Código de Ativação - Design Profissional -->
        <div class="codigo-ativacao-container">
            <div class="codigo-header">
                <i class="fas fa-ticket-alt codigo-icone"></i>
                <h4 class="codigo-titulo">Código de Ativação</h4>
            </div>
            <p class="codigo-descricao">
                ${isAdmin ? 'Como admin, você pode ativar códigos para usuários ou para teste:' : 'Se você possui um código promocional ou de ativação, digite-o abaixo:'}
            </p>
            
            <form id="codigoForm" class="codigo-form">
                <input type="text" id="codigoInput" placeholder="Digite seu código..." class="codigo-input">
                <button type="submit" class="codigo-botao">
                    <i class="fas fa-check"></i>
                    Ativar
                </button>
            </form>
            <div id="codigoMsg" class="codigo-msg"></div>
        </div>
    `;
    
    planosContainer.innerHTML = html;
    
    // Event listener para o formulário de código
    const codigoForm = document.getElementById('codigoForm');
    if (codigoForm) {
        codigoForm.addEventListener('submit', ativarCodigo);
    }
}

async function ativarCodigo(e) {
    e.preventDefault();
    
    const codigo = document.getElementById('codigoInput').value.trim();
    const msgDiv = document.getElementById('codigoMsg');
    
    if (!codigo) {
        msgDiv.innerHTML = '<div class="text-red-500">Digite um código válido.</div>';
        return;
    }
    
    try {
        // Aqui você faria uma chamada para ativar o código
        // Por enquanto, apenas simulamos uma resposta
        msgDiv.innerHTML = '<div class="text-green-500">Código ativado com sucesso!</div>';
        
        // Limpar o campo de código
        document.getElementById('codigoInput').value = '';
        
    } catch (error) {
        console.error('Erro ao ativar código:', error);
        msgDiv.innerHTML = '<div class="text-red-500">Erro ao ativar código. Tente novamente.</div>';
    }
}

// ==================== SISTEMA DE EVENTOS AUTOMÁTICO ==================== //

// Função para registrar evento do usuário
async function registrarEvento(eventoNome, valor = true) {
    if (!currentUser) return;
    
    try {
        const userRef = firebaseModules.doc(db, 'users', currentUser.uid);
        const userSnap = await firebaseModules.getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        // Atualizar eventos
        const eventos = userData.eventos || {};
        
        if (typeof valor === 'boolean') {
            eventos[eventoNome] = valor;
        } else if (typeof valor === 'number') {
            eventos[eventoNome] = (eventos[eventoNome] || 0) + valor;
        } else if (Array.isArray(valor)) {
            eventos[eventoNome] = [...new Set([...(eventos[eventoNome] || []), ...valor])];
        } else {
            eventos[eventoNome] = valor;
        }
        
        // Salvar no Firebase - usando apenas campos que o usuário pode alterar
        await firebaseModules.setDoc(userRef, { 
            eventos,
            eventosAtualizadosEm: new Date()
        }, { merge: true });
        
        console.log(`📊 Evento registrado: ${eventoNome} = ${valor}`);
        
        // Verificar novas conquistas
        setTimeout(() => {
            verificarNovasConquistas({ ...userData, eventos }).catch(err => {
                console.error('Erro ao verificar conquistas após evento:', err);
            });
        }, 1000);
        
    } catch (error) {
        console.error('Erro ao registrar evento:', error);
        // Não mostrar erro para o usuário, pois eventos são opcionais
    }
}

// Registrar eventos automaticamente
function inicializarEventosAutomaticos() {
    // Marcar que visitou o perfil
    registrarEvento('visitou_perfil', true);
    
    // Registrar aba visitada
    window.addEventListener('storage', function(e) {
        if (e.key === 'perfilUltimaAba') {
            const aba = e.newValue;
            if (aba) {
                registrarEvento('abas_visitadas', [aba]);
            }
        }
    });
}

// ==================== MESAS ==================== //
async function carregarMesas() {
    if (!currentUser) return;
    
    const mesasDiv = document.getElementById('minhasMesasLista');
    if (!mesasDiv) return;
    
    mesasDiv.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400">Carregando suas mesas...</div>';
    
    try {
        const campanhasRef = firebaseModules.collection(db, 'campanhas');
        const snapshot = await firebaseModules.getDocs(campanhasRef);
        
        let mesas = [];
        snapshot.forEach(docSnap => {
            const campanha = docSnap.data();
            if (Array.isArray(campanha.jogadores) && 
                campanha.jogadores.some(j => j.email === currentUser.email)) {
                const mesa = { id: docSnap.id, ...campanha };
                console.log('Mesa carregada:', mesa.nome, 'Imagem:', mesa.imagem || mesa.imagemUrl || 'não definida');
                mesas.push(mesa);
            }
        });
        
        if (mesas.length === 0) {
            mesasDiv.innerHTML = `
                <div class="mesas-empty-state">
                    <i class="fas fa-dice-d20"></i>
                    <h3>Nenhuma mesa encontrada</h3>
                    <p>Você ainda não está inscrito em nenhuma campanha. Explore nossas campanhas disponíveis e encontre a mesa perfeita para você!</p>
                    <a href="campanhas.html" class="lorde-btn px-6 py-3 inline-flex items-center">
                        <i class="fas fa-search mr-2"></i>Explorar Campanhas
                    </a>
                </div>
            `;
        } else {
            const html = mesas.map(mesa => {
                const imagemSrc = mesa.imagemUrl || mesa.imagem;
                console.log('Renderizando mesa:', mesa.nome, 'Imagem encontrada:', !!imagemSrc, 'URL:', imagemSrc);
                
                return `
                <div class="mesa-card">
                    ${imagemSrc ? `
                        <div class="mesa-imagem">
                            <img src="${imagemSrc}" alt="${mesa.nome}" class="mesa-img" onerror="this.style.display='none'; this.parentElement.style.display='none';">
                            <div class="mesa-overlay">
                                <h4 class="mesa-titulo-overlay">
                                    <i class="fas fa-dungeon"></i>
                                    ${mesa.nome}
                                </h4>
                            </div>
                        </div>
                    ` : `
                        <div class="mesa-header-sem-imagem">
                            <h4>
                                <i class="fas fa-dungeon"></i>
                                ${mesa.nome}
                            </h4>
                        </div>
                    `}
                    
                    <div class="mesa-conteudo">
                        <p class="mesa-descricao">${mesa.descricao || 'Aventura épica aguarda os corajosos!'}</p>
                        
                        <div class="mesa-detalhes">
                            <div class="mesa-detalhe-item">
                                <div class="mesa-detalhe-label">
                                    <i class="fas fa-dice-d20"></i>
                                    Sistema
                                </div>
                                <div class="mesa-detalhe-valor">${mesa.sistema || 'D&D 5e'}</div>
                            </div>
                            <div class="mesa-detalhe-item">
                                <div class="mesa-detalhe-label">
                                    <i class="fas fa-calendar-alt"></i>
                                    Dia
                                </div>
                                <div class="mesa-detalhe-valor">${mesa.dia || 'A definir'}</div>
                            </div>
                            <div class="mesa-detalhe-item">
                                <div class="mesa-detalhe-label">
                                    <i class="fas fa-clock"></i>
                                    Horário
                                </div>
                                <div class="mesa-detalhe-valor">${mesa.horario || '19:00'}</div>
                            </div>
                            <div class="mesa-detalhe-item">
                                <div class="mesa-detalhe-label">
                                    <i class="fas fa-users"></i>
                                    Jogadores
                                </div>
                                <div class="mesa-detalhe-valor">${mesa.jogadores ? mesa.jogadores.length : 0}/${mesa.vagas || '6'}</div>
                            </div>
                        </div>
                        
                        <div class="mesa-acoes">
                            <a href="https://discord.gg/BHgQ2XZ89Y" target="_blank" rel="noopener" class="discord-btn-mesa">
                                <i class="fab fa-discord"></i>
                                Entrar no Discord
                            </a>
                            <button class="info-btn-mesa" onclick="mostrarInfoMesa('${mesa.id}', '${mesa.nome}')">
                                <i class="fas fa-info-circle"></i>
                                Mais Informações
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
            
            mesasDiv.innerHTML = html;
        }
        
    } catch (error) {
        console.error('Erro ao carregar mesas:', error);
        mesasDiv.innerHTML = '<div class="text-center text-red-500">Erro ao carregar suas mesas.</div>';
    }
}

// Função global para mostrar informações da mesa
window.mostrarInfoMesa = async function(mesaId, mesaNome) {
    // Criar modal de informações da mesa
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'modal-info-mesa';
    
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3 class="modal-title">
                    <i class="fas fa-dungeon mr-2"></i>
                    Informações da Mesa: ${mesaNome}
                </h3>
                <button class="modal-close" onclick="fecharModalInfoMesa()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" id="modal-body-info-mesa">
                <div class="text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-spinner fa-spin text-2xl mb-4"></i>
                    <p>Carregando informações da mesa...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Buscar dados reais da campanha no Firebase
    try {
        const campanhaRef = firebaseModules.doc(db, 'campanhas', mesaId);
        const campanhaSnap = await firebaseModules.getDoc(campanhaRef);
        
        if (!campanhaSnap.exists()) {
            throw new Error('Campanha não encontrada');
        }
        
        const campanha = campanhaSnap.data();
        
        const modalBody = document.getElementById('modal-body-info-mesa');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="space-y-6">
                    ${(campanha.imagemUrl || campanha.imagem) ? `
                        <!-- Imagem da Aventura -->
                        <div class="modal-mesa-imagem">
                            <img src="${campanha.imagemUrl || campanha.imagem}" alt="${campanha.nome}" class="modal-mesa-img">
                            <div class="modal-mesa-overlay">
                                <h3 class="modal-mesa-titulo">${campanha.nome}</h3>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Sobre esta Mesa -->
                    <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border-l-4 border-purple-500">
                        <h4 class="text-lg font-bold text-purple-700 dark:text-purple-300 mb-3">
                            <i class="fas fa-info-circle mr-2"></i>
                            Sobre esta Mesa
                        </h4>
                        <p class="text-purple-600 dark:text-purple-400 mb-4">
                            ${campanha.descricao || 'Esta é uma campanha emocionante de RPG que acontece regularmente no Discord da comunidade Lorde Tempus. Prepare-se para aventuras épicas, combates estratégicos e narrativas envolventes!'}
                        </p>
                        
                        <!-- Informações da Mesa -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                                <h5 class="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                                    <i class="fas fa-calendar mr-2"></i>Horário
                                </h5>
                                <p class="text-gray-600 dark:text-gray-400">${campanha.dia || 'A definir'} às ${campanha.horario || 'A definir'}</p>
                            </div>
                            <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                                <h5 class="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                                    <i class="fas fa-users mr-2"></i>Vagas
                                </h5>
                                <p class="text-gray-600 dark:text-gray-400">${campanha.vagas || 'A definir'} jogadores</p>
                            </div>
                            <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                                <h5 class="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                                    <i class="fas fa-dice-d20 mr-2"></i>Sistema
                                </h5>
                                <p class="text-gray-600 dark:text-gray-400">${campanha.sistema || 'A definir'}</p>
                            </div>
                            <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                                <h5 class="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                                    <i class="fas fa-clock mr-2"></i>Duração
                                </h5>
                                <p class="text-gray-600 dark:text-gray-400">${campanha.duracao || '3-4 horas'}</p>
                            </div>
                        </div>
                        
                        <!-- Requisitos -->
                        <div class="mt-4">
                            <h5 class="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                                <i class="fas fa-check-circle mr-2"></i>Requisitos
                            </h5>
                            <ul class="space-y-2">
                                <li class="flex items-center text-gray-600 dark:text-gray-400">
                                    <i class="fas fa-dot-circle text-green-500 mr-2"></i>
                                    Discord instalado e configurado
                                </li>
                                <li class="flex items-center text-gray-600 dark:text-gray-400">
                                    <i class="fas fa-dot-circle text-green-500 mr-2"></i>
                                    Microfone funcionando
                                </li>
                                ${campanha.requisitos ? campanha.requisitos.split('\n').map(req => 
                                    req.trim() ? `<li class="flex items-center text-gray-600 dark:text-gray-400">
                                        <i class="fas fa-dot-circle text-green-500 mr-2"></i>
                                        ${req.trim()}
                                    </li>` : ''
                                ).join('') : `
                                <li class="flex items-center text-gray-600 dark:text-gray-400">
                                    <i class="fas fa-dot-circle text-green-500 mr-2"></i>
                                    Conhecimento básico do sistema (ou disposição para aprender)
                                </li>`}
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Discord -->
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-l-4 border-blue-500">
                        <h4 class="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3">
                            <i class="fab fa-discord mr-2"></i>
                            Acesso ao Discord
                        </h4>
                        <p class="text-blue-600 dark:text-blue-400 mb-4">
                            As sessões acontecem no servidor Discord da Lorde Tempus. 
                            Certifique-se de estar no servidor e ter acesso ao canal da sua mesa.
                        </p>
                        <a href="https://discord.gg/BHgQ2XZ89Y" target="_blank" rel="noopener" 
                           class="discord-btn inline-flex items-center gap-2">
                            <i class="fab fa-discord"></i>
                            Entrar no Discord
                        </a>
                    </div>
                    
                    <!-- Regras -->
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border-l-4 border-yellow-500">
                        <h4 class="text-lg font-bold text-yellow-700 dark:text-yellow-300 mb-3">
                            <i class="fas fa-scroll mr-2"></i>
                            Regras da Mesa
                        </h4>
                        <p class="text-yellow-600 dark:text-yellow-400 mb-3">
                            Para garantir uma experiência divertida para todos:
                        </p>
                        <ul class="space-y-2">
                            <li class="flex items-start text-yellow-600 dark:text-yellow-400">
                                <i class="fas fa-dot-circle text-yellow-500 mr-2 mt-1"></i>
                                Seja respeitoso com outros jogadores e o mestre
                            </li>
                            <li class="flex items-start text-yellow-600 dark:text-yellow-400">
                                <i class="fas fa-dot-circle text-yellow-500 mr-2 mt-1"></i>
                                Chegue no horário combinado (tolerância de 15 minutos)
                            </li>
                            <li class="flex items-start text-yellow-600 dark:text-yellow-400">
                                <i class="fas fa-dot-circle text-yellow-500 mr-2 mt-1"></i>
                                Mantenha o microfone mutado quando não estiver falando
                            </li>
                            <li class="flex items-start text-yellow-600 dark:text-yellow-400">
                                <i class="fas fa-dot-circle text-yellow-500 mr-2 mt-1"></i>
                                Comunique ausências com antecedência sempre que possível
                            </li>
                            ${campanha.regras ? campanha.regras.split('\n').map(regra => 
                                regra.trim() ? `<li class="flex items-start text-yellow-600 dark:text-yellow-400">
                                    <i class="fas fa-dot-circle text-yellow-500 mr-2 mt-1"></i>
                                    ${regra.trim()}
                                </li>` : ''
                            ).join('') : ''}
                        </ul>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar informações da mesa:', error);
        const modalBody = document.getElementById('modal-body-info-mesa');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="text-center text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-4"></i>
                    <p>Erro ao carregar informações da mesa.</p>
                    <p class="text-sm mt-2">Tente novamente mais tarde.</p>
                </div>
            `;
        }
    }
};

// Função para fechar o modal de informações da mesa
window.fecharModalInfoMesa = function() {
    const modal = document.getElementById('modal-info-mesa');
    if (modal) {
        modal.remove();
    }
};

// ==================== TROFÉUS E CONQUISTAS ==================== //

// Função para carregar troféus personalizados do Firebase
async function carregarTrofeusPersonalizados() {
    try {
        console.log('🏆 Carregando troféus personalizados...');
        
        // Buscar troféus personalizados do Firebase
        const trofeusQuery = firebaseModules.query(
            firebaseModules.collection(db, 'trofeus_personalizados'),
            firebaseModules.where('ativo', '==', true)
        );
        
        const trofeusSnapshot = await firebaseModules.getDocs(trofeusQuery);
        
        if (!trofeusSnapshot.empty) {
            let trofeusCarregados = 0;
            
            trofeusSnapshot.forEach(docSnap => {
                const trofeuData = docSnap.data();
                
                // Verificar se já não existe no array (evitar duplicatas)
                const jaExiste = CONQUISTAS_DISPONIVEIS.find(c => c.id === trofeuData.id);
                
                if (!jaExiste) {
                    // Adicionar ao array de conquistas disponíveis
                    CONQUISTAS_DISPONIVEIS.push({
                        id: trofeuData.id,
                        nome: trofeuData.nome,
                        descricao: trofeuData.descricao,
                        icone: trofeuData.icone,
                        categoria: trofeuData.categoria,
                        raridade: trofeuData.raridade,
                        xp: trofeuData.xp,
                        condicoes: trofeuData.condicoes,
                        personalizado: true,
                        criadoEm: trofeuData.criadoEm,
                        criadoPor: trofeuData.criadoPor,
                        criadorNome: trofeuData.criadorNome
                    });
                    
                    trofeusCarregados++;
                }
            });
            
            console.log(`✅ ${trofeusCarregados} troféus personalizados carregados com sucesso!`);
        } else {
            console.log('ℹ️ Nenhum troféu personalizado encontrado.');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar troféus personalizados:', error);
        // Não interromper o carregamento se houver erro
    }
}

// Carregar modificações de troféus padrão do Firestore
async function carregarTrofeusModificados() {
    try {
        console.log('🔧 Carregando modificações de troféus padrão...');
        
        const querySnapshot = await firebaseModules.getDocs(firebaseModules.collection(db, 'trofeus_modificados'));
        const modificacoes = new Map();
        
        querySnapshot.forEach((doc) => {
            const modificacao = doc.data();
            modificacoes.set(modificacao.trofeuOriginalId, modificacao);
        });
        
        console.log(`✅ ${modificacoes.size} modificações de troféus carregadas`);
        
        // Aplicar modificações aos troféus padrão
        modificacoes.forEach((modificacao, trofeuId) => {
            const trofeuIndex = CONQUISTAS_DISPONIVEIS.findIndex(t => t.id === trofeuId);
            
            if (trofeuIndex !== -1) {
                if (modificacao.tipoModificacao === 'exclusao' && modificacao.excluido) {
                    // Remover troféu excluído
                    CONQUISTAS_DISPONIVEIS.splice(trofeuIndex, 1);
                    console.log(`🗑️ Troféu "${trofeuId}" removido (excluído por admin)`);
                } else if (modificacao.tipoModificacao === 'edicao') {
                    // Aplicar modificações ao troféu
                    CONQUISTAS_DISPONIVEIS[trofeuIndex] = {
                        ...CONQUISTAS_DISPONIVEIS[trofeuIndex],
                        nome: modificacao.nome,
                        descricao: modificacao.descricao,
                        icone: modificacao.icone,
                        categoria: modificacao.categoria,
                        raridade: modificacao.raridade,
                        xp: modificacao.xp,
                        condicoes: modificacao.condicoes,
                        modificado: true,
                        modificadoEm: modificacao.modificadoEm,
                        modificadoPor: modificacao.modificadoPor
                    };
                    console.log(`🔧 Troféu "${trofeuId}" atualizado com modificações`);
                }
            }
        });
        
        return modificacoes;
        
    } catch (error) {
        console.error('❌ Erro ao carregar modificações de troféus:', error);
        return new Map();
    }
}

// Definição das conquistas disponíveis (semelhante ao Steam)
const CONQUISTAS_DISPONIVEIS = [
    // Categoria: Primeiros Passos
    {
        id: 'primeiro_login',
        nome: 'Bem-vindo à Lorde Tempus!',
        descricao: 'Faça seu primeiro login na plataforma',
        icone: 'fas fa-door-open',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 10,
        condicoes: { tipo: 'evento', evento: 'primeiro_login' }
    },
    {
        id: 'perfil_completo',
        nome: 'Identidade Revelada',
        descricao: 'Complete todas as informações do seu perfil',
        icone: 'fas fa-user-check',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 25,
        condicoes: { tipo: 'perfil_completo' }
    },
    {
        id: 'discord_conectado',
        nome: 'Conectado à Comunidade',
        descricao: 'Conecte sua conta Discord',
        icone: 'fab fa-discord',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 20,
        condicoes: { tipo: 'discord_conectado' }
    },
    {
        id: 'primeira_exploracao',
        nome: 'Explorador Iniciante',
        descricao: 'Explore todas as páginas do site',
        icone: 'fas fa-compass',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 15,
        condicoes: { tipo: 'evento', evento: 'explorou_site' }
    },
    {
        id: 'avatar_personalizado',
        nome: 'Face da Aventura',
        descricao: 'Personalize sua foto de perfil',
        icone: 'fas fa-user-circle',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 10,
        condicoes: { tipo: 'evento', evento: 'avatar_alterado' }
    },
    {
        id: 'primeiro_contato',
        nome: 'Quebra-Gelo',
        descricao: 'Envie sua primeira mensagem no Discord',
        icone: 'fas fa-comments',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 20,
        condicoes: { tipo: 'evento', evento: 'primeira_mensagem' }
    },
    {
        id: 'perfil_visitado',
        nome: 'Espelho Mágico',
        descricao: 'Visite sua página de perfil pela primeira vez',
        icone: 'fas fa-magic',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 5,
        condicoes: { tipo: 'evento', evento: 'visitou_perfil' }
    },
    {
        id: 'endereco_salvo',
        nome: 'Lar, Doce Lar',
        descricao: 'Cadastre seu endereço de entrega',
        icone: 'fas fa-home',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 15,
        condicoes: { tipo: 'evento', evento: 'endereco_cadastrado' }
    },
    {
        id: 'primeira_campanha_vista',
        nome: 'Olhos de Águia',
        descricao: 'Visualize os detalhes de uma campanha',
        icone: 'fas fa-eye',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 10,
        condicoes: { tipo: 'evento', evento: 'campanha_visualizada' }
    },
    {
        id: 'tutorial_completo',
        nome: 'Aprendiz Dedicado',
        descricao: 'Complete o tutorial da plataforma',
        icone: 'fas fa-graduation-cap',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 30,
        condicoes: { tipo: 'evento', evento: 'tutorial_completo' }
    },
    {
        id: 'explorador_abas',
        nome: 'Explorador de Abas',
        descricao: 'Visite todas as abas do seu perfil',
        icone: 'fas fa-folder-open',
        categoria: 'primeiros_passos',
        raridade: 'comum',
        xp: 30,
        condicoes: { tipo: 'evento', evento: 'visitou_todas_abas' }
    },

    // Categoria: Campanhas
    {
        id: 'primeira_inscricao',
        nome: 'Primeira Aventura',
        descricao: 'Inscreva-se em sua primeira campanha',
        icone: 'fas fa-scroll',
        categoria: 'campanhas',
        raridade: 'comum',
        xp: 50,
        condicoes: { tipo: 'evento', evento: 'primeira_inscricao' }
    },
    {
        id: 'aventureiro_versatil',
        nome: 'Aventureiro Versátil',
        descricao: 'Participe de campanhas de 3 sistemas diferentes',
        icone: 'fas fa-dice-d20',
        categoria: 'campanhas',
        raridade: 'rara',
        xp: 100,
        condicoes: { tipo: 'evento', evento: 'sistemas_diversos' }
    },
    {
        id: 'mestre_estrategista',
        nome: 'Mestre Estrategista',
        descricao: 'Complete uma campanha como líder do grupo',
        icone: 'fas fa-chess-king',
        categoria: 'campanhas',
        raridade: 'epica',
        xp: 200,
        condicoes: { tipo: 'evento', evento: 'lider_grupo' }
    },
    {
        id: 'heroi_lendario',
        nome: 'Herói Lendário',
        descricao: 'Complete 5 campanhas com final épico',
        icone: 'fas fa-crown',
        categoria: 'campanhas',
        raridade: 'lendaria',
        xp: 500,
        condicoes: { tipo: 'evento', evento: 'finais_epicos' }
    },
    {
        id: 'explorador_mundos',
        nome: 'Explorador de Mundos',
        descricao: 'Participe de campanhas em 5 cenários diferentes',
        icone: 'fas fa-globe',
        categoria: 'campanhas',
        raridade: 'rara',
        xp: 150,
        condicoes: { tipo: 'evento', evento: 'cenarios_diversos' }
    },
    {
        id: 'sobrevivente',
        nome: 'Sobrevivente Nato',
        descricao: 'Complete uma campanha de terror sem morrer',
        icone: 'fas fa-skull',
        categoria: 'campanhas',
        raridade: 'epica',
        xp: 250,
        condicoes: { tipo: 'evento', evento: 'terror_sobreviveu' }
    },
    {
        id: 'diplomata',
        nome: 'Diplomata Habilidoso',
        descricao: 'Resolva um conflito sem combate',
        icone: 'fas fa-handshake',
        categoria: 'campanhas',
        raridade: 'rara',
        xp: 120,
        condicoes: { tipo: 'evento', evento: 'resolucao_pacifica' }
    },
    {
        id: 'colecionador_tesouros',
        nome: 'Colecionador de Tesouros',
        descricao: 'Encontre 10 itens raros em campanhas',
        icone: 'fas fa-gem',
        categoria: 'campanhas',
        raridade: 'epica',
        xp: 300,
        condicoes: { tipo: 'evento', evento: 'itens_raros' }
    },
    {
        id: 'mentor_novatos',
        nome: 'Mentor dos Novatos',
        descricao: 'Ajude 3 jogadores iniciantes em campanhas',
        icone: 'fas fa-hands-helping',
        categoria: 'campanhas',
        raridade: 'rara',
        xp: 180,
        condicoes: { tipo: 'evento', evento: 'ajudou_novatos' }
    },
    {
        id: 'velocista',
        nome: 'Aventureiro Veloz',
        descricao: 'Complete uma campanha one-shot em tempo recorde',
        icone: 'fas fa-tachometer-alt',
        categoria: 'campanhas',
        raridade: 'rara',
        xp: 140,
        condicoes: { tipo: 'evento', evento: 'oneshot_rapido' }
    },

    // Categoria: Tempo
    {
        id: 'guardiao_tempo',
        nome: 'Guardião do Tempo',
        descricao: 'Seja membro da Lorde Tempus por 1 mês',
        icone: 'fas fa-clock',
        categoria: 'tempo',
        raridade: 'comum',
        xp: 75,
        condicoes: { tipo: 'evento', evento: 'membro_um_mes' }
    },
    {
        id: 'viajante_temporal',
        nome: 'Viajante Temporal',
        descricao: 'Seja membro da Lorde Tempus por 6 meses',
        icone: 'fas fa-hourglass-half',
        categoria: 'tempo',
        raridade: 'rara',
        xp: 200,
        condicoes: { tipo: 'evento', evento: 'membro_seis_meses' }
    },
    {
        id: 'senhor_tempo',
        nome: 'Senhor do Tempo',
        descricao: 'Seja membro da Lorde Tempus por 1 ano',
        icone: 'fas fa-infinity',
        categoria: 'tempo',
        raridade: 'lendaria',
        xp: 500,
        condicoes: { tipo: 'evento', evento: 'membro_um_ano' }
    },
    {
        id: 'pontual',
        nome: 'Sempre Pontual',
        descricao: 'Chegue no horário em 10 sessões consecutivas',
        icone: 'fas fa-stopwatch',
        categoria: 'tempo',
        raridade: 'rara',
        xp: 150,
        condicoes: { tipo: 'evento', evento: 'pontualidade_perfeita' }
    },
    {
        id: 'maratonista',
        nome: 'Maratonista RPG',
        descricao: 'Participe de uma sessão de mais de 6 horas',
        icone: 'fas fa-running',
        categoria: 'tempo',
        raridade: 'epica',
        xp: 250,
        condicoes: { tipo: 'evento', evento: 'sessao_longa' }
    },
    {
        id: 'noturno',
        nome: 'Aventureiro Noturno',
        descricao: 'Participe de 5 sessões após meia-noite',
        icone: 'fas fa-moon',
        categoria: 'tempo',
        raridade: 'rara',
        xp: 120,
        condicoes: { tipo: 'evento', evento: 'sessoes_noturnas' }
    },
    {
        id: 'veterano_plataforma',
        nome: 'Veterano da Plataforma',
        descricao: 'Complete 2 anos como membro ativo',
        icone: 'fas fa-medal',
        categoria: 'tempo',
        raridade: 'lendaria',
        xp: 750,
        condicoes: { tipo: 'evento', evento: 'dois_anos_membro' }
    },
    {
        id: 'fim_semana',
        nome: 'Guerreiro de Fim de Semana',
        descricao: 'Jogue RPG em 10 fins de semana consecutivos',
        icone: 'fas fa-calendar-alt',
        categoria: 'tempo',
        raridade: 'rara',
        xp: 160,
        condicoes: { tipo: 'evento', evento: 'fins_semana_consecutivos' }
    },
    {
        id: 'dedicado_horario',
        nome: 'Dedicação Total',
        descricao: 'Mantenha um horário fixo por 3 meses',
        icone: 'fas fa-calendar-check',
        categoria: 'tempo',
        raridade: 'epica',
        xp: 200,
        condicoes: { tipo: 'evento', evento: 'horario_fixo' }
    },
    {
        id: 'presenca_perfeita',
        nome: 'Presença Perfeita',
        descricao: 'Não falte em nenhuma sessão por 2 meses',
        icone: 'fas fa-check-circle',
        categoria: 'tempo',
        raridade: 'epica',
        xp: 300,
        condicoes: { tipo: 'evento', evento: 'sem_faltas' }
    },

    // Categoria: Social
    {
        id: 'primeira_amizade',
        nome: 'Primeira Amizade',
        descricao: 'Adicione seu primeiro amigo na plataforma',
        icone: 'fas fa-user-friends',
        categoria: 'social',
        raridade: 'comum',
        xp: 30,
        condicoes: { tipo: 'evento', evento: 'primeiro_amigo' }
    },
    {
        id: 'comunicador',
        nome: 'Grande Comunicador',
        descricao: 'Envie 100 mensagens no Discord da comunidade',
        icone: 'fas fa-comments',
        categoria: 'social',
        raridade: 'rara',
        xp: 100,
        condicoes: { tipo: 'evento', evento: 'cem_mensagens' }
    },
    {
        id: 'anfitriao',
        nome: 'Anfitrião Perfeito',
        descricao: 'Organize uma sessão para outros jogadores',
        icone: 'fas fa-crown',
        categoria: 'social',
        raridade: 'epica',
        xp: 200,
        condicoes: { tipo: 'evento', evento: 'organizou_sessao' }
    },
    {
        id: 'influenciador',
        nome: 'Influenciador RPG',
        descricao: 'Traga 3 novos jogadores para a plataforma',
        icone: 'fas fa-bullhorn',
        categoria: 'social',
        raridade: 'lendaria',
        xp: 400,
        condicoes: { tipo: 'evento', evento: 'trouxe_jogadores' }
    },
    {
        id: 'contador_historias',
        nome: 'Contador de Histórias',
        descricao: 'Compartilhe 5 momentos épicos de suas aventuras',
        icone: 'fas fa-book-open',
        categoria: 'social',
        raridade: 'rara',
        xp: 120,
        condicoes: { tipo: 'evento', evento: 'compartilhou_historias' }
    },
    {
        id: 'mediador',
        nome: 'Mediador Sábio',
        descricao: 'Ajude a resolver um conflito entre jogadores',
        icone: 'fas fa-balance-scale',
        categoria: 'social',
        raridade: 'epica',
        xp: 250,
        condicoes: { tipo: 'evento', evento: 'resolveu_conflito' }
    },
    {
        id: 'festeiro',
        nome: 'Alma da Festa',
        descricao: 'Participe de 3 eventos especiais da comunidade',
        icone: 'fas fa-party-horn',
        categoria: 'social',
        raridade: 'rara',
        xp: 150,
        condicoes: { tipo: 'evento', evento: 'eventos_especiais' }
    },
    {
        id: 'feedback_mestre',
        nome: 'Crítico Construtivo',
        descricao: 'Deixe feedback positivo em 10 campanhas',
        icone: 'fas fa-thumbs-up',
        categoria: 'social',
        raridade: 'rara',
        xp: 130,
        condicoes: { tipo: 'evento', evento: 'feedbacks_positivos' }
    },
    {
        id: 'embaixador',
        nome: 'Embaixador da Lorde Tempus',
        descricao: 'Seja indicado como referência por outros jogadores',
        icone: 'fas fa-award',
        categoria: 'social',
        raridade: 'lendaria',
        xp: 500,
        condicoes: { tipo: 'evento', evento: 'embaixador_indicado' }
    },
    {
        id: 'mentor_comunidade',
        nome: 'Mentor da Comunidade',
        descricao: 'Ajude 10 novos jogadores a se integrarem',
        icone: 'fas fa-hands-helping',
        categoria: 'social',
        raridade: 'epica',
        xp: 300,
        condicoes: { tipo: 'evento', evento: 'mentor_dez_jogadores' }
    },

    // Categoria: Especiais
    {
        id: 'assinante_premium',
        nome: 'Patrono da Praça do Tempo',
        descricao: 'Torne-se um assinante da Praça do Tempo',
        icone: 'fas fa-map-marker-alt',
        categoria: 'especiais',
        raridade: 'epica',
        xp: 200,
        condicoes: { tipo: 'evento', evento: 'plano_premium' }
    },
    {
        id: 'colecionador_planos',
        nome: 'Colecionador de Planos',
        descricao: 'Experimente 3 planos diferentes',
        icone: 'fas fa-layer-group',
        categoria: 'especiais',
        raridade: 'rara',
        xp: 150,
        condicoes: { tipo: 'evento', evento: 'tres_planos' }
    },
    {
        id: 'explorador_secreto',
        nome: 'Explorador de Segredos',
        descricao: 'Encontre uma página ou função oculta do site',
        icone: 'fas fa-search',
        categoria: 'especiais',
        raridade: 'lendaria',
        xp: 300,
        condicoes: { tipo: 'evento', evento: 'encontrou_segredo' }
    },
    {
        id: 'beta_tester',
        nome: 'Testador Beta',
        descricao: 'Participe da fase beta de uma nova funcionalidade',
        icone: 'fas fa-flask',
        categoria: 'especiais',
        raridade: 'lendaria',
        xp: 400,
        condicoes: { tipo: 'evento', evento: 'beta_tester' }
    },
    {
        id: 'early_adopter',
        nome: 'Pioneiro Digital',
        descricao: 'Seja um dos primeiros 100 membros da plataforma',
        icone: 'fas fa-rocket',
        categoria: 'especiais',
        raridade: 'lendaria',
        xp: 1000,
        condicoes: { tipo: 'evento', evento: 'early_adopter' }
    },
    {
        id: 'bug_hunter',
        nome: 'Caçador de Bugs',
        descricao: 'Reporte um bug que foi corrigido pela equipe',
        icone: 'fas fa-bug',
        categoria: 'especiais',
        raridade: 'epica',
        xp: 250,
        condicoes: { tipo: 'evento', evento: 'bug_reportado' }
    },
    {
        id: 'criativo',
        nome: 'Mente Criativa',
        descricao: 'Sugira uma funcionalidade que foi implementada',
        icone: 'fas fa-lightbulb',
        categoria: 'especiais',
        raridade: 'lendaria',
        xp: 500,
        condicoes: { tipo: 'evento', evento: 'sugestao_implementada' }
    },
    {
        id: 'fiel_escudeiro',
        nome: 'Fiel Escudeiro',
        descricao: 'Mantenha uma assinatura ativa por 1 ano',
        icone: 'fas fa-shield-alt',
        categoria: 'especiais',
        raridade: 'lendaria',
        xp: 600,
        condicoes: { tipo: 'evento', evento: 'um_ano_assinatura' }
    },
    {
        id: 'aventureiro_sortudo',
        nome: 'Aventureiro Sortudo',
        descricao: 'Ganhe um sorteio especial da comunidade',
        icone: 'fas fa-dice-six',
        categoria: 'especiais',
        raridade: 'lendaria',
        xp: 300,
        condicoes: { tipo: 'evento', evento: 'ganhou_sorteio' }
    },
    {
        id: 'lorde_temporal',
        nome: 'Verdadeiro Lorde Temporal',
        descricao: 'Conquista secreta para os mais dedicados',
        icone: 'fas fa-hourglass',
        categoria: 'especiais',
        raridade: 'lendaria',
        xp: 1000,
        condicoes: { tipo: 'evento', evento: 'lorde_temporal_secreto' }
    }
];

async function carregarTrofeus() {
    const trophiesDiv = document.getElementById('trophies');
    if (!trophiesDiv) return;
    
    try {
        // Verificar se currentUser existe
        if (!currentUser) {
            trophiesDiv.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400">
                    Carregando dados do usuário...
                </div>
            `;
            return;
        }
        
        // Carregar troféus personalizados do Firebase e integrá-los
        await carregarTrofeusPersonalizados();
        await carregarTrofeusModificados();
        
        // Buscar conquistas do usuário
        const userRef = firebaseModules.doc(db, 'users', currentUser.uid);
        const userSnap = await firebaseModules.getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const conquistasUsuario = userData.conquistas || {};
        
        // Calcular estatísticas
        const stats = calcularEstatisticas(conquistasUsuario);
        
        // Verificar novas conquistas (sem await para não travar)
        verificarNovasConquistas(userData).catch(err => {
            console.error('Erro ao verificar novas conquistas:', err);
        });
        
        // Renderizar interface
        let html = `
            <!-- Seção de Explicação -->
            <div class="trofeus-info">
                <h4>
                    <i class="fas fa-trophy"></i>
                    Como funcionam as conquistas e troféus?
                </h4>
                
                <!-- Grid de Estatísticas -->
                <div class="trofeus-stats">
                    <div class="stat-trofeu">
                        <div class="stat-trofeu-icone">🏆</div>
                        <div class="stat-trofeu-numero">${stats.total}</div>
                        <div class="stat-trofeu-label">Total</div>
                    </div>
                    <div class="stat-trofeu">
                        <div class="stat-trofeu-icone">🥉</div>
                        <div class="stat-trofeu-numero">${stats.comum}</div>
                        <div class="stat-trofeu-label">Comum</div>
                    </div>
                    <div class="stat-trofeu">
                        <div class="stat-trofeu-icone">🥈</div>
                        <div class="stat-trofeu-numero">${stats.rara}</div>
                        <div class="stat-trofeu-label">Rara</div>
                    </div>
                    <div class="stat-trofeu">
                        <div class="stat-trofeu-icone">🥇</div>
                        <div class="stat-trofeu-numero">${stats.epica}</div>
                        <div class="stat-trofeu-label">Épica</div>
                    </div>
                    <div class="stat-trofeu">
                        <div class="stat-trofeu-icone">💎</div>
                        <div class="stat-trofeu-numero">${stats.lendaria}</div>
                        <div class="stat-trofeu-label">Lendária</div>
                    </div>
                    <div class="stat-trofeu">
                        <div class="stat-trofeu-icone">⚡</div>
                        <div class="stat-trofeu-numero">${stats.xpTotal}</div>
                        <div class="stat-trofeu-label">XP Total</div>
                    </div>
                </div>
                
                <div class="space-y-4 text-sm">
                    <div class="flex items-start gap-3">
                        <span class="text-2xl">🎯</span>
                        <div>
                            <strong>Sistema de Conquistas:</strong><br>
                            Complete desafios específicos para desbloquear conquistas e ganhar XP! 
                            Cada conquista possui uma raridade e recompensa diferentes.
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="text-2xl">📈</span>
                        <div>
                            <strong>Progresso em Tempo Real:</strong><br>
                            Suas conquistas são atualizadas automaticamente conforme você usa a plataforma.
                            Participe de campanhas, complete seu perfil e seja ativo na comunidade!
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <span class="text-2xl">🏅</span>
                        <div>
                            <strong>Raridades disponíveis:</strong><br>
                            <div class="ml-4 mt-2 space-y-1">
                                <div>🥉 <strong>Comum:</strong> Conquistas básicas e primeiros passos</div>
                                <div>🥈 <strong>Rara:</strong> Marcos importantes na sua jornada</div>
                                <div>🥇 <strong>Épica:</strong> Feitos impressionantes e dedicação</div>
                                <div>💎 <strong>Lendária:</strong> Conquistas únicas e exclusivas</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Card "Criar Troféu" apenas para administradores
        // Verificando permissões para card admin
        if (isAdmin) {
            html += `
                <!-- Card Criar Troféu (Admin Only) -->
                <div class="criar-trofeu-section mb-8">
                    <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <i class="fas fa-cogs text-primary"></i>
                        Gerenciar Troféus (Administrador)
                    </h4>
                    <div class="criar-trofeu-card" onclick="abrirModalCriarTrofeu()">
                        <div class="criar-trofeu-icone">
                            <i class="fas fa-plus"></i>
                        </div>
                        <div class="criar-trofeu-content">
                            <h5 class="criar-trofeu-titulo">Criar Troféu</h5>
                            <p class="criar-trofeu-descricao">Adicione uma nova conquista para a comunidade</p>
                        </div>
                        <div class="criar-trofeu-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += `
            <!-- Filtros de Categoria -->
            <div class="categorias-conquistas">
                <button class="categoria-btn active" data-categoria="todas">Todas</button>
                <button class="categoria-btn" data-categoria="primeiros_passos">Primeiros Passos</button>
                <button class="categoria-btn" data-categoria="campanhas">Campanhas</button>
                <button class="categoria-btn" data-categoria="tempo">Tempo</button>
                <button class="categoria-btn" data-categoria="social">Social</button>
                <button class="categoria-btn" data-categoria="especiais">Especiais</button>
            </div>
            
            <!-- Grid de Conquistas -->
            <div class="conquistas-grid" id="conquistasGrid">
                ${renderizarConquistas('todas', conquistasUsuario)}
            </div>
        `;
        
        trophiesDiv.innerHTML = html;
        
        // Configurar filtros
        configurarFiltrosConquistas(conquistasUsuario);
        
    } catch (error) {
        console.error('Erro ao carregar troféus:', error);
        trophiesDiv.innerHTML = `
            <div class="trofeus-empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar conquistas</h3>
                <p>Ocorreu um erro ao carregar suas conquistas. Tente recarregar a página.</p>
            </div>
        `;
    }
}

function calcularEstatisticas(conquistasUsuario) {
    let stats = { total: 0, comum: 0, rara: 0, epica: 0, lendaria: 0, xpTotal: 0 };
    
    CONQUISTAS_DISPONIVEIS.forEach(conquista => {
        const conquistaUser = conquistasUsuario[conquista.id];
        if (conquistaUser && conquistaUser.desbloqueada) {
            stats.total++;
            stats[conquista.raridade]++;
            stats.xpTotal += conquista.xp;
        }
    });
    
    return stats;
}

function renderizarConquistas(categoria, conquistasUsuario) {
    const conquistasFiltradas = CONQUISTAS_DISPONIVEIS.filter(conquista =>
        categoria === 'todas' || conquista.categoria === categoria
    );
    
    if (conquistasFiltradas.length === 0) {
        return `
            <div class="trofeus-empty-state">
                <i class="fas fa-trophy"></i>
                <h3>Nenhuma conquista nesta categoria</h3>
                <p>Explore outras categorias para ver suas conquistas!</p>
            </div>
        `;
    }
    
    // Ordenar conquistas: desbloqueadas primeiro, depois por categoria
    const conquistasOrdenadas = conquistasFiltradas.sort((a, b) => {
        const aDesbloqueada = conquistasUsuario[a.id]?.desbloqueada || false;
        const bDesbloqueada = conquistasUsuario[b.id]?.desbloqueada || false;
        
        // Se uma está desbloqueada e outra não, priorizar a desbloqueada
        if (aDesbloqueada && !bDesbloqueada) return -1;
        if (!aDesbloqueada && bDesbloqueada) return 1;
        
        // Se ambas têm o mesmo status de desbloqueio, ordenar por categoria
        if (a.categoria < b.categoria) return -1;
        if (a.categoria > b.categoria) return 1;
        
        // Se mesma categoria, ordenar por raridade (comum primeiro)
        const raridadeOrdem = { 'comum': 1, 'rara': 2, 'epica': 3, 'lendaria': 4 };
        return raridadeOrdem[a.raridade] - raridadeOrdem[b.raridade];
    });
    
    return conquistasOrdenadas.map(conquista => {
        const conquistaUser = conquistasUsuario[conquista.id] || {};
        const desbloqueada = conquistaUser.desbloqueada || false;
        
        const raridadeClass = `raridade-${conquista.raridade}`;
        const estadoClass = desbloqueada ? 'desbloqueada' : 'bloqueada';
        
        return `
            <div class="conquista-card ${estadoClass} ${conquista.raridade}">
                <div class="conquista-header">
                    <div class="conquista-icone">
                        <i class="${conquista.icone}"></i>
                    </div>
                    <div class="conquista-info">
                        <h5 class="conquista-nome">${conquista.nome}</h5>
                        <span class="conquista-raridade ${raridadeClass}">
                            ${conquista.raridade}
                        </span>
                    </div>
                </div>
                
                <p class="conquista-descricao">${conquista.descricao}</p>
                
                <div class="conquista-recompensas">
                    <div class="recompensa-xp">
                        <i class="fas fa-star"></i>
                        <span>+${conquista.xp} XP</span>
                    </div>
                    ${desbloqueada ? 
                        `<div class="conquista-data">
                            <i class="fas fa-check-circle text-green-500"></i>
                        </div>` : 
                        `<div class="conquista-data">
                            <i class="fas fa-lock text-gray-400"></i>
                        </div>`
                    }
                </div>
                
                ${isAdmin ? `
                    <div class="conquista-admin-actions">
                        <button class="btn-editar-trofeu" onclick="abrirModalEditarTrofeu('${conquista.id}')" title="Editar troféu">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-excluir-trofeu" onclick="confirmarExclusaoTrofeu('${conquista.id}', '${conquista.nome}')" title="Excluir troféu">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function obterProgressoMaximo(conquista) {
    const condicoes = conquista.condicoes;
    
    switch (condicoes.tipo) {
        case 'campanhas_count':
        case 'campanhas_total':
        case 'campanhas_completas':
        case 'sessoes_count':
        case 'dias_membro':
            return condicoes.valor;
        default:
            return 0;
    }
}

function configurarFiltrosConquistas(conquistasUsuario) {
    const botoesFiltro = document.querySelectorAll('.categoria-btn');
    
    botoesFiltro.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active de todos os botões
            botoesFiltro.forEach(b => b.classList.remove('active'));
            // Adiciona active ao botão clicado
            this.classList.add('active');
            
            // Atualiza grid de conquistas
            const categoria = this.dataset.categoria;
            const gridConquistas = document.getElementById('conquistasGrid');
            if (gridConquistas) {
                gridConquistas.innerHTML = renderizarConquistas(categoria, conquistasUsuario);
            }
        });
    });
}

async function verificarNovasConquistas(userData) {
    if (!currentUser || !userData) return;
    
    try {
        const conquistasUsuario = userData.conquistas || {};
        const novasConquistas = [];
        
        for (const conquista of CONQUISTAS_DISPONIVEIS) {
            // Se a conquista já está desbloqueada, pular
            if (conquistasUsuario[conquista.id]?.desbloqueada) continue;
            
            // Verificar se a condição foi atendida
            const condicaoAtendida = await verificarCondicaoConquista(conquista, userData);
            
            if (condicaoAtendida) {
                // Marcar conquista como desbloqueada
                conquistasUsuario[conquista.id] = {
                    desbloqueada: true,
                    dataDesbloqueio: new Date().toISOString()
                };
                
                novasConquistas.push(conquista);
            }
        }
        
        // Salvar conquistas atualizadas no banco
        if (novasConquistas.length > 0) {
            try {
                const userRef = firebaseModules.doc(db, 'users', currentUser.uid);
                await firebaseModules.updateDoc(userRef, {
                    conquistas: conquistasUsuario
                });
                
                // Mostrar notificações para novas conquistas
                novasConquistas.forEach((conquista, index) => {
                    setTimeout(() => {
                        mostrarNotificacaoConquista(conquista);
                    }, index * 1000); // Delay entre notificações
                });
            } catch (firebaseError) {
                console.error('Erro ao salvar conquistas no Firebase:', firebaseError);
            }
        }
        
    } catch (error) {
        console.error('Erro ao verificar novas conquistas:', error);
    }
}

async function verificarCondicaoConquista(conquista, userData) {
    if (!currentUser || !userData) return false;
    
    switch (conquista.condicoes.tipo) {
        case 'evento':
            switch (conquista.condicoes.evento) {
                case 'primeiro_login':
                    // Sempre considera primeiro login como verdadeiro se o usuário está logado
                    return true;
                    
                case 'perfil_completo':
                    // Verifica se o perfil está completo no Firebase
                    return userData.displayName && userData.discord && userData.age;
                    
                case 'discord_conectado':
                    // Verifica se tem Discord no Firebase
                    return userData.discord && userData.discord.trim() !== '';
                    
                case 'explorou_site':
                    // Verifica se tem registro de exploração no Firebase
                    return userData.eventos?.explorou_site || false;
                    
                case 'avatar_alterado':
                    // Verifica se tem photoURL diferente do padrão
                    return currentUser.photoURL && !currentUser.photoURL.includes('avatar-default');
                    
                case 'primeira_mensagem':
                    // Verifica no Firebase se já enviou mensagem
                    return userData.eventos?.primeira_mensagem || false;
                    
                case 'visitou_perfil':
                    // Verifica se já visitou o perfil (Firebase)
                    return userData.eventos?.visitou_perfil || false;
                    
                case 'endereco_cadastrado':
                    // Verifica se tem endereço completo no Firebase
                    const endereco = userData.address || {};
                    return endereco.street && endereco.city && endereco.state;
                    
                case 'campanha_visualizada':
                    // Verifica se já visualizou campanha (Firebase)
                    return userData.eventos?.campanha_visualizada || false;
                    
                case 'tutorial_completo':
                    // Verifica se completou tutorial (Firebase)
                    return userData.eventos?.tutorial_completo || false;
                    
                case 'primeira_inscricao':
                    // Verifica se já se inscreveu em alguma campanha (Firebase)
                    return userData.eventos?.primeira_inscricao || false;
                    
                case 'visitou_todas_abas':
                    // Verifica se visitou todas as abas (Firebase)
                    const abasVisitadas = userData.eventos?.abas_visitadas || [];
                    const abasObrigatorias = ['perfil', 'endereco', 'planos', 'mesas', 'trofeus'];
                    return abasObrigatorias.every(aba => abasVisitadas.includes(aba));
                    
                case 'sistemas_diversos':
                    // Conta sistemas diferentes (Firebase)
                    const sistemas = userData.eventos?.sistemas_jogados || [];
                    return sistemas.length >= 3;
                    
                case 'lider_grupo':
                    // Verifica se já foi líder (Firebase)
                    return userData.eventos?.foi_lider || false;
                    
                case 'finais_epicos':
                    // Conta campanhas completadas (Firebase)
                    const campanhasCompletas = userData.eventos?.campanhas_completas || 0;
                    return campanhasCompletas >= 5;
                    
                case 'cenarios_diversos':
                    // Conta cenários diferentes (Firebase)
                    const cenarios = userData.eventos?.cenarios_jogados || [];
                    return cenarios.length >= 5;
                    
                case 'terror_sobreviveu':
                    // Verifica se sobreviveu em terror (Firebase)
                    return userData.eventos?.sobreviveu_terror || false;
                    
                case 'resolucao_pacifica':
                    // Verifica resolução pacífica (Firebase)
                    return userData.eventos?.resolucao_pacifica || false;
                    
                case 'itens_raros':
                    // Conta itens raros (Firebase)
                    const itensRaros = userData.eventos?.itens_raros || 0;
                    return itensRaros >= 10;
                    
                case 'ajudou_novatos':
                    // Verifica se ajudou novatos (Firebase)
                    const novatosAjudados = userData.eventos?.novatos_ajudados || 0;
                    return novatosAjudados >= 3;
                    
                case 'oneshot_rapido':
                    // Verifica oneshot rápido (Firebase)
                    return userData.eventos?.oneshot_rapido || false;
                    
                case 'membro_um_mes':
                    // Verifica se é membro há pelo menos 1 mês
                    const dataRegistro = userData.lastLogin || userData.criadoEm;
                    if (!dataRegistro) return false;
                    const umMesAtras = new Date();
                    umMesAtras.setMonth(umMesAtras.getMonth() - 1);
                    return dataRegistro.toDate() <= umMesAtras;
                    
                case 'membro_seis_meses':
                    // Verifica se é membro há pelo menos 6 meses
                    const dataRegistro6 = userData.lastLogin || userData.criadoEm;
                    if (!dataRegistro6) return false;
                    const seisMesesAtras = new Date();
                    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
                    return dataRegistro6.toDate() <= seisMesesAtras;
                    
                case 'membro_um_ano':
                    // Verifica se é membro há pelo menos 1 ano
                    const dataRegistroAno = userData.lastLogin || userData.criadoEm;
                    if (!dataRegistroAno) return false;
                    const umAnoAtras = new Date();
                    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
                    return dataRegistroAno.toDate() <= umAnoAtras;
                    
                case 'pontualidade_perfeita':
                    // Verifica pontualidade (Firebase)
                    const sessoesPontuais = userData.eventos?.sessoes_pontuais || 0;
                    return sessoesPontuais >= 10;
                    
                case 'sessao_longa':
                    // Verifica sessão longa (Firebase)
                    return userData.eventos?.sessao_longa || false;
                    
                case 'sessoes_noturnas':
                    // Conta sessões noturnas (Firebase)
                    const sessoesNoturnas = userData.eventos?.sessoes_noturnas || 0;
                    return sessoesNoturnas >= 5;
                    
                case 'dois_anos_membro':
                    // Verifica se é membro há 2 anos
                    const dataRegistro2Anos = userData.lastLogin || userData.criadoEm;
                    if (!dataRegistro2Anos) return false;
                    const doisAnosAtras = new Date();
                    doisAnosAtras.setFullYear(doisAnosAtras.getFullYear() - 2);
                    return dataRegistro2Anos.toDate() <= doisAnosAtras;
                    
                case 'fins_semana_consecutivos':
                    // Verifica fins de semana consecutivos (Firebase)
                    const finsSemanConsecutivos = userData.eventos?.fins_semana_consecutivos || 0;
                    return finsSemanConsecutivos >= 10;
                    
                case 'horario_fixo':
                    // Verifica horário fixo (Firebase)
                    return userData.eventos?.horario_fixo || false;
                    
                case 'sem_faltas':
                    // Verifica se não faltou (Firebase)
                    return userData.eventos?.sem_faltas || false;
                    
                case 'primeiro_amigo':
                    // Verifica primeiro amigo (Firebase)
                    return userData.eventos?.primeiro_amigo || false;
                    
                case 'cem_mensagens':
                    // Conta mensagens (Firebase)
                    const mensagensEnviadas = userData.eventos?.mensagens_enviadas || 0;
                    return mensagensEnviadas >= 100;
                    
                case 'organizou_sessao':
                    // Verifica se organizou sessão (Firebase)
                    return userData.eventos?.organizou_sessao || false;
                    
                case 'trouxe_jogadores':
                    // Conta jogadores trazidos (Firebase)
                    const jogadoresTrazidos = userData.eventos?.jogadores_trazidos || 0;
                    return jogadoresTrazidos >= 3;
                    
                case 'compartilhou_historias':
                    // Conta histórias compartilhadas (Firebase)
                    const historiasCompartilhadas = userData.eventos?.historias_compartilhadas || 0;
                    return historiasCompartilhadas >= 5;
                    
                case 'resolveu_conflito':
                    // Verifica resolução de conflito (Firebase)
                    return userData.eventos?.resolveu_conflito || false;
                    
                case 'eventos_especiais':
                    // Conta eventos especiais (Firebase)
                    const eventosEspeciais = userData.eventos?.eventos_especiais || 0;
                    return eventosEspeciais >= 3;
                    
                case 'feedbacks_positivos':
                    // Conta feedbacks (Firebase)
                    const feedbacksPositivos = userData.eventos?.feedbacks_positivos || 0;
                    return feedbacksPositivos >= 10;
                    
                case 'embaixador_indicado':
                    // Verifica se foi indicado como embaixador (Firebase)
                    return userData.eventos?.embaixador_indicado || false;
                    
                case 'mentor_dez_jogadores':
                    // Conta jogadores mentorados (Firebase)
                    const jogadoresMentorados = userData.eventos?.jogadores_mentorados || 0;
                    return jogadoresMentorados >= 10;
                    
                        case 'plano_premium':
            // Verifica se tem plano premium
            return userData.plano && ['relogio', 'lorde', 'nobreza', 'familiareal', 'pracadotempo', 'atemporal', 'cronomante', 'administrador'].includes(userData.plano);
                    
                case 'tres_planos':
                    // Conta planos diferentes já usados (Firebase)
                    const planosUsados = userData.eventos?.planos_usados || [];
                    return planosUsados.length >= 3;
                    
                case 'encontrou_segredo':
                    // Verifica se encontrou página secreta (Firebase)
                    return userData.eventos?.encontrou_segredo || false;
                    
                case 'beta_tester':
                    // Verifica se é beta tester (Firebase)
                    return userData.eventos?.beta_tester || false;
                    
                case 'early_adopter':
                    // Verifica se é early adopter (Firebase)
                    return userData.eventos?.early_adopter || false;
                    
                case 'bug_reportado':
                    // Verifica se reportou bug (Firebase)
                    return userData.eventos?.bug_reportado || false;
                    
                case 'sugestao_implementada':
                    // Verifica se teve sugestão implementada (Firebase)
                    return userData.eventos?.sugestao_implementada || false;
                    
                case 'um_ano_assinatura':
                    // Verifica assinatura de 1 ano (Firebase)
                    const inicioAssinatura = userData.eventos?.inicio_assinatura;
                    if (!inicioAssinatura) return false;
                    const umAnoAssinatura = new Date(inicioAssinatura);
                    umAnoAssinatura.setFullYear(umAnoAssinatura.getFullYear() + 1);
                    return new Date() >= umAnoAssinatura;
                    
                case 'ganhou_sorteio':
                    // Verifica se ganhou sorteio (Firebase)
                    return userData.eventos?.ganhou_sorteio || false;
                    
                case 'lorde_temporal_secreto':
                    // Conquista secreta especial
                    const conquistasDesbloqueadas = Object.keys(userData.conquistas || {}).filter(id => 
                        userData.conquistas[id].desbloqueada
                    ).length;
                    return conquistasDesbloqueadas >= 30; // Precisa ter 30+ conquistas
                    
                default:
                    return false;
            }
            
        case 'perfil_completo':
            // Verifica se nome e discord estão preenchidos no Firebase
            return userData.displayName && userData.discord;
            
        case 'discord_conectado':
            // Verifica se o campo discord está preenchido no Firebase
            return userData.discord && userData.discord.trim() !== '';
            
        default:
            return false;
    }
}

function mostrarNotificacaoConquista(conquista) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'conquista-notification';
    notification.innerHTML = `
        <div class="conquista-notification-content">
            <div class="conquista-notification-icon">
                <i class="${conquista.icone}"></i>
            </div>
            <div class="conquista-notification-text">
                <h4>Conquista Desbloqueada!</h4>
                <h5>${conquista.nome}</h5>
                <p>${conquista.descricao}</p>
                <div class="conquista-xp">
                    <i class="fas fa-star"></i>
                    +${conquista.xp} XP
                </div>
            </div>
        </div>
        <button class="conquista-notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Adicionar estilos se não existirem
    if (!document.getElementById('conquista-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'conquista-notification-styles';
        styles.textContent = `
            .conquista-notification {
                position: fixed;
                top: 2rem;
                right: 2rem;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                border-radius: 1rem;
                padding: 1.5rem;
                box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
                z-index: 10000;
                max-width: 400px;
                animation: slideInRight 0.5s ease-out, fadeOut 0.5s ease-out 4.5s;
                overflow: hidden;
                position: relative;
            }
            
            .conquista-notification::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #ffd700, #ffa500);
            }
            
            .conquista-notification-content {
                display: flex;
                gap: 1rem;
                align-items: flex-start;
            }
            
            .conquista-notification-icon {
                width: 3rem;
                height: 3rem;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            
            .conquista-notification-text h4 {
                font-size: 0.875rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                opacity: 0.9;
                margin: 0 0 0.25rem 0;
            }
            
            .conquista-notification-text h5 {
                font-size: 1.125rem;
                font-weight: 700;
                margin: 0 0 0.5rem 0;
            }
            
            .conquista-notification-text p {
                font-size: 0.875rem;
                opacity: 0.9;
                line-height: 1.4;
                margin: 0 0 0.75rem 0;
            }
            
            .conquista-xp {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                font-weight: 600;
                color: #ffd700;
            }
            
            .conquista-notification-close {
                position: absolute;
                top: 0.75rem;
                right: 0.75rem;
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }
            
            .conquista-notification-close:hover {
                opacity: 1;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Função global para mostrar detalhes da conquista
window.mostrarDetalhesConquista = function(conquistaId) {
    const conquista = CONQUISTAS_DISPONIVEIS.find(c => c.id === conquistaId);
    if (!conquista) return;
    
    // Por enquanto, apenas mostrar uma notificação com os detalhes
    const detalhes = `
        ${conquista.nome}
        
        ${conquista.descricao}
        
        Categoria: ${conquista.categoria.replace('_', ' ')}
        Raridade: ${conquista.raridade}
        Recompensa: ${conquista.xp} XP
    `;
    
    alert(detalhes);
};

// ==================== PAINEL ADMIN ==================== //
async function carregarPainelAdmin() {
    if (!isAdmin) return;
    
    const criarContainer = document.getElementById('criarCampanhaContainer');
    const listaContainer = document.getElementById('listaCampanhasAdmin');
    
    if (!criarContainer || !listaContainer) return;
    
    // Seções do painel admin
    criarContainer.innerHTML = `
        <!-- Navegação do Admin -->
        <div class="admin-nav mb-8">
            <div class="flex flex-wrap gap-4 mb-6">
                <button class="admin-nav-btn active" data-section="campanhas">
                    <i class="fas fa-dungeon mr-2"></i>Gerenciar Campanhas
                </button>
                <button class="admin-nav-btn" data-section="mensagens">
                    <i class="fas fa-comments mr-2"></i>Mensagens
                </button>
                <button class="admin-nav-btn" data-section="clientes">
                    <i class="fas fa-users mr-2"></i>Encontrar Clientes
                </button>
            </div>
        </div>
        
        <!-- Seção Campanhas -->
        <div id="admin-section-campanhas" class="admin-section">
            <form id="criarCampanhaForm" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                <h5 class="text-lg font-bold mb-4">
                    <i class="fas fa-plus mr-2"></i>Criar Nova Campanha
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">Nome da Campanha</label>
                        <input type="text" id="campanhaNome" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">Sistema</label>
                        <input type="text" id="campanhaSistema" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="D&D 5e, Tormenta20, etc" required>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                        <textarea id="campanhaDescricao" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3" required></textarea>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">Vagas</label>
                        <select id="campanhaVagas" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                            <option value="">Selecione</option>
                            ${Array.from({length: 21}, (_, i) => `<option value="${i}">${i}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">Plano Necessário</label>
                        <select id="campanhaPlano" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                            <option value="gratis">Grátis</option>
                                                    <option value="minuta">Minuta</option>
                        <option value="minutos">Minutos</option>
                        <option value="relogio">Relógio</option>
                        <option value="lorde">Lorde</option>
                        <option value="nobreza">Nobreza</option>
                        <option value="familiareal">Família Real</option>
                        <option value="pracadotempo">Praça do Tempo</option>
                        <option value="atemporal">Atemporal</option>
                        <option value="cronomante">Cronomante</option>
                            <option value="administrador">Administrador</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">Dia da Semana</label>
                        <select id="campanhaDia" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                            <option value="">Selecione</option>
                            <option value="Segunda">Segunda</option>
                            <option value="Terça">Terça</option>
                            <option value="Quarta">Quarta</option>
                            <option value="Quinta">Quinta</option>
                            <option value="Sexta">Sexta</option>
                            <option value="Sábado">Sábado</option>
                            <option value="Domingo">Domingo</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">Horário</label>
                        <input type="time" id="campanhaHorario" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">Duração</label>
                        <input type="text" id="campanhaDuracao" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="3-4 horas">
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">Requisitos</label>
                        <textarea id="campanhaRequisitos" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3" placeholder="Requisitos específicos"></textarea>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">Regras</label>
                        <textarea id="campanhaRegras" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3" placeholder="Regras da mesa"></textarea>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-image mr-2"></i>Imagem da Campanha
                        </label>
                        <div class="image-upload-container">
                            <input type="file" id="campanhaImagem" accept="image/*" class="hidden" onchange="previewImagemCampanha(this)">
                            <div class="image-upload-area" onclick="document.getElementById('campanhaImagem').click()">
                                <div id="imagePreview" class="image-preview hidden">
                                    <img id="previewImg" src="" alt="Preview da imagem" class="preview-image">
                                    <button type="button" class="remove-image-btn" onclick="removerImagemCampanha()" title="Remover imagem">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div id="uploadPlaceholder" class="upload-placeholder">
                                    <i class="fas fa-cloud-upload-alt text-4xl mb-2 text-gray-400"></i>
                                    <p class="text-gray-600 dark:text-gray-400">Clique para selecionar uma imagem</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-500">PNG, JPG, GIF até 10MB (compressão automática)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button type="submit" class="lorde-btn px-6 py-2">
                    <i class="fas fa-plus mr-2"></i>Criar Campanha
                </button>
                <div id="campanhaMsg" class="mt-4"></div>
            </form>
            
            <!-- Lista de Campanhas Ativas (só aparece nesta seção) -->
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h5 class="text-lg font-bold mb-4">
                    <i class="fas fa-list mr-2"></i>Campanhas Ativas
                </h5>
                <div id="listaCampanhasContainer"></div>
            </div>
        </div>
        
        <!-- Seção Mensagens -->
        <div id="admin-section-mensagens" class="admin-section hidden">
            <!-- Dashboard de Mensagens -->
            <div class="mensagens-dashboard bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border-l-4 border-blue-500 mb-6">
                <h5 class="text-xl font-bold text-blue-700 dark:text-blue-300 mb-4">
                    <i class="fas fa-chart-line mr-2"></i>Dashboard de Mensagens
                </h5>
                <div id="mensagensDashboard" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="stat-card">
                        <div class="stat-number" id="totalMensagens">0</div>
                        <div class="stat-label">Total</div>
                    </div>
                    <div class="stat-card nova">
                        <div class="stat-number" id="mensagensNovas">0</div>
                        <div class="stat-label">Novas</div>
                    </div>
                    <div class="stat-card respondida">
                        <div class="stat-number" id="mensagensRespondidas">0</div>
                        <div class="stat-label">Respondidas</div>
                    </div>
                    <div class="stat-card urgente">
                        <div class="stat-number" id="mensagensUrgentes">0</div>
                        <div class="stat-label">Urgentes</div>
                    </div>
                </div>
            </div>
            
            <!-- Filtros e Controles -->
            <div class="filtros-container bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <div class="flex flex-wrap gap-4 items-center justify-between">
                    <div class="flex flex-wrap gap-3">
                        <select id="filtroStatusMensagens" class="filtro-select px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">Todos os Status</option>
                            <option value="nova">Novas</option>
                            <option value="lida">Lidas</option>
                            <option value="respondida">Respondidas</option>
                            <option value="resolvida">Resolvidas</option>
                        </select>
                        
                        <select id="filtroCategoriaMensagens" class="filtro-select px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">Todas as Categorias</option>
                            <option value="problema">Problemas</option>
                            <option value="duvida">Dúvidas</option>
                            <option value="sugestao">Sugestões</option>
                            <option value="planos">Planos</option>
                            <option value="conta">Conta</option>
                            <option value="geral">Geral</option>
                        </select>
                        
                        <select id="filtroPrioridadeMensagens" class="filtro-select px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">Todas as Prioridades</option>
                            <option value="urgente">Urgente</option>
                            <option value="alta">Alta</option>
                            <option value="normal">Normal</option>
                            <option value="baixa">Baixa</option>
                        </select>
                    </div>
                    
                    <div class="flex gap-2">
                        <button id="btnAtualizarMensagens" class="btn-admin atualizar bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                            <i class="fas fa-sync-alt mr-2"></i>Atualizar
                        </button>
                        <button id="btnMarcarTodasLidas" class="btn-admin marcar-lidas bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                            <i class="fas fa-check-double mr-2"></i>Marcar Todas Lidas
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Lista de Conversas -->
            <div class="conversas-container bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="conversas-header p-4 border-b border-gray-200 dark:border-gray-700">
                    <h5 class="conversas-titulo text-lg font-bold text-gray-900 dark:text-white">
                        <i class="fas fa-inbox mr-2"></i>Conversas de Suporte
                    </h5>
                </div>
                
                <div id="listaMensagensAdmin" class="divide-y divide-gray-200 dark:divide-gray-700">
                    <div class="mensagens-empty-state p-8 text-center text-gray-500 dark:text-gray-400">
                        <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                        <p>Carregando mensagens...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Seção Clientes -->
        <div id="admin-section-clientes" class="admin-section hidden">
            <!-- Seção de Importação/Exportação de Contatos -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border-l-4 border-green-500 mb-6">
                <h5 class="text-lg font-bold text-green-700 dark:text-green-300 mb-4">
                    <i class="fas fa-file-csv mr-2"></i>Gerenciar Contatos (CSV)
                </h5>
                <p class="text-green-600 dark:text-green-400 mb-4">
                    Importe e exporte contatos de/para arquivos CSV compatíveis com Google Contacts
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Exportar Contatos -->
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <h6 class="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                            <i class="fas fa-download text-green-500 mr-2"></i>Exportar Contatos
                        </h6>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Baixe todos os contatos cadastrados em formato CSV compatível com Google Contacts
                        </p>
                        <button id="btnExportarContatos" class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center">
                            <i class="fas fa-download mr-2"></i>Exportar CSV
                        </button>
                    </div>
                    
                    <!-- Importar Contatos -->
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <h6 class="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                            <i class="fas fa-upload text-blue-500 mr-2"></i>Importar Contatos
                        </h6>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Carregue um arquivo CSV do Google Contacts para importar contatos
                        </p>
                        <div class="space-y-3">
                            <input type="file" id="csvFileInput" accept=".csv" class="hidden" onchange="processarArquivoCSV(this)">
                            <button onclick="document.getElementById('csvFileInput').click()" 
                                    class="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center">
                                <i class="fas fa-upload mr-2"></i>Selecionar Arquivo CSV
                            </button>
                            <div id="csvPreview" class="hidden">
                                <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview dos dados:</div>
                                <div id="csvPreviewContent" class="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs"></div>
                                <button id="btnImportarContatos" class="w-full mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition">
                                    <i class="fas fa-check mr-2"></i>Confirmar Importação
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="csvResults" class="mt-4"></div>
            </div>
            
            <!-- Seção de Busca de Clientes -->
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                <h5 class="text-lg font-bold mb-4">
                    <i class="fas fa-search mr-2"></i>Buscar Cliente
                </h5>
                <div class="flex gap-4 mb-4">
                    <input type="text" id="buscarCliente" 
                           class="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                           placeholder="Digite o email ou nome do cliente...">
                    <button id="btnBuscarCliente" class="lorde-btn px-6 py-2">
                        <i class="fas fa-search mr-2"></i>Buscar
                    </button>
                </div>
                <div id="resultadoBusca" class="mt-4"></div>
            </div>
            
            <!-- Seção de Limpeza de Duplicados -->
            <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 mb-6 border-l-4 border-orange-500">
                <h5 class="text-lg font-bold text-orange-700 dark:text-orange-300 mb-4">
                    <i class="fas fa-broom mr-2"></i>Limpeza de Usuários Duplicados
                </h5>
                <p class="text-orange-600 dark:text-orange-400 mb-4">
                    Detecta e remove automaticamente usuários duplicados (mesmo email), mesclando seus dados de forma inteligente.
                </p>
                <div class="space-y-4">
                    <button id="btnLimparDuplicados" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 font-semibold" onclick="detectarELimparDuplicados()">
                        <i class="fas fa-broom mr-2"></i>Detectar e Limpar Duplicados
                    </button>
                    <div id="resultadoDuplicados"></div>
                </div>
            </div>
            
            <div id="listaClientes" class="space-y-4">
                <div class="text-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-users text-4xl mb-2"></i>
                    <p>Use a busca acima para encontrar clientes específicos ou carregue todos os usuários</p>
                    <button id="carregarTodosUsuarios" class="lorde-btn mt-4 px-6 py-2">
                        <i class="fas fa-list mr-2"></i>Carregar Todos os Usuários
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Event listeners para navegação
    const navBtns = document.querySelectorAll('.admin-nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active de todos
            navBtns.forEach(b => b.classList.remove('active'));
            // Adiciona active ao clicado
            btn.classList.add('active');
            
            // Esconde todas as seções
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Mostra a seção selecionada
            const section = btn.dataset.section;
            document.getElementById(`admin-section-${section}`).classList.remove('hidden');
            
            // Carregar dados específicos da seção
            if (section === 'mensagens') {
                carregarMensagensAdmin();
            }
        });
    });
    
    // Event listeners da seção clientes
    document.getElementById('btnBuscarCliente').addEventListener('click', buscarCliente);
    document.getElementById('buscarCliente').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarCliente();
    });
    document.getElementById('carregarTodosUsuarios').addEventListener('click', carregarTodosUsuarios);
    
    // Event listeners para CSV
    document.getElementById('btnExportarContatos').addEventListener('click', exportarContatosCSV);
    const btnImportarContatos = document.getElementById('btnImportarContatos');
    if (btnImportarContatos) {
        btnImportarContatos.addEventListener('click', importarContatosCSV);
    }
    
    // Event listener do formulário de campanha
    const form = document.getElementById('criarCampanhaForm');
    if (form) {
        form.addEventListener('submit', criarCampanha);
    }
    
    // Carregar lista de campanhas apenas na seção de campanhas
    carregarListaCampanhas();
    
    // Limpar o container original que não é mais usado
    listaContainer.innerHTML = '';
}

async function criarCampanha(e) {
    e.preventDefault();
    
    const msgDiv = document.getElementById('campanhaMsg');
    
    // Processar imagem se foi selecionada
    let imagemUrl = null;
    const imagemInput = document.getElementById('campanhaImagem');
    if (imagemInput && imagemInput.files[0]) {
        try {
            msgDiv.innerHTML = '<div class="text-blue-500"><i class="fas fa-spinner fa-spin mr-2"></i>Processando imagem...</div>';
            imagemUrl = await processarImagemCampanha(imagemInput.files[0]);
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            msgDiv.innerHTML = `<div class="text-red-500">Erro ao processar imagem: ${error.message}</div>`;
            return;
        }
    }
    
    const campanha = {
        nome: document.getElementById('campanhaNome').value.trim(),
        descricao: document.getElementById('campanhaDescricao').value.trim(),
        sistema: document.getElementById('campanhaSistema').value.trim(),
        vagas: document.getElementById('campanhaVagas').value,
        plano: document.getElementById('campanhaPlano').value,
        dia: document.getElementById('campanhaDia').value,
        horario: document.getElementById('campanhaHorario').value,
        duracao: document.getElementById('campanhaDuracao')?.value || '3-4 horas',
        requisitos: document.getElementById('campanhaRequisitos')?.value || '',
        regras: document.getElementById('campanhaRegras')?.value || '',
        imagem: imagemUrl,
        criadaPor: currentUser.email,
        criadaEm: new Date(),
        jogadores: []
    };
    
    try {
        await firebaseModules.addDoc(firebaseModules.collection(db, 'campanhas'), campanha);
        
        msgDiv.innerHTML = '<div class="text-green-500">Campanha criada com sucesso!</div>';
        
        // Limpar formulário
        document.getElementById('criarCampanhaForm').reset();
        
        // Recarregar lista
        carregarListaCampanhas();
        
    } catch (error) {
        console.error('Erro ao criar campanha:', error);
        msgDiv.innerHTML = '<div class="text-red-500">Erro ao criar campanha!</div>';
    }
}

// Funções para manipulação de imagem de campanha
function previewImagemCampanha(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validar tamanho (10MB - será comprimida automaticamente)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('A imagem deve ter menos de 10MB', 'error');
        input.value = '';
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        showNotification('Arquivo deve ser uma imagem', 'error');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('uploadPlaceholder');
        const img = document.getElementById('previewImg');
        
        if (preview && placeholder && img) {
            img.src = e.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
        }
    };
    reader.readAsDataURL(file);
}

function removerImagemCampanha() {
    const input = document.getElementById('campanhaImagem');
    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    
    if (input) input.value = '';
    if (preview) preview.classList.add('hidden');
    if (placeholder) placeholder.classList.remove('hidden');
}

async function processarImagemCampanha(file) {
    return new Promise((resolve, reject) => {
        // Criar canvas para redimensionar/comprimir a imagem
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Calcular dimensões mantendo proporção (máximo 800x600)
            const maxWidth = 800;
            const maxHeight = 600;
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            // Configurar canvas
            canvas.width = width;
            canvas.height = height;
            
            // Desenhar imagem redimensionada
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converter para base64 com compressão
            let quality = 0.8;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            
            // Se ainda estiver muito grande, reduzir qualidade
            while (dataUrl.length > 900000 && quality > 0.1) { // Limite de ~900KB para segurança
                quality -= 0.1;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            
            if (dataUrl.length > 900000) {
                reject(new Error('Não foi possível comprimir a imagem suficientemente. Tente uma imagem menor.'));
                return;
            }
            
            resolve(dataUrl);
        };
        
        img.onerror = function() {
            reject(new Error('Erro ao carregar a imagem'));
        };
        
        // Carregar a imagem
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.onerror = function() {
            reject(new Error('Erro ao ler o arquivo'));
        };
        reader.readAsDataURL(file);
    });
}

// Funções para preview e remoção de imagem na edição
function previewImagemEdicaoCampanha(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validar tamanho (10MB - será comprimida automaticamente)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('A imagem deve ter menos de 10MB', 'error');
        input.value = '';
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        showNotification('Arquivo deve ser uma imagem', 'error');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('editImagePreview');
        const placeholder = document.getElementById('editUploadPlaceholder');
        const img = document.getElementById('editPreviewImg');
        
        if (preview && placeholder && img) {
            img.src = e.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
        }
    };
    reader.readAsDataURL(file);
}

function removerImagemEdicaoCampanha() {
    const input = document.getElementById('editCampanhaImagem');
    const preview = document.getElementById('editImagePreview');
    const placeholder = document.getElementById('editUploadPlaceholder');
    
    if (input) input.value = '';
    if (preview) preview.classList.add('hidden');
    if (placeholder) placeholder.classList.remove('hidden');
}

// Funções para adicionar campos de imagem no modal de edição
window.previewImagemCampanha = previewImagemCampanha;
window.removerImagemCampanha = removerImagemCampanha;
window.previewImagemEdicaoCampanha = previewImagemEdicaoCampanha;
window.removerImagemEdicaoCampanha = removerImagemEdicaoCampanha;

async function carregarListaCampanhas() {
    const listaContainer = document.getElementById('listaCampanhasContainer') || document.getElementById('listaCampanhasAdmin');
    if (!listaContainer) return;
    
            listaContainer.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400">Carregando campanhas...</div>';
    
    try {
        const q = firebaseModules.query(firebaseModules.collection(db, 'campanhas'), firebaseModules.orderBy('criadaEm', 'desc'));
        const snapshot = await firebaseModules.getDocs(q);
        
        if (snapshot.empty) {
            listaContainer.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400">Nenhuma campanha cadastrada.</div>';
            return;
        }
        
        const html = snapshot.docs.map(docSnap => {
            const campanha = docSnap.data();
            const jogadores = campanha.jogadores || [];
            
            // Criar seção de imagem se existir
            const imagemSection = campanha.imagem ? `
                <div class="campanha-admin-imagem mb-4">
                    <img src="${campanha.imagem}" alt="${campanha.nome}" 
                         class="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600">
                </div>
            ` : '';
            
            return `
                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 border">
                    ${imagemSection}
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h6 class="font-bold text-lg text-gray-900 dark:text-white mb-2">
                                <i class="fas fa-dungeon mr-2 text-primary"></i>${campanha.nome}
                            </h6>
                            <p class="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">${campanha.descricao}</p>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <div class="flex items-center">
                                    <i class="fas fa-gamepad mr-2 text-blue-500"></i>
                                    <span>${campanha.sistema}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-users mr-2 text-green-500"></i>
                                    <span>${jogadores.length}/${campanha.vagas}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-calendar mr-2 text-purple-500"></i>
                                    <span>${campanha.dia}</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-clock mr-2 text-orange-500"></i>
                                    <span>${campanha.horario}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2 ml-4 flex-shrink-0">
                            <button class="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition flex items-center" 
                                    onclick="editarCampanha('${docSnap.id}')" title="Editar Campanha">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition flex items-center" 
                                    onclick="verJogadores('${docSnap.id}')" title="Ver Jogadores">
                                <i class="fas fa-users"></i>
                            </button>
                            <button class="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition flex items-center" 
                                    onclick="excluirCampanha('${docSnap.id}')" title="Excluir Campanha">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        listaContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
        listaContainer.innerHTML = '<div class="text-center text-red-500">Erro ao carregar campanhas.</div>';
    }
}

// Função global para excluir campanha
window.excluirCampanha = async function(campanhaId) {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;
    
    try {
        await firebaseModules.deleteDoc(firebaseModules.doc(db, 'campanhas', campanhaId));
        showNotification('Campanha excluída com sucesso!', 'success');
        carregarListaCampanhas();
    } catch (error) {
        console.error('Erro ao excluir campanha:', error);
        showNotification('Erro ao excluir campanha!', 'error');
    }
};

// Função global para editar campanha
window.editarCampanha = async function(campanhaId) {
    try {
        // Buscar dados da campanha
        const campanhaRef = firebaseModules.doc(db, 'campanhas', campanhaId);
        const campanhaSnap = await firebaseModules.getDoc(campanhaRef);
        
        if (!campanhaSnap.exists()) {
            showNotification('Campanha não encontrada!', 'error');
            return;
        }
        
        const campanha = campanhaSnap.data();
        
        // Criar modal de edição
        const modalBody = document.getElementById('modal-body-editar');
        modalBody.innerHTML = `
            <form id="editarCampanhaForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Nome da Campanha</label>
                        <input type="text" id="editCampanhaNome" 
                               class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                               value="${campanha.nome || ''}" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Sistema</label>
                        <input type="text" id="editCampanhaSistema" 
                               class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                               value="${campanha.sistema || ''}" placeholder="D&D 5e, Tormenta20, etc" required>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Descrição</label>
                        <textarea id="editCampanhaDescricao" 
                                  class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                  rows="3" required>${campanha.descricao || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Vagas</label>
                        <select id="editCampanhaVagas" 
                                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                            <option value="">Selecione</option>
                            ${Array.from({length: 21}, (_, i) => 
                                `<option value="${i}" ${campanha.vagas == i ? 'selected' : ''}>${i}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Plano Necessário</label>
                        <select id="editCampanhaPlano" 
                                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                            <option value="gratis" ${campanha.plano === 'gratis' ? 'selected' : ''}>Grátis</option>
                                            <option value="minuta" ${campanha.plano === 'minuta' ? 'selected' : ''}>Minuta</option>
                <option value="minutos" ${campanha.plano === 'minutos' ? 'selected' : ''}>Minutos</option>
                <option value="relogio" ${campanha.plano === 'relogio' ? 'selected' : ''}>Relógio</option>
                <option value="lorde" ${campanha.plano === 'lorde' ? 'selected' : ''}>Lorde</option>
                <option value="nobreza" ${campanha.plano === 'nobreza' ? 'selected' : ''}>Nobreza</option>
                <option value="familiareal" ${campanha.plano === 'familiareal' ? 'selected' : ''}>Família Real</option>
                <option value="pracadotempo" ${campanha.plano === 'pracadotempo' ? 'selected' : ''}>Praça do Tempo</option>
                <option value="atemporal" ${campanha.plano === 'atemporal' ? 'selected' : ''}>Atemporal</option>
                <option value="cronomante" ${campanha.plano === 'cronomante' ? 'selected' : ''}>Cronomante</option>
                            <option value="administrador" ${campanha.plano === 'administrador' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Dia da Semana</label>
                        <select id="editCampanhaDia" 
                                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                            <option value="">Selecione</option>
                            <option value="Segunda" ${campanha.dia === 'Segunda' ? 'selected' : ''}>Segunda</option>
                            <option value="Terça" ${campanha.dia === 'Terça' ? 'selected' : ''}>Terça</option>
                            <option value="Quarta" ${campanha.dia === 'Quarta' ? 'selected' : ''}>Quarta</option>
                            <option value="Quinta" ${campanha.dia === 'Quinta' ? 'selected' : ''}>Quinta</option>
                            <option value="Sexta" ${campanha.dia === 'Sexta' ? 'selected' : ''}>Sexta</option>
                            <option value="Sábado" ${campanha.dia === 'Sábado' ? 'selected' : ''}>Sábado</option>
                            <option value="Domingo" ${campanha.dia === 'Domingo' ? 'selected' : ''}>Domingo</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Horário</label>
                        <input type="time" id="editCampanhaHorario" 
                               class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                               value="${campanha.horario || ''}" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Duração</label>
                        <input type="text" id="editCampanhaDuracao" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value="${campanha.duracao || '3-4 horas'}" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Requisitos</label>
                        <textarea id="editCampanhaRequisitos" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3">${campanha.requisitos || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Regras</label>
                        <textarea id="editCampanhaRegras" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows="3">${campanha.regras || ''}</textarea>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                            <i class="fas fa-image mr-2"></i>Imagem da Campanha
                        </label>
                        <div class="image-upload-container">
                            <input type="file" id="editCampanhaImagem" accept="image/*" class="hidden" onchange="previewImagemEdicaoCampanha(this)">
                            <div class="image-upload-area" onclick="document.getElementById('editCampanhaImagem').click()">
                                <div id="editImagePreview" class="image-preview ${campanha.imagem ? '' : 'hidden'}">
                                    <img id="editPreviewImg" src="${campanha.imagem || ''}" alt="Preview da imagem" class="preview-image">
                                    <button type="button" class="remove-image-btn" onclick="removerImagemEdicaoCampanha()" title="Remover imagem">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div id="editUploadPlaceholder" class="upload-placeholder ${campanha.imagem ? 'hidden' : ''}">
                                    <i class="fas fa-cloud-upload-alt text-4xl mb-2 text-gray-400"></i>
                                    <p class="text-gray-600 dark:text-gray-400">Clique para ${campanha.imagem ? 'alterar' : 'selecionar'} uma imagem</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-500">PNG, JPG, GIF até 10MB (compressão automática)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                    <button type="button" class="secondary-btn" onclick="fecharModalEditar()">
                        <i class="fas fa-times mr-2"></i>Cancelar
                    </button>
                    <button type="submit" class="lorde-btn">
                        <i class="fas fa-save mr-2"></i>Salvar Alterações
                    </button>
                </div>
                <div id="editCampanhaMsg" class="mt-4"></div>
            </form>
        `;
        
        // Mostrar modal
        const modal = document.getElementById('modal-editar-campanha');
        modal.classList.add('active');
        
        // Event listener do formulário
        const form = document.getElementById('editarCampanhaForm');
        form.addEventListener('submit', (e) => salvarEdicaoCampanha(e, campanhaId));
        
    } catch (error) {
        console.error('Erro ao carregar dados da campanha:', error);
        showNotification('Erro ao carregar dados da campanha!', 'error');
    }
};

// Função global para ver jogadores
window.verJogadores = async function(campanhaId) {
    try {
        // Buscar dados da campanha
        const campanhaRef = firebaseModules.doc(db, 'campanhas', campanhaId);
        const campanhaSnap = await firebaseModules.getDoc(campanhaRef);
        
        if (!campanhaSnap.exists()) {
            showNotification('Campanha não encontrada!', 'error');
            return;
        }
        
        const campanha = campanhaSnap.data();
        const jogadores = campanha.jogadores || [];
        
        // Criar modal de jogadores
        const modalBody = document.getElementById('modal-body-jogadores');
        
        if (jogadores.length === 0) {
            modalBody.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-users text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">Nenhum jogador inscrito</h3>
                    <p class="text-gray-500 dark:text-gray-400">Esta campanha ainda não possui jogadores inscritos.</p>
                </div>
            `;
        } else {
            // Buscar dados completos dos jogadores
            const jogadoresCompletos = await Promise.all(
                jogadores.map(async (jogador) => {
                    try {
                        // Buscar dados do usuário no Firestore
                        const q = firebaseModules.query(firebaseModules.collection(db, 'users'));
                        const snap = await firebaseModules.getDocs(q);
                        let userData = null;
                        
                        snap.forEach(docSnap => {
                            const data = docSnap.data();
                            if (data.email && data.email.toLowerCase() === jogador.email.toLowerCase()) {
                                userData = { id: docSnap.id, ...data };
                            }
                        });
                        
                        // Verificar se é admin
                        const isJogadorAdmin = isAdminEmail(jogador.email.toLowerCase());
                        let planoFinal = userData?.plano || 'gratis';
                        
                        // Se for admin, sempre mostrar como administrador
                        if (isJogadorAdmin) {
                            planoFinal = 'administrador';
                        }
                        
                        return {
                            ...jogador,
                            userData: userData,
                            plano: planoFinal
                        };
                    } catch (error) {
                        console.error('Erro ao buscar dados do jogador:', error);
                        return {
                            ...jogador,
                            userData: null,
                            plano: 'gratis'
                        };
                    }
                })
            );
            
            modalBody.innerHTML = `
                <div class="space-y-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                            Jogadores da Campanha (${jogadores.length}/${campanha.vagas || 0})
                        </h3>
                    </div>
                    <div class="space-y-3">
                        ${jogadoresCompletos.map((jogador, index) => {
                            // Função para obter nome do plano (local)
                            function obterNomePlanoJogador(plano) {
                                const planos = {
                                    'gratis': 'Grátis',
                                                                'minuta': 'Minuta',
                            'minutos': 'Minutos',
                            'relogio': 'Relógio',
                            'lorde': 'Lorde',
                            'nobreza': 'Nobreza',
                            'familiareal': 'Família Real',
                            'pracadotempo': 'Praça do Tempo',
                            'atemporal': 'Atemporal',
                            'cronomante': 'Cronomante',
                                    'administrador': 'Administrador'
                                };
                                return planos[plano] || 'Grátis';
                            }
                            
                            const planoLabel = obterNomePlanoJogador(jogador.plano);
                            const planoColor = jogador.plano === 'relogio' ? 'text-green-600' : 
                                             jogador.plano === 'administrador' ? 'text-purple-600' : 
                                             jogador.plano === 'outro' ? 'text-blue-600' : 'text-gray-600';
                            
                            return `
                                <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-3 mb-2">
                                                <img src="${jogador.userData?.photoURL || 'images/avatar-default.png'}" 
                                                     alt="Avatar" class="w-10 h-10 rounded-full border-2 border-primary">
                                                <div>
                                                    <h4 class="font-bold text-gray-900 dark:text-white">
                                                        ${jogador.userData?.displayName || jogador.nome || 'Nome não informado'}
                                                    </h4>
                                                    <p class="text-sm text-gray-600 dark:text-gray-400">${jogador.email}</p>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-4 mb-3">
                                                <span class="text-xs px-2 py-1 rounded-full bg-primary text-white font-semibold">
                                                    <i class="fas fa-crown mr-1"></i>${planoLabel}
                                                </span>
                                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                                    Inscrito em: ${jogador.dataInscricao ? new Date(jogador.dataInscricao.seconds * 1000).toLocaleDateString() : 'Data não disponível'}
                                                </span>
                                            </div>
                                            <div class="mb-3">
                                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    Anotações do Admin:
                                                </label>
                                                <textarea id="anotacao-${index}" 
                                                          class="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                                          rows="2" placeholder="Adicione anotações sobre este jogador...">${jogador.anotacoes || ''}</textarea>
                                            </div>
                                        </div>
                                        <div class="flex flex-col gap-2 ml-4">
                                            <button class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition" 
                                                    onclick="salvarAnotacao('${campanhaId}', ${index}, document.getElementById('anotacao-${index}').value)">
                                                <i class="fas fa-save mr-1"></i>Salvar
                                            </button>
                                            <button class="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition" 
                                                    onclick="removerJogador('${campanhaId}', '${jogador.email}')">
                                                <i class="fas fa-user-minus mr-1"></i>Remover
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // Mostrar modal
        const modal = document.getElementById('modal-jogadores-campanha');
        modal.classList.add('active');
        
    } catch (error) {
        console.error('Erro ao carregar jogadores da campanha:', error);
        showNotification('Erro ao carregar jogadores da campanha!', 'error');
    }
};

// Função para salvar edição da campanha
async function salvarEdicaoCampanha(e, campanhaId) {
    e.preventDefault();
    
    const msgDiv = document.getElementById('editCampanhaMsg');
    
    try {
        // Primeiro, obter dados atuais da campanha para preservar a imagem existente
        const campanhaRef = firebaseModules.doc(db, 'campanhas', campanhaId);
        const campanhaSnap = await firebaseModules.getDoc(campanhaRef);
        const campanhaAtual = campanhaSnap.data();
        
        // Processar nova imagem se foi selecionada
        let imagemUrl = campanhaAtual.imagem; // Manter imagem atual por padrão
        const imagemInput = document.getElementById('editCampanhaImagem');
        
        if (imagemInput && imagemInput.files[0]) {
            try {
                msgDiv.innerHTML = '<div class="text-blue-500 font-semibold"><i class="fas fa-spinner fa-spin mr-2"></i>Processando nova imagem...</div>';
                imagemUrl = await processarImagemCampanha(imagemInput.files[0]);
            } catch (error) {
                console.error('Erro ao processar nova imagem:', error);
                msgDiv.innerHTML = `<div class="text-red-500 font-semibold">Erro ao processar imagem: ${error.message}</div>`;
                return;
            }
        }
        
        const campanhaAtualizada = {
            nome: document.getElementById('editCampanhaNome').value.trim(),
            descricao: document.getElementById('editCampanhaDescricao').value.trim(),
            sistema: document.getElementById('editCampanhaSistema').value.trim(),
            vagas: document.getElementById('editCampanhaVagas').value,
            plano: document.getElementById('editCampanhaPlano').value,
            dia: document.getElementById('editCampanhaDia').value,
            horario: document.getElementById('editCampanhaHorario').value,
            duracao: document.getElementById('editCampanhaDuracao').value || '3-4 horas',
            requisitos: document.getElementById('editCampanhaRequisitos').value || '',
            regras: document.getElementById('editCampanhaRegras').value || '',
            imagem: imagemUrl,
            editadaEm: new Date(),
            editadaPor: currentUser.email
        };
        
        // Atualizar no Firestore
        await firebaseModules.setDoc(campanhaRef, campanhaAtualizada, { merge: true });
        
        msgDiv.innerHTML = '<div class="text-green-500 font-semibold">Campanha atualizada com sucesso!</div>';
        
        // Fechar modal após 1.5 segundos
        setTimeout(() => {
            fecharModalEditar();
            carregarListaCampanhas(); // Recarregar lista
            showNotification('Campanha editada com sucesso!', 'success');
        }, 1500);
        
    } catch (error) {
        console.error('Erro ao salvar edição da campanha:', error);
        msgDiv.innerHTML = '<div class="text-red-500 font-semibold">Erro ao salvar alterações!</div>';
    }
}

// Função para fechar modal de edição
window.fecharModalEditar = function() {
    const modal = document.getElementById('modal-editar-campanha');
    modal.classList.remove('active');
};

// Função para fechar modal de jogadores
window.fecharModalJogadores = function() {
    const modal = document.getElementById('modal-jogadores-campanha');
    modal.classList.remove('active');
};

// Função para salvar anotação do jogador
window.salvarAnotacao = async function(campanhaId, jogadorIndex, anotacao) {
    try {
        const campanhaRef = firebaseModules.doc(db, 'campanhas', campanhaId);
        const campanhaSnap = await firebaseModules.getDoc(campanhaRef);
        
        if (!campanhaSnap.exists()) {
            showNotification('Campanha não encontrada!', 'error');
            return;
        }
        
        const campanha = campanhaSnap.data();
        const jogadores = [...(campanha.jogadores || [])];
        
        if (jogadorIndex >= 0 && jogadorIndex < jogadores.length) {
            jogadores[jogadorIndex].anotacoes = anotacao.trim();
            jogadores[jogadorIndex].anotacaoEditadaEm = new Date();
            jogadores[jogadorIndex].anotacaoEditadaPor = currentUser.email;
            
            await firebaseModules.setDoc(campanhaRef, { jogadores }, { merge: true });
            showNotification('Anotação salva com sucesso!', 'success');
        }
        
    } catch (error) {
        console.error('Erro ao salvar anotação:', error);
        showNotification('Erro ao salvar anotação!', 'error');
    }
};

// Função para remover jogador da campanha
window.removerJogador = async function(campanhaId, emailJogador) {
    if (!confirm('Tem certeza que deseja remover este jogador da campanha?')) return;
    
    try {
        const campanhaRef = firebaseModules.doc(db, 'campanhas', campanhaId);
        const campanhaSnap = await firebaseModules.getDoc(campanhaRef);
        
        if (!campanhaSnap.exists()) {
            showNotification('Campanha não encontrada!', 'error');
            return;
        }
        
        const campanha = campanhaSnap.data();
        const jogadores = (campanha.jogadores || []).filter(
            jogador => jogador.email.toLowerCase() !== emailJogador.toLowerCase()
        );
        
        await firebaseModules.setDoc(campanhaRef, { jogadores }, { merge: true });
        showNotification('Jogador removido com sucesso!', 'success');
        
        // Recarregar modal de jogadores
        setTimeout(() => {
            verJogadores(campanhaId);
        }, 500);
        
    } catch (error) {
        console.error('Erro ao remover jogador:', error);
        showNotification('Erro ao remover jogador!', 'error');
    }
};

// Configurar modais
function configurarModais() {
    // Modal de editar campanha
    const modalEditar = document.getElementById('modal-editar-campanha');
    if (modalEditar) {
        // Fechar ao clicar no overlay
        modalEditar.addEventListener('click', function(e) {
            if (e.target === modalEditar) {
                fecharModalEditar();
            }
        });
        
        // Fechar ao clicar no botão X
        const closeBtn = modalEditar.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', fecharModalEditar);
        }
    }
    
    // Modal de jogadores
    const modalJogadores = document.getElementById('modal-jogadores-campanha');
    if (modalJogadores) {
        // Fechar ao clicar no overlay
        modalJogadores.addEventListener('click', function(e) {
            if (e.target === modalJogadores) {
                fecharModalJogadores();
            }
        });
        
        // Fechar ao clicar no botão X
        const closeBtnJogadores = modalJogadores.querySelector('.modal-close');
        if (closeBtnJogadores) {
            closeBtnJogadores.addEventListener('click', fecharModalJogadores);
        }
    }
    
    // Fechar modais com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (modalEditar && modalEditar.classList.contains('active')) {
                fecharModalEditar();
            }
            if (modalJogadores && modalJogadores.classList.contains('active')) {
                fecharModalJogadores();
            }
        }
    });
}

// ==================== UTILITÁRIOS ==================== //

// Função para simular eventos básicos automaticamente
function simularEventosBasicos() {
    // Simular algumas ações básicas para demonstração
    const eventosBasicos = [
        'explorou_site',
        'primeira_mensagem', 
        'primeiro_amigo',
        'organizou_sessao',
        'enviouPrimeiraMensagem'
    ];
    
    eventosBasicos.forEach(evento => {
        // 30% de chance de ter feito cada evento
        if (Math.random() < 0.3) {
            localStorage.setItem(evento, 'true');
        }
    });
    
    // Adicionar alguns números aleatórios para contadores
    const contadores = {
        'mensagensEnviadas': Math.floor(Math.random() * 150),
        'sessoesPontuais': Math.floor(Math.random() * 15),
        'itensRaros': Math.floor(Math.random() * 12),
        'feedbacksPositivos': Math.floor(Math.random() * 15)
    };
    
    Object.entries(contadores).forEach(([key, value]) => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, value.toString());
        }
    });
}

function showNotification(message, type = 'info') {
    if (window.showNotification && typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

function showPerfilMsg(message, type = 'success') {
    const perfilMsg = document.getElementById('perfilMsg');
    if (perfilMsg) {
        const className = type === 'success' ? 'text-green-500' : 'text-red-500';
        perfilMsg.innerHTML = `<div class="${className} text-center font-semibold animate-fade-in">${message}</div>`;
        setTimeout(() => { perfilMsg.innerHTML = ''; }, 3500);
    }
}

// Função de teste para desbloquear conquistas (apenas para desenvolvimento)
window.testarConquistas = function() {
    console.log('🧪 Modo de teste de conquistas ativado!');
    
    // Marcar alguns eventos importantes
    const eventosParaTestar = [
        'visitouPerfil',
        'explorou_site', 
        'primeira_mensagem',
        'primeiro_amigo',
        'organizou_sessao',
        'salvouPerfil',
        'cadastrouEndereco'
    ];
    
    eventosParaTestar.forEach(evento => {
        localStorage.setItem(evento, 'true');
    });
    
    // Simular algumas abas visitadas
    const abasVisitadas = ['perfil', 'endereco', 'planos'];
    localStorage.setItem('abasVisitadas', JSON.stringify(abasVisitadas));
    
    // Adicionar alguns contadores
    localStorage.setItem('mensagensEnviadas', '50');
    localStorage.setItem('sessoesPontuais', '5');
    localStorage.setItem('itensRaros', '8');
    
    console.log('✅ Eventos de teste configurados! Recarregue a aba troféus para ver os resultados.');
    
    // Recarregar troféus se estiver na aba
    if (document.getElementById('tab-trofeus') && !document.getElementById('tab-trofeus').classList.contains('hidden')) {
        carregarTrofeus();
    }
};

// ==================== FUNÇÕES DO PAINEL ADMIN ==================== //

// Função para buscar cliente específico
async function buscarCliente() {
    const termo = document.getElementById('buscarCliente').value.trim().toLowerCase();
    const resultadoDiv = document.getElementById('resultadoBusca');
    
    if (!termo) {
        // Se o campo estiver vazio, carregar todos os usuários
        carregarTodosUsuarios();
        return;
    }
    
    resultadoDiv.innerHTML = '<div class="text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Buscando...</div>';
    
    try {
        const q = firebaseModules.query(firebaseModules.collection(db, 'users'));
        const snapshot = await firebaseModules.getDocs(q);
        
        let usuariosEncontrados = [];
        snapshot.forEach(docSnap => {
            const userData = docSnap.data();
            const email = userData.email?.toLowerCase() || '';
            const nome = userData.displayName?.toLowerCase() || '';
            
            if (email.includes(termo) || nome.includes(termo)) {
                usuariosEncontrados.push({ id: docSnap.id, ...userData });
            }
        });
        
        if (usuariosEncontrados.length === 0) {
            resultadoDiv.innerHTML = '<div class="text-yellow-600">Nenhum usuário encontrado com esse termo.</div>';
        } else {
            resultadoDiv.innerHTML = `
                <div class="text-green-600 mb-4">
                    <i class="fas fa-check mr-2"></i>Encontrados ${usuariosEncontrados.length} usuário(s)
                </div>
            `;
            renderizarListaUsuarios(usuariosEncontrados, 'listaClientes');
        }
        
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        resultadoDiv.innerHTML = '<div class="text-red-500">Erro ao buscar cliente.</div>';
    }
}

// Função para carregar todos os usuários
async function carregarTodosUsuarios() {
    const listaDiv = document.getElementById('listaClientes');
    
    listaDiv.innerHTML = '<div class="text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Carregando todos os usuários...</div>';
    
    try {
        const q = firebaseModules.query(firebaseModules.collection(db, 'users'));
        const snapshot = await firebaseModules.getDocs(q);
        
        let usuarios = [];
        snapshot.forEach(docSnap => {
            usuarios.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Ordenar por email
        usuarios.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
        
        renderizarListaUsuarios(usuarios, 'listaClientes');
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        listaDiv.innerHTML = '<div class="text-red-500 text-center">Erro ao carregar usuários.</div>';
    }
}

// Função para renderizar lista de usuários
function renderizarListaUsuarios(usuarios, containerId) {
    const container = document.getElementById(containerId);
    
    if (usuarios.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500">Nenhum usuário encontrado.</div>';
        return;
    }

    // Função para obter HTML do plano igual ao perfil
    function renderizarBadgePlano(plano, email) {
        const isAdminUser = isAdminEmail(email);
        let nome = 'Grátis', classesCSS = 'plano-badge plano-gratis', emoji = '🆓';
        
        if (isAdminUser) {
            nome = 'Administrador';
            classesCSS = 'plano-badge plano-administrador';
            emoji = '👑';
        } else if (plano === 'minuta') {
            nome = 'Minuta';
            classesCSS = 'plano-badge plano-minuta';
            emoji = '🕰️';
        } else if (plano === 'minutos') {
            nome = 'Minutos';
            classesCSS = 'plano-badge plano-minutos';
            emoji = '⏱️';
        } else if (plano === 'relogio') {
            nome = 'Relógio';
            classesCSS = 'plano-badge plano-relogio popular';
            emoji = '⏰';
        } else if (plano === 'lorde') {
            nome = 'Lorde';
            classesCSS = 'plano-badge plano-lorde';
            emoji = '👑';
        } else if (plano === 'nobreza') {
            nome = 'Nobreza';
            classesCSS = 'plano-badge plano-nobreza';
            emoji = '🏰';
        } else if (plano === 'familiareal') {
            nome = 'Família Real';
            classesCSS = 'plano-badge plano-familiareal';
            emoji = '👨‍👩‍👧‍👦';
        } else if (plano === 'pracadotempo') {
            nome = 'Praça do Tempo';
            classesCSS = 'plano-badge plano-pracadotempo';
            emoji = '🧭';
        } else if (plano === 'atemporal') {
            nome = 'Atemporal';
            classesCSS = 'plano-badge plano-atemporal';
            emoji = '🔱';
        } else if (plano === 'cronomante') {
            nome = 'Cronomante';
            classesCSS = 'plano-badge plano-cronomante';
            emoji = '🌀';
        }
        
        return `<span class="${classesCSS}" title="${nome}">
            <span class="plano-emoji">${emoji}</span>
            ${nome}
            ${isAdminUser ? '<span class="admin-badge">ADMIN</span>' : ''}
        </span>`;
    }

    const html = usuarios.map(usuario => {
        const planoAtual = usuario.plano || 'gratis';
        const isAdminUser = isAdminEmail(usuario.email);
        return `
            <div class="user-card bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-4 flex-1">
                        <img src="${usuario.photoURL || 'images/avatar-default.png'}" 
                             alt="Avatar" class="w-16 h-16 rounded-full border-2 border-primary object-cover">
                        <div class="flex-1">
                            <h4 class="text-lg font-bold text-gray-900 dark:text-white">
                                ${usuario.displayName || 'Nome não informado'}
                                ${isAdminUser ? '<span class="text-xs bg-purple-600 text-white px-2 py-1 rounded ml-2 font-bold">ADMIN</span>' : ''}
                            </h4>
                            <p class="text-gray-600 dark:text-gray-400">${usuario.email || 'Email não informado'}</p>
                            <div class="flex items-center gap-4 mt-2 text-sm">
                                <span class="text-gray-500 dark:text-gray-400">Discord: ${usuario.discord || 'Não informado'}</span>
                                <span class="text-gray-500 dark:text-gray-400">Idade: ${usuario.age || 'Não informado'}</span>
                            </div>
                            <div class="mt-2">
                                ${renderizarBadgePlano(planoAtual, usuario.email)}
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2 ml-4">
                        <button class="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 transition" 
                                onclick="editarUsuario('${usuario.id}')">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                        <button class="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition" 
                                onclick="gerenciarConquistas('${usuario.id}')">
                            <i class="fas fa-trophy mr-1"></i>Conquistas
                        </button>
                        <button class="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600 transition" 
                                onclick="responderCliente('${usuario.email}', '${usuario.displayName || 'Cliente'}')">
                            <i class="fas fa-reply mr-1"></i>Responder
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ==================== FUNÇÕES DE IMPORTAÇÃO/EXPORTAÇÃO CSV ==================== //

// Variável global para armazenar dados do CSV em preview
let dadosCSVPreview = [];

// Função para exportar contatos para CSV
async function exportarContatosCSV() {
    const btnExportar = document.getElementById('btnExportarContatos');
    const resultDiv = document.getElementById('csvResults');
    
    // Mostrar carregamento
    btnExportar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Exportando...';
    btnExportar.disabled = true;
    
    try {
        // Buscar todos os usuários
        const q = firebaseModules.query(firebaseModules.collection(db, 'users'));
        const snapshot = await firebaseModules.getDocs(q);
        
        const usuarios = [];
        snapshot.forEach(docSnap => {
            const userData = docSnap.data();
            usuarios.push(userData);
        });
        
        if (usuarios.length === 0) {
            resultDiv.innerHTML = '<div class="text-yellow-600"><i class="fas fa-exclamation-triangle mr-2"></i>Nenhum usuário encontrado para exportar.</div>';
            return;
        }
        
        // Criar CSV compatível com Google Contacts
        const csvHeaders = [
            'Name',
            'Given Name', 
            'Family Name',
            'E-mail 1 - Value',
            'Phone 1 - Value',
            'Address 1 - Street',
            'Address 1 - City',
            'Address 1 - Region',
            'Address 1 - Postal Code',
            'Address 1 - Country',
            'Organization 1 - Name',
            'Organization 1 - Title',
            'Notes'
        ];
        
        const csvRows = usuarios.map(usuario => {
            const nome = usuario.displayName || '';
            const email = usuario.email || '';
            const telefone = usuario.phone || usuario.telefone || '';
            const endereco = usuario.address || usuario.endereco || {};
            
            // Dividir nome em primeiro e último nome
            const partesNome = nome.split(' ');
            const primeiroNome = partesNome[0] || '';
            const ultimoNome = partesNome.slice(1).join(' ') || '';
            
            return [
                `"${nome}"`,                                    // Name
                `"${primeiroNome}"`,                           // Given Name
                `"${ultimoNome}"`,                             // Family Name
                `"${email}"`,                                   // E-mail 1 - Value
                `"${telefone}"`,                               // Phone 1 - Value
                `"${endereco.street || endereco.rua || ''} ${endereco.number || endereco.numero || ''}"`, // Address 1 - Street
                `"${endereco.city || endereco.cidade || ''}"`,                  // Address 1 - City
                `"${endereco.state || endereco.estado || ''}"`,                  // Address 1 - Region
                `"${endereco.zip || endereco.cep || ''}"`,                     // Address 1 - Postal Code
                `"${endereco.country || endereco.pais || 'Brasil'}"`,              // Address 1 - Country
                `"Lorde Tempus"`,                              // Organization 1 - Name
                `"Cliente - Plano ${usuario.plano || 'Grátis'}"`, // Organization 1 - Title
                `"Importado do site Lorde Tempus em ${new Date().toLocaleDateString('pt-BR')}"` // Notes
            ].join(',');
        });
        
        // Criar conteúdo CSV
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        
        // Criar e baixar arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contatos_lorde_tempus_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Mostrar sucesso
        resultDiv.innerHTML = `
            <div class="text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <i class="fas fa-check-circle mr-2"></i>
                <strong>Exportação concluída!</strong><br>
                ${usuarios.length} contatos exportados com sucesso.<br>
                <small class="text-green-500">O arquivo foi baixado para sua pasta de Downloads.</small>
            </div>
        `;
        
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        resultDiv.innerHTML = `
            <div class="text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <i class="fas fa-times-circle mr-2"></i>
                Erro ao exportar contatos: ${error.message}
            </div>
        `;
    } finally {
        // Restaurar botão
        btnExportar.innerHTML = '<i class="fas fa-download mr-2"></i>Exportar CSV';
        btnExportar.disabled = false;
    }
}

// Função para processar arquivo CSV selecionado (global)
window.processarArquivoCSV = function(input) {
    console.log('🔍 Iniciando processamento de CSV...');
    
    const file = input.files[0];
    if (!file) {
        console.log('❌ Nenhum arquivo selecionado');
        return;
    }
    
    console.log('📄 Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'bytes');
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        document.getElementById('csvResults').innerHTML = `
            <div class="text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <i class="fas fa-times-circle mr-2"></i>
                Por favor, selecione um arquivo CSV válido.
            </div>
        `;
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            console.log('📖 Lendo conteúdo do arquivo...');
            const csv = e.target.result;
            console.log('📝 CSV content preview:', csv.substring(0, 200) + '...');
            
            const linhas = csv.split('\n');
            console.log('📋 Total de linhas encontradas:', linhas.length);
            
            const headers = linhas[0].split(',').map(h => h.replace(/"/g, '').trim());
            console.log('🏷️ Headers encontrados:', headers);
            
            // Validar se é um CSV do Google Contacts (aceitar formatos reais)
            const temName = headers.some(h => {
                const lower = h.toLowerCase();
                return lower.includes('name') || lower.includes('nome');
            });
            const temEmail = headers.some(h => {
                const lower = h.toLowerCase();
                return lower.includes('mail') || 
                       lower.includes('email') ||
                       lower.includes('e-mail') ||
                       lower === 'email address' ||
                       lower.startsWith('e-mail ') ||
                       lower.startsWith('email ') ||
                       lower.endsWith(' email') ||
                       lower.endsWith(' e-mail') ||
                       (lower.endsWith('- value') && lower.includes('mail'));
            });
            const temHeadersValidos = temName && temEmail;
            
            console.log('✅ Validação de headers:', { 
                temName, 
                temEmail,
                temHeadersValidos,
                headersEncontrados: headers
            });
            
            if (!temHeadersValidos) {
                document.getElementById('csvResults').innerHTML = `
                    <div class="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <strong>Formato não reconhecido!</strong><br>
                        O arquivo deve ser um CSV exportado do Google Contacts.<br>
                        <div class="mt-3 text-sm">
                            <div class="mb-2">
                                <strong>Status da validação:</strong><br>
                                • Campo Nome: ${temName ? '✅ Encontrado' : '❌ Não encontrado'}<br>
                                • Campo Email: ${temEmail ? '✅ Encontrado' : '❌ Não encontrado'}
                            </div>
                        </div>
                        <details class="mt-2">
                            <summary class="cursor-pointer">Ver headers encontrados (${headers.length} total)</summary>
                            <div class="mt-2 text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded max-h-32 overflow-y-auto">
                                ${headers.map((h, i) => `${i}: ${h}`).join('<br>')}
                            </div>
                        </details>
                        <div class="mt-3 text-sm">
                            <strong>Campos aceitos para Nome:</strong> Name, Given Name, nome<br>
                            <strong>Campos aceitos para Email:</strong> Email, E-mail, Email Address, E-mail 1 - Value, etc.
                        </div>
                    </div>
                `;
                return;
            }
            
            // Mapear campos específicos do Google Contacts baseado no arquivo analisado
            
            // Para nome: usar "First Name" como principal, se não tiver usar "Last Name"
            const firstNameIndex = headers.findIndex(h => h.toLowerCase() === 'first name');
            const lastNameIndex = headers.findIndex(h => h.toLowerCase() === 'last name');
            const nameIndex = firstNameIndex >= 0 ? firstNameIndex : lastNameIndex;
            
            // Para email: priorizar "E-mail 1 - Value" que é onde estão os dados reais
            let emailIndex = headers.findIndex(h => {
                const lower = h.toLowerCase();
                return lower === 'e-mail 1 - value' || 
                       lower === 'email 1 - value' ||
                       (lower.includes('mail') && lower.includes('value') && lower.includes('1'));
            });
            
            // Se não encontrou "E-mail 1 - Value", procurar outros padrões de email
            if (emailIndex === -1) {
                emailIndex = headers.findIndex(h => {
                    const lower = h.toLowerCase();
                    return (lower.includes('mail') && lower.includes('value')) ||
                           (lower.includes('email') && lower.includes('value')) ||
                           lower.includes('mail') || 
                           lower.includes('email') ||
                           lower === 'email address';
                });
            }
            
            // Para telefone: usar "Phone 1 - Value"
            let phoneIndex = headers.findIndex(h => {
                const lower = h.toLowerCase();
                return lower === 'phone 1 - value' ||
                       (lower.includes('phone') && lower.includes('value') && lower.includes('1'));
            });
            
            // Se não encontrou "Phone 1 - Value", procurar outros padrões
            if (phoneIndex === -1) {
                phoneIndex = headers.findIndex(h => {
                    const lower = h.toLowerCase();
                    return (lower.includes('phone') && lower.includes('value')) ||
                           lower.includes('phone') || 
                           lower.includes('telefone') ||
                           lower.includes('tel');
                });
            }
            
            // Encontrar TODAS as colunas que podem conter email
            const todasColunasEmail = headers.map((h, index) => {
                const lower = h.toLowerCase();
                const isEmailColumn = lower.includes('mail') || lower.includes('email');
                return isEmailColumn ? { index, header: h, priority: lower.includes('value') ? 1 : 2 } : null;
            }).filter(col => col !== null).sort((a, b) => a.priority - b.priority);
            
            console.log('🗂️ Índices dos campos detectados:', { 
                firstNameIndex,
                lastNameIndex,
                nameIndex, 
                emailIndex, 
                phoneIndex,
                todasColunasEmail,
                headers: {
                    firstName: firstNameIndex >= 0 ? headers[firstNameIndex] : 'não encontrado',
                    lastName: lastNameIndex >= 0 ? headers[lastNameIndex] : 'não encontrado',
                    email: emailIndex >= 0 ? headers[emailIndex] : 'não encontrado',
                    phone: phoneIndex >= 0 ? headers[phoneIndex] : 'não encontrado'
                },
                totalHeaders: headers.length
            });
            
            // Verificar se pelo menos um campo de email foi encontrado
            if (emailIndex < 0) {
                document.getElementById('csvResults').innerHTML = `
                    <div class="text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <i class="fas fa-times-circle mr-2"></i>
                        <strong>Campo de email não encontrado!</strong><br>
                        O arquivo CSV deve conter pelo menos um campo de email para importação.<br>
                        <div class="mt-2 text-sm">
                            <strong>Campos aceitos:</strong> Email, E-mail, Email Address, E-mail 1 - Value, etc.
                        </div>
                        <details class="mt-2">
                            <summary class="cursor-pointer">Ver headers encontrados (${headers.length} total)</summary>
                            <div class="mt-2 text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded max-h-32 overflow-y-auto">
                                ${headers.map((h, i) => `${i}: ${h}`).join('<br>')}
                            </div>
                        </details>
                    </div>
                `;
                return;
            }
            
            // Processar dados
            dadosCSVPreview = [];
            const linhasDados = linhas.slice(1); // Pular header
            
            console.log('🔄 Processando', linhasDados.length, 'linhas de dados...');
            
            for (let i = 0; i < linhasDados.length; i++) {
                const linha = linhasDados[i].trim();
                if (!linha) continue;
                
                // Parse mais robusto do CSV (considera aspas)
                const valores = [];
                let campoAtual = '';
                let dentroAspas = false;
                
                for (let j = 0; j < linha.length; j++) {
                    const char = linha[j];
                    if (char === '"') {
                        dentroAspas = !dentroAspas;
                    } else if (char === ',' && !dentroAspas) {
                        valores.push(campoAtual.replace(/"/g, '').trim());
                        campoAtual = '';
                    } else {
                        campoAtual += char;
                    }
                }
                valores.push(campoAtual.replace(/"/g, '').trim()); // Último campo
                
                // Construir nome completo: First Name + Last Name
                const firstName = firstNameIndex >= 0 ? (valores[firstNameIndex] || '').trim() : '';
                const lastName = lastNameIndex >= 0 ? (valores[lastNameIndex] || '').trim() : '';
                let nome = '';
                
                if (firstName && lastName) {
                    nome = `${firstName} ${lastName}`;
                } else if (firstName) {
                    nome = firstName;
                } else if (lastName) {
                    nome = lastName;
                } else if (nameIndex >= 0) {
                    nome = valores[nameIndex] || '';
                }
                
                // Tentar extrair email de múltiplas colunas possíveis
                let email = '';
                if (todasColunasEmail.length > 0) {
                    for (const coluna of todasColunasEmail) {
                        const emailCandidate = valores[coluna.index] || '';
                        if (emailCandidate.trim() && emailCandidate.includes('@')) {
                            email = emailCandidate.trim();
                            break; // Usar o primeiro email válido encontrado
                        }
                    }
                } else if (emailIndex >= 0) {
                    email = valores[emailIndex] || '';
                }
                
                const telefone = phoneIndex >= 0 ? valores[phoneIndex] || '' : '';
                
                if (i < 5) { // Log das primeiras 5 linhas para debug
                    const emailDebugging = todasColunasEmail.map(col => ({
                        header: col.header,
                        index: col.index,
                        valor: `"${valores[col.index] || 'vazio'}"`
                    }));
                    
                    console.log(`📋 Linha ${i + 1} DEBUG:`, {
                        linha: linha.substr(0, 200) + '...', // Primeiros 200 chars da linha
                        totalValores: valores.length,
                        indices: { firstNameIndex, lastNameIndex, nameIndex, emailIndex, phoneIndex },
                        extraidos: {
                            firstName: `"${firstName}"`,
                            lastName: `"${lastName}"`,
                            nomeCompleto: `"${nome}"`,
                            email: `"${email}"`,
                            telefone: `"${telefone}"`
                        },
                        emailDebugging,
                        headers: {
                            firstName: firstNameIndex >= 0 ? headers[firstNameIndex] : 'não encontrado',
                            lastName: lastNameIndex >= 0 ? headers[lastNameIndex] : 'não encontrado',
                            email: emailIndex >= 0 ? headers[emailIndex] : 'não encontrado',
                            phone: phoneIndex >= 0 ? headers[phoneIndex] : 'não encontrado'
                        },
                        primeiros15Valores: valores.slice(0, 15)
                    });
                }
                
                if (nome || email) {
                    dadosCSVPreview.push({
                        nome: nome,
                        email: email,
                        telefone: telefone
                    });
                }
            }
            
            console.log('✅ Dados processados:', dadosCSVPreview.length, 'contatos válidos encontrados');
            console.log('📋 Preview dos primeiros contatos:', dadosCSVPreview.slice(0, 3));
            
            // Mostrar preview
            if (dadosCSVPreview.length > 0) {
                document.getElementById('csvPreview').classList.remove('hidden');
                document.getElementById('csvPreviewContent').innerHTML = `
                    <div class="space-y-1">
                        ${dadosCSVPreview.slice(0, 5).map(contato => `
                            <div class="text-sm">
                                <strong>${contato.nome || 'Sem nome'}</strong> - ${contato.email || 'Sem email'}
                                ${contato.telefone ? ` - ${contato.telefone}` : ''}
                            </div>
                        `).join('')}
                        ${dadosCSVPreview.length > 5 ? `<div class="text-gray-500">... e mais ${dadosCSVPreview.length - 5} contatos</div>` : ''}
                    </div>
                `;
                
                // Criar resumo dos campos detectados
                const camposDetectados = [];
                if (firstNameIndex >= 0 && lastNameIndex >= 0) {
                    camposDetectados.push(`• Nome: "${headers[firstNameIndex]}" + "${headers[lastNameIndex]}"`);
                } else if (firstNameIndex >= 0) {
                    camposDetectados.push(`• Nome: "${headers[firstNameIndex]}"`);
                } else if (lastNameIndex >= 0) {
                    camposDetectados.push(`• Nome: "${headers[lastNameIndex]}"`);
                } else if (nameIndex >= 0) {
                    camposDetectados.push(`• Nome: "${headers[nameIndex]}"`);
                }
                
                if (emailIndex >= 0) camposDetectados.push(`• Email: "${headers[emailIndex]}"`);
                if (phoneIndex >= 0) camposDetectados.push(`• Telefone: "${headers[phoneIndex]}"`);
                
                // Contar contatos com email
                const contatosComEmail = dadosCSVPreview.filter(c => c.email && c.email.trim()).length;
                const contatosSemEmail = dadosCSVPreview.length - contatosComEmail;
                
                // Validar se há emails válidos com regex mais rigorosa
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const emailsValidos = dadosCSVPreview.filter(c => {
                    const email = c.email ? c.email.trim().toLowerCase() : '';
                    return email && emailRegex.test(email);
                }).length;
                
                document.getElementById('csvResults').innerHTML = `
                    <div class="text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <i class="fas fa-info-circle mr-2"></i>
                        <strong>Arquivo processado com sucesso!</strong><br>
                        <div class="mt-2 text-sm">
                            <strong>Resumo da análise:</strong><br>
                            • ${dadosCSVPreview.length} contatos encontrados no total<br>
                            • ${emailsValidos} contatos com email VÁLIDO<br>
                            • ${contatosComEmail - emailsValidos} contatos com email INVÁLIDO<br>
                            ${contatosSemEmail > 0 ? `• ${contatosSemEmail} contatos SEM email<br>` : ''}
                            <br>
                            <span class="text-green-600">✅ ${emailsValidos} contatos serão importados</span><br>
                            ${(contatosSemEmail + (contatosComEmail - emailsValidos)) > 0 ? 
                                `<span class="text-yellow-600">⚠️ ${contatosSemEmail + (contatosComEmail - emailsValidos)} contatos serão ignorados</span>` : 
                                ''
                            }
                        </div>
                        <div class="mt-2 text-sm">
                            <strong>Campos detectados automaticamente:</strong><br>
                            ${camposDetectados.length > 0 ? camposDetectados.join('<br>') : '• Nenhum campo padrão detectado'}
                        </div>
                        <div class="mt-3">
                            Verifique o preview acima e clique em "Confirmar Importação" para continuar.
                        </div>
                    </div>
                `;
            } else {
                document.getElementById('csvResults').innerHTML = `
                    <div class="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Nenhum contato válido encontrado no arquivo.
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('❌ Erro ao processar CSV:', error);
            console.error('❌ Stack trace:', error.stack);
            document.getElementById('csvResults').innerHTML = `
                <div class="text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <i class="fas fa-times-circle mr-2"></i>
                    <strong>Erro ao processar arquivo:</strong> ${error.message}<br>
                    <small>Verifique o console para mais detalhes.</small>
                </div>
            `;
        }
    };
    
    reader.onerror = function(error) {
        console.error('❌ Erro ao ler arquivo:', error);
        document.getElementById('csvResults').innerHTML = `
            <div class="text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <i class="fas fa-times-circle mr-2"></i>
                Erro ao ler o arquivo. Verifique se o arquivo não está corrompido.
            </div>
        `;
    };
    
    console.log('📚 Iniciando leitura do arquivo...');
    reader.readAsText(file, 'utf-8');
};

// Função para importar contatos do CSV para o Firestore
async function importarContatosCSV() {
    if (!dadosCSVPreview || dadosCSVPreview.length === 0) {
        document.getElementById('csvResults').innerHTML = `
            <div class="text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <i class="fas fa-times-circle mr-2"></i>
                Nenhum dado para importar. Selecione um arquivo CSV primeiro.
            </div>
        `;
        return;
    }
    
    const btnImportar = document.getElementById('btnImportarContatos');
    const resultDiv = document.getElementById('csvResults');
    
    // Mostrar carregamento
    btnImportar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando duplicatas...';
    btnImportar.disabled = true;
    
    try {
        let contatosImportados = 0;
        let contatosIgnorados = 0;
        let contatosDuplicados = 0;
        let erros = [];
        
        // PROTEÇÃO 1: Verificar duplicatas dentro do próprio CSV
        const emailsUnicos = new Set();
        const contatosFiltrados = [];
        
        console.log('🔍 Verificando duplicatas dentro do CSV...');
        for (const contato of dadosCSVPreview) {
            if (!contato.email || contato.email.trim() === '') {
                continue; // Será tratado depois
            }
            
            const emailLimpo = contato.email.trim().toLowerCase();
            if (emailsUnicos.has(emailLimpo)) {
                // Email duplicado ignorado
                contatosDuplicados++;
                continue;
            }
            
            emailsUnicos.add(emailLimpo);
            contatosFiltrados.push({
                ...contato,
                email: emailLimpo // Usar email limpo
            });
        }
        
        console.log(`✅ Filtrados ${contatosFiltrados.length} contatos únicos de ${dadosCSVPreview.length} originais`);
        
        // PROTEÇÃO 2: Verificar quais emails já existem no banco (batch query)
        btnImportar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando emails existentes...';
        
        const emailsExistentes = new Set();
        const batchSize = 10; // Firestore permite até 10 emails por query "in"
        
        for (let i = 0; i < contatosFiltrados.length; i += batchSize) {
            const batch = contatosFiltrados.slice(i, i + batchSize);
            const emails = batch.map(c => c.email);
            
            try {
                const userQuery = firebaseModules.query(
                    firebaseModules.collection(db, 'users'), 
                    firebaseModules.where('email', 'in', emails)
                );
                const userSnapshot = await firebaseModules.getDocs(userQuery);
                
                userSnapshot.forEach(doc => {
                    emailsExistentes.add(doc.data().email);
                });
                
                // Progresso da verificação de emails processado
            } catch (error) {
                console.error('Erro ao verificar batch de emails:', emails, error);
            }
        }
        
        // Verificação de emails existentes concluída
        
        // PROTEÇÃO 3: Processar apenas emails novos
        btnImportar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Importando contatos novos...';
        let contatosNovos = 0;
        
        for (const contato of contatosFiltrados) {
            try {
                console.log('🔄 Processando contato:', contato);
                
                if (!contato.email || contato.email.trim() === '') {
                    // Contato sem email ignorado
                    contatosIgnorados++;
                    continue;
                }
                
                // Email já foi limpo e validado
                const emailLimpo = contato.email;
                
                // Validação adicional de formato
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailLimpo)) {
                    // Email inválido ignorado
                    contatosIgnorados++;
                    continue;
                }
                
                // PROTEÇÃO 4: Verificar se email já existe (usando cache)
                if (emailsExistentes.has(emailLimpo)) {
                    // Email já existe no banco - ignorado
                    contatosIgnorados++;
                    continue;
                }
                
                // PROTEÇÃO 5: Gerar UID único garantido para evitar conflitos
                const timestamp = Date.now();
                const random = Math.random().toString(36).substr(2, 9);
                const uniqueId = `imported_${timestamp}_${random}_${emailsUnicos.size}`;
                
                // Criar novo usuário com dados mínimos necessários
                const novoUsuario = {
                    uid: uniqueId,
                    email: emailLimpo,
                    displayName: contato.nome ? contato.nome.trim() : '',
                    phone: contato.telefone ? contato.telefone.trim() : '',
                    plano: 'gratis',
                    criadoEm: new Date(),
                    criadoViaImportacao: true,
                    importadoEm: new Date(),
                    importadoPor: auth.currentUser?.email || 'admin',
                    ativo: true,
                    emailVerificado: false,
                    primeiroLogin: false,
                    // PROTEÇÃO 6: Adicionar hash para identificação única
                    hashImportacao: `${emailLimpo}_${timestamp}`
                };
                
                console.log('🆕 Criando novo usuário:', novoUsuario);
                
                try {
                    const docRef = await firebaseModules.addDoc(firebaseModules.collection(db, 'users'), novoUsuario);
                    console.log('✅ Usuário criado com ID:', docRef.id);
                    
                    // Adicionar ao cache de emails existentes para evitar duplicação na mesma sessão
                    emailsExistentes.add(emailLimpo);
                    contatosImportados++;
                    contatosNovos++;
                    
                } catch (createError) {
                    if (createError.code === 'already-exists' || createError.message.includes('already exists')) {
                        // Usuário já existe - detectado durante criação
                        contatosIgnorados++;
                    } else {
                        throw createError; // Re-throw se não for erro de duplicação
                    }
                }
                
            } catch (error) {
                console.error(`❌ Erro ao importar contato ${contato.email}:`, error);
                console.error('❌ Detalhes do erro:', error.code, error.message);
                
                // Tratar erro específico de permissão
                if (error.code === 'permission-denied') {
                    erros.push(`${contato.email}: Permissão negada - verifique se você tem privilégios de administrador`);
                } else if (error.code === 'already-exists') {
                    // Usuário já existe - capturado na verificação
                    contatosIgnorados++;
                } else {
                    erros.push(`${contato.email}: ${error.message}`);
                }
            }
        }
        
        // Mostrar resultado detalhado
        let mensagemResultado = `
            <div class="text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <i class="fas fa-check-circle mr-2"></i>
                <strong>Importação concluída com proteção anti-duplicação!</strong><br>
                <div class="mt-2 space-y-1">
                    <div class="text-sm font-medium text-blue-700">📊 Resumo da Importação:</div>
                    <ul class="ml-4 space-y-1 text-sm">
                        <li><span class="font-medium text-green-600">✅ ${contatosImportados} novos contatos criados</span></li>
                        <li><span class="text-yellow-600">⏭️ ${contatosIgnorados} contatos ignorados (já existiam ou sem email válido)</span></li>
                        ${contatosDuplicados > 0 ? `<li><span class="text-orange-600">🔄 ${contatosDuplicados} duplicatas removidas do próprio CSV</span></li>` : ''}
                        ${erros.length > 0 ? `<li><span class="text-red-600">❌ ${erros.length} erros encontrados</span></li>` : ''}
                    </ul>
                    
                    <div class="mt-3 text-sm text-gray-600">
                        <strong>Proteções aplicadas:</strong><br>
                        • Remoção de duplicatas dentro do CSV<br>
                        • Verificação em lote de emails existentes<br>
                        • UIDs únicos para evitar conflitos<br>
                        • Hash de importação para rastreabilidade<br>
                        • Cache de sessão para importações múltiplas
                    </div>
                    
                    ${contatosImportados > 0 ? 
                        `<div class="mt-3 p-2 bg-green-100 rounded text-sm">
                            <i class="fas fa-info-circle mr-1"></i>
                            <strong>Sucesso!</strong> ${contatosImportados} novos usuários foram adicionados ao sistema com plano gratuito.
                        </div>` : ''
                    }
                </div>
        `;
        
        if (erros.length > 0 && erros.length <= 5) {
            mensagemResultado += `
                <details class="mt-3">
                    <summary class="cursor-pointer text-red-600">Ver erros</summary>
                    <ul class="mt-2 text-sm text-red-500">
                        ${erros.map(erro => `<li>• ${erro}</li>`).join('')}
                    </ul>
                </details>
            `;
        }
        
        mensagemResultado += '</div>';
        resultDiv.innerHTML = mensagemResultado;
        
        // Limpar preview
        document.getElementById('csvPreview').classList.add('hidden');
        document.getElementById('csvFileInput').value = '';
        dadosCSVPreview = [];
        
    } catch (error) {
        console.error('Erro geral na importação:', error);
        resultDiv.innerHTML = `
            <div class="text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <i class="fas fa-times-circle mr-2"></i>
                Erro na importação: ${error.message}
            </div>
        `;
    } finally {
        // Restaurar botão
        btnImportar.innerHTML = '<i class="fas fa-check mr-2"></i>Confirmar Importação';
        btnImportar.disabled = false;
    }
}

// Função utilitária para obter nome do plano para admins
function obterNomePlanoAdmin(plano) {
    if (!plano) return 'Grátis';
    return PLANOS_SISTEMA[plano]?.nome || 'Desconhecido';
}

// Função para editar usuário
window.editarUsuario = async function(userId) {
    try {
        const userRef = firebaseModules.doc(db, 'users', userId);
        const userSnap = await firebaseModules.getDoc(userRef);
        
        if (!userSnap.exists()) {
            showNotification('Usuário não encontrado!', 'error');
            return;
        }
        
        const userData = userSnap.data();
        
        // Criar modal de edição
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'modal-editar-usuario';
        
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-user-edit mr-2"></i>
                        Editar Usuário: ${userData.displayName || userData.email}
                    </h3>
                    <button class="modal-close" onclick="fecharModalEditarUsuario()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editarUsuarioForm" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Nome Completo</label>
                                <input type="text" id="editUserName" 
                                       class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                       value="${userData.displayName || ''}">
                            </div>
                            <div>
                                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Discord</label>
                                <input type="text" id="editUserDiscord" 
                                       class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                       value="${userData.discord || ''}">
                            </div>
                            <div>
                                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Email</label>
                                <input type="email" id="editUserEmail" 
                                       class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" 
                                       value="${userData.email || ''}" readonly>
                            </div>
                            <div>
                                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Idade</label>
                                <input type="number" id="editUserAge" 
                                       class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                       value="${userData.age || ''}" min="13" max="120">
                            </div>
                            <div>
                                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Telefone</label>
                                <input type="tel" id="editUserPhone" 
                                       class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                       value="${userData.phone || ''}">
                            </div>
                            <div>
                                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Plano</label>
                                <select id="editUserPlano" 
                                        class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                    <option value="">Sem plano</option>
                                    <option value="minuta" ${userData.plano === 'minuta' ? 'selected' : ''}>Minuta</option>
                                    <option value="minutos" ${userData.plano === 'minutos' ? 'selected' : ''}>Minutos</option>
                                    <option value="relogio" ${userData.plano === 'relogio' ? 'selected' : ''}>Relógio</option>
                                    <option value="lorde" ${userData.plano === 'lorde' ? 'selected' : ''}>Lorde</option>
                                    <option value="nobreza" ${userData.plano === 'nobreza' ? 'selected' : ''}>Nobreza</option>
                                    <option value="familiareal" ${userData.plano === 'familiareal' ? 'selected' : ''}>Família Real</option>
                                    <option value="pracadotempo" ${userData.plano === 'pracadotempo' ? 'selected' : ''}>Praça do Tempo</option>
                                    <option value="atemporal" ${userData.plano === 'atemporal' ? 'selected' : ''}>Atemporal</option>
                                    <option value="cronomante" ${userData.plano === 'cronomante' ? 'selected' : ''}>Cronomante</option>
                                    <option value="administrador" ${userData.plano === 'administrador' ? 'selected' : ''}>Administrador</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Endereço -->
                        <div class="border-t pt-4 mt-6">
                            <h4 class="text-lg font-bold mb-4">Endereço</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="md:col-span-2">
                                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Rua</label>
                                    <input type="text" id="editUserStreet" 
                                           class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                           value="${userData.address?.street || ''}">
                                </div>
                                <div>
                                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Número</label>
                                    <input type="text" id="editUserNumber" 
                                           class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                           value="${userData.address?.number || ''}">
                                </div>
                                <div>
                                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Cidade</label>
                                    <input type="text" id="editUserCity" 
                                           class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                           value="${userData.address?.city || ''}">
                                </div>
                                <div>
                                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Estado</label>
                                    <input type="text" id="editUserState" 
                                           class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                           value="${userData.address?.state || ''}">
                                </div>
                                <div>
                                    <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">CEP</label>
                                    <input type="text" id="editUserZip" 
                                           class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                                           value="${userData.address?.zip || ''}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex justify-end gap-3 mt-6">
                            <button type="button" class="secondary-btn" onclick="fecharModalEditarUsuario()">
                                <i class="fas fa-times mr-2"></i>Cancelar
                            </button>
                            <button type="submit" class="lorde-btn">
                                <i class="fas fa-save mr-2"></i>Salvar Alterações
                            </button>
                        </div>
                        <div id="editUserMsg" class="mt-4"></div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listener do formulário
        document.getElementById('editarUsuarioForm').addEventListener('submit', (e) => salvarEdicaoUsuario(e, userId));
        
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        showNotification('Erro ao carregar dados do usuário!', 'error');
    }
};

// Função para salvar edição do usuário
async function salvarEdicaoUsuario(e, userId) {
    e.preventDefault();
    
    const msgDiv = document.getElementById('editUserMsg');
    
    try {
        const dadosAtualizados = {
            displayName: document.getElementById('editUserName').value.trim(),
            discord: document.getElementById('editUserDiscord').value.trim(),
            age: document.getElementById('editUserAge').value.trim(),
            phone: document.getElementById('editUserPhone').value.trim(),
            plano: document.getElementById('editUserPlano').value || null,
            address: {
                street: document.getElementById('editUserStreet').value.trim(),
                number: document.getElementById('editUserNumber').value.trim(),
                city: document.getElementById('editUserCity').value.trim(),
                state: document.getElementById('editUserState').value.trim(),
                zip: document.getElementById('editUserZip').value.trim()
            },
            editadoEm: new Date(),
            editadoPor: currentUser.email
        };
        
        const userRef = firebaseModules.doc(db, 'users', userId);
        await firebaseModules.setDoc(userRef, dadosAtualizados, { merge: true });
        
        // Sincronizar plano se foi alterado
        sincronizarPlanoComCampanhas(dadosAtualizados.email || currentUser.email, dadosAtualizados.plano);
        
        msgDiv.innerHTML = '<div class="text-green-500 font-semibold">Usuário atualizado com sucesso!</div>';
        
        setTimeout(() => {
            fecharModalEditarUsuario();
            showNotification('Usuário editado com sucesso!', 'success');
            // Recarregar lista se estiver visível
            const listaClientes = document.getElementById('listaClientes');
            if (listaClientes && !listaClientes.innerHTML.includes('Carregar Todos')) {
                carregarTodosUsuarios();
            }
        }, 1500);
        
    } catch (error) {
        console.error('Erro ao salvar edição do usuário:', error);
        msgDiv.innerHTML = '<div class="text-red-500 font-semibold">Erro ao salvar alterações!</div>';
    }
}

// Função para fechar modal de editar usuário
window.fecharModalEditarUsuario = function() {
    const modal = document.getElementById('modal-editar-usuario');
    if (modal) {
        modal.remove();
    }
};

// Função para gerenciar conquistas do usuário
window.gerenciarConquistas = async function(userId) {
    try {
        const userRef = firebaseModules.doc(db, 'users', userId);
        const userSnap = await firebaseModules.getDoc(userRef);
        
        if (!userSnap.exists()) {
            showNotification('Usuário não encontrado!', 'error');
            return;
        }
        
        const userData = userSnap.data();
        const conquistasUsuario = userData.conquistas || {};
        
        // Criar modal de conquistas
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'modal-conquistas-usuario';
        
        const conquistasHtml = CONQUISTAS_DISPONIVEIS.map(conquista => {
            const desbloqueada = conquistasUsuario[conquista.id]?.desbloqueada || false;
            
            return `
                <div class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div class="flex items-center gap-3">
                        <i class="${conquista.icone} text-xl ${desbloqueada ? 'text-green-500' : 'text-gray-400'}"></i>
                        <div>
                            <h5 class="font-semibold">${conquista.nome}</h5>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${conquista.descricao}</p>
                            <span class="text-xs px-2 py-1 rounded-full bg-${conquista.raridade === 'comum' ? 'gray' : conquista.raridade === 'rara' ? 'blue' : conquista.raridade === 'epica' ? 'purple' : 'yellow'}-100 text-${conquista.raridade === 'comum' ? 'gray' : conquista.raridade === 'rara' ? 'blue' : conquista.raridade === 'epica' ? 'purple' : 'yellow'}-800">
                                ${conquista.raridade} • ${conquista.xp} XP
                            </span>
                        </div>
                    </div>
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" class="conquista-checkbox mr-2" 
                               data-conquista-id="${conquista.id}" 
                               ${desbloqueada ? 'checked' : ''}>
                        <span class="text-sm">${desbloqueada ? 'Desbloqueada' : 'Bloqueada'}</span>
                    </label>
                </div>
            `;
        }).join('');
        
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-trophy mr-2"></i>
                        Gerenciar Conquistas: ${userData.displayName || userData.email}
                    </h3>
                    <button class="modal-close" onclick="fecharModalConquistas()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="mb-4">
                        <p class="text-gray-600 dark:text-gray-400">
                            Marque ou desmarque as conquistas que este usuário deve ter.
                        </p>
                    </div>
                    <div class="space-y-3 max-h-96 overflow-y-auto">
                        ${conquistasHtml}
                    </div>
                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" class="secondary-btn" onclick="fecharModalConquistas()">
                            <i class="fas fa-times mr-2"></i>Cancelar
                        </button>
                        <button type="button" class="lorde-btn" onclick="salvarConquistasUsuario('${userId}')">
                            <i class="fas fa-save mr-2"></i>Salvar Conquistas
                        </button>
                    </div>
                    <div id="conquistasMsg" class="mt-4"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Erro ao carregar conquistas do usuário:', error);
        showNotification('Erro ao carregar conquistas!', 'error');
    }
};

// Função para salvar conquistas do usuário
window.salvarConquistasUsuario = async function(userId) {
    const msgDiv = document.getElementById('conquistasMsg');
    
    try {
        const checkboxes = document.querySelectorAll('.conquista-checkbox');
        const novasConquistas = {};
        
        checkboxes.forEach(checkbox => {
            const conquistaId = checkbox.dataset.conquistaId;
            const desbloqueada = checkbox.checked;
            
            if (desbloqueada) {
                novasConquistas[conquistaId] = {
                    desbloqueada: true,
                    dataDesbloqueio: new Date().toISOString(),
                    desbloqueadaPorAdmin: currentUser.email
                };
            }
        });
        
        const userRef = firebaseModules.doc(db, 'users', userId);
        // Usar setDoc com merge já que é admin alterando conquistas
        await firebaseModules.setDoc(userRef, {
            conquistas: novasConquistas,
            conquistasEditadasEm: new Date(),
            conquistasEditadasPor: currentUser.email
        }, { merge: true });
        
        msgDiv.innerHTML = '<div class="text-green-500 font-semibold">Conquistas atualizadas com sucesso!</div>';
        
        setTimeout(() => {
            fecharModalConquistas();
            showNotification('Conquistas atualizadas com sucesso!', 'success');
        }, 1500);
        
    } catch (error) {
        console.error('Erro ao salvar conquistas:', error);
        msgDiv.innerHTML = '<div class="text-red-500 font-semibold">Erro ao salvar conquistas!</div>';
    }
};

// Função para fechar modal de conquistas
window.fecharModalConquistas = function() {
    const modal = document.getElementById('modal-conquistas-usuario');
    if (modal) {
        modal.remove();
    }
};

// Função para alterar plano do usuário (modal rápido)
window.alterarPlanoUsuario = async function(userId) {
    try {
        const userRef = firebaseModules.doc(db, 'users', userId);
        const userSnap = await firebaseModules.getDoc(userRef);
        
        if (!userSnap.exists()) {
            showNotification('Usuário não encontrado!', 'error');
            return;
        }
        
        const userData = userSnap.data();
        const planoAtual = userData.plano || 'gratis';
        
        const novoPlano = prompt(`Alterar plano de ${userData.displayName || userData.email}:\n\nPlano atual: ${obterNomePlanoAdmin(planoAtual)}\n\nDigite o novo plano:\n- minuta\n- minutos\n- relogio\n- lorde\n- nobreza\n- familiareal\n- pracadotempo\n- atemporal\n- cronomante\n- administrador\n- (vazio para remover plano)`, planoAtual);
        
        if (novoPlano === null) return; // Cancelou
        
        const planoFinal = novoPlano.trim() || 'gratis';
        
        // Atualizar plano no documento do usuário
        await firebaseModules.setDoc(userRef, {
            plano: planoFinal,
            planoAlteradoEm: new Date(),
            planoAlteradoPor: currentUser.email
        }, { merge: true });
        
        // Sincronizar com campanhas
        await sincronizarPlanoComCampanhas(userData.email, planoFinal);
        
        showNotification(`Plano alterado para: ${obterNomePlanoAdmin(planoFinal)}`, 'success');
        
        // Recarregar lista de usuários
        const listaClientes = document.getElementById('listaClientes');
        if (listaClientes) {
            await carregarTodosUsuarios();
        }
        
        // Se o usuário estiver alterando seu próprio plano, recarregar a interface
        if (currentUser && currentUser.email && currentUser.email.toLowerCase() === userData.email.toLowerCase()) {
            userPlano = planoFinal;
            hasPlano = planoFinal !== 'gratis';
            await carregarPlanos();
            await carregarMesas();
        }
        
        console.log('✅ Plano alterado com sucesso:', {
            userId,
            email: userData.email,
            planoAntigo: planoAtual,
            planoNovo: planoFinal
        });
        
    } catch (error) {
        console.error('Erro ao alterar plano:', error);
        showNotification('Erro ao alterar plano! Tente novamente.', 'error');
    }
};

// Função global para ativar aba (usada nos botões)
window.ativarAba = function(tabName) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remover classes ativas
    tabBtns.forEach(btn => {
        btn.classList.remove('border-[#00FCC8]', 'text-[#00FCC8]', 'active');
    });
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    // Ativar aba selecionada
    const btn = Array.from(tabBtns).find(b => b.dataset.tab === tabName);
    const content = document.getElementById('tab-' + tabName);
    
    if (btn && content) {
        btn.classList.add('border-[#00FCC8]', 'text-[#00FCC8]', 'active');
        content.classList.remove('hidden');
        
        // Salvar última aba
        localStorage.setItem('perfilUltimaAba', tabName);
        
        // Marcar aba como visitada e registrar evento
        const abasVisitadas = JSON.parse(localStorage.getItem('abasVisitadas') || '[]');
        if (!abasVisitadas.includes(tabName)) {
            abasVisitadas.push(tabName);
            localStorage.setItem('abasVisitadas', JSON.stringify(abasVisitadas));
        }
        
        // Registrar evento no Firebase
        if (currentUser) {
            registrarEvento('abas_visitadas', [tabName]);
        }
        
        // Carregar dados específicos da aba
        carregarDadosAba(tabName);
    }
};

console.log('🎭 Módulo de perfil carregado com sucesso!'); 

// Função para sincronizar o plano do usuário em todas as campanhas e no perfil
async function sincronizarPlanoComCampanhas(email, novoPlano) {
    if (!email) return;
    
    // Converter null/undefined para 'gratis'
    const planoFinal = novoPlano || 'gratis';
    
    try {
        // Buscar todas as campanhas
        const campanhasRef = firebaseModules.collection(db, 'campanhas');
        const snapshot = await firebaseModules.getDocs(campanhasRef);
        
        // Para cada campanha, atualizar o plano do jogador correspondente
        const updates = [];
        snapshot.forEach(docSnap => {
            const campanha = docSnap.data();
            const jogadores = Array.isArray(campanha.jogadores) ? [...campanha.jogadores] : [];
            let alterou = false;
            
            for (let i = 0; i < jogadores.length; i++) {
                if (jogadores[i].email && jogadores[i].email.toLowerCase() === email.toLowerCase()) {
                    jogadores[i].plano = planoFinal;
                    alterou = true;
                }
            }
            
            if (alterou) {
                const campanhaRef = firebaseModules.doc(db, 'campanhas', docSnap.id);
                updates.push(firebaseModules.setDoc(campanhaRef, { jogadores }, { merge: true }));
            }
        });
        
        await Promise.all(updates);
        
        // Atualizar plano no perfil em tempo real se o usuário estiver logado
        if (currentUser && currentUser.email && currentUser.email.toLowerCase() === email.toLowerCase()) {
            userPlano = planoFinal;
            hasPlano = planoFinal !== 'gratis';
            
            // Disparar evento de atualização de plano
            const event = new CustomEvent('planoAtualizado', {
                detail: { email, plano: planoFinal }
            });
            window.dispatchEvent(event);
            
            // Recarregar interface
            carregarPlanos();
            carregarMesas();
        }
        
        console.log('✅ Plano sincronizado com sucesso:', {
            email,
            planoAntigo: novoPlano,
            planoFinal,
            campanhasAtualizadas: updates.length
        });
        
    } catch (error) {
        console.error('Erro ao sincronizar plano nas campanhas:', error);
        showNotification('Erro ao sincronizar plano. Tente novamente.', 'error');
    }
}

// Tornar função de sincronização disponível globalmente
window.sincronizarPlanoComCampanhas = sincronizarPlanoComCampanhas;

// ==================== MENSAGENS ==================== //

// === CONSTANTES DO SISTEMA DE MENSAGENS ===
const MENSAGENS_CONFIG = {
    // Verificação de admin removida do frontend por segurança
    // Admin será verificado através das regras do Firestore
    
    // Configurações de limites
    MAX_CARACTERES: 1000,
    MAX_MENSAGENS_POR_DIA: 10,
    
    // Tipos de mensagem permitidos
    TIPOS_PERMITIDOS: ['suporte', 'duvida', 'problema', 'sugestao'],
    
    // Prioridades disponíveis
    PRIORIDADES: ['baixa', 'normal', 'alta', 'urgente'],
    
    // Status possíveis
    STATUS: ['nova', 'lida', 'em_andamento', 'respondida', 'resolvida', 'fechada']
};

// === FUNÇÕES UTILITÁRIAS ===
function validarMensagemAnteEnvio(conteudo, usuario) {
    const erros = [];
    
    // Validar conteúdo
    if (!conteudo || conteudo.trim().length === 0) {
        erros.push('Mensagem não pode estar vazia');
    }
    
    if (conteudo.length > MENSAGENS_CONFIG.MAX_CARACTERES) {
        erros.push(`Mensagem muito longa (máximo ${MENSAGENS_CONFIG.MAX_CARACTERES} caracteres)`);
    }
    
    // Validar usuário
    if (!usuario || !usuario.email) {
        erros.push('Usuário não autenticado');
    }
    
    // Verificar conteúdo suspeito (spam, links maliciosos, etc.)
    const padroesSuspeitos = [
        /https?:\/\/(?!discord\.gg|lordetempus\.com)/gi, // Links externos (exceto Discord e LordeTempus)
        /(\b\w+\s*){20,}/g, // Texto muito repetitivo
        /[🔥💰💎]{5,}/g // Muitos emojis seguidos
    ];
    
    padroesSuspeitos.forEach(padrao => {
        if (padrao.test(conteudo)) {
            erros.push('Conteúdo pode conter elementos suspeitos');
        }
    });
    
    return {
        valida: erros.length === 0,
        erros: erros
    };
}

function obterAdministradorDestinatario() {
    // Por padrão, usar o primeiro email configurado como destinatário
    // Em um ambiente real, isso seria determinado pelo servidor
    return "suporte@lordetempus.com"; // Email genérico de suporte
}

function gerarIdConversa(userId) {
    // Gerar ID único para a conversa baseado no usuário e timestamp
    const timestamp = Date.now();
    return `conv_${userId}_${timestamp}`;
}

function categorizarMensagemAutomaticamente(conteudo) {
    const palavrasChave = {
        'problema': ['erro', 'bug', 'problema', 'não funciona', 'quebrou', 'falha'],
        'duvida': ['como', 'onde', 'quando', 'posso', 'dúvida', 'help', 'ajuda'],
        'sugestao': ['sugestão', 'ideia', 'melhoria', 'poderia', 'seria legal'],
        'planos': ['plano', 'assinatura', 'pagamento', 'upgrade', 'premium'],
        'conta': ['conta', 'perfil', 'login', 'senha', 'acesso']
    };
    
    const conteudoLower = conteudo.toLowerCase();
    
    for (const [categoria, palavras] of Object.entries(palavrasChave)) {
        if (palavras.some(palavra => conteudoLower.includes(palavra))) {
            return categoria;
        }
    }
    
    return 'geral'; // Categoria padrão
}

// Variável global para controlar o listener de mensagens
let mensagensListener = null;

async function carregarMensagens() {
    if (!currentUser) {
        document.getElementById('mensagensLista').innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <i class="fas fa-sign-in-alt text-4xl mb-4"></i>
                <p>Faça login para acessar suas mensagens</p>
            </div>
        `;
        return;
    }
    
    console.log('💬 Carregando mensagens do usuário...');
    
    try {
        // Configurar event listeners do chat
        configurarChat();
        
        // Carregar mensagens existentes
        await carregarMensagensExistentes();
        
        // Configurar listener de tempo real para novas mensagens
        configurarListenerTempoReal();
        
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        document.getElementById('mensagensLista').innerHTML = `
            <div class="text-center text-red-500 py-8">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>Erro ao carregar mensagens. Tente recarregar a página.</p>
            </div>
        `;
    }
}

function configurarChat() {
    const form = document.getElementById('enviarMensagemForm');
    const input = document.getElementById('mensagemInput');
    const submitBtn = form?.querySelector('button[type="submit"]');
    const contador = document.getElementById('contadorCaracteres');
    
    if (!form || !input || !submitBtn) return;
    
    // Verificar se já foi configurado para evitar múltiplos event listeners
    if (form.dataset.chatConfigurado === 'true') {
        console.log('📝 Chat já configurado, pulando...');
        return;
    }
    
    // Marcar como configurado
    form.dataset.chatConfigurado = 'true';
    
    // Controle já implementado na função enviarMensagem() através do disabled do botão
    
    // Event listener para o contador de caracteres
    input.addEventListener('input', function() {
        const length = this.value.length;
        contador.textContent = length;
        
        // Habilitar/desabilitar botão - SIMPLIFICADO
        submitBtn.disabled = length === 0 || length > 1000;
        
        // Mudar cor do contador próximo ao limite
        if (length > 900) {
            contador.className = 'text-red-500';
        } else if (length > 800) {
            contador.className = 'text-yellow-500';
        } else {
            contador.className = 'text-gray-400';
        }
    });
    

    
    // Event listener para enviar mensagem
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await enviarMensagem();
    });
    
    // Enter para enviar (Shift+Enter para nova linha)
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!submitBtn.disabled) {
                enviarMensagem();
            }
        }
    });
    
    console.log('📝 Chat configurado com sucesso com proteção anti-spam');
}

async function carregarMensagensExistentes() {
    const mensagensLista = document.getElementById('mensagensLista');
    if (!mensagensLista) return;
    
    try {
        mensagensLista.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                Carregando suas mensagens...
            </div>
        `;
        
        const mensagens = [];
        
        try {
            console.log('📝 Tentando carregar mensagens com queries simples...');
            
            // Abordagem simplificada: buscar todas as mensagens e filtrar
            const qTodasMensagens = firebaseModules.collection(db, 'messages');
            const snapshot = await firebaseModules.getDocs(qTodasMensagens);
            
            snapshot.forEach(docSnap => {
                const msg = docSnap.data();
                // Incluir mensagens onde o usuário é remetente OU destinatário
                if (msg.from === currentUser.email || msg.to === currentUser.email) {
                    mensagens.push({ id: docSnap.id, ...msg });
                }
            });
            
            console.log(`📋 ${mensagens.length} mensagens encontradas`);
            
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            // Se falhar, tentar queries específicas como fallback
            try {
                console.log('⚠️ Tentando queries específicas...');
                
                // Query 1: Mensagens enviadas pelo usuário
                const qEnviadas = firebaseModules.query(
                    firebaseModules.collection(db, 'messages'),
                    firebaseModules.where('from', '==', currentUser.email)
                );
                
                const snapshotEnviadas = await firebaseModules.getDocs(qEnviadas);
                snapshotEnviadas.forEach(docSnap => {
                    mensagens.push({ id: docSnap.id, ...docSnap.data() });
                });
                
                // Query 2: Mensagens recebidas pelo usuário
                const qRecebidas = firebaseModules.query(
                    firebaseModules.collection(db, 'messages'),
                    firebaseModules.where('to', '==', currentUser.email)
                );
                
                const snapshotRecebidas = await firebaseModules.getDocs(qRecebidas);
                snapshotRecebidas.forEach(docSnap => {
                    const msgData = docSnap.data();
                    // Evitar duplicatas
                    if (!mensagens.find(m => m.id === docSnap.id)) {
                        mensagens.push({ id: docSnap.id, ...msgData });
                    }
                });
                
            } catch (fallbackError) {
                console.error('Fallback queries também falharam:', fallbackError);
                throw fallbackError;
            }
        }
        
        // Ordenar por data de criação
        mensagens.sort((a, b) => {
            const dateA = a.criadaEm ? (a.criadaEm.seconds || a.criadaEm.getTime() / 1000) : 0;
            const dateB = b.criadaEm ? (b.criadaEm.seconds || b.criadaEm.getTime() / 1000) : 0;
            return dateA - dateB;
        });
        
        if (mensagens.length === 0) {
            mensagensLista.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-comments text-4xl mb-4"></i>
                    <p>Nenhuma mensagem ainda.</p>
                    <p class="text-sm mt-2">Envie sua primeira mensagem para nossa equipe!</p>
                </div>
            `;
        } else {
            renderizarMensagens(mensagens);
            console.log(`📬 ${mensagens.length} mensagem(ns) carregada(s) com sucesso`);
        }
        
    } catch (error) {
        console.error('Erro ao carregar mensagens existentes:', error);
        
        // Feedback mais específico baseado no tipo de erro
        let mensagemErro = 'Erro ao carregar mensagens';
        if (error.code === 'permission-denied') {
            mensagemErro = 'Sem permissão para acessar mensagens';
        } else if (error.code === 'failed-precondition') {
            mensagemErro = 'Configuração do banco de dados pendente';
        }
        
        mensagensLista.innerHTML = `
            <div class="text-center text-yellow-600 dark:text-yellow-400 py-4">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                ${mensagemErro}
                <div class="text-sm mt-2 text-gray-500">
                    Suas novas mensagens aparecerão normalmente.
                </div>
            </div>
        `;
    }
}

function renderizarMensagens(mensagens) {
    const mensagensLista = document.getElementById('mensagensLista');
    if (!mensagensLista || !mensagens.length) return;
    
    const html = mensagens.map(msg => {
        const isEnviada = msg.from === currentUser.email;
        const horario = msg.criadaEm ? 
            new Date(msg.criadaEm.seconds * 1000).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Agora';
        
        return `
            <div class="message-item ${isEnviada ? 'sent' : 'received'} mb-4">
                <div class="message-bubble ${isEnviada ? 'bg-primary text-white' : 'bg-white dark:bg-gray-700'} rounded-lg p-3 shadow-sm">
                    <p class="${isEnviada ? 'text-white' : 'text-gray-800 dark:text-gray-200'}">${msg.conteudo || msg.content || 'Mensagem sem conteúdo'}</p>
                    <div class="message-time text-xs mt-1 ${isEnviada ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}">
                        ${isEnviada ? 'Você' : 'Suporte'} • ${horario}
                        ${isEnviada ? '<div class="message-status"><i class="fas fa-check"></i>Enviada</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    mensagensLista.innerHTML = html;
    
    // Scroll para baixo para mostrar as mensagens mais recentes
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }
}

// Configurar listener de tempo real para novas mensagens
function configurarListenerTempoReal() {
    if (!currentUser) return;
    
    // Limpar listener anterior se existir
    if (mensagensListener) {
        mensagensListener();
        console.log('🔄 Listener anterior removido');
    }
    
    try {
        // Criar query simples para mensagens recebidas pelo usuário (sem orderBy para evitar problemas de índice)
        const qRecebidas = firebaseModules.query(
            firebaseModules.collection(db, 'messages'),
            firebaseModules.where('to', '==', currentUser.email)
        );
        
        // Configurar listener em tempo real
        mensagensListener = firebaseModules.onSnapshot(qRecebidas, 
            (snapshot) => {
                console.log('📨 Listener de mensagens ativado');
                
                const novasMensagens = [];
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const novaMensagem = { id: change.doc.id, ...change.doc.data() };
                        novasMensagens.push(novaMensagem);
                        console.log('📨 Nova mensagem recebida:', novaMensagem.conteudo);
                    }
                });
                
                // Se há novas mensagens, adicionar à interface
                if (novasMensagens.length > 0) {
                    novasMensagens.forEach(mensagem => {
                        adicionarMensagemNaInterface(mensagem, false);
                    });
                    
                    // Mostrar notificação apenas se for realmente nova (não carregamento inicial)
                    if (mensagensListener) {
                        showNotification(`${novasMensagens.length} nova(s) mensagem(ns) recebida(s)!`, 'info');
                    }
                    
                    // Scroll para baixo para mostrar as novas mensagens
                    const chatMessages = document.getElementById('chatMessages');
                    if (chatMessages) {
                        setTimeout(() => {
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }, 300);
                    }
                }
            },
            (error) => {
                console.error('Erro no listener de mensagens em tempo real:', error);
                console.log('📝 Tentando listener simplificado...');
                
                // Fallback: listener mais simples
                try {
                    mensagensListener = firebaseModules.onSnapshot(firebaseModules.collection(db, 'messages'), 
                        (snapshot) => {
                            snapshot.docChanges().forEach((change) => {
                                if (change.type === 'added') {
                                    const msg = change.doc.data();
                                    if (msg.to === currentUser.email) {
                                        const novaMensagem = { id: change.doc.id, ...msg };
                                        adicionarMensagemNaInterface(novaMensagem, false);
                                        console.log('📨 Nova mensagem (fallback):', novaMensagem.conteudo);
                                    }
                                }
                            });
                        }
                    );
                } catch (fallbackError) {
                    console.error('Fallback listener também falhou:', fallbackError);
                }
            }
        );
        
        console.log('🔔 Listener de tempo real configurado com sucesso');
        
    } catch (error) {
        console.error('Erro ao configurar listener de tempo real:', error);
        // Fallback silencioso - o usuário ainda pode atualizar manualmente
    }
}

// Função para limpar o listener quando sair da aba de mensagens
function limparListenerTempoReal() {
    if (mensagensListener) {
        mensagensListener();
        mensagensListener = null;
        console.log('🔕 Listener de tempo real removido');
    }
}

async function enviarMensagem() {
    console.log('🚀 Iniciando envio de mensagem...');
    
    const input = document.getElementById('mensagemInput');
    const submitBtn = document.querySelector('#enviarMensagemForm button[type="submit"]');
    
    console.log('📋 Elementos encontrados:', {
        input: !!input,
        submitBtn: !!submitBtn,
        currentUser: !!currentUser
    });
    
    if (!input || !currentUser) {
        console.error('❌ Elementos necessários não encontrados ou usuário não logado');
        return;
    }
    
    const conteudo = input.value.trim();
    console.log('📝 Conteúdo da mensagem:', { conteudo, length: conteudo.length });
    
    if (!conteudo) {
        console.log('⚠️ Conteúdo vazio, cancelando envio');
        return;
    }
    
    // Verificar se o botão já está desabilitado (evita envios duplicados)
    if (submitBtn.disabled) {
        console.log('⚠️ Botão já desabilitado, evitando envio duplicado');
        return;
    }
    
    try {
        // === VALIDAÇÃO PRÉ-ENVIO ===
        const validacao = validarMensagemAnteEnvio(conteudo, currentUser);
        if (!validacao.valida) {
            showNotification(validacao.erros.join('. '), 'error');
            return;
        }
        
        // Desabilitar botão IMEDIATAMENTE para evitar duplo clique
        submitBtn.disabled = true;
        const iconOriginal = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // === CONFIGURAÇÃO AUTOMÁTICA ===
        const adminDestinatario = obterAdministradorDestinatario();
        const categoriaAutomatica = categorizarMensagemAutomaticamente(conteudo);
        const conversaId = gerarIdConversa(currentUser.uid);
        
        // Verificar dados do usuário
        const userRef = firebaseModules.doc(db, 'users', currentUser.uid);
        const userSnap = await firebaseModules.getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        // === CRIAÇÃO DA MENSAGEM ===
        const mensagem = {
            // === DADOS PRINCIPAIS ===
            from: currentUser.email,
            to: adminDestinatario, // SEMPRE um administrador
            conteudo: conteudo,
            criadaEm: new Date(),
            
            // === METADADOS DE CONTROLE ===
            tipo: 'suporte',
            categoria: categoriaAutomatica,
            prioridade: 'normal',
            status: 'nova',
            
            // === DADOS DO USUÁRIO ===
            userId: currentUser.uid,
            userName: userData.displayName || currentUser.displayName || 'Usuário',
            userEmail: currentUser.email,
            userPhoto: userData.photoURL || currentUser.photoURL || null,
            userPlano: userData.plano || 'gratis',
            
            // === CONTROLE DE CONVERSA ===
            adminDestinatario: adminDestinatario,
            conversaId: conversaId,
            threadId: null,
            
            // === STATUS DE CONTROLE ===
            lida: false,
            lidaEm: null,
            respondida: false,
            respondidaEm: null,
            resolvida: false,
            resolvidaEm: null,
            
            // === CONTEXTO TÉCNICO ===
            navegador: navigator.userAgent,
            paginaOrigem: 'perfil-mensagens',
            ipHash: null, // Pode ser implementado no backend
            
            // === CONTROLE ADMINISTRATIVO ===
            podeResponder: true,
            precisaAtencao: categoriaAutomatica === 'problema' || categoriaAutomatica === 'conta',
            
            // === VALIDAÇÃO DE SEGURANÇA ===
            validadoPor: 'cliente',
            revisadoPor: null,
            bloqueada: false,
            spam: false
        };
        
// === VALIDAÇÃO PRÉVIA DO DESTINATÁRIO ===
console.log('🔒 Validando destinatário...', {
    adminDestinatario,
    currentUserEmail: currentUser.email
});

if (!isAdminEmail(adminDestinatario)) {
    console.error('❌ Validação falhou: destinatário não é admin válido');
    console.log('🔍 Destinatário:', adminDestinatario);
    throw new Error('Validação de segurança falhou: destinatário inválido');
}

console.log('✅ Validação do destinatário passou');
        console.log('✅ Validação de segurança passou');
        
        // === SALVAR NO FIREBASE PRIMEIRO ===
        console.log('💾 Salvando mensagem no Firebase...');
        const docRef = await firebaseModules.addDoc(firebaseModules.collection(db, 'messages'), mensagem);
        
        // Atualizar com ID do documento
        await firebaseModules.updateDoc(docRef, {
            messageId: docRef.id,
            criadaComSucesso: true,
            timestampFinal: new Date()
        });
        
        // === ADICIONAR MENSAGEM À INTERFACE COM ID ===
        const mensagemComId = {
            ...mensagem,
            id: docRef.id,
            messageId: docRef.id
        };
        adicionarMensagemNaInterface(mensagemComId, true);
        
        // Limpar interface
        input.value = '';
        document.getElementById('contadorCaracteres').textContent = '0';
        
        // === PÓS-PROCESSAMENTO ===
        // Registrar eventos
        registrarEventosMensagem(categoriaAutomatica);
        
        // Notificar administradores
        await criarNotificacaoParaAdmins({
            ...mensagem,
            messageId: docRef.id
        });
        
        // === FEEDBACK DE SUCESSO ===
        showNotification('Mensagem enviada com sucesso!', 'success');
        
        console.log('✅ Mensagem enviada com sucesso:', {
            id: docRef.id,
            destinatario: adminDestinatario,
            categoria: categoriaAutomatica,
            conversaId: conversaId
        });
        
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        
        // === ADICIONAR MENSAGEM À INTERFACE MESMO COM ERRO ===
        // Criar um ID temporário para a mensagem
        const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const mensagemComIdTemp = {
            ...mensagem,
            id: tempId,
            messageId: tempId,
            status: 'erro_envio'
        };
        adicionarMensagemNaInterface(mensagemComIdTemp, true);
        
        // Limpar interface mesmo com erro
        input.value = '';
        document.getElementById('contadorCaracteres').textContent = '0';
        
        // === TRATAMENTO DE ERRO MELHORADO ===
        let mensagemErro = 'Erro ao enviar mensagem, mas ela aparece na sua tela para referência.';
        
        if (error.message.includes('Validação de segurança falhou')) {
            mensagemErro = 'Erro de segurança. Mensagem salva localmente, recarregue a página para tentar novamente.';
        } else if (error.code === 'permission-denied') {
            mensagemErro = 'Sem permissão para enviar. Mensagem salva localmente, entre em contato conosco.';
        } else if (error.code === 'quota-exceeded') {
            mensagemErro = 'Limite atingido. Mensagem salva localmente, tente novamente mais tarde.';
        } else if (error.code === 'network-request-failed') {
            mensagemErro = 'Problema de conexão. Mensagem salva localmente, verifique sua internet.';
        }
        
        showNotification(mensagemErro, 'warning');
        
    } finally {
        // Sempre restaurar o botão, mas com um pequeno delay para evitar spam
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }, 500);
    }
}

// Função para registrar eventos relacionados a mensagens
function registrarEventosMensagem(categoria) {
    try {
        // Primeira mensagem
        if (!localStorage.getItem('primeiraMensagemEnviada')) {
            localStorage.setItem('primeiraMensagemEnviada', 'true');
            registrarEvento('primeira_mensagem_suporte', true);
        }
        
        // Categorias específicas
        registrarEvento(`mensagem_categoria_${categoria}`, true);
        
        // Contador total
        const totalMensagens = parseInt(localStorage.getItem('totalMensagensEnviadas') || '0') + 1;
        localStorage.setItem('totalMensagensEnviadas', totalMensagens.toString());
        registrarEvento('total_mensagens_suporte', totalMensagens);
        
    } catch (eventError) {
        console.error('Erro ao registrar eventos de mensagem:', eventError);
        // Não bloquear o envio por erro de evento
    }
}

function adicionarMensagemNaInterface(mensagem, isEnviada = false) {
    const mensagensLista = document.getElementById('mensagensLista');
    if (!mensagensLista) return;
    
    // Verificar se a mensagem já existe para evitar duplicações
    const messageId = mensagem.id || mensagem.messageId;
    if (messageId) {
        const existingMessage = mensagensLista.querySelector(`[data-message-id="${messageId}"]`);
        if (existingMessage) {
            console.log('⚠️ Mensagem já existe na interface, pulando duplicação');
            return;
        }
    }
    
    // Verificação adicional por conteúdo se não houver ID (para prevenir duplicação de mensagens temporárias)
    if (!messageId && isEnviada) {
        const existingMessages = mensagensLista.querySelectorAll('.message-item.sent');
        for (let existing of existingMessages) {
            const existingContent = existing.querySelector('p')?.textContent;
            if (existingContent === mensagem.conteudo) {
                const existingTime = existing.querySelector('.message-time')?.textContent;
                const currentTime = new Date().toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                // Se o conteúdo e horário são iguais, provavelmente é duplicata
                if (existingTime && existingTime.includes(currentTime.split(' ')[1])) {
                    console.log('⚠️ Mensagem duplicada detectada por conteúdo, pulando');
                    return;
                }
            }
        }
    }
    
    // Se está vazio, limpar mensagem de "nenhuma mensagem"
    if (mensagensLista.innerHTML.includes('Nenhuma mensagem ainda') || 
        mensagensLista.innerHTML.includes('Carregando suas mensagens')) {
        mensagensLista.innerHTML = '';
    }
    
    const horario = mensagem.criadaEm ? 
        new Date(mensagem.criadaEm.seconds * 1000 || mensagem.criadaEm).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }) : new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    
    const novoElemento = document.createElement('div');
    novoElemento.className = `message-item ${isEnviada ? 'sent' : 'received'} mb-4`;
    if (messageId) {
        novoElemento.setAttribute('data-message-id', messageId);
    }
    
    novoElemento.innerHTML = `
        <div class="message-bubble ${isEnviada ? 'bg-primary text-white' : 'bg-white dark:bg-gray-700'} rounded-lg p-3 shadow-sm">
            <p class="${isEnviada ? 'text-white' : 'text-gray-800 dark:text-gray-200'}">${mensagem.conteudo}</p>
            <div class="message-time text-xs mt-1 ${isEnviada ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}">
                ${isEnviada ? 'Você' : 'Suporte'} • ${horario}
                ${isEnviada ? '<div class="message-status"><i class="fas fa-check"></i>Enviada</div>' : ''}
            </div>
        </div>
    `;
    
    // Adicionar com animação suave
    novoElemento.style.opacity = '0';
    novoElemento.style.transform = 'translateY(20px)';
    mensagensLista.appendChild(novoElemento);
    
    // Animar entrada
    setTimeout(() => {
        novoElemento.style.transition = 'all 0.3s ease-out';
        novoElemento.style.opacity = '1';
        novoElemento.style.transform = 'translateY(0)';
    }, 50);
    
    // Scroll para baixo
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }
}

// Função para criar notificação para administradores
async function criarNotificacaoParaAdmins(mensagem) {
    try {
        // Lista de administradores que devem ser notificados  
        // Em ambiente real, isso seria obtido do servidor de forma segura
        const administradores = ["suporte@lordetempus.com"]; // Email genérico de suporte
        
        // Criar notificação para cada administrador
        const notificacoesPromises = administradores.map(async (adminEmail) => {
            const notificacao = {
                tipo: 'nova_mensagem_suporte',
                titulo: 'Nova Mensagem de Suporte',
                descricao: `${mensagem.userName} (${mensagem.userEmail}) enviou uma mensagem`,
                conteudoPreview: mensagem.conteudo.length > 50 
                    ? mensagem.conteudo.substring(0, 50) + '...' 
                    : mensagem.conteudo,
                
                // Dados da mensagem original
                mensagemId: mensagem.messageId || null,
                conversaId: mensagem.conversaId,
                
                // Dados do usuário que enviou
                remetenteId: mensagem.userId,
                remetenteEmail: mensagem.userEmail,
                remetenteName: mensagem.userName,
                remetentePlano: mensagem.userPlano,
                
                // Dados do admin destinatário
                adminEmail: adminEmail,
                destinatario: adminEmail,
                
                // Controle da notificação
                criadaEm: new Date(),
                lida: false,
                lidaEm: null,
                prioridade: mensagem.prioridade || 'normal',
                categoria: 'suporte',
                
                // Ações disponíveis
                acoes: {
                    responder: true,
                    marcarComoLida: true,
                    encaminhar: true
                },
                
                // Link para ação
                linkAcao: '/perfil.html#admin-mensagens',
                icone: 'fas fa-envelope',
                cor: '#00FCC8'
            };
            
            // Salvar notificação no Firestore
            return firebaseModules.addDoc(firebaseModules.collection(db, 'notifications'), notificacao);
        });
        
        // Aguardar todas as notificações serem criadas
        await Promise.all(notificacoesPromises);
        
        console.log('📬 Notificações criadas para administradores');
        
    } catch (error) {
        console.error('Erro ao criar notificações para admins:', error);
        // Não bloquear o envio da mensagem se as notificações falharem
    }
}

// ==================== PAINEL ADMIN ==================== //

// ==================== FUNÇÕES ADMIN MENSAGENS ==================== //

async function carregarMensagensAdmin() {
    if (!isAdmin) {
        console.log('⚠️ Usuário não é admin, não pode carregar mensagens admin');
        return;
    }
    
    console.log('📧 Carregando mensagens para painel admin...');
    
    try {
        // Configurar event listeners dos filtros
        configurarFiltrosMensagensAdmin();
        
        // Carregar e exibir mensagens
        await buscarEExibirMensagensAdmin();
        
    } catch (error) {
        console.error('Erro ao carregar mensagens admin:', error);
        document.getElementById('listaMensagensAdmin').innerHTML = `
            <div class="p-8 text-center text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>Erro ao carregar mensagens</p>
            </div>
        `;
    }
}

function configurarFiltrosMensagensAdmin() {
    // Event listeners para filtros
    const filtros = ['filtroStatusMensagens', 'filtroCategoriaMensagens', 'filtroPrioridadeMensagens'];
    filtros.forEach(filtroId => {
        const filtro = document.getElementById(filtroId);
        if (filtro) {
            filtro.addEventListener('change', filtrarMensagensAdmin);
        }
    });
    
    // Event listeners para botões de ação
    const btnAtualizar = document.getElementById('btnAtualizarMensagens');
    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', () => {
            buscarEExibirMensagensAdmin();
        });
    }
    
    const btnMarcarLidas = document.getElementById('btnMarcarTodasLidas');
    if (btnMarcarLidas) {
        btnMarcarLidas.addEventListener('click', marcarTodasMensagensComoLidas);
    }
    
    console.log('🔧 Filtros de mensagens admin configurados');
}

async function buscarEExibirMensagensAdmin() {
    const lista = document.getElementById('listaMensagensAdmin');
    
    if (!lista) return;
    
    lista.innerHTML = `
        <div class="p-8 text-center text-gray-500 dark:text-gray-400">
            <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
            <p>Carregando mensagens...</p>
        </div>
    `;
    
    try {
        // Buscar todas as mensagens direcionadas aos administradores
        // Em ambiente real, isso seria determinado pelo servidor de forma segura
        const adminEmails = ["suporte@lordetempus.com"]; // Email genérico de suporte
        const q = firebaseModules.query(
            firebaseModules.collection(db, 'messages'),
            firebaseModules.where('to', 'in', adminEmails),
            firebaseModules.orderBy('criadaEm', 'desc')
        );
        
        const snapshot = await firebaseModules.getDocs(q);
        const mensagens = [];
        
        snapshot.forEach(docSnap => {
            mensagens.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Atualizar dashboard
        atualizarDashboardMensagens(mensagens);
        
        // Renderizar mensagens
        renderizarMensagensAdmin(mensagens);
        
        console.log(`📬 ${mensagens.length} mensagens carregadas para admin`);
        
    } catch (error) {
        console.error('Erro ao buscar mensagens admin:', error);
        lista.innerHTML = `
            <div class="p-8 text-center text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>Erro ao carregar mensagens</p>
                <p class="text-sm mt-2">Verifique sua conexão e tente novamente</p>
            </div>
        `;
    }
}

function atualizarDashboardMensagens(mensagens) {
    const stats = {
        total: mensagens.length,
        novas: mensagens.filter(m => m.status === 'nova').length,
        respondidas: mensagens.filter(m => m.status === 'respondida').length,
        urgentes: mensagens.filter(m => m.prioridade === 'urgente' || m.precisaAtencao).length
    };
    
    // Atualizar números do dashboard
    const elementos = {
        totalMensagens: document.getElementById('totalMensagens'),
        mensagensNovas: document.getElementById('mensagensNovas'),
        mensagensRespondidas: document.getElementById('mensagensRespondidas'),
        mensagensUrgentes: document.getElementById('mensagensUrgentes')
    };
    
    if (elementos.totalMensagens) elementos.totalMensagens.textContent = stats.total;
    if (elementos.mensagensNovas) elementos.mensagensNovas.textContent = stats.novas;
    if (elementos.mensagensRespondidas) elementos.mensagensRespondidas.textContent = stats.respondidas;
    if (elementos.mensagensUrgentes) elementos.mensagensUrgentes.textContent = stats.urgentes;
}

function renderizarMensagensAdmin(mensagens) {
    const lista = document.getElementById('listaMensagensAdmin');
    if (!lista) return;
    
    if (mensagens.length === 0) {
        lista.innerHTML = `
            <div class="mensagens-empty-state p-8 text-center text-gray-500 dark:text-gray-400">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p>Nenhuma mensagem encontrada</p>
                <p class="text-sm mt-2">Quando os clientes enviarem mensagens, elas aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    // Agrupar mensagens por usuário (conversa)
    const conversas = agruparMensagensPorUsuario(mensagens);
    
    const html = conversas.map(conversa => {
        const ultimaMensagem = conversa.mensagens[0]; // Mais recente
        const totalMensagens = conversa.mensagens.length;
        const naoLidas = conversa.mensagens.filter(m => !m.lida).length;
        
        // Determinar status visual
        const statusClass = getStatusClass(ultimaMensagem.status);
        const prioridadeClass = getPrioridadeClass(ultimaMensagem.prioridade);
        
        return `
            <div class="conversa-item p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" 
                 onclick="abrirConversa('${conversa.userId}', '${conversa.userEmail}')">
                <div class="flex items-start gap-4">
                    <!-- Avatar do usuário -->
                    <div class="flex-shrink-0 relative">
                        <img src="${ultimaMensagem.userPhoto || 'images/avatar-default.png'}" 
                             alt="Avatar" class="conversa-avatar w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600">
                        ${naoLidas > 0 ? `<div class="badge-nao-lidas w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center absolute -top-1 -right-1">${naoLidas}</div>` : ''}
                    </div>
                    
                    <!-- Informações da conversa -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h4 class="font-semibold text-gray-900 dark:text-white truncate">
                                ${ultimaMensagem.userName || 'Usuário'}
                            </h4>
                            <div class="flex items-center gap-2">
                                <span class="status-badge ${statusClass}">
                                    ${getStatusText(ultimaMensagem.status)}
                                </span>
                                ${ultimaMensagem.precisaAtencao ? '<i class="fas fa-exclamation-triangle text-yellow-500" title="Precisa atenção"></i>' : ''}
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                                ${ultimaMensagem.userEmail}
                            </p>
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                ${formatarDataMensagem(ultimaMensagem.criadaEm)}
                            </span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <p class="text-sm text-gray-700 dark:text-gray-300 truncate max-w-md">
                                ${ultimaMensagem.conteudo}
                            </p>
                            <div class="flex items-center gap-2">
                                <span class="categoria-badge ${ultimaMensagem.categoria}">
                                    ${ultimaMensagem.categoria}
                                </span>
                                <span class="text-xs text-gray-500">
                                    ${totalMensagens} msg${totalMensagens > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ações rápidas -->
                    <div class="flex flex-col gap-1">
                        <button class="acao-rapida responder text-sm px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition" 
                                onclick="event.stopPropagation(); responderRapido('${ultimaMensagem.id}', '${conversa.userEmail}')">
                            <i class="fas fa-reply"></i>
                        </button>
                        <button class="acao-rapida marcar-lida text-sm px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition" 
                                onclick="event.stopPropagation(); marcarComoLida('${ultimaMensagem.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    lista.innerHTML = html;
}

// Funções auxiliares para renderização
function agruparMensagensPorUsuario(mensagens) {
    const grupos = {};
    
    mensagens.forEach(mensagem => {
        const key = mensagem.userId || mensagem.userEmail;
        if (!grupos[key]) {
            grupos[key] = {
                userId: mensagem.userId,
                userEmail: mensagem.userEmail,
                userName: mensagem.userName,
                mensagens: []
            };
        }
        grupos[key].mensagens.push(mensagem);
    });
    
    // Converter para array e ordenar por última mensagem
    return Object.values(grupos).sort((a, b) => {
        const dataA = a.mensagens[0].criadaEm ? a.mensagens[0].criadaEm.seconds : 0;
        const dataB = b.mensagens[0].criadaEm ? b.mensagens[0].criadaEm.seconds : 0;
        return dataB - dataA;
    });
}

function getStatusClass(status) {
    const classes = {
        'nova': 'status-nova',
        'lida': 'status-lida',
        'respondida': 'status-respondida',
        'resolvida': 'status-resolvida'
    };
    return classes[status] || 'status-nova';
}

function getPrioridadeClass(prioridade) {
    const classes = {
        'urgente': 'prioridade-urgente',
        'alta': 'prioridade-alta',
        'normal': 'prioridade-normal',
        'baixa': 'prioridade-baixa'
    };
    return classes[prioridade] || 'prioridade-normal';
}

function getStatusText(status) {
    const textos = {
        'nova': 'Nova',
        'lida': 'Lida',
        'respondida': 'Respondida',
        'resolvida': 'Resolvida'
    };
    return textos[status] || 'Nova';
}

function formatarDataMensagem(data) {
    if (!data) return 'Agora';
    
    const agora = new Date();
    const mensagemData = data.seconds ? new Date(data.seconds * 1000) : new Date(data);
    const diffMs = agora - mensagemData;
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);
    
    if (diffMinutos < 1) return 'Agora';
    if (diffMinutos < 60) return `${diffMinutos}m atrás`;
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    if (diffDias < 7) return `${diffDias}d atrás`;
    
    return mensagemData.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
    });
}

// Funções globais para ações
window.abrirConversa = function(userId, userEmail) {
    // Implementar modal/tela de conversa detalhada
    console.log('Abrindo conversa com:', userEmail);
    // TODO: Implementar na próxima etapa
};

window.responderRapido = async function(mensagemId, userEmail) {
    const resposta = prompt('Digite sua resposta:');
    if (!resposta) return;
    
    try {
        // Criar mensagem de resposta
        const respostaMensagem = {
            from: currentUser.email,
            to: userEmail,
            conteudo: resposta,
            criadaEm: new Date(),
            tipo: 'resposta_admin',
            categoria: 'resposta',
            prioridade: 'normal',
            status: 'nova',
            threadId: mensagemId, // Vincular à mensagem original
            adminAutor: currentUser.email,
            adminNome: currentUser.displayName || 'Admin'
        };
        
        await firebaseModules.addDoc(firebaseModules.collection(db, 'messages'), respostaMensagem);
        
        // Marcar mensagem original como respondida
        await firebaseModules.updateDoc(firebaseModules.doc(db, 'messages', mensagemId), {
            status: 'respondida',
            respondida: true,
            respondidaEm: new Date(),
            respondidaPor: currentUser.email
        });
        
        showNotification('Resposta enviada com sucesso!', 'success');
        buscarEExibirMensagensAdmin(); // Recarregar
        
    } catch (error) {
        console.error('Erro ao enviar resposta:', error);
        showNotification('Erro ao enviar resposta', 'error');
    }
};

window.marcarComoLida = async function(mensagemId) {
    try {
        await firebaseModules.updateDoc(firebaseModules.doc(db, 'messages', mensagemId), {
            lida: true,
            lidaEm: new Date(),
            lidaPor: currentUser.email
        });
        
        showNotification('Marcada como lida', 'success');
        buscarEExibirMensagensAdmin(); // Recarregar
        
    } catch (error) {
        console.error('Erro ao marcar como lida:', error);
        showNotification('Erro ao marcar como lida', 'error');
    }
};

async function filtrarMensagensAdmin() {
    // Recarregar mensagens com filtros aplicados
    buscarEExibirMensagensAdmin();
}

async function marcarTodasMensagensComoLidas() {
    if (!confirm('Deseja marcar todas as mensagens como lidas?')) return;
    
    try {
        // Em ambiente real, isso seria determinado pelo servidor de forma segura
        const adminEmails = ["suporte@lordetempus.com"]; // Email genérico de suporte
        const q = firebaseModules.query(
            firebaseModules.collection(db, 'messages'),
            firebaseModules.where('to', 'in', adminEmails),
            firebaseModules.where('lida', '==', false)
        );
        
        const snapshot = await firebaseModules.getDocs(q);
        const batch = [];
        
        snapshot.forEach(docSnap => {
            batch.push(
                firebaseModules.updateDoc(firebaseModules.doc(db, 'messages', docSnap.id), {
                    lida: true,
                    lidaEm: new Date(),
                    lidaPor: currentUser.email
                })
            );
        });
        
        await Promise.all(batch);
        
        showNotification(`${batch.length} mensagens marcadas como lidas`, 'success');
        buscarEExibirMensagensAdmin(); // Recarregar
        
    } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        showNotification('Erro ao marcar mensagens como lidas', 'error');
    }
}

// ==================== PAINEL ADMIN ==================== //

// Função global para responder cliente (nova funcionalidade)
window.responderCliente = async function(clienteEmail, clienteNome) {
    console.log('🔄 Redirecionando para responder cliente:', clienteEmail);
    
    try {
        // 1. Trocar para aba de mensagens
        const navBtns = document.querySelectorAll('.admin-nav-btn');
        navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === 'mensagens') {
                btn.classList.add('active');
            }
        });
        
        // Esconder todas as seções e mostrar mensagens
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById('admin-section-mensagens').classList.remove('hidden');
        
        // 2. Carregar mensagens se ainda não foram carregadas
        await carregarMensagensAdmin();
        
        // 3. Filtrar mensagens do cliente específico
        await filtrarMensagensParaCliente(clienteEmail, clienteNome);
        
        // 4. Feedback visual
        showNotification(`Exibindo mensagens de ${clienteNome}`, 'info');
        
        // 5. Scroll suave para o topo da seção
        document.getElementById('admin-section-mensagens').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
    } catch (error) {
        console.error('Erro ao redirecionar para mensagens:', error);
        showNotification('Erro ao abrir mensagens do cliente', 'error');
    }
};

async function filtrarMensagensParaCliente(clienteEmail, clienteNome) {
    console.log('🔍 Filtrando mensagens para cliente:', clienteEmail);
    
    try {
        // Buscar mensagens específicas do cliente
        const q = firebaseModules.query(
            firebaseModules.collection(db, 'messages'),
            firebaseModules.where('from', '==', clienteEmail),
            firebaseModules.orderBy('criadaEm', 'desc')
        );
        
        const snapshot = await firebaseModules.getDocs(q);
        const mensagensCliente = [];
        
        snapshot.forEach(docSnap => {
            mensagensCliente.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Atualizar dashboard focado no cliente
        atualizarDashboardParaCliente(mensagensCliente, clienteNome);
        
        // Renderizar apenas mensagens do cliente
        renderizarMensagensCliente(mensagensCliente, clienteEmail, clienteNome);
        
        // Adicionar botão para voltar a ver todas as mensagens
        adicionarBotaoVoltarTodasMensagens();
        
    } catch (error) {
        console.error('Erro ao filtrar mensagens do cliente:', error);
        showNotification('Erro ao carregar mensagens do cliente', 'error');
    }
}

function atualizarDashboardParaCliente(mensagens, clienteNome) {
    const stats = {
        total: mensagens.length,
        novas: mensagens.filter(m => m.status === 'nova').length,
        respondidas: mensagens.filter(m => m.status === 'respondida').length,
        urgentes: mensagens.filter(m => m.prioridade === 'urgente' || m.precisaAtencao).length
    };
    
    // Atualizar elementos do dashboard
    const elementos = {
        totalMensagens: document.getElementById('totalMensagens'),
        mensagensNovas: document.getElementById('mensagensNovas'),
        mensagensRespondidas: document.getElementById('mensagensRespondidas'),
        mensagensUrgentes: document.getElementById('mensagensUrgentes')
    };
    
    if (elementos.totalMensagens) elementos.totalMensagens.textContent = stats.total;
    if (elementos.mensagensNovas) elementos.mensagensNovas.textContent = stats.novas;
    if (elementos.mensagensRespondidas) elementos.mensagensRespondidas.textContent = stats.respondidas;
    if (elementos.mensagensUrgentes) elementos.mensagensUrgentes.textContent = stats.urgentes;
    
    // Adicionar indicador de filtro ativo
    const dashboard = document.getElementById('mensagensDashboard');
    if (dashboard) {
        const filtroIndicador = dashboard.querySelector('.filtro-cliente-ativo');
        if (filtroIndicador) {
            filtroIndicador.remove();
        }
        
        const indicador = document.createElement('div');
        indicador.className = 'filtro-cliente-ativo col-span-full bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-500 mb-4';
        indicador.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i class="fas fa-filter text-blue-600 dark:text-blue-400"></i>
                    <span class="font-semibold text-blue-800 dark:text-blue-300">
                        Filtrando mensagens de: ${clienteNome}
                    </span>
                </div>
                <button onclick="voltarTodasMensagens()" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition">
                    <i class="fas fa-times mr-1"></i>Limpar filtro
                </button>
            </div>
        `;
        
        dashboard.appendChild(indicador);
    }
}

function renderizarMensagensCliente(mensagens, clienteEmail, clienteNome) {
    const lista = document.getElementById('listaMensagensAdmin');
    if (!lista) return;
    
    if (mensagens.length === 0) {
        lista.innerHTML = `
            <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                <i class="fas fa-comment-slash text-4xl mb-4"></i>
                <h3 class="text-lg font-semibold mb-2">Nenhuma mensagem de ${clienteNome}</h3>
                <p>Este cliente ainda não enviou mensagens para o suporte.</p>
                <button onclick="iniciarConversaComCliente('${clienteEmail}', '${clienteNome}')" 
                        class="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                    <i class="fas fa-plus mr-2"></i>Iniciar Conversa
                </button>
            </div>
        `;
        return;
    }
    
    // Agrupar mensagens do cliente
    const conversa = {
        userId: mensagens[0].userId,
        userEmail: clienteEmail,
        userName: clienteNome,
        mensagens: mensagens
    };
    
    const ultimaMensagem = mensagens[0];
    const totalMensagens = mensagens.length;
    const naoLidas = mensagens.filter(m => !m.lida).length;
    
    const html = `
        <!-- Cabeçalho da conversa com cliente específico -->
        <div class="conversa-header bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-4">
                <img src="${ultimaMensagem.userPhoto || 'images/avatar-default.png'}" 
                     alt="Avatar" class="w-16 h-16 rounded-full border-4 border-blue-500">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Conversa com ${clienteNome}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-2">${clienteEmail}</p>
                    <div class="flex items-center gap-4 text-sm">
                        <span class="flex items-center gap-1">
                            <i class="fas fa-envelope text-blue-500"></i>
                            ${totalMensagens} mensagem${totalMensagens > 1 ? 's' : ''}
                        </span>
                        ${naoLidas > 0 ? `
                            <span class="flex items-center gap-1">
                                <i class="fas fa-eye-slash text-yellow-500"></i>
                                ${naoLidas} não lida${naoLidas > 1 ? 's' : ''}
                            </span>
                        ` : ''}
                        <span class="flex items-center gap-1">
                            <i class="fas fa-clock text-gray-500"></i>
                            Última: ${formatarDataMensagem(ultimaMensagem.criadaEm)}
                        </span>
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <button onclick="responderClienteModal('${clienteEmail}', '${clienteNome}')" 
                            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold">
                        <i class="fas fa-reply mr-2"></i>Responder Agora
                    </button>
                    <button onclick="marcarTodasLidasCliente('${clienteEmail}')" 
                            class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                        <i class="fas fa-check-double mr-2"></i>Marcar Todas Lidas
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Lista de mensagens do cliente -->
        <div class="mensagens-cliente-lista">
            ${mensagens.map(mensagem => {
                const statusClass = getStatusClass(mensagem.status);
                return `
                    <div class="mensagem-item p-4 border-l-4 ${mensagem.lida ? 'border-green-500' : 'border-yellow-500'} hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <span class="status-badge ${statusClass}">
                                    ${getStatusText(mensagem.status)}
                                </span>
                                <span class="categoria-badge ${mensagem.categoria}">
                                    ${mensagem.categoria}
                                </span>
                                ${mensagem.precisaAtencao ? '<i class="fas fa-exclamation-triangle text-yellow-500" title="Precisa atenção"></i>' : ''}
                            </div>
                            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span>${formatarDataMensagem(mensagem.criadaEm)}</span>
                                <div class="flex gap-1">
                                    <button onclick="responderRapido('${mensagem.id}', '${clienteEmail}')" 
                                            class="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition" title="Responder">
                                        <i class="fas fa-reply text-xs"></i>
                                    </button>
                                    <button onclick="marcarComoLida('${mensagem.id}')" 
                                            class="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition" title="Marcar como lida">
                                        <i class="fas fa-check text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="mensagem-conteudo">
                            <p class="text-gray-800 dark:text-gray-200 leading-relaxed">${mensagem.conteudo}</p>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    lista.innerHTML = html;
}

function adicionarBotaoVoltarTodasMensagens() {
    // Este botão já é adicionado no indicador do dashboard
    console.log('📌 Filtro ativo para cliente específico');
}

// Funções globais adicionais
window.voltarTodasMensagens = function() {
    // Limpar filtro e recarregar todas as mensagens
    buscarEExibirMensagensAdmin();
    showNotification('Exibindo todas as mensagens', 'info');
};

// Modal de Chat Dinâmico - Substituir prompt simples
window.responderClienteModal = function(clienteEmail, clienteNome) {
    abrirModalChatCliente(clienteEmail, clienteNome);
};

// Função principal para abrir modal de chat
async function abrirModalChatCliente(clienteEmail, clienteNome) {
    const modal = document.getElementById('modal-chat-cliente');
    const avatar = document.getElementById('chatClienteAvatar');
    const nome = document.getElementById('chatClienteNome');
    const email = document.getElementById('chatClienteEmail');
    
    // Configurar cabeçalho do modal
    avatar.src = 'images/avatar-default.png'; // Será atualizado quando carregar dados
    nome.textContent = `Chat com ${clienteNome}`;
    email.textContent = clienteEmail;
    
    // Mostrar modal
    modal.classList.add('active');
    
    // Carregar histórico de mensagens
    await carregarHistoricoChatCliente(clienteEmail, clienteNome);
    
    // Configurar formulário de envio
    configurarFormularioChatCliente(clienteEmail, clienteNome);
}

// Carregar histórico de mensagens no modal
async function carregarHistoricoChatCliente(clienteEmail, clienteNome) {
    const historico = document.getElementById('chatHistorico');
    
    try {
        // Buscar todas as mensagens do cliente (enviadas e recebidas)
        const mensagensEnviadas = await buscarMensagensCliente(clienteEmail, 'from');
        const mensagensRecebidas = await buscarMensagensCliente(clienteEmail, 'to');
        
        // Combinar e ordenar mensagens
        const todasMensagens = [...mensagensEnviadas, ...mensagensRecebidas];
        todasMensagens.sort((a, b) => {
            const dateA = a.criadaEm ? (a.criadaEm.seconds || a.criadaEm.getTime() / 1000) : 0;
            const dateB = b.criadaEm ? (b.criadaEm.seconds || b.criadaEm.getTime() / 1000) : 0;
            return dateA - dateB;
        });
        
        // Atualizar avatar se disponível
        if (todasMensagens.length > 0) {
            const primeiraDoCliente = todasMensagens.find(m => m.from === clienteEmail);
            if (primeiraDoCliente && primeiraDoCliente.userPhoto) {
                document.getElementById('chatClienteAvatar').src = primeiraDoCliente.userPhoto;
            }
        }
        
        // Renderizar mensagens
        if (todasMensagens.length === 0) {
            historico.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-comment-slash text-4xl mb-4"></i>
                    <h3 class="text-lg font-semibold mb-2">Nenhuma mensagem ainda</h3>
                    <p>Comece a conversa enviando a primeira mensagem!</p>
                </div>
            `;
        } else {
            renderizarHistoricoChat(todasMensagens, clienteEmail, clienteNome);
        }
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        historico.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>Erro ao carregar histórico de mensagens</p>
            </div>
        `;
    }
}

// Buscar mensagens específicas do cliente
async function buscarMensagensCliente(clienteEmail, campo) {
    try {
        const q = firebaseModules.query(
            firebaseModules.collection(db, 'messages'),
            firebaseModules.where(campo, '==', clienteEmail)
        );
        
        const snapshot = await firebaseModules.getDocs(q);
        const mensagens = [];
        
        snapshot.forEach(docSnap => {
            mensagens.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        return mensagens;
    } catch (error) {
        console.error(`Erro ao buscar mensagens (${campo}):`, error);
        return [];
    }
}

// Renderizar histórico de mensagens no chat
function renderizarHistoricoChat(mensagens, clienteEmail, clienteNome) {
    const historico = document.getElementById('chatHistorico');
    
    const html = mensagens.map(mensagem => {
        const isAdmin = mensagem.from !== clienteEmail;
        const tipo = isAdmin ? 'admin' : 'cliente';
        const remetente = isAdmin ? 'Suporte' : (clienteNome || 'Cliente');
        
        const horario = mensagem.criadaEm ? 
            new Date(mensagem.criadaEm.seconds * 1000).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Agora';
        
        return `
            <div class="chat-mensagem ${tipo}">
                <div class="chat-bubble">
                    <div class="chat-conteudo">
                        ${mensagem.conteudo}
                    </div>
                    <div class="chat-meta">
                        ${remetente} • ${horario}
                        ${mensagem.status ? `• ${mensagem.status}` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    historico.innerHTML = html;
    
    // Scroll para baixo
    setTimeout(() => {
        historico.scrollTop = historico.scrollHeight;
    }, 100);
}

// Configurar formulário de envio no modal
function configurarFormularioChatCliente(clienteEmail, clienteNome) {
    const form = document.getElementById('formChatCliente');
    const input = document.getElementById('chatMensagemInput');
    const submitBtn = form.querySelector('button[type="submit"]');
    const contador = document.getElementById('chatContadorCaracteres');
    
    // Limpar event listeners anteriores
    const novoForm = form.cloneNode(true);
    form.parentNode.replaceChild(novoForm, form);
    
    // Referenciar elementos novamente
    const novoInput = document.getElementById('chatMensagemInput');
    const novoSubmitBtn = novoForm.querySelector('button[type="submit"]');
    const novoContador = document.getElementById('chatContadorCaracteres');
    
    // Controle já implementado na função enviarMensagemChatCliente() através do disabled do botão
    
    // Event listener para contador de caracteres
    novoInput.addEventListener('input', function() {
        const length = this.value.length;
        novoContador.textContent = `${length}/1000`;
        
        // Habilitar/desabilitar botão - SIMPLIFICADO
        novoSubmitBtn.disabled = length === 0 || length > 1000;
        
        // Mudar cor do contador
        novoContador.classList.remove('text-red-500', 'text-yellow-500', 'text-gray-400');
        if (length > 900) {
            novoContador.classList.add('text-red-500');
        } else if (length > 800) {
            novoContador.classList.add('text-yellow-500');
        } else {
            novoContador.classList.add('text-gray-400');
        }
    });
    

    
    // Event listener para envio
    novoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!novoSubmitBtn.disabled) {
            const conteudo = novoInput.value.trim();
            if (conteudo) {
                await enviarMensagemChatCliente(clienteEmail, clienteNome, conteudo);
            }
        }
    });
    
    // Enter para enviar (Shift+Enter para nova linha)
    novoInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!novoSubmitBtn.disabled) {
                const conteudo = novoInput.value.trim();
                if (conteudo) {
                    enviarMensagemChatCliente(clienteEmail, clienteNome, conteudo);
                }
            }
        }
    });
    
    // Auto-focus no input
    setTimeout(() => {
        novoInput.focus();
    }, 300);
}

// Enviar mensagem através do modal
async function enviarMensagemChatCliente(clienteEmail, clienteNome, mensagem) {
    if (!mensagem) return;
    
    const submitBtn = document.querySelector('#formChatCliente button[type="submit"]');
    const input = document.getElementById('chatMensagemInput');
    
    // Verificar se o botão já está desabilitado (evita envios duplicados)
    if (submitBtn.disabled) {
        console.log('⚠️ Botão de chat já desabilitado, evitando envio duplicado');
        return;
    }
    
    try {
        // Desabilitar botão IMEDIATAMENTE para evitar duplo clique
        submitBtn.disabled = true;
        const textoOriginal = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';
        
        // Criar mensagem de resposta
        const respostaMensagem = {
            from: currentUser.email,
            to: clienteEmail,
            conteudo: mensagem,
            criadaEm: new Date(),
            tipo: 'resposta_admin',
            categoria: 'resposta',
            prioridade: 'normal',
            status: 'nova',
            threadId: null,
            adminAutor: currentUser.email,
            adminNome: currentUser.displayName || 'Admin',
            userId: null,
            userName: currentUser.displayName || 'Suporte',
            userEmail: currentUser.email,
            userPhoto: currentUser.photoURL
        };
        
        await firebaseModules.addDoc(firebaseModules.collection(db, 'messages'), respostaMensagem);
        
        // Limpar input
        input.value = '';
        document.getElementById('chatContadorCaracteres').textContent = '0/1000';
        
        // Adicionar mensagem à interface imediatamente
        adicionarMensagemAoChat(respostaMensagem, 'admin');
        
        showNotification('Mensagem enviada com sucesso!', 'success');
        
        // Recarregar mensagens na aba se estiver ativa
        const filtroAtivo = document.querySelector('.filtro-cliente-ativo');
        if (filtroAtivo) {
            setTimeout(() => {
                filtrarMensagensParaCliente(clienteEmail, clienteNome);
            }, 500);
        }
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showNotification('Erro ao enviar mensagem', 'error');
    } finally {
        // Sempre restaurar o botão, mas com um pequeno delay para evitar spam
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Enviar';
        }, 500);
    }
}

// Adicionar mensagem ao chat em tempo real
function adicionarMensagemAoChat(mensagem, tipo) {
    const historico = document.getElementById('chatHistorico');
    
    // Se está vazio, limpar mensagem de "nenhuma mensagem"
    if (historico.innerHTML.includes('Nenhuma mensagem ainda') || historico.innerHTML.includes('Carregando histórico')) {
        historico.innerHTML = '';
    }
    
    const remetente = tipo === 'admin' ? 'Suporte' : 'Cliente';
    const horario = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const novaMensagem = document.createElement('div');
    novaMensagem.className = `chat-mensagem ${tipo}`;
    novaMensagem.innerHTML = `
        <div class="chat-bubble">
            <div class="chat-conteudo">
                ${mensagem.conteudo}
            </div>
            <div class="chat-meta">
                ${remetente} • ${horario}
            </div>
        </div>
    `;
    
    historico.appendChild(novaMensagem);
    
    // Scroll para baixo
    setTimeout(() => {
        historico.scrollTop = historico.scrollHeight;
    }, 100);
}

// Fechar modal de chat
window.fecharModalChatCliente = function() {
    const modal = document.getElementById('modal-chat-cliente');
    modal.classList.remove('active');
    
    // Limpar conteúdo
    document.getElementById('chatHistorico').innerHTML = '';
    document.getElementById('chatMensagemInput').value = '';
    document.getElementById('chatContadorCaracteres').textContent = '0';
};

window.marcarTodasLidasCliente = async function(clienteEmail) {
    if (!confirm('Marcar todas as mensagens deste cliente como lidas?')) return;
    
    try {
        const q = firebaseModules.query(
            firebaseModules.collection(db, 'messages'),
            firebaseModules.where('from', '==', clienteEmail),
            firebaseModules.where('lida', '==', false)
        );
        
        const snapshot = await firebaseModules.getDocs(q);
        const updates = [];
        
        snapshot.forEach(docSnap => {
            updates.push(
                firebaseModules.updateDoc(firebaseModules.doc(db, 'messages', docSnap.id), {
                    lida: true,
                    lidaEm: new Date(),
                    lidaPor: currentUser.email
                })
            );
        });
        
        await Promise.all(updates);
        
        showNotification(`${updates.length} mensagens marcadas como lidas`, 'success');
        filtrarMensagensParaCliente(clienteEmail, 'Cliente'); // Recarregar
        
    } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
        showNotification('Erro ao marcar mensagens como lidas', 'error');
    }
};

window.iniciarConversaComCliente = function(clienteEmail, clienteNome) {
    // Abrir modal de chat para iniciar conversa
    abrirModalChatCliente(clienteEmail, clienteNome);
};

// Função melhorada para responder (aceita mensagem customizada)
window.responderRapido = async function(mensagemId, userEmail, mensagemCustomizada = null) {
    // Se foi passada uma mensagem customizada (resposta direta), usar
    if (mensagemCustomizada) {
        const resposta = mensagemCustomizada;
        
        try {
            // Criar mensagem de resposta
            const respostaMensagem = {
                from: currentUser.email,
                to: userEmail,
                conteudo: resposta,
                criadaEm: new Date(),
                tipo: 'resposta_admin',
                categoria: 'resposta',
                prioridade: 'normal',
                status: 'nova',
                threadId: mensagemId || null,
                adminAutor: currentUser.email,
                adminNome: currentUser.displayName || 'Admin',
                userId: null,
                userName: currentUser.displayName || 'Suporte',
                userEmail: currentUser.email,
                userPhoto: currentUser.photoURL
            };
            
            await firebaseModules.addDoc(firebaseModules.collection(db, 'messages'), respostaMensagem);
            
            // Marcar mensagem original como respondida (se existe)
            if (mensagemId) {
                await firebaseModules.updateDoc(firebaseModules.doc(db, 'messages', mensagemId), {
                    status: 'respondida',
                    respondida: true,
                    respondidaEm: new Date(),
                    respondidaPor: currentUser.email
                });
            }
            
            showNotification('Resposta enviada com sucesso!', 'success');
            
            // Recarregar mensagens (mantendo filtro se ativo)
            const filtroAtivo = document.querySelector('.filtro-cliente-ativo');
            if (filtroAtivo) {
                setTimeout(() => {
                    filtrarMensagensParaCliente(userEmail, 'Cliente');
                }, 500);
            } else {
                buscarEExibirMensagensAdmin();
            }
            
        } catch (error) {
            console.error('Erro ao enviar resposta:', error);
            showNotification('Erro ao enviar resposta', 'error');
        }
    } else {
        // Abrir modal de chat para resposta
        const clienteNome = 'Cliente'; // Nome genérico, será atualizado no modal
        abrirModalChatCliente(userEmail, clienteNome);
    }
};

// Fechar modal de chat
window.fecharModalChatCliente = function() {
    const modal = document.getElementById('modal-chat-cliente');
    modal.classList.remove('active');
    
    // Limpar conteúdo
    document.getElementById('chatHistorico').innerHTML = '';
    document.getElementById('chatMensagemInput').value = '';
    document.getElementById('chatContadorCaracteres').textContent = '0';
};

// Configurar fechamento do modal ao clicar fora
document.addEventListener('DOMContentLoaded', function() {
    const modalChatCliente = document.getElementById('modal-chat-cliente');
    
    if (modalChatCliente) {
        modalChatCliente.addEventListener('click', function(e) {
            if (e.target === modalChatCliente) {
                fecharModalChatCliente();
            }
        });
    }
    
    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal-chat-cliente');
            if (modal && modal.classList.contains('active')) {
                fecharModalChatCliente();
            }
        }
    });
});

// ==================== PAINEL ADMIN ==================== //

// ==================== FUNÇÕES PARA GERENCIAMENTO DE TROFÉUS (ADMIN) ==================== //

// Função para abrir modal de criar troféu (Etapa 2)
window.abrirModalCriarTrofeu = function() {
    console.log('🏆 Abrindo modal de criar troféu...');
    console.log('🔍 isAdmin atual:', isAdmin);
    console.log('👤 currentUser:', currentUser?.email);
    
    // Verificar se o usuário é admin
    if (!isAdmin) {
        console.warn('❌ Usuário não é administrador!');
        showNotification('Acesso negado: apenas administradores podem criar troféus.', 'error');
        return;
    }
    
    // Criar o modal dinamicamente
    const modal = document.createElement('div');
    modal.id = 'modal-criar-trofeu';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content modal-criar-trofeu">
            <div class="modal-header">
                <h3 class="modal-title">
                    <i class="fas fa-plus-circle mr-2 text-yellow-500"></i>
                    Criar Novo Troféu
                </h3>
                <button class="modal-close" onclick="fecharModalCriarTrofeu()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="modal-body">
                <form id="form-criar-trofeu" onsubmit="salvarNovoTrofeu(event)">
                    <!-- Campo Nome -->
                    <div class="form-group">
                        <label for="trofeu-nome" class="form-label">
                            <i class="fas fa-award mr-2"></i>Nome do Troféu
                        </label>
                        <input 
                            type="text" 
                            id="trofeu-nome" 
                            name="nome"
                            class="form-input" 
                            placeholder="Ex: Primeiro Login, Explorador Iniciante..."
                            required
                            maxlength="50"
                        >
                        <div class="form-hint">Nome que aparecerá para os usuários (máx. 50 caracteres)</div>
                    </div>

                    <!-- Campo Descrição -->
                    <div class="form-group">
                        <label for="trofeu-descricao" class="form-label">
                            <i class="fas fa-align-left mr-2"></i>Descrição
                        </label>
                        <textarea 
                            id="trofeu-descricao" 
                            name="descricao"
                            class="form-textarea" 
                            placeholder="Descreva como conquistar este troféu..."
                            required
                            maxlength="150"
                            rows="3"
                        ></textarea>
                        <div class="form-hint">Explicação clara de como obter o troféu (máx. 150 caracteres)</div>
                    </div>

                    <!-- Ícone -->
                    <div class="form-group">
                        <label for="trofeu-icone" class="form-label">
                            <i class="fas fa-icons mr-2"></i>Ícone (FontAwesome)
                        </label>
                        <div class="icone-input-group">
                            <input 
                                type="text" 
                                id="trofeu-icone" 
                                name="icone"
                                class="form-input" 
                                placeholder="Ex: fas fa-star, fas fa-medal, fas fa-trophy..."
                                required
                                value="fas fa-trophy"
                            >
                            <div class="icone-preview" id="icone-preview">
                                <i class="fas fa-trophy"></i>
                            </div>
                        </div>
                        <div class="form-hint">
                            Use classes FontAwesome. 
                            <a href="https://fontawesome.com/icons" target="_blank" class="text-blue-500 hover:underline">
                                Ver ícones disponíveis
                            </a>
                        </div>
                    </div>

                    <!-- Categoria -->
                    <div class="form-group">
                        <label for="trofeu-categoria" class="form-label">
                            <i class="fas fa-tags mr-2"></i>Categoria
                        </label>
                        <select id="trofeu-categoria" name="categoria" class="form-select" required>
                            <option value="">Selecione uma categoria</option>
                            <option value="primeiros_passos">🚀 Primeiros Passos</option>
                            <option value="campanhas">⚔️ Campanhas</option>
                            <option value="tempo">⏰ Tempo na Plataforma</option>
                            <option value="social">👥 Social</option>
                            <option value="especial">✨ Especial</option>
                            <option value="seasonal">🎃 Sazonal</option>
                        </select>
                        <div class="form-hint">Categoria para organização dos troféus</div>
                    </div>

                    <!-- Raridade -->
                    <div class="form-group">
                        <label for="trofeu-raridade" class="form-label">
                            <i class="fas fa-gem mr-2"></i>Raridade
                        </label>
                        <select id="trofeu-raridade" name="raridade" class="form-select" required>
                            <option value="">Selecione a raridade</option>
                            <option value="comum">🥉 Comum (5-30 XP)</option>
                            <option value="rara">🥈 Rara (50-200 XP)</option>
                            <option value="epica">🥇 Épica (250-400 XP)</option>
                            <option value="lendaria">💎 Lendária (500+ XP)</option>
                        </select>
                        <div class="form-hint">Raridade determina a dificuldade e valor em XP</div>
                    </div>

                    <!-- XP -->
                    <div class="form-group">
                        <label for="trofeu-xp" class="form-label">
                            <i class="fas fa-star mr-2"></i>Pontos de Experiência (XP)
                        </label>
                        <input 
                            type="number" 
                            id="trofeu-xp" 
                            name="xp"
                            class="form-input" 
                            placeholder="Ex: 10, 50, 100..."
                            required
                            min="1"
                            max="1000"
                        >
                        <div class="form-hint">XP que o usuário ganhará ao conquistar este troféu</div>
                    </div>

                    <!-- Tipo de Condição -->
                    <div class="form-group">
                        <label for="trofeu-tipo-condicao" class="form-label">
                            <i class="fas fa-cogs mr-2"></i>Tipo de Condição
                        </label>
                        <select id="trofeu-tipo-condicao" name="tipoCondicao" class="form-select" required onchange="atualizarCamposCondicao()">
                            <option value="">Selecione o tipo</option>
                            <option value="evento">🎯 Evento (ação específica)</option>
                            <option value="perfil_completo">👤 Perfil Completo</option>
                            <option value="contador">📊 Contador (quantidade)</option>
                            <option value="temporal">⏱️ Temporal (tempo)</option>
                            <option value="manual">✋ Manual (admin concede)</option>
                        </select>
                        <div class="form-hint">Como o troféu será desbloqueado</div>
                    </div>

                    <!-- Campos dinâmicos baseados no tipo -->
                    <div id="campos-condicao-dinamicos"></div>

                    <!-- Mensagem de erro/sucesso -->
                    <div id="msg-criar-trofeu" class="mt-4"></div>
                </form>
            </div>

            <div class="modal-footer">
                <button type="button" class="secondary-btn" onclick="fecharModalCriarTrofeu()">
                    <i class="fas fa-times mr-2"></i>Cancelar
                </button>
                <button type="submit" form="form-criar-trofeu" class="lorde-btn">
                    <i class="fas fa-save mr-2"></i>Criar Troféu
                </button>
            </div>
        </div>
    `;

    // Adicionar ao body
    document.body.appendChild(modal);

    // Mostrar modal com animação
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    // Configurar preview do ícone
    configurarPreviewIcone();

    // Configurar fechamento com ESC
    configurarFechamentoModal();
};

// Função para fechar modal de criar troféu
window.fecharModalCriarTrofeu = function() {
    const modal = document.getElementById('modal-criar-trofeu');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// Configurar preview do ícone em tempo real
function configurarPreviewIcone() {
    const inputIcone = document.getElementById('trofeu-icone');
    const preview = document.getElementById('icone-preview');
    
    if (inputIcone && preview) {
        inputIcone.addEventListener('input', function() {
            const iconeClass = this.value.trim();
            if (iconeClass) {
                preview.innerHTML = `<i class="${iconeClass}"></i>`;
            } else {
                preview.innerHTML = `<i class="fas fa-question"></i>`;
            }
        });
    }
}

// Atualizar campos dinâmicos baseados no tipo de condição
window.atualizarCamposCondicao = function() {
    const tipoSelect = document.getElementById('trofeu-tipo-condicao');
    const container = document.getElementById('campos-condicao-dinamicos');
    
    if (!tipoSelect || !container) return;
    
    const tipo = tipoSelect.value;
    let camposHtml = '';
    
    switch (tipo) {
        case 'evento':
            camposHtml = `
                <div class="form-group">
                    <label for="evento-nome" class="form-label">
                        <i class="fas fa-bolt mr-2"></i>Nome do Evento
                    </label>
                    <input 
                        type="text" 
                        id="evento-nome" 
                        name="eventoNome"
                        class="form-input" 
                        placeholder="Ex: primeiro_login, campanha_inscrita..."
                        required
                    >
                    <div class="form-hint">Nome técnico do evento que será registrado no sistema</div>
                </div>
            `;
            break;
            
        case 'contador':
            camposHtml = `
                <div class="form-group">
                    <label for="contador-evento" class="form-label">
                        <i class="fas fa-list mr-2"></i>Evento a Contar
                    </label>
                    <input 
                        type="text" 
                        id="contador-evento" 
                        name="contadorEvento"
                        class="form-input" 
                        placeholder="Ex: mensagem_enviada, campanha_completada..."
                        required
                    >
                    <div class="form-hint">Tipo de evento que será contado</div>
                </div>
                <div class="form-group">
                    <label for="contador-meta" class="form-label">
                        <i class="fas fa-target mr-2"></i>Meta (Quantidade)
                    </label>
                    <input 
                        type="number" 
                        id="contador-meta" 
                        name="contadorMeta"
                        class="form-input" 
                        placeholder="Ex: 5, 10, 100..."
                        required
                        min="1"
                    >
                    <div class="form-hint">Quantas vezes o evento deve ocorrer</div>
                </div>
            `;
            break;
            
        case 'temporal':
            camposHtml = `
                <div class="form-group">
                    <label for="tempo-duracao" class="form-label">
                        <i class="fas fa-calendar mr-2"></i>Duração Necessária
                    </label>
                    <select id="tempo-duracao" name="tempoDuracao" class="form-select" required>
                        <option value="">Selecione o tempo</option>
                        <option value="1_dia">1 Dia</option>
                        <option value="1_semana">1 Semana</option>
                        <option value="1_mes">1 Mês</option>
                        <option value="3_meses">3 Meses</option>
                        <option value="6_meses">6 Meses</option>
                        <option value="1_ano">1 Ano</option>
                    </select>
                    <div class="form-hint">Tempo que o usuário deve estar ativo na plataforma</div>
                </div>
            `;
            break;
            
        case 'manual':
            camposHtml = `
                <div class="form-group">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                            <strong class="text-blue-700 dark:text-blue-300">Troféu Manual</strong>
                        </div>
                        <p class="text-sm text-blue-600 dark:text-blue-400">
                            Este troféu será concedido manualmente pelos administradores. 
                            Aparecerá na lista de troféus dos usuários, mas só pode ser 
                            desbloqueado através do painel de administração.
                        </p>
                    </div>
                </div>
            `;
            break;
            
        case 'perfil_completo':
            camposHtml = `
                <div class="form-group">
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-check-circle text-green-500 mr-2"></i>
                            <strong class="text-green-700 dark:text-green-300">Perfil Completo</strong>
                        </div>
                        <p class="text-sm text-green-600 dark:text-green-400">
                            Este troféu será desbloqueado automaticamente quando o usuário 
                            completar todas as informações obrigatórias do perfil 
                            (nome, foto, informações básicas).
                        </p>
                    </div>
                </div>
            `;
            break;
    }
    
    container.innerHTML = camposHtml;
};

// Configurar fechamento do modal
function configurarFechamentoModal() {
    const modal = document.getElementById('modal-criar-trofeu');
    
    if (modal) {
        // Fechar ao clicar fora
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                fecharModalCriarTrofeu();
            }
        });
        
        // Fechar com ESC
        const handleEscape = function(e) {
            if (e.key === 'Escape') {
                fecharModalCriarTrofeu();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
}

// Função para salvar novo troféu
window.salvarNovoTrofeu = async function(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const msgContainer = document.getElementById('msg-criar-trofeu');
    
    // Verificar se os elementos existem antes de manipular
    if (!submitBtn) {
        console.error('❌ Botão de submit não encontrado!');
        console.log('🔍 Tentando buscar por seletor alternativo...');
        
        // Tentar buscar pelo atributo form
        const altBtn = document.querySelector('button[form="form-criar-trofeu"]');
        if (altBtn) {
            console.log('✅ Botão encontrado com seletor alternativo!');
            altBtn.disabled = true;
            altBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Criando...';
        } else {
            console.error('❌ Nenhum botão de submit encontrado!');
            return;
        }
    } else {
        // Desabilitar botão e mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Criando...';
    }
    
    if (!msgContainer) {
        console.error('❌ Container de mensagem não encontrado!');
        return;
    }
    
    try {
        // Obter dados do formulário
        const formData = new FormData(event.target);
        const dados = Object.fromEntries(formData.entries());
        
        // Validar dados básicos
        if (!dados.nome || !dados.descricao || !dados.icone || !dados.categoria || !dados.raridade || !dados.xp || !dados.tipoCondicao) {
            throw new Error('Todos os campos obrigatórios devem ser preenchidos!');
        }
        
        // Construir objeto de condições baseado no tipo
        let condicoes = { tipo: dados.tipoCondicao };
        
        switch (dados.tipoCondicao) {
            case 'evento':
                if (!dados.eventoNome) throw new Error('Nome do evento é obrigatório!');
                condicoes.evento = dados.eventoNome;
                break;
                
            case 'contador':
                if (!dados.contadorEvento || !dados.contadorMeta) {
                    throw new Error('Evento e meta são obrigatórios para contador!');
                }
                condicoes.evento = dados.contadorEvento;
                condicoes.meta = parseInt(dados.contadorMeta);
                break;
                
            case 'temporal':
                if (!dados.tempoDuracao) throw new Error('Duração é obrigatória!');
                condicoes.duracao = dados.tempoDuracao;
                break;
        }
        
        // Gerar ID único para o troféu
        const troféuId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Estrutura do novo troféu
        const novoTrofeu = {
            id: troféuId,
            nome: dados.nome.trim(),
            descricao: dados.descricao.trim(),
            icone: dados.icone.trim(),
            categoria: dados.categoria,
            raridade: dados.raridade,
            xp: parseInt(dados.xp),
            condicoes: condicoes,
            criadoEm: new Date(),
            criadoPor: currentUser.email,
            criadorNome: currentUser.displayName || 'Admin',
            ativo: true,
            personalizado: true
        };
        
        // Salvar no Firebase
        await firebaseModules.addDoc(firebaseModules.collection(db, 'trofeus_personalizados'), novoTrofeu);
        
        // Adicionar ao array local de conquistas (para uso imediato)
        CONQUISTAS_DISPONIVEIS.push(novoTrofeu);
        
        // Mostrar sucesso
        msgContainer.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle mr-2"></i>
                Troféu "${dados.nome}" criado com sucesso!
            </div>
        `;
        
        // Aguardar um pouco e fechar modal
        setTimeout(() => {
            fecharModalCriarTrofeu();
            
            // Recarregar troféus se estiver na aba
            if (document.getElementById('tab-trofeus') && !document.getElementById('tab-trofeus').classList.contains('hidden')) {
                carregarTrofeus();
            }
            
            showNotification(`🏆 Troféu "${dados.nome}" criado com sucesso!`, 'success');
        }, 1500);
        
    } catch (error) {
        console.error('Erro ao criar troféu:', error);
        
        // Mostrar erro
        msgContainer.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                ${error.message || 'Erro ao criar troféu. Tente novamente.'}
            </div>
        `;
        
    } finally {
        // Reabilitar botão
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Criar Troféu';
    }
};

// Função de debug para verificar status do usuário
window.debugUsuario = function() {
    // Debug de usuário - informações sensíveis removidas por segurança
    
    // Verificar se o card está no DOM
    const cardTrofeu = document.querySelector('.criar-trofeu-card');
    console.log('🎨 Card no DOM:', !!cardTrofeu);
    
    if (cardTrofeu) {
        console.log('✅ Card encontrado! Testando click...');
        cardTrofeu.click();
    } else {
        console.log('❌ Card não encontrado no DOM');
    }
    
    return { userAuthenticated: !!currentUser, isAdmin, cardExists: !!cardTrofeu };
};

// Adicionar no console global para facilitar debug
console.log('🛠️ Para debug, use: debugUsuario()');

// ❌ FUNÇÃO REMOVIDA POR SEGURANÇA: forcarVerificacaoAdmin  
// Esta função foi removida para evitar manipulação indevida de permissões via console

// === SISTEMA DE EDIÇÃO/EXCLUSÃO DE TROFÉUS ===

// Função para abrir modal de edição de troféu
window.abrirModalEditarTrofeu = async function(trofeuId) {
    console.log('🔧 Abrindo modal de edição para troféu:', trofeuId);
    
    // Verificar se é admin
    if (!isAdmin) {
        showNotification('Acesso negado: apenas administradores podem editar troféus.', 'error');
        return;
    }
    
    // Buscar o troféu nos dados
    const trofeu = CONQUISTAS_DISPONIVEIS.find(t => t.id === trofeuId);
    if (!trofeu) {
        showNotification('Troféu não encontrado!', 'error');
        return;
    }
    
    // Permitir edição de todos os troféus para administradores
    console.log('🏆 Troféu encontrado:', trofeu.nome, '- Tipo:', trofeu.personalizado ? 'Personalizado' : 'Padrão');
    
    // Criar modal de edição (similar ao de criação, mas com dados preenchidos)
    const modal = document.createElement('div');
    modal.id = 'modal-editar-trofeu';
    modal.className = 'modal-overlay modal-criar-trofeu';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">
                    <i class="fas fa-edit mr-2"></i>Editar Troféu
                </h3>
                <button type="button" class="modal-close" onclick="fecharModalEditarTrofeu()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <form id="form-editar-trofeu" onsubmit="salvarEdicaoTrofeu(event, '${trofeuId}')">
                    <!-- Nome do troféu -->
                    <div class="form-group">
                        <label for="edit-trofeu-nome" class="form-label">
                            <i class="fas fa-trophy mr-2"></i>Nome do Troféu
                        </label>
                        <input 
                            type="text" 
                            id="edit-trofeu-nome" 
                            name="nome"
                            class="form-input" 
                            value="${trofeu.nome}"
                            maxlength="50"
                            required
                        >
                        <div class="form-hint">Máximo 50 caracteres</div>
                    </div>

                    <!-- Descrição -->
                    <div class="form-group">
                        <label for="edit-trofeu-descricao" class="form-label">
                            <i class="fas fa-align-left mr-2"></i>Descrição
                        </label>
                        <textarea 
                            id="edit-trofeu-descricao" 
                            name="descricao"
                            class="form-input form-textarea" 
                            rows="3"
                            maxlength="150"
                            required
                        >${trofeu.descricao}</textarea>
                        <div class="form-hint">Máximo 150 caracteres</div>
                    </div>

                    <!-- Ícone -->
                    <div class="form-group">
                        <label for="edit-trofeu-icone" class="form-label">
                            <i class="fas fa-icons mr-2"></i>Ícone (FontAwesome)
                        </label>
                        <div class="icone-input-group">
                            <input 
                                type="text" 
                                id="edit-trofeu-icone" 
                                name="icone"
                                class="form-input" 
                                value="${trofeu.icone}"
                                placeholder="Ex: fas fa-trophy"
                                required
                            >
                            <div class="icone-preview" id="edit-icone-preview">
                                <i class="${trofeu.icone}"></i>
                            </div>
                        </div>
                        <div class="form-hint">Use classes FontAwesome. Ver icons disponíveis em <a href="https://fontawesome.com/icons" target="_blank">FontAwesome</a></div>
                    </div>

                    <!-- Categoria -->
                    <div class="form-group">
                        <label for="edit-trofeu-categoria" class="form-label">
                            <i class="fas fa-tags mr-2"></i>Categoria
                        </label>
                        <select id="edit-trofeu-categoria" name="categoria" class="form-select" required>
                            <option value="">Selecione a categoria</option>
                            <option value="especial" ${trofeu.categoria === 'especial' ? 'selected' : ''}>🎯 Especial</option>
                            <option value="social" ${trofeu.categoria === 'social' ? 'selected' : ''}>👥 Social</option>
                            <option value="exploracao" ${trofeu.categoria === 'exploracao' ? 'selected' : ''}>🧭 Exploração</option>
                            <option value="campanha" ${trofeu.categoria === 'campanha' ? 'selected' : ''}>⚔️ Campanha</option>
                            <option value="tempo" ${trofeu.categoria === 'tempo' ? 'selected' : ''}>⏱️ Tempo</option>
                            <option value="conquista" ${trofeu.categoria === 'conquista' ? 'selected' : ''}>🏆 Conquista</option>
                        </select>
                        <div class="form-hint">Categoria para organização dos troféus</div>
                    </div>

                    <!-- Raridade -->
                    <div class="form-group">
                        <label for="edit-trofeu-raridade" class="form-label">
                            <i class="fas fa-gem mr-2"></i>Raridade
                        </label>
                        <select id="edit-trofeu-raridade" name="raridade" class="form-select" required>
                            <option value="">Selecione a raridade</option>
                            <option value="comum" ${trofeu.raridade === 'comum' ? 'selected' : ''}>⚪ Comum</option>
                            <option value="rara" ${trofeu.raridade === 'rara' ? 'selected' : ''}>🔵 Rara</option>
                            <option value="epica" ${trofeu.raridade === 'epica' ? 'selected' : ''}>🟣 Épica</option>
                            <option value="lendaria" ${trofeu.raridade === 'lendaria' ? 'selected' : ''}>🟡 Lendária</option>
                        </select>
                        <div class="form-hint">Determina a dificuldade e valor do troféu</div>
                    </div>

                    <!-- Pontos de Experiência -->
                    <div class="form-group">
                        <label for="edit-trofeu-xp" class="form-label">
                            <i class="fas fa-star mr-2"></i>Pontos de Experiência (XP)
                        </label>
                        <input 
                            type="number" 
                            id="edit-trofeu-xp" 
                            name="xp"
                            class="form-input" 
                            value="${trofeu.xp}"
                            min="1"
                            max="1000"
                            required
                        >
                        <div class="form-hint">XP que o usuário ganha ao desbloquear (1-1000)</div>
                    </div>

                    <!-- Tipo de Condição -->
                    <div class="form-group">
                        <label for="edit-trofeu-tipo-condicao" class="form-label">
                            <i class="fas fa-cogs mr-2"></i>Tipo de Condição
                        </label>
                        <select id="edit-trofeu-tipo-condicao" name="tipoCondicao" class="form-select" required onchange="atualizarCamposCondicaoEdicao()">
                            <option value="">Selecione o tipo</option>
                            <option value="evento" ${trofeu.condicoes.tipo === 'evento' ? 'selected' : ''}>🎯 Evento (ação específica)</option>
                            <option value="perfil_completo" ${trofeu.condicoes.tipo === 'perfil_completo' ? 'selected' : ''}>👤 Perfil Completo</option>
                            <option value="contador" ${trofeu.condicoes.tipo === 'contador' ? 'selected' : ''}>📊 Contador (quantidade)</option>
                            <option value="temporal" ${trofeu.condicoes.tipo === 'temporal' ? 'selected' : ''}>⏱️ Temporal (tempo)</option>
                            <option value="manual" ${trofeu.condicoes.tipo === 'manual' ? 'selected' : ''}>✋ Manual (admin concede)</option>
                        </select>
                        <div class="form-hint">Como o troféu será desbloqueado</div>
                    </div>

                    <!-- Campos dinâmicos baseados no tipo -->
                    <div id="edit-campos-condicao-dinamicos"></div>

                    <!-- Mensagem de erro/sucesso -->
                    <div id="msg-editar-trofeu" class="mt-4"></div>
                </form>
            </div>

            <div class="modal-footer">
                <button type="button" class="secondary-btn" onclick="fecharModalEditarTrofeu()">
                    <i class="fas fa-times mr-2"></i>Cancelar
                </button>
                <button type="submit" form="form-editar-trofeu" class="lorde-btn">
                    <i class="fas fa-save mr-2"></i>Salvar Alterações
                </button>
            </div>
        </div>
    `;

    // Adicionar ao body
    document.body.appendChild(modal);

    // Mostrar modal com animação
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    // Configurar preview do ícone para edição
    configurarPreviewIconeEdicao();
    
    // Configurar campos dinâmicos baseados no tipo atual
    atualizarCamposCondicaoEdicao();

    // Configurar fechamento com ESC
    configurarFechamentoModalEdicao();
};

// Função para fechar modal de edição
window.fecharModalEditarTrofeu = function() {
    const modal = document.getElementById('modal-editar-trofeu');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// Configurar preview do ícone para edição
function configurarPreviewIconeEdicao() {
    const inputIcone = document.getElementById('edit-trofeu-icone');
    const preview = document.getElementById('edit-icone-preview');
    
    if (inputIcone && preview) {
        inputIcone.addEventListener('input', function() {
            const iconeClass = this.value.trim();
            if (iconeClass) {
                preview.innerHTML = `<i class="${iconeClass}"></i>`;
            } else {
                preview.innerHTML = `<i class="fas fa-question"></i>`;
            }
        });
    }
}

// Atualizar campos dinâmicos para edição
window.atualizarCamposCondicaoEdicao = function() {
    const tipoSelect = document.getElementById('edit-trofeu-tipo-condicao');
    const container = document.getElementById('edit-campos-condicao-dinamicos');
    
    if (!tipoSelect || !container) return;
    
    const tipo = tipoSelect.value;
    let camposHtml = '';
    
    // Obter troféu atual para preencher campos
    const trofeuId = document.querySelector('#form-editar-trofeu').getAttribute('onsubmit').match(/'([^']+)'/)[1];
    const trofeu = CONQUISTAS_DISPONIVEIS.find(t => t.id === trofeuId);
    
    switch (tipo) {
        case 'evento':
            camposHtml = `
                <div class="form-group">
                    <label for="edit-evento-nome" class="form-label">
                        <i class="fas fa-bolt mr-2"></i>Nome do Evento
                    </label>
                    <input 
                        type="text" 
                        id="edit-evento-nome" 
                        name="eventoNome"
                        class="form-input" 
                        value="${trofeu?.condicoes?.evento || ''}"
                        placeholder="Ex: primeiro_login, campanha_inscrita..."
                        required
                    >
                    <div class="form-hint">Nome técnico do evento que será registrado no sistema</div>
                </div>
            `;
            break;
            
        case 'contador':
            camposHtml = `
                <div class="form-group">
                    <label for="edit-contador-evento" class="form-label">
                        <i class="fas fa-list mr-2"></i>Evento a Contar
                    </label>
                    <input 
                        type="text" 
                        id="edit-contador-evento" 
                        name="contadorEvento"
                        class="form-input" 
                        value="${trofeu?.condicoes?.evento || ''}"
                        placeholder="Ex: mensagem_enviada, campanha_completada..."
                        required
                    >
                    <div class="form-hint">Tipo de evento que será contado</div>
                </div>
                <div class="form-group">
                    <label for="edit-contador-meta" class="form-label">
                        <i class="fas fa-target mr-2"></i>Meta (Quantidade)
                    </label>
                    <input 
                        type="number" 
                        id="edit-contador-meta" 
                        name="contadorMeta"
                        class="form-input" 
                        value="${trofeu?.condicoes?.meta || ''}"
                        placeholder="Ex: 5, 10, 100..."
                        required
                        min="1"
                    >
                    <div class="form-hint">Quantas vezes o evento deve ocorrer</div>
                </div>
            `;
            break;
            
        case 'temporal':
            camposHtml = `
                <div class="form-group">
                    <label for="edit-tempo-duracao" class="form-label">
                        <i class="fas fa-calendar mr-2"></i>Duração Necessária
                    </label>
                    <select id="edit-tempo-duracao" name="tempoDuracao" class="form-select" required>
                        <option value="">Selecione o tempo</option>
                        <option value="1_dia" ${trofeu?.condicoes?.duracao === '1_dia' ? 'selected' : ''}>1 Dia</option>
                        <option value="1_semana" ${trofeu?.condicoes?.duracao === '1_semana' ? 'selected' : ''}>1 Semana</option>
                        <option value="1_mes" ${trofeu?.condicoes?.duracao === '1_mes' ? 'selected' : ''}>1 Mês</option>
                        <option value="3_meses" ${trofeu?.condicoes?.duracao === '3_meses' ? 'selected' : ''}>3 Meses</option>
                        <option value="6_meses" ${trofeu?.condicoes?.duracao === '6_meses' ? 'selected' : ''}>6 Meses</option>
                        <option value="1_ano" ${trofeu?.condicoes?.duracao === '1_ano' ? 'selected' : ''}>1 Ano</option>
                    </select>
                    <div class="form-hint">Tempo que o usuário deve estar ativo na plataforma</div>
                </div>
            `;
            break;
            
        case 'manual':
            camposHtml = `
                <div class="form-group">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                            <strong class="text-blue-700 dark:text-blue-300">Troféu Manual</strong>
                        </div>
                        <p class="text-sm text-blue-600 dark:text-blue-400">
                            Este troféu será concedido manualmente pelos administradores. 
                            Aparecerá na lista de troféus dos usuários, mas só pode ser 
                            desbloqueado através do painel de administração.
                        </p>
                    </div>
                </div>
            `;
            break;
            
        case 'perfil_completo':
            camposHtml = `
                <div class="form-group">
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-check-circle text-green-500 mr-2"></i>
                            <strong class="text-green-700 dark:text-green-300">Perfil Completo</strong>
                        </div>
                        <p class="text-sm text-green-600 dark:text-green-400">
                            Este troféu será desbloqueado automaticamente quando o usuário 
                            completar todas as informações obrigatórias do perfil 
                            (nome, foto, informações básicas).
                        </p>
                    </div>
                </div>
            `;
            break;
    }
    
    container.innerHTML = camposHtml;
};

// Configurar fechamento do modal de edição
function configurarFechamentoModalEdicao() {
    const modal = document.getElementById('modal-editar-trofeu');
    
    if (modal) {
        // Fechar ao clicar fora
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                fecharModalEditarTrofeu();
            }
        });
        
        // Fechar com ESC
        const handleEscape = function(e) {
            if (e.key === 'Escape') {
                fecharModalEditarTrofeu();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
}

// Função para salvar edição do troféu
window.salvarEdicaoTrofeu = async function(event, trofeuId) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]') || document.querySelector('button[form="form-editar-trofeu"]');
    const msgContainer = document.getElementById('msg-editar-trofeu');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
    }
    
    try {
        // Obter dados do formulário
        const formData = new FormData(event.target);
        const dados = Object.fromEntries(formData.entries());
        
        // Validar dados básicos
        if (!dados.nome || !dados.descricao || !dados.icone || !dados.categoria || !dados.raridade || !dados.xp || !dados.tipoCondicao) {
            throw new Error('Todos os campos obrigatórios devem ser preenchidos!');
        }
        
        // Construir objeto de condições baseado no tipo
        let condicoes = { tipo: dados.tipoCondicao };
        
        switch (dados.tipoCondicao) {
            case 'evento':
                if (!dados.eventoNome) throw new Error('Nome do evento é obrigatório!');
                condicoes.evento = dados.eventoNome;
                break;
                
            case 'contador':
                if (!dados.contadorEvento || !dados.contadorMeta) {
                    throw new Error('Evento e meta são obrigatórios para contador!');
                }
                condicoes.evento = dados.contadorEvento;
                condicoes.meta = parseInt(dados.contadorMeta);
                break;
                
            case 'temporal':
                if (!dados.tempoDuracao) throw new Error('Duração é obrigatória!');
                condicoes.duracao = dados.tempoDuracao;
                break;
        }
        
        // Buscar o troféu original para determinar se é personalizado ou padrão
        const trofeuOriginal = CONQUISTAS_DISPONIVEIS.find(t => t.id === trofeuId);
        
        const dadosAtualizados = {
            nome: dados.nome.trim(),
            descricao: dados.descricao.trim(),
            icone: dados.icone.trim(),
            categoria: dados.categoria,
            raridade: dados.raridade,
            xp: parseInt(dados.xp),
            condicoes: condicoes,
            atualizadoEm: new Date(),
            atualizadoPor: currentUser.email
        };
        
        if (trofeuOriginal?.personalizado) {
            // Troféu personalizado - atualizar na coleção trofeus_personalizados
            const trofeuQuery = firebaseModules.query(
                firebaseModules.collection(db, 'trofeus_personalizados'),
                firebaseModules.where('id', '==', trofeuId)
            );
            const querySnapshot = await firebaseModules.getDocs(trofeuQuery);
            
            if (querySnapshot.empty) {
                throw new Error('Troféu personalizado não encontrado no banco de dados!');
            }
            
            const trofeuDoc = querySnapshot.docs[0];
            await firebaseModules.updateDoc(trofeuDoc.ref, dadosAtualizados);
            
        } else {
            // Troféu padrão - salvar modificação na coleção trofeus_modificados
            const trofeuModificado = {
                ...dadosAtualizados,
                id: trofeuId,
                trofeuOriginalId: trofeuId,
                tipoModificacao: 'edicao',
                modificadoEm: new Date(),
                modificadoPor: currentUser.email
            };
            
            // Verificar se já existe uma modificação para este troféu
            const modificacaoQuery = firebaseModules.query(
                firebaseModules.collection(db, 'trofeus_modificados'),
                firebaseModules.where('trofeuOriginalId', '==', trofeuId)
            );
            const modificacaoSnapshot = await firebaseModules.getDocs(modificacaoQuery);
            
            if (modificacaoSnapshot.empty) {
                // Criar nova modificação
                await firebaseModules.addDoc(firebaseModules.collection(db, 'trofeus_modificados'), trofeuModificado);
            } else {
                // Atualizar modificação existente
                const modificacaoDoc = modificacaoSnapshot.docs[0];
                await firebaseModules.updateDoc(modificacaoDoc.ref, trofeuModificado);
            }
        }
        
        // Atualizar no array local
        const trofeuIndex = CONQUISTAS_DISPONIVEIS.findIndex(t => t.id === trofeuId);
        if (trofeuIndex !== -1) {
            CONQUISTAS_DISPONIVEIS[trofeuIndex] = {
                ...CONQUISTAS_DISPONIVEIS[trofeuIndex],
                ...dadosAtualizados
            };
        }
        
        // Mostrar sucesso
        msgContainer.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle mr-2"></i>
                Troféu "${dados.nome}" atualizado com sucesso!
            </div>
        `;
        
        // Aguardar um pouco e fechar modal
        setTimeout(() => {
            fecharModalEditarTrofeu();
            
            // Recarregar troféus se estiver na aba
            if (document.getElementById('tab-trofeus') && !document.getElementById('tab-trofeus').classList.contains('hidden')) {
                carregarTrofeus();
            }
            
            showNotification(`🏆 Troféu "${dados.nome}" atualizado com sucesso!`, 'success');
        }, 1500);
        
    } catch (error) {
        console.error('Erro ao atualizar troféu:', error);
        
        // Mostrar erro
        msgContainer.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                ${error.message || 'Erro ao atualizar troféu. Tente novamente.'}
            </div>
        `;
        
    } finally {
        // Reabilitar botão
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar Alterações';
        }
    }
};

// Função para confirmar exclusão de troféu
window.confirmarExclusaoTrofeu = function(trofeuId, nomeTrofeu) {
    console.log('🗑️ Confirmando exclusão do troféu:', trofeuId);
    
    // Verificar se é admin
    if (!isAdmin) {
        showNotification('Acesso negado: apenas administradores podem excluir troféus.', 'error');
        return;
    }
    
    // Criar modal de confirmação
    const modal = document.createElement('div');
    modal.id = 'modal-confirmar-exclusao';
    modal.className = 'modal-overlay modal-confirmacao-exclusao';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="modal-close" onclick="fecharModalConfirmacaoExclusao()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="danger-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4 class="danger-title">Confirmar Exclusão</h4>
                <p class="danger-text">
                    Tem certeza que deseja excluir o troféu <strong>"${nomeTrofeu}"</strong>?
                    <br><br>
                    <strong>Esta ação não pode ser desfeita!</strong>
                </p>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn-cancelar-exclusao" onclick="fecharModalConfirmacaoExclusao()">
                    <i class="fas fa-times mr-2"></i>Cancelar
                </button>
                <button type="button" class="btn-confirmar-exclusao" onclick="excluirTrofeu('${trofeuId}')">
                    <i class="fas fa-trash-alt mr-2"></i>Excluir
                </button>
            </div>
        </div>
    `;

    // Adicionar ao body
    document.body.appendChild(modal);

    // Mostrar modal com animação
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Configurar fechamento com ESC
    const handleEscape = function(e) {
        if (e.key === 'Escape') {
            fecharModalConfirmacaoExclusao();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
};

// Função para fechar modal de confirmação
window.fecharModalConfirmacaoExclusao = function() {
    const modal = document.getElementById('modal-confirmar-exclusao');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// Função para excluir troféu
window.excluirTrofeu = async function(trofeuId) {
    console.log('🗑️ Excluindo troféu:', trofeuId);
    
    try {
        // Buscar o troféu original para determinar o tipo
        const trofeuOriginal = CONQUISTAS_DISPONIVEIS.find(t => t.id === trofeuId);
        
        if (!trofeuOriginal) {
            throw new Error('Troféu não encontrado!');
        }
        
        const trofeuNome = trofeuOriginal.nome;
        
        if (trofeuOriginal.personalizado) {
            // Troféu personalizado - excluir da coleção trofeus_personalizados
            const trofeuQuery = firebaseModules.query(
                firebaseModules.collection(db, 'trofeus_personalizados'),
                firebaseModules.where('id', '==', trofeuId)
            );
            const querySnapshot = await firebaseModules.getDocs(trofeuQuery);
            
            if (!querySnapshot.empty) {
                const trofeuDoc = querySnapshot.docs[0];
                await firebaseModules.deleteDoc(trofeuDoc.ref);
            }
            
            // Remover do array local
            const trofeuIndex = CONQUISTAS_DISPONIVEIS.findIndex(t => t.id === trofeuId);
            if (trofeuIndex !== -1) {
                CONQUISTAS_DISPONIVEIS.splice(trofeuIndex, 1);
            }
            
        } else {
            // Troféu padrão - marcar como "excluído" na coleção trofeus_modificados
            const trofeuExcluido = {
                id: trofeuId,
                trofeuOriginalId: trofeuId,
                tipoModificacao: 'exclusao',
                excluido: true,
                modificadoEm: new Date(),
                modificadoPor: currentUser.email,
                motivoExclusao: 'Excluído pelo administrador'
            };
            
            // Verificar se já existe uma modificação para este troféu
            const modificacaoQuery = firebaseModules.query(
                firebaseModules.collection(db, 'trofeus_modificados'),
                firebaseModules.where('trofeuOriginalId', '==', trofeuId)
            );
            const modificacaoSnapshot = await firebaseModules.getDocs(modificacaoQuery);
            
            if (modificacaoSnapshot.empty) {
                // Criar nova modificação de exclusão
                await firebaseModules.addDoc(firebaseModules.collection(db, 'trofeus_modificados'), trofeuExcluido);
            } else {
                // Atualizar modificação existente para marcar como excluído
                const modificacaoDoc = modificacaoSnapshot.docs[0];
                await firebaseModules.updateDoc(modificacaoDoc.ref, trofeuExcluido);
            }
            
            // Remover do array local (interface)
            const trofeuIndex = CONQUISTAS_DISPONIVEIS.findIndex(t => t.id === trofeuId);
            if (trofeuIndex !== -1) {
                CONQUISTAS_DISPONIVEIS.splice(trofeuIndex, 1);
            }
        }
        
        // Fechar modal de confirmação
        fecharModalConfirmacaoExclusao();
        
        // Recarregar troféus se estiver na aba
        if (document.getElementById('tab-trofeus') && !document.getElementById('tab-trofeus').classList.contains('hidden')) {
            carregarTrofeus();
        }
        
        showNotification(`🗑️ Troféu "${trofeuNome}" excluído com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao excluir troféu:', error);
        showNotification('Erro ao excluir troféu: ' + error.message, 'error');
    }
};

// ==================== SISTEMA DE LIMPEZA DE DUPLICADOS ==================== //

/**
 * Função para detectar e limpar usuários duplicados existentes
 */
async function detectarELimparDuplicados() {
    if (!isAdmin) {
        showNotification('Apenas administradores podem executar esta função!', 'error');
        return;
    }
    
    const btnLimpar = document.getElementById('btnLimparDuplicados');
    const resultDiv = document.getElementById('resultadoDuplicados');
    
    if (btnLimpar) {
        btnLimpar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analisando usuários...';
        btnLimpar.disabled = true;
    }
    
    try {
        console.log('🔍 Iniciando detecção de usuários duplicados...');
        
        // Buscar todos os usuários
        const q = firebaseModules.query(firebaseModules.collection(db, 'users'));
        const snapshot = await firebaseModules.getDocs(q);
        
        const usuarios = [];
        snapshot.forEach(docSnap => {
            usuarios.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        console.log(`📊 Total de usuários encontrados: ${usuarios.length}`);
        
        // Agrupar por email
        const usuariosPorEmail = {};
        usuarios.forEach(usuario => {
            const email = usuario.email ? usuario.email.toLowerCase().trim() : null;
            if (!email) return;
            
            if (!usuariosPorEmail[email]) {
                usuariosPorEmail[email] = [];
            }
            usuariosPorEmail[email].push(usuario);
        });
        
        // Encontrar emails com duplicatas
        const emailsComDuplicatas = Object.keys(usuariosPorEmail).filter(
            email => usuariosPorEmail[email].length > 1
        );
        
        console.log(`🔄 Emails com duplicatas encontrados: ${emailsComDuplicatas.length}`);
        
        if (emailsComDuplicatas.length === 0) {
            const mensagem = `
                <div class="text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <i class="fas fa-check-circle mr-2"></i>
                    <strong>Nenhuma duplicata encontrada!</strong><br>
                    Todos os usuários têm emails únicos.
                </div>
            `;
            if (resultDiv) resultDiv.innerHTML = mensagem;
            showNotification('Nenhuma duplicata encontrada!', 'success');
            return;
        }
        
        // Processar duplicatas
        let totalDuplicatasResolvidas = 0;
        let totalContasDeletadas = 0;
        let erros = [];
        
        if (btnLimpar) {
            btnLimpar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Resolvendo duplicatas...';
        }
        
        for (const email of emailsComDuplicatas) {
            try {
                const contasDuplicadas = usuariosPorEmail[email];
                console.log(`🔧 Processando ${contasDuplicadas.length} contas para ${email}`);
                
                // Usar a função de mesclagem do auth.js se disponível
                if (window.authUtils && window.authUtils.mesclarContasUsuario) {
                    // Simular uma conta "auth" para usar a função existente
                    const contaAuth = {
                        uid: contasDuplicadas[0].uid || `merged_${Date.now()}`,
                        email: email,
                        displayName: contasDuplicadas.find(c => c.displayName)?.displayName || '',
                        photoURL: contasDuplicadas.find(c => c.photoURL)?.photoURL || ''
                    };
                    
                    const resultado = await window.authUtils.mesclarContasUsuario(contaAuth, contasDuplicadas);
                    totalDuplicatasResolvidas++;
                    totalContasDeletadas += resultado.contasDeletadas;
                    
                    // Sincronizar plano com campanhas após mesclagem
                    const contaPrincipalData = await firebaseModules.getDoc(firebaseModules.doc(db, 'users', resultado.contaPrincipal));
                    if (contaPrincipalData.exists()) {
                        const planoFinal = contaPrincipalData.data().plano || 'gratis';
                        await sincronizarPlanoComCampanhas(email, planoFinal);
                    }
                    
                } else {
                    // Implementação própria de mesclagem (fallback) - CORRIGIDA
                    console.log('⚠️ Usando implementação fallback de mesclagem');
                    
                    // Escolher conta principal priorizando: 1) Melhor plano 2) Mais dados
                    const contaPrincipal = contasDuplicadas.reduce((melhor, atual) => {
                        // Priorizar conta com plano pago
                        const planoMelhor = melhor.plano || 'gratis';
                        const planoAtual = atual.plano || 'gratis';
                        
                        // Se uma tem plano pago e outra não, escolher a com plano pago
                        if (planoAtual !== 'gratis' && planoMelhor === 'gratis') {
                            return atual;
                        } else if (planoMelhor !== 'gratis' && planoAtual === 'gratis') {
                            return melhor;
                        }
                        
                        // Se ambas têm plano pago ou ambas gratis, escolher por completude
                        const scoreMelhor = Object.keys(melhor).length;
                        const scoreAtual = Object.keys(atual).length;
                        return scoreAtual > scoreMelhor ? atual : melhor;
                    });
                    
                    const contasParaDeletar = contasDuplicadas.filter(c => c.id !== contaPrincipal.id);
                    
                    console.log(`👑 Conta principal escolhida: ${contaPrincipal.id} (plano: ${contaPrincipal.plano || 'gratis'})`);
                    
                    // Mesclar dados na conta principal - PRESERVANDO MELHOR PLANO
                    const dadosMesclados = { ...contaPrincipal };
                    
                    for (const conta of contasParaDeletar) {
                        // Mesclar campos básicos
                        if (!dadosMesclados.displayName && conta.displayName) dadosMesclados.displayName = conta.displayName;
                        if (!dadosMesclados.photoURL && conta.photoURL) dadosMesclados.photoURL = conta.photoURL;
                        if (!dadosMesclados.discord && conta.discord) dadosMesclados.discord = conta.discord;
                        if (!dadosMesclados.phone && conta.phone) dadosMesclados.phone = conta.phone;
                        if (!dadosMesclados.age && conta.age) dadosMesclados.age = conta.age;
                        
                        // LÓGICA MELHORADA DE PLANOS - preservar o melhor plano
                        if (conta.plano && conta.plano !== 'gratis') {
                            const planoAtual = dadosMesclados.plano || 'gratis';
                            if (planoAtual === 'gratis') {
                                // Se a conta principal não tem plano pago, usar o da conta sendo mesclada
                                dadosMesclados.plano = conta.plano;
                                console.log(`📈 Plano atualizado de '${planoAtual}' para '${conta.plano}'`);
                            } else {
                                // Se ambas têm planos pagos, manter o de maior nível
                                const nivelAtual = PLANOS_SISTEMA[planoAtual]?.nivel || 0;
                                const nivelConta = PLANOS_SISTEMA[conta.plano]?.nivel || 0;
                                if (nivelConta > nivelAtual) {
                                    dadosMesclados.plano = conta.plano;
                                    console.log(`📈 Plano upgradado de '${planoAtual}' para '${conta.plano}'`);
                                }
                            }
                        }
                        
                        // Mesclar conquistas
                        if (conta.conquistas) {
                            dadosMesclados.conquistas = { ...dadosMesclados.conquistas, ...conta.conquistas };
                        }
                        
                        // Mesclar eventos
                        if (conta.eventos) {
                            dadosMesclados.eventos = { ...dadosMesclados.eventos, ...conta.eventos };
                        }
                        
                        // Mesclar endereço
                        if (conta.address && Object.keys(conta.address).length > 0) {
                            dadosMesclados.address = { ...dadosMesclados.address, ...conta.address };
                        }
                    }
                    
                    // Metadados de mesclagem
                    dadosMesclados.mesclado = true;
                    dadosMesclados.mescladoEm = new Date();
                    dadosMesclados.contasMescladas = contasParaDeletar.length;
                    dadosMesclados.planoFinalAposMesclagem = dadosMesclados.plano;
                    
                    console.log(`💾 Salvando dados mesclados:`, {
                        contaPrincipal: contaPrincipal.id,
                        planoFinal: dadosMesclados.plano,
                        contasRemovidas: contasParaDeletar.length
                    });
                    
                    // Atualizar conta principal
                    await firebaseModules.setDoc(firebaseModules.doc(db, 'users', contaPrincipal.id), dadosMesclados, { merge: true });
                    
                    // Deletar contas duplicadas
                    for (const conta of contasParaDeletar) {
                        await firebaseModules.deleteDoc(firebaseModules.doc(db, 'users', conta.id));
                        console.log(`🗑️ Conta deletada: ${conta.id}`);
                    }
                    
                    // Sincronizar plano com campanhas
                    await sincronizarPlanoComCampanhas(email, dadosMesclados.plano);
                    
                    totalDuplicatasResolvidas++;
                    totalContasDeletadas += contasParaDeletar.length;
                }
                
            } catch (error) {
                console.error(`Erro ao processar duplicatas para ${email}:`, error);
                erros.push(`${email}: ${error.message}`);
            }
        }
        
        // Mostrar resultado
        const mensagemResultado = `
            <div class="text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <i class="fas fa-broom mr-2"></i>
                <strong>Limpeza de duplicados concluída!</strong><br>
                <div class="mt-2 space-y-1">
                    <div class="text-sm">
                        <strong>📊 Resumo da Limpeza:</strong><br>
                        • ${totalDuplicatasResolvidas} grupos de duplicatas resolvidos<br>
                        • ${totalContasDeletadas} contas duplicadas removidas<br>
                        • ${usuarios.length - totalContasDeletadas} contas restantes<br>
                        ${erros.length > 0 ? `• ${erros.length} erros encontrados` : '• Nenhum erro encontrado'}
                    </div>
                    ${erros.length > 0 ? `
                        <details class="mt-2">
                            <summary class="cursor-pointer text-red-600">Ver erros (${erros.length})</summary>
                            <div class="mt-1 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                ${erros.map(erro => `• ${erro}`).join('<br>')}
                            </div>
                        </details>
                    ` : ''}
                </div>
            </div>
        `;
        
        if (resultDiv) resultDiv.innerHTML = mensagemResultado;
        
        showNotification(
            `Limpeza concluída! ${totalContasDeletadas} contas duplicadas foram removidas.`, 
            'success'
        );
        
        // Recarregar lista de usuários se estiver visível
        setTimeout(() => {
            const listaClientes = document.getElementById('listaClientes');
            if (listaClientes && !listaClientes.innerHTML.includes('Carregar Todos')) {
                carregarTodosUsuarios();
            }
        }, 2000);
        
    } catch (error) {
        console.error('Erro na detecção de duplicados:', error);
        const mensagemErro = `
            <div class="text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <strong>Erro na limpeza de duplicados!</strong><br>
                ${error.message}
            </div>
        `;
        if (resultDiv) resultDiv.innerHTML = mensagemErro;
        showNotification('Erro na limpeza de duplicados!', 'error');
        
    } finally {
        if (btnLimpar) {
            btnLimpar.innerHTML = '<i class="fas fa-broom mr-2"></i>Detectar e Limpar Duplicados';
            btnLimpar.disabled = false;
        }
    }
}

// Tornar função disponível globalmente
window.detectarELimparDuplicados = detectarELimparDuplicados;

// Tornar função disponível globalmente
window.detectarELimparDuplicados = detectarELimparDuplicados;
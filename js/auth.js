// Configuração do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// Configuração Firebase fixa
const firebaseConfig = {
    apiKey: "AIzaSyA5TCpAxv9MAtozIDSnP1MnL21MWX9si8c",
    authDomain: "lordetempus-3be20.firebaseapp.com",
    projectId: "lordetempus-3be20",
    storageBucket: "lordetempus-3be20.appspot.com",
    messagingSenderId: "759824598929",
    appId: "1:759824598929:web:995369b4c7cdab2d777c30",
    measurementId: "G-R710NDR809"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Estado do usuário
let currentUser = null;
let isAdmin = false;

// ==================== FUNÇÕES DE UTILIDADE ==================== //

/**
 * Busca usuários existentes com o mesmo email
 */
async function buscarUsuariosComMesmoEmail(email) {
    try {
        const emailLower = email.toLowerCase();
        const q = query(collection(db, 'users'), where('email', '==', emailLower));
        const snapshot = await getDocs(q);
        
        const usuarios = [];
        snapshot.forEach(docSnap => {
            usuarios.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        return usuarios;
    } catch (error) {
        console.error('Erro ao buscar usuários por email:', error);
        return [];
    }
}

/**
 * Mescla dados de múltiplas contas de usuário em uma única conta
 */
async function mesclarContasUsuario(contaAuth, contasExistentes) {
            // Iniciando processo de mesclagem de contas
    console.log('📋 Contas encontradas:', contasExistentes.length);
    
    try {
        // Encontrar a conta principal priorizando: 1) UID do auth atual 2) Melhor plano 3) Mais dados
        let contaPrincipal = null;
        let contasParaDeletar = [];
        
        // Primeiro: verificar se alguma conta já tem o UID do auth atual
        for (const conta of contasExistentes) {
            if (conta.uid === contaAuth.uid) {
                contaPrincipal = conta;
                break;
            }
        }
        
        // Se não encontrou por UID, escolher por melhor plano e completude
        if (!contaPrincipal) {
            contaPrincipal = contasExistentes.reduce((melhor, atual) => {
                // Priorizar conta com plano pago
                const planoMelhor = melhor.plano || 'gratis';
                const planoAtual = atual.plano || 'gratis';
                
                // Se uma tem plano pago e outra não, escolher a com plano pago
                if (planoAtual !== 'gratis' && planoMelhor === 'gratis') {
                    return atual;
                } else if (planoMelhor !== 'gratis' && planoAtual === 'gratis') {
                    return melhor;
                }
                
                // Se ambas têm mesmo status de plano, escolher por completude
                const scoreAtual = Object.keys(atual).length;
                const scoreMaisCompleta = Object.keys(melhor).length;
                return scoreAtual > scoreMaisCompleta ? atual : melhor;
            });
        }
        
        // Preparar lista de contas para deletar (todas menos a principal)
        contasParaDeletar = contasExistentes.filter(conta => conta.id !== contaPrincipal.id);
        
        console.log('👑 Conta principal escolhida:', contaPrincipal.id, 'Plano:', contaPrincipal.plano || 'gratis');
        console.log('🗑️ Contas para deletar:', contasParaDeletar.map(c => `${c.id} (${c.plano || 'gratis'})`));
        
        // Mesclar dados de todas as contas na principal
        const dadosMesclados = {
            // Dados do auth (sempre atualizados)
            uid: contaAuth.uid,
            email: contaAuth.email.toLowerCase(),
            displayName: contaAuth.displayName || contaPrincipal.displayName || '',
            photoURL: contaAuth.photoURL || contaPrincipal.photoURL || '',
            
            // Manter dados existentes da conta principal
            plano: contaPrincipal.plano || 'gratis',
            discord: contaPrincipal.discord || '',
            age: contaPrincipal.age || '',
            phone: contaPrincipal.phone || '',
            address: contaPrincipal.address || {},
            conquistas: contaPrincipal.conquistas || {},
            eventos: contaPrincipal.eventos || {},
            
            // Metadados
            criadoEm: contaPrincipal.criadoEm || new Date(),
            ultimoLogin: new Date(),
            mesclado: true,
            mescladoEm: new Date(),
            contasMescladas: contasParaDeletar.length,
            
            // Se foi criado via importação, manter info
            criadoViaImportacao: contaPrincipal.criadoViaImportacao || false,
            importadoEm: contaPrincipal.importadoEm || null,
            importadoPor: contaPrincipal.importadoPor || null
        };
        
        // Mesclar dados únicos de outras contas - LÓGICA MELHORADA
        for (const conta of contasParaDeletar) {
            // Mesclar campos que podem estar vazios na principal
            if (!dadosMesclados.discord && conta.discord) dadosMesclados.discord = conta.discord;
            if (!dadosMesclados.age && conta.age) dadosMesclados.age = conta.age;
            if (!dadosMesclados.phone && conta.phone) dadosMesclados.phone = conta.phone;
            if (!dadosMesclados.displayName && conta.displayName) dadosMesclados.displayName = conta.displayName;
            
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
            
            // LÓGICA MELHORADA DE PLANOS - preservar o melhor plano
            if (conta.plano && conta.plano !== 'gratis') {
                const planoAtual = dadosMesclados.plano || 'gratis';
                if (planoAtual === 'gratis') {
                    // Se a conta principal não tem plano pago, usar o da conta sendo mesclada
                    dadosMesclados.plano = conta.plano;
                    console.log(`📈 Plano atualizado de '${planoAtual}' para '${conta.plano}'`);
                } else {
                    // Se ambas têm planos pagos, verificar hierarquia (se PLANOS_SISTEMA disponível)
                    if (typeof window !== 'undefined' && window.PLANOS_SISTEMA) {
                        const nivelAtual = window.PLANOS_SISTEMA[planoAtual]?.nivel || 0;
                        const nivelConta = window.PLANOS_SISTEMA[conta.plano]?.nivel || 0;
                        if (nivelConta > nivelAtual) {
                            dadosMesclados.plano = conta.plano;
                            console.log(`📈 Plano upgradado de '${planoAtual}' para '${conta.plano}'`);
                        }
                    }
                }
            }
        }
        
        // Adicionar metadados finais
        dadosMesclados.planoFinalAposMesclagem = dadosMesclados.plano;
        dadosMesclados.contasOriginais = contasExistentes.map(c => ({
            id: c.id,
            plano: c.plano || 'gratis',
            criadoEm: c.criadoEm
        }));
        
        // Atualizar conta principal com dados mesclados
        const contaRef = doc(db, 'users', contaPrincipal.id);
        await setDoc(contaRef, dadosMesclados, { merge: true });
        
        console.log('✅ Conta principal atualizada com dados mesclados');
        console.log('📊 Plano final após mesclagem:', dadosMesclados.plano);
        
        // Deletar contas duplicadas
        for (const conta of contasParaDeletar) {
            try {
                await deleteDoc(doc(db, 'users', conta.id));
                console.log('🗑️ Conta duplicada deletada:', conta.id);
            } catch (deleteError) {
                console.error('Erro ao deletar conta duplicada:', conta.id, deleteError);
            }
        }
        
        console.log('🎉 Mesclagem concluída com sucesso!');
        return { contaPrincipal: contaPrincipal.id, contasDeletadas: contasParaDeletar.length };
        
    } catch (error) {
        console.error('❌ Erro durante mesclagem de contas:', error);
        throw error;
    }
}

/**
 * Cria ou atualiza usuário com verificação anti-duplicação
 */
async function criarOuAtualizarUsuario(contaAuth) {
    try {
        // Verificando duplicatas de conta
        
        // Buscar contas existentes com mesmo email
        const contasExistentes = await buscarUsuariosComMesmoEmail(contaAuth.email);
        
        if (contasExistentes.length === 0) {
            // Nenhuma conta encontrada - criar nova
            // Criando nova conta de usuário
            
            const userRef = doc(db, 'users', contaAuth.uid);
            const dadosNovoUsuario = {
                uid: contaAuth.uid,
                email: contaAuth.email.toLowerCase(),
                displayName: contaAuth.displayName || '',
                photoURL: contaAuth.photoURL || '',
                plano: 'gratis',
                criadoEm: new Date(),
                ultimoLogin: new Date(),
                primeiroLogin: true
            };
            
            await setDoc(userRef, dadosNovoUsuario);
            console.log('✅ Nova conta criada com sucesso');
            return { tipo: 'nova', contaId: contaAuth.uid };
            
        } else if (contasExistentes.length === 1) {
            // Uma conta encontrada - atualizar
            const contaExistente = contasExistentes[0];
            console.log('🔄 Atualizando conta existente:', contaExistente.id);
            
            const contaRef = doc(db, 'users', contaExistente.id);
            const dadosAtualizados = {
                uid: contaAuth.uid, // Atualizar UID para o atual do auth
                email: contaAuth.email.toLowerCase(),
                displayName: contaAuth.displayName || contaExistente.displayName || '',
                photoURL: contaAuth.photoURL || contaExistente.photoURL || '',
                ultimoLogin: new Date(),
                primeiroLogin: false
            };
            
            await setDoc(contaRef, dadosAtualizados, { merge: true });
            console.log('✅ Conta existente atualizada');
            return { tipo: 'atualizada', contaId: contaExistente.id };
            
        } else {
            // Múltiplas contas encontradas - mesclar
            console.log('⚠️ Múltiplas contas encontradas - iniciando mesclagem');
            const resultado = await mesclarContasUsuario(contaAuth, contasExistentes);
            return { tipo: 'mesclada', ...resultado };
        }
        
    } catch (error) {
        console.error('❌ Erro em criarOuAtualizarUsuario:', error);
        
        // Fallback: tentar criar/atualizar da forma tradicional
        console.log('🔄 Usando fallback tradicional...');
        const userRef = doc(db, 'users', contaAuth.uid);
        await setDoc(userRef, {
            uid: contaAuth.uid,
            email: contaAuth.email.toLowerCase(),
            displayName: contaAuth.displayName || '',
            photoURL: contaAuth.photoURL || '',
            ultimoLogin: new Date(),
            erroMesclagem: true,
            erroMesclagemDetalhes: error.message
        }, { merge: true });
        
        return { tipo: 'fallback', contaId: contaAuth.uid };
    }
}

// ==================== OBSERVADOR DE AUTENTICAÇÃO ==================== //

// Observador de estado de autenticação
onAuthStateChanged(auth, async (user) => {
    const loginOptions = document.getElementById("loginOptions");
    const userInfo = document.getElementById("userInfo");
    const loginBtn = document.getElementById("google-sign-in-button");
    const logoutBtn = document.getElementById("sign-out-button");
    const nameEl = document.getElementById("user-display-name");
    const emailEl = document.getElementById("user-email");
    const photoEl = document.getElementById("user-photo");
    const adminPanel = document.getElementById("admin-panel");

    if (user && user.email) {
        // Usuário autenticado com sucesso
        
        try {
            // Sistema anti-duplicação implementado
            const resultado = await criarOuAtualizarUsuario(user);
            
            // Verificar se é admin através do Firestore
            await verificarSeEAdmin();
            
            // Se for admin, configurar plano automaticamente
            if (isAdmin) {
                await configurarPlanoAdmin();
            }
            
            console.log('✅ Resultado do login:', resultado);
            
            // Mostrar notificação se houve mesclagem
            if (resultado.tipo === 'mesclada' && resultado.contasDeletadas > 0) {
                setTimeout(() => {
                    if (window.showNotification) {
                        window.showNotification(
                            `Contas mescladas! ${resultado.contasDeletadas} conta(s) duplicada(s) foram unificadas.`, 
                            'success'
                        );
                    }
                }, 2000);
                
                // Sincronizar plano com campanhas após mesclagem bem-sucedida
                try {
                    if (window.sincronizarPlanoComCampanhas) {
                        // Buscar o plano final da conta mesclada
                        const userRef = doc(db, 'users', resultado.contaPrincipal);
                        getDoc(userRef).then(docSnap => {
                            if (docSnap.exists()) {
                                const userData = docSnap.data();
                                const planoFinal = userData.plano || 'gratis';
                                console.log('🔄 Sincronizando plano após mesclagem:', planoFinal);
                                window.sincronizarPlanoComCampanhas(user.email, planoFinal);
                            }
                        });
                    }
                } catch (syncError) {
                    console.error('Erro ao sincronizar plano após mesclagem:', syncError);
                }
            }
            
        } catch (error) {
            console.error('❌ Erro no sistema anti-duplicação:', error);
        }

        // Mostrar bloco de perfil, esconder bloco de login
        if (loginOptions) loginOptions.style.display = "none";
        if (userInfo) userInfo.style.display = "block";
        if (loginBtn) loginBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "block";
        if (nameEl) nameEl.textContent = user.displayName || "";
        if (emailEl) emailEl.textContent = user.email || "";
        if (photoEl) photoEl.src = user.photoURL || "images/avatar-default.png";

        // Painel de admin será controlado pelas regras do Firestore
        if (adminPanel) {
            if (isAdmin) {
                adminPanel.style.display = "block";
            } else {
                adminPanel.style.display = "none";
            }
        }
    } else {
        // Mostrar bloco de login, esconder bloco de perfil
        if (loginOptions) loginOptions.style.display = "block";
        if (userInfo) userInfo.style.display = "none";
        if (loginBtn) loginBtn.style.display = "block";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (nameEl) nameEl.textContent = "";
        if (emailEl) emailEl.textContent = "";
        if (photoEl) photoEl.src = "images/avatar-default.png";
        if (adminPanel) adminPanel.style.display = "none";
    }
});

// ==================== FUNÇÕES PÚBLICAS ==================== //

// Funções de logout - mantida apenas para outras páginas que possam usar
async function signOutUser() {
    try {
        await signOut(auth);
        // Redirecionar para index.html após logout
        window.location.href = "index.html";
    } catch (error) {
        alert("Erro ao sair.");
        console.error(error);
    }
}

// ==================== VERIFICAÇÃO DE ADMIN VIA FIRESTORE ==================== //

/**
 * Verifica se o usuário atual é admin através das regras do Firestore
 * Tenta fazer uma operação que só admins podem fazer
 */
async function verificarSeEAdmin() {
    if (!auth.currentUser) {
        isAdmin = false;
        return false;
    }

    try {
        // Tentar ler uma coleção que só admins podem acessar (logs)
        const testRef = doc(db, 'logs', 'admin-test');
        await getDoc(testRef);
        
        // Se chegou até aqui sem erro, é admin
        isAdmin = true;
        return true;
    } catch (error) {
        // Se deu erro de permissão, não é admin
        if (error.code === 'permission-denied') {
            isAdmin = false;
            return false;
        }
        
        // Para outros erros, assumir que não é admin por segurança
        isAdmin = false;
        return false;
    }
}

/**
 * Atualiza o plano do usuário para 'administrador' se for admin
 */
async function configurarPlanoAdmin() {
    if (!auth.currentUser || !isAdmin) return;

    try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Se é admin mas não tem plano de administrador, atualizar
            if (userData.plano !== 'administrador') {
                await setDoc(userRef, {
                    plano: 'administrador',
                    planoAlteradoEm: new Date(),
                    planoAlteradoPor: 'sistema-admin-detection'
                }, { merge: true });
                
                console.log('✅ Plano de administrador configurado automaticamente');
            }
        }
    } catch (error) {
        console.error('Erro ao configurar plano admin:', error);
    }
}

// Exportar funções úteis para outros módulos
window.authUtils = {
    buscarUsuariosComMesmoEmail,
    mesclarContasUsuario,
    criarOuAtualizarUsuario,
    verificarSeEAdmin,
    configurarPlanoAdmin
}; 
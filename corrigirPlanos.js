const admin = require('firebase-admin');

// Substitua pelo caminho do seu arquivo de credenciais
const serviceAccount = require('./caminho/para/seu-arquivo-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const PLANOS_VALIDOS = ['relogio', 'administrador', 'outro'];

async function corrigirPlanosUsuarios() {
  const usersSnap = await db.collection('users').get();
  let countCorrigidos = 0;

  for (const doc of usersSnap.docs) {
    let plano = doc.data().plano;
    if (typeof plano === 'string') {
      const planoCorrigido = plano.trim().toLowerCase();
      if (PLANOS_VALIDOS.includes(planoCorrigido)) {
        if (plano !== planoCorrigido) {
          await doc.ref.update({ plano: planoCorrigido });
          countCorrigidos++;
          console.log(`Corrigido: ${doc.id} => ${planoCorrigido}`);
        }
      } else {
        // Se não for válido, remove o campo plano
        await doc.ref.update({ plano: admin.firestore.FieldValue.delete() });
        countCorrigidos++;
        console.log(`Removido plano inválido de: ${doc.id}`);
      }
    }
  }
  console.log(`Correção concluída. Usuários corrigidos: ${countCorrigidos}`);
}

corrigirPlanosUsuarios().catch(console.error);
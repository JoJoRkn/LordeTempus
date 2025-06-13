# 🎲 Lorde Tempus - Plataforma de RPG Premium

> **Atualização: Janeiro 2025** - Refatoração completa do `index.html` implementada com melhorias significativas em performance, acessibilidade e design.

## 📋 Sobre o Projeto

A **Lorde Tempus** é a principal plataforma de RPG online do Brasil, conectando aventureiros para criar histórias épicas e memoráveis. Oferecemos mesas exclusivas conduzidas pelos melhores mestres, com diferentes planos de assinatura para todos os tipos de jogadores.

## ✨ Novidades da Refatoração (Janeiro 2025)

### 🎯 **Index.html Completamente Refatorado**

#### **Melhorias de Performance**
- ✅ Preload de fontes críticas
- ✅ Otimização de imagens e assets
- ✅ CSS organizado com GPU acceleration
- ✅ JavaScript otimizado com debouncing
- ✅ Meta tags para SEO completas

#### **Design e UX Melhorados**
- ✅ Hero section com background `FundoVerdeAmassado.png`
- ✅ Fontes corretas: **Trend Slab Four** (títulos) + **Helvetica Bold** (textos)
- ✅ Animações suaves e profissionais
- ✅ Responsividade perfeita (desktop, tablet, mobile)
- ✅ Dark/Light mode funcional
- ✅ Menu mobile moderno com animações

#### **Funcionalidades Implementadas**
- ✅ Navegação ativa com scroll spy
- ✅ Smooth scroll otimizado
- ✅ Botões de planos com loading states
- ✅ Sistema de notificações
- ✅ Back to top button
- ✅ Parallax effect no hero
- ✅ Discord widget responsivo

#### **Acessibilidade e Compatibilidade**
- ✅ Focusável por teclado
- ✅ Suporte a leitores de tela
- ✅ Compatível com todos os tipos de usuário (admin, logado, deslogado)
- ✅ Reduce motion support
- ✅ High contrast mode support

## 🎨 Estrutura das Páginas

### **📄 Index.html** ✅ **REFATORADO**
- **Hero Section**: Banner com fundo personalizado e call-to-actions
- **Sobre Section**: Informações da empresa + Discord widget
- **Planos Section**: 6 planos em grid responsivo com animações
- **Footer**: Links, contatos e redes sociais

### **📄 Campanhas.html** ⏳ **Próxima etapa**
- Sistema de campanhas com filtros
- Cards de campanhas interativos
- Sistema de busca avançada

### **📄 Perfil.html** ⏳ **Última etapa**
- Painel de usuário completo
- Abas: perfil, planos, compras, endereço, mesas, troféus, admin
- Background `FundoVerdeAmassado.png`

## 🎭 Planos de Assinatura

| Plano | Preço | Características |
|-------|-------|----------------|
| **Segundos** | R$ 29,99/mês | Conteúdos introdutórios, sorteios |
| **Minutos** | R$ 49,99/mês | Prioridade em reservas, eventos especiais |
| **Relógio** | R$ 109,99/mês | ⭐ **Popular** - Campanhas ilimitadas |
| **Lorde** | R$ 119,99/mês | Atendimento VIP, suporte 24/7 |
| **Praça do Tempo** | R$ 599,99/mês | Mesa exclusiva personalizada |
| **Atemporal** | R$ 999,99/mês | 3 campanhas simultâneas, acesso aos fundadores |

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3 (Custom Properties), JavaScript ES6+
- **Framework CSS**: Tailwind CSS 2.2.19
- **Fontes**: Trend Slab Four (títulos), Helvetica Bold (textos)
- **Ícones**: FontAwesome 6.5.1
- **Backend**: Firebase (autenticação, banco de dados)
- **Animations**: CSS Animations + Intersection Observer API

## 🚀 Como Executar

### **Pré-requisitos**
- Node.js (para desenvolvimento)
- Servidor web (Python, Live Server, etc.)

### **Instalação**
```bash
# Clone o repositório
git clone https://github.com/lordetempus/site-rpg.git

# Navegue até o diretório
cd "Site da Lorde Tempus"

# Instale as dependências (se necessário)
npm install

# Execute o servidor local
python -m http.server 8000
# ou
npx live-server
```

### **Acesso**
- **Local**: http://localhost:8000
- **Produção**: https://lordetempus.com

## 📁 Estrutura de Arquivos

```
Site da Lorde Tempus/
├── 📄 index.html              # ✅ REFATORADO - Página principal
├── 📄 campanhas.html          # ⏳ Próxima etapa
├── 📄 perfil.html             # ⏳ Última etapa
├── 📁 css/
│   └── styles.css             # ✅ REFATORADO - Estilos organizados
├── 📁 js/
│   ├── main.js                # JavaScript principal
│   └── auth.js                # Autenticação Firebase
├── 📁 fontes/                 # ✅ Fontes locais implementadas
│   ├── trend-slab-four.otf    # Títulos
│   └── Helvetica-Bold.ttf     # Textos
├── 📁 images/
│   └── Papeis_amassados/
│       └── FundoVerdeAmassado.png  # ✅ Background implementado
└── 📁 node_modules/           # Dependências
```

## 🎯 Próximas Etapas

### **Etapa 2: Campanhas.html**
- [ ] Refatorar HTML e CSS
- [ ] Sistema de filtros funcionais
- [ ] Cards de campanhas responsivos
- [ ] Integração com Firebase
- [ ] Animações e interações

### **Etapa 3: Perfil.html**
- [ ] Refatorar todas as abas
- [ ] Background `FundoVerdeAmassado.png`
- [ ] Sistema de pagamentos
- [ ] Painel administrativo
- [ ] Dashboard de usuário

## 🏆 Recursos Implementados

### ✅ **Concluído (Index.html)**
- Navbar responsiva com menu mobile
- Hero section com background personalizado
- Seção sobre com Discord widget
- Grid de planos com animações
- Footer completo com redes sociais
- Dark/Light mode toggle
- Sistema de notificações
- Animations com Intersection Observer
- Smooth scroll e scroll spy
- Back to top button
- Acessibilidade completa

### 🔄 **Em Desenvolvimento**
- Sistema de campanhas (campanhas.html)
- Painel de usuário (perfil.html)
- Integração de pagamentos
- Sistema de reservas

### 📋 **Planejado**
- PWA (Progressive Web App)
- Sistema de chat em tempo real
- Calendário de sessões
- Sistema de avaliações
- Marketplace de itens RPG

## 👥 Equipe

- **Fundadores**: Raio & Tempus
- **Desenvolvimento**: Equipe Lorde Tempus
- **Design**: UI/UX Premium
- **Refatoração 2025**: Implementação completa com foco em performance e acessibilidade

## 📞 Contato

- **Discord**: [Lorde Tempus Community](https://discord.gg/BHgQ2XZ89Y)
- **Email**: contato@lordetempus.com
- **Twitter**: [@LordeTempus](https://x.com/LordeTempus)
- **YouTube**: [@lordetempus](https://www.youtube.com/@lordetempus)
- **TikTok**: [@lordetempus](https://www.tiktok.com/@lordetempus)

## 📝 Licença

© 2025 Lorde Tempus. Todos os direitos reservados.  
Feito com ❤️ para a comunidade RPG brasileira.

---

> **Status do Projeto**: 🟢 **Etapa 1 Concluída** - Index.html totalmente refatorado e otimizado  
> **Próxima Atualização**: Campanhas.html (Etapa 2) 
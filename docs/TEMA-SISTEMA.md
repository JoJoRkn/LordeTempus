# Sistema de Temas - Lorde Tempus

## Visão Geral

O Lorde Tempus possui um sistema completo de temas claro/escuro com as seguintes funcionalidades:

- 🌙 **Modo Escuro**: Tema escuro com cores suaves para os olhos
- ☀️ **Modo Claro**: Tema claro e moderno 
- 🔄 **Alternância Suave**: Transições animadas entre temas
- 💾 **Persistência**: Salva a preferência do usuário
- 🖥️ **Detecção do Sistema**: Detecta automaticamente a preferência do sistema operacional
- ⌨️ **Atalho de Teclado**: Ctrl + Shift + D para alternar rapidamente
- 📱 **Compatibilidade Mobile**: Funciona em todos os dispositivos

## Como Usar

### Para Usuários

1. **Botão de Alternância**: Clique no ícone de lua/sol na navbar
2. **Menu Mobile**: Use o botão "Alternar Tema" no menu mobile  
3. **Atalho**: Pressione `Ctrl + Shift + D` para alternar rapidamente
4. **Automático**: O sistema detecta automaticamente sua preferência do SO

### Para Desenvolvedores

#### Estrutura dos Arquivos

```
js/
├── theme-manager.js    # Gerenciador principal de temas
├── main.js            # Funcionalidades gerais
├── campanhas.js       # Funcionalidades das campanhas
└── perfil.js          # Funcionalidades do perfil

css/
└── styles.css         # Estilos incluindo variáveis de tema
```

#### HTML Requirements

Para que o sistema funcione, você precisa incluir:

```html
<!-- Theme Manager (sempre primeiro) -->
<script src="js/theme-manager.js"></script>

<!-- Botão de alternância -->
<button id="themeToggle" class="theme-toggle-btn" aria-label="Alternar modo claro/escuro">
    <i class="fas fa-moon theme-icon-moon"></i>
    <i class="fas fa-sun theme-icon-sun hidden"></i>
</button>

<!-- Botão mobile (opcional) -->
<button id="themeToggleMobile" class="mobile-theme-toggle">
    <i class="fas fa-palette"></i>
    <span>Alternar Tema</span>
</button>
```

#### Classes CSS Importantes

```css
/* Classes obrigatórias para ícones */
.theme-icon-moon   /* Ícone de lua (modo claro) */
.theme-icon-sun    /* Ícone de sol (modo escuro) */

/* Estados de tema */
.dark             /* Aplicada ao <html> quando em modo escuro */

/* Classes de transição */
.toggling         /* Aplicada temporariamente durante alternância */
```

#### JavaScript API

```javascript
// Acessar o gerenciador globalmente
window.themeManager

// Métodos disponíveis
themeManager.getTheme()        // 'light' ou 'dark'
themeManager.setTheme('dark')  // Forçar um tema específico
themeManager.toggleTheme()     // Alternar tema
themeManager.isDark()          // true se modo escuro
themeManager.isLight()         // true se modo claro
themeManager.resetToSystem()   // Voltar para preferência do sistema

// Eventos customizados
document.addEventListener('themeChanged', function(e) {
    console.log('Novo tema:', e.detail.theme);
});
```

## Variáveis CSS

O sistema usa variáveis CSS que se adaptam automaticamente:

```css
:root {
    /* Cores primárias */
    --primary: #00bfae;
    --primary-dark: #008c7e;
    --primary-light: #00fcc8;
    
    /* Backgrounds */
    --bg-light: #f8fafc;      /* Fundo claro */
    --bg-dark: #0f172a;       /* Fundo escuro */
    --surface-light: #ffffff; /* Superficie clara */
    --surface-dark: #1e293b;  /* Superficie escura */
    
    /* Textos */
    --text-main: #1e293b;     /* Texto principal */
    --text-light: #f8fafc;    /* Texto claro */
    --text-muted: #64748b;    /* Texto secundário */
    
    /* Bordas */
    --border-light: #e2e8f0;  /* Borda clara */
    --border-dark: #334155;   /* Borda escura */
}
```

## Funcionalidades Avançadas

### Detecção de Preferência do Sistema

O sistema detecta automaticamente se o usuário prefere modo escuro:

```javascript
window.matchMedia('(prefers-color-scheme: dark)')
```

### Persistência Local

As preferências são salvas em `localStorage`:

```javascript
localStorage.getItem('lorde-tempus-theme') // 'light' ou 'dark'
```

### Notificações de Tema

Quando o tema é alterado via atalho de teclado, uma notificação aparece:

- **Modo Escuro**: "Tema Escuro ativado"
- **Modo Claro**: "Tema Claro ativado"

### Transições Suaves

Todos os elementos têm transições suaves de 300ms:

```css
transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
```

## Compatibilidade

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers
- ✅ Modo de alto contraste
- ✅ Prefers-reduced-motion

## Troubleshooting

### Problema: Ícones não alternam

**Solução**: Verifique se as classes `theme-icon-moon` e `theme-icon-sun` estão aplicadas:

```html
<i class="fas fa-moon theme-icon-moon"></i>
<i class="fas fa-sun theme-icon-sun hidden"></i>
```

### Problema: Tema não persiste

**Solução**: Verifique se o `theme-manager.js` está carregando antes de outros scripts.

### Problema: Transições muito rápidas/lentas

**Solução**: Ajuste as variáveis CSS:

```css
:root {
    --transition-fast: 0.15s ease;    /* Transições rápidas */
    --transition-normal: 0.3s ease;   /* Transições normais */
    --transition-slow: 0.5s ease;     /* Transições lentas */
}
```

## Exemplos de Uso

### Escutar mudanças de tema

```javascript
document.addEventListener('themeChanged', function(e) {
    if (e.detail.theme === 'dark') {
        // Lógica específica para modo escuro
        console.log('Modo escuro ativado');
    } else {
        // Lógica específica para modo claro
        console.log('Modo claro ativado');
    }
});
```

### Forçar tema baseado em condição

```javascript
// Exemplo: modo escuro após 18h
const hour = new Date().getHours();
if (hour >= 18 || hour <= 6) {
    themeManager.setTheme('dark');
} else {
    themeManager.setTheme('light');
}
```

### Criar botão customizado

```html
<button data-theme-toggle aria-label="Alternar tema">
    <i class="fas fa-moon"></i>
    <i class="fas fa-sun"></i>
</button>
```

O atributo `data-theme-toggle` faz o botão funcionar automaticamente.

---

**Desenvolvido com ❤️ para a comunidade RPG do Lorde Tempus** 
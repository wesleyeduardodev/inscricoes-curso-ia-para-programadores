# Sistema de Inscricoes - Mini Curso de IA para Programadores (IFMA)

## Visao Geral

Sistema completo para gerenciamento de inscricoes do Mini Curso de Inteligencia Artificial para Programadores, direcionado aos alunos do IFMA.

**Componentes:**
- **Backend**: Modulo isolado no Spring Boot existente (devquote-backend)
- **Frontend**: Landing page publica + Painel administrativo

---

## Arquitetura

```
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────┐
│   Landing Page      │      │                     │      │                 │
│   (HTML/CSS/JS)     │ ───► │   API Spring Boot   │ ───► │   PostgreSQL    │
├─────────────────────┤      │   /api/minicurso/*  │      │                 │
│   Painel Admin      │      │                     │      │                 │
│   (HTML/CSS/JS)     │ ───► │                     │      │                 │
└─────────────────────┘      └─────────────────────┘      └─────────────────┘
```

---

## Backend - Modulo Minicurso

### Estrutura de Pacotes

```
br.com.devquote.minicurso/
├── entity/
│   ├── InscricaoMinicurso.java
│   ├── ConfiguracaoEvento.java
│   ├── ModuloEvento.java
│   └── ItemModulo.java
├── repository/
│   ├── InscricaoMinicursoRepository.java
│   ├── ConfiguracaoEventoRepository.java
│   ├── ModuloEventoRepository.java
│   └── ItemModuloRepository.java
├── service/
│   ├── InscricaoMinicursoService.java
│   ├── ConfiguracaoEventoService.java
│   ├── ModuloEventoService.java
│   └── ItemModuloService.java
├── controller/
│   ├── MinicursoController.java
│   └── doc/
│       └── MinicursoControllerDoc.java
├── dto/
│   ├── request/
│   │   ├── InscricaoRequest.java
│   │   ├── ConfiguracaoEventoRequest.java
│   │   ├── ModuloEventoRequest.java
│   │   └── ItemModuloRequest.java
│   └── response/
│       ├── InscricaoResponse.java
│       ├── ConfiguracaoEventoResponse.java
│       ├── ModuloEventoResponse.java
│       └── ItemModuloResponse.java
└── adapter/
    ├── InscricaoMinicursoAdapter.java
    ├── ConfiguracaoEventoAdapter.java
    ├── ModuloEventoAdapter.java
    └── ItemModuloAdapter.java
```

---

### Entities (Tabelas)

#### 1. InscricaoMinicurso

| Campo | Tipo | Restricoes |
|-------|------|------------|
| id | Long | PK, auto-increment |
| nome | String(150) | NOT NULL |
| email | String(150) | NOT NULL, UNIQUE |
| telefone | String(20) | nullable |
| curso | String(100) | NOT NULL |
| periodo | String(20) | nullable |
| nivelProgramacao | String(50) | NOT NULL |
| expectativa | Text | nullable |
| createdAt | LocalDateTime | NOT NULL |
| confirmado | Boolean | default false |

#### 2. ConfiguracaoEvento

| Campo | Tipo | Restricoes |
|-------|------|------------|
| id | Long | PK, auto-increment |
| titulo | String(200) | NOT NULL |
| dataEvento | LocalDate | nullable |
| horarioInicio | LocalTime | nullable |
| horarioFim | LocalTime | nullable |
| local | String(200) | nullable |
| quantidadeVagas | Integer | nullable |
| inscricoesAbertas | Boolean | default true |
| createdAt | LocalDateTime | NOT NULL |
| updatedAt | LocalDateTime | nullable |

**Relacionamento:** OneToMany com ModuloEvento

#### 3. ModuloEvento

| Campo | Tipo | Restricoes |
|-------|------|------------|
| id | Long | PK, auto-increment |
| configuracaoEventoId | Long | FK, NOT NULL |
| titulo | String(200) | NOT NULL |
| descricao | Text | nullable |
| ordem | Integer | NOT NULL |
| cargaHoraria | Integer | nullable (em minutos) |
| ativo | Boolean | default true |

**Relacionamento:** ManyToOne com ConfiguracaoEvento, OneToMany com ItemModulo

#### 4. ItemModulo

| Campo | Tipo | Restricoes |
|-------|------|------------|
| id | Long | PK, auto-increment |
| moduloId | Long | FK, NOT NULL |
| titulo | String(200) | NOT NULL |
| descricao | Text | nullable |
| ordem | Integer | NOT NULL |
| duracao | Integer | nullable (em minutos) |
| ativo | Boolean | default true |

**Relacionamento:** ManyToOne com ModuloEvento

---

### Endpoints da API

#### Endpoints Publicos (Sem autenticacao)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/minicurso/inscricao` | Cadastra nova inscricao |
| GET | `/api/minicurso/inscricao/check?email=x` | Verifica se email ja existe |
| GET | `/api/minicurso/inscricoes/count` | Retorna total de inscritos |
| GET | `/api/minicurso/evento` | Retorna config do evento + modulos + itens |

#### Endpoints Admin (Requer ROLE_ADMIN)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/minicurso/inscricoes` | Lista todas inscricoes |
| GET | `/api/minicurso/inscricoes/{id}` | Busca inscricao por ID |
| DELETE | `/api/minicurso/inscricoes/{id}` | Exclui inscricao |
| GET | `/api/minicurso/inscricoes/export` | Exporta Excel com inscricoes |
| PUT | `/api/minicurso/evento` | Atualiza configuracao do evento |
| POST | `/api/minicurso/modulos` | Cria novo modulo |
| PUT | `/api/minicurso/modulos/{id}` | Atualiza modulo |
| DELETE | `/api/minicurso/modulos/{id}` | Exclui modulo |
| POST | `/api/minicurso/modulos/{moduloId}/itens` | Cria item no modulo |
| PUT | `/api/minicurso/itens/{id}` | Atualiza item |
| DELETE | `/api/minicurso/itens/{id}` | Exclui item |

---

### Validacoes - InscricaoRequest

| Campo | Validacoes |
|-------|------------|
| nome | @NotBlank, @Size(min=3, max=150) |
| email | @NotBlank, @Email, @Size(max=150) |
| telefone | @Size(max=20), @Pattern (formato telefone) |
| curso | @NotBlank, @Size(max=100) |
| periodo | @Size(max=20) |
| nivelProgramacao | @NotBlank, @Pattern (INICIANTE\|INTERMEDIARIO\|AVANCADO) |
| expectativa | @Size(max=500) |

---

### Regras de Negocio

1. **Email unico**: Nao permitir inscricao com email ja cadastrado (retornar erro 409)
2. **Vagas**: Verificar se ainda ha vagas disponiveis antes de aceitar inscricao
3. **Inscricoes abertas**: Verificar flag `inscricoesAbertas` antes de aceitar
4. **Export Excel**: Gerar planilha com Apache POI contendo todos os dados das inscricoes

---

## Frontend

### Estrutura de Arquivos

```
inscricoes-curso-ia-para-programadores/
├── index.html              # Landing page publica
├── styles.css              # Estilos da landing
├── script.js               # Logica da landing
├── admin/
│   ├── index.html          # Painel admin
│   ├── admin.css           # Estilos do admin
│   └── admin.js            # Logica do admin
└── README.md               # Este arquivo
```

---

### Landing Page (index.html)

#### Secoes

1. **Header**
   - Logo IFMA
   - Titulo do curso

2. **Hero Section**
   - Titulo chamativo: "Mini Curso de Inteligencia Artificial para Programadores"
   - Subtitulo: "Gratuito e exclusivo para alunos do IFMA"
   - Botao CTA: "Garantir minha vaga"
   - Badge: "Vagas Limitadas"

3. **Conteudo Programatico**
   - Modulos e itens carregados dinamicamente da API
   - Exibe carga horaria de cada modulo

4. **Informacoes do Evento**
   - Data, horario, local (carregados da API)
   - Numero de vagas disponiveis

5. **Formulario de Inscricao**
   - Nome (obrigatorio)
   - Email (obrigatorio)
   - Telefone (opcional)
   - Curso no IFMA (obrigatorio)
   - Periodo (opcional)
   - Nivel de programacao (obrigatorio): Iniciante, Intermediario, Avancado
   - Expectativas (opcional, textarea)
   - Botao: "Quero participar!"

6. **Footer**
   - Contato
   - Redes sociais

#### Comportamento do Formulario

1. Validacao client-side antes de enviar
2. Verificar se email ja existe (GET /check)
3. Feedback visual durante envio (loading no botao)
4. Mensagem de sucesso apos cadastro
5. Tratamento de erros (email duplicado, vagas esgotadas, falha de conexao)

---

### Painel Admin (admin/index.html)

#### Acesso

- URL: `/admin` ou `/admin/index.html`
- Autenticacao: Usa login existente do devquote (`/api/auth/login`)
- Requer usuario com ROLE_ADMIN

#### Tela de Login

- Campos: email e senha
- Armazena JWT no localStorage
- Redireciona para dashboard apos login

#### Dashboard - Secoes

1. **Estatisticas**
   - Total de inscritos
   - Vagas disponiveis
   - Status das inscricoes (abertas/fechadas)

2. **Configuracoes do Evento**
   - Formulario para editar: titulo, data, horario, local, vagas
   - Toggle para abrir/fechar inscricoes
   - Botao salvar

3. **Modulos e Itens**
   - Lista de modulos ordenados
   - Botoes: editar, excluir, adicionar item
   - Lista de itens dentro de cada modulo
   - Modal para criar/editar

4. **Inscricoes**
   - Tabela com: nome, email, curso, nivel, data inscricao
   - Busca/filtro por nome ou email
   - Botao excluir (com confirmacao)
   - Botao "Exportar Excel"

---

### Design - Especificacoes

#### Estilo

- **Conceito**: Clean & Moderno
- **Fonte**: Inter (Google Fonts)
- **Layout**: Mobile-first, responsivo

#### Paleta de Cores IFMA

| Cor | Hexadecimal | Uso |
|-----|-------------|-----|
| Verde Principal | `#84BD00` | Botoes, links, destaques |
| Verde Escuro | `#6B9E00` | Hover, gradientes |
| Vermelho | `#9E1B32` | Alertas, badges, erros |
| Amarelo | `#FFD100` | Destaques especiais |
| Branco | `#FFFFFF` | Fundo principal |
| Cinza Claro | `#F5F5F5` | Fundo secoes alternadas |
| Cinza Escuro | `#2D2D2D` | Textos |

#### Elementos Visuais

- Header com gradiente verde (#84BD00 -> #6B9E00)
- Secoes alternando fundo branco e cinza claro
- Cards com sombras suaves (box-shadow)
- Bordas arredondadas (8px)
- Botoes com transicao suave no hover
- Inputs com borda verde no focus
- Espacamento generoso (padding/margin)
- Animacoes suaves para feedback

---

## Configuracao de Seguranca

### SecurityConfig.java

**Endpoints Publicos a adicionar:**

```java
"/api/minicurso/inscricao"           // POST criar inscricao
"/api/minicurso/inscricao/check"     // GET verificar email
"/api/minicurso/inscricoes/count"    // GET contador
"/api/minicurso/evento"              // GET config evento (publico para landing)
```

**Endpoints Protegidos (ADMIN):**

```java
"/api/minicurso/inscricoes/**"       // GET lista, DELETE, export
"/api/minicurso/modulos/**"          // CRUD modulos
"/api/minicurso/itens/**"            // CRUD itens
```

---

## Arquivos a Criar/Modificar

### Backend (26 arquivos)

| Tipo | Quantidade | Arquivos |
|------|------------|----------|
| Entity | 4 | InscricaoMinicurso, ConfiguracaoEvento, ModuloEvento, ItemModulo |
| Repository | 4 | Para cada entity |
| DTO Request | 4 | Para cada entity |
| DTO Response | 4 | Para cada entity |
| Adapter | 4 | Para cada entity |
| Service | 4 | Para cada entity |
| Controller | 1 | MinicursoController |
| Controller Doc | 1 | MinicursoControllerDoc |
| Modificacao | 1 | SecurityConfig.java |

### Frontend (6 arquivos)

| Arquivo | Descricao |
|---------|-----------|
| index.html | Landing page |
| styles.css | Estilos da landing |
| script.js | Logica da landing |
| admin/index.html | Painel admin |
| admin/admin.css | Estilos do admin |
| admin/admin.js | Logica do admin |

---

## Testes de Verificacao

### Backend

- [ ] JPA cria tabelas automaticamente ao iniciar
- [ ] Swagger exibe documentacao em /swagger-ui.html
- [ ] POST inscricao funciona com dados validos
- [ ] POST inscricao retorna 409 para email duplicado
- [ ] GET check retorna true/false corretamente
- [ ] GET count retorna numero de inscritos
- [ ] GET evento retorna config + modulos + itens
- [ ] Endpoints admin retornam 401 sem token
- [ ] Endpoints admin funcionam com token ADMIN
- [ ] Export Excel gera arquivo corretamente

### Frontend - Landing

- [ ] Pagina carrega e exibe conteudo da API
- [ ] Modulos e itens sao renderizados
- [ ] Formulario valida campos obrigatorios
- [ ] Inscricao e enviada com sucesso
- [ ] Mensagens de erro sao exibidas
- [ ] Layout responsivo (mobile/desktop)

### Frontend - Admin

- [ ] Login funciona com credenciais ADMIN
- [ ] Dashboard exibe estatisticas
- [ ] CRUD de evento funciona
- [ ] CRUD de modulos funciona
- [ ] CRUD de itens funciona
- [ ] Lista de inscricoes carrega
- [ ] Exclusao de inscricao funciona
- [ ] Export Excel baixa arquivo

---

## Observacoes Tecnicas

1. **JPA/Hibernate**: Cria tabelas automaticamente, nao precisa de scripts SQL
2. **Apache POI**: Ja existe no projeto, usar para export Excel
3. **Autenticacao**: Usa sistema JWT existente do devquote
4. **CORS**: Configurar origem da landing page no SecurityConfig
5. **Lombok**: Usar @Data, @Builder, @RequiredArgsConstructor
6. **Validacao**: Jakarta Validation com mensagens em portugues

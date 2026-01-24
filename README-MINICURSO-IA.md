# Landing Page - Mini Curso de IA para Programadores (IFMA)

## Visão Geral

Landing page para captura de pré-inscrições do mini curso de Inteligência Artificial voltado para programadores, direcionado aos alunos do IFMA.

---

## Arquitetura

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Landing Page   │ ───► │   API Existente │ ───► │   PostgreSQL    │
│  (Frontend)     │      │   (Spring Boot) │      │   (novas tabelas)│
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

**Estratégia:** Aproveitar a API e banco de dados já em produção, adicionando apenas novas tabelas e endpoints.

---

## Backend (Spring Boot)

### Nova Tabela: `inscricoes_minicurso`

```sql
CREATE TABLE inscricoes_minicurso (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    curso VARCHAR(100),                    -- curso que o aluno faz no IFMA
    periodo VARCHAR(20),                   -- período/semestre atual
    nivel_programacao VARCHAR(50),         -- iniciante, intermediário, avançado
    expectativa TEXT,                      -- o que espera aprender (opcional)
    created_at TIMESTAMP DEFAULT NOW(),
    confirmado BOOLEAN DEFAULT FALSE
);
```

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/minicurso/inscricao` | Cadastra nova inscrição |
| GET | `/api/minicurso/inscricao/check?email=x` | Verifica se email já está inscrito |
| GET | `/api/minicurso/inscricoes` | Lista todas inscrições (admin) |
| GET | `/api/minicurso/inscricoes/count` | Retorna total de inscritos |

### DTO de Entrada (InscricaoRequest)

```java
public class InscricaoRequest {
    private String nome;          // obrigatório
    private String email;         // obrigatório
    private String telefone;      // opcional
    private String curso;         // obrigatório
    private String periodo;       // opcional
    private String nivelProgramacao; // obrigatório
    private String expectativa;   // opcional
}
```

### Validações

- Email em formato válido e único
- Nome com mínimo de 3 caracteres
- Nível de programação deve ser: INICIANTE, INTERMEDIARIO ou AVANCADO

---

## Frontend (Landing Page)

### Stack Sugerida

- **HTML5 + CSS3 + JavaScript Vanilla**
- Design responsivo (mobile-first)
- Sem frameworks para manter simplicidade

### Estrutura da Página

```
┌────────────────────────────────────────┐
│              HEADER                     │
│  Logo IFMA | Mini Curso IA             │
├────────────────────────────────────────┤
│              HERO SECTION              │
│  Título chamativo                      │
│  Subtítulo com proposta de valor       │
│  CTA: "Garantir minha vaga"            │
├────────────────────────────────────────┤
│           O QUE VOCÊ VAI APRENDER      │
│  - Tópico 1                            │
│  - Tópico 2                            │
│  - Tópico 3                            │
├────────────────────────────────────────┤
│              INFORMAÇÕES               │
│  Data | Horário | Local | Vagas        │
├────────────────────────────────────────┤
│         FORMULÁRIO DE INSCRIÇÃO        │
│  [Nome]                                │
│  [Email]                               │
│  [Telefone]                            │
│  [Curso no IFMA]                       │
│  [Nível de programação]                │
│  [Expectativas] (textarea)             │
│  [BOTÃO: Quero participar!]            │
├────────────────────────────────────────┤
│              FOOTER                    │
│  Contato | Redes sociais               │
└────────────────────────────────────────┘
```

### Comportamento do Formulário

1. Validação client-side antes de enviar
2. Feedback visual durante envio (loading)
3. Mensagem de sucesso após cadastro
4. Tratamento de erro (email duplicado, falha de conexão)

---

## Conteúdo Sugerido

### Hero Section

**Título:** Mini Curso de Inteligência Artificial para Programadores

**Subtítulo:** Aprenda os fundamentos de IA e Machine Learning de forma prática. Gratuito e exclusivo para alunos do IFMA.

### O Que Você Vai Aprender

- [ ] Definir os tópicos do curso (preencher depois)
- Introdução à IA e Machine Learning
- Conceitos de redes neurais
- Ferramentas e frameworks (Python, TensorFlow, etc.)
- Projeto prático

### Informações do Evento

| Item | Valor |
|------|-------|
| Data | A definir |
| Horário | A definir |
| Local | IFMA - Campus X |
| Vagas | X vagas |
| Valor | Gratuito |

---

## Configurações

### Variáveis de Ambiente (Frontend)

```env
API_BASE_URL=https://sua-api.com.br/api
```

### CORS (Backend)

Garantir que a API aceita requisições do domínio da landing page.

---

## Deploy

### Frontend
- Opção 1: Vercel (gratuito)
- Opção 2: Netlify (gratuito)
- Opção 3: GitHub Pages (gratuito)
- Opção 4: Mesmo servidor da API

### Backend
- Já em produção (apenas adicionar novas rotas)

---

## Checklist de Implementação

### Backend
- [ ] Criar tabela `inscricoes_minicurso`
- [ ] Criar entity `InscricaoMinicurso`
- [ ] Criar repository
- [ ] Criar service com validações
- [ ] Criar controller com endpoints
- [ ] Configurar CORS para o domínio da landing page
- [ ] Testar endpoints

### Frontend
- [ ] Estrutura HTML
- [ ] Estilização CSS (responsivo)
- [ ] JavaScript para consumir API
- [ ] Validações do formulário
- [ ] Feedback visual (loading, sucesso, erro)
- [ ] Testar em mobile e desktop

---

## Observações

- Manter o design limpo e objetivo
- Foco na conversão (inscrição)
- Performance: página leve para carregar rápido
- SEO básico (meta tags, título)

---

## Próximos Passos

1. Revisar e ajustar este planejamento
2. Definir informações do curso (data, local, conteúdo)
3. Implementar backend (tabela + endpoints)
4. Implementar frontend (landing page)
5. Testar integração
6. Deploy

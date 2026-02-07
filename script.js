const API_BASE_URL = 'https://wesley.devquote.com.br/api/minicurso';
//const API_BASE_URL = 'http://localhost:8080/api/minicurso';

document.addEventListener('DOMContentLoaded', () => {
    carregarEvento();
    carregarContador();
    carregarInstrutores();
    setupFormulario();
    setupCharCounter();
});

async function carregarEvento() {
    try {
        const response = await fetch(`${API_BASE_URL}/evento`);
        if (!response.ok) {
            throw new Error('Erro ao carregar evento');
        }

        const evento = await response.json();

        if (evento) {
            renderizarInformacoes(evento);
            renderizarModulos(evento.modulos || []);
            renderizarFaleConosco(evento); // Chama a nova função de renderização
            verificarInscricoesAbertas(evento);
        }
    } catch (error) {
        console.error('Erro ao carregar evento:', error);
        document.getElementById('modulos-container').innerHTML =
            '<p class="loading-placeholder">Não foi possível carregar o conteúdo. Tente novamente mais tarde.</p>';
    }
}

async function carregarContador() {
    try {
        const response = await fetch(`${API_BASE_URL}/inscricoes/count`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById('total-inscritos').textContent = data.total || 0;
        }
    } catch (error) {
        console.error('Erro ao carregar contador:', error);
    }
}

function renderizarInformacoes(evento) {
    const datasContainer = document.getElementById('datas-info-container');

    if (evento.datasEvento && evento.datasEvento.length > 0) {
        datasContainer.innerHTML = evento.datasEvento.map(data => `
            <div class="info-card">
                <div class="info-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </div>
                <div class="info-label">Dia ${escapeHtml(String(data.ordem))}</div>
                <div class="info-value">${escapeHtml(data.dataFormatada)}</div>
                <div class="info-sub">${escapeHtml(data.horarioFormatado)}</div>
            </div>
        `).join('');
    }

    if (evento.local) {
        document.getElementById('info-local').textContent = evento.local;
    }

    if (evento.cargaHorariaTotalFormatada) {
        document.getElementById('info-carga').textContent = evento.cargaHorariaTotalFormatada;
    }

    if (evento.vagasDisponiveis !== null && evento.vagasDisponiveis !== undefined) {
        document.getElementById('vagas-disponiveis').textContent = evento.vagasDisponiveis;
    }
}

function renderizarModulos(modulos) {
    const container = document.getElementById('modulos-container');

    if (!modulos || modulos.length === 0) {
        container.innerHTML = `
            <div class="modulos-empty">
                <div class="modulos-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                </div>
                <h3>Conteúdo em preparação</h3>
                <p>O conteúdo programático será divulgado em breve. Fique atento!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = modulos.map((modulo, index) => `
        <div class="modulo-card">
            <div class="modulo-header">
                <div class="modulo-numero">
                    <span class="modulo-numero-label">Módulo</span>
                    <span class="modulo-numero-value">${String(index + 1).padStart(2, '0')}</span>
                </div>
                ${modulo.cargaHorariaFormatada ?
                    `<div class="modulo-carga">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        ${modulo.cargaHorariaFormatada}
                    </div>` : ''}
            </div>
            <h3 class="modulo-titulo">${escapeHtml(modulo.titulo)}</h3>
            ${modulo.descricao ?
                `<p class="modulo-descricao">${escapeHtml(modulo.descricao)}</p>` : ''}
            ${modulo.itens && modulo.itens.length > 0 ? `
                <ul class="modulo-itens">
                    ${modulo.itens.map((item, i) => `
                        <li>
                            <span class="item-numero">${String(i + 1).padStart(2, '0')}</span>
                            ${escapeHtml(item.titulo)}
                        </li>
                    `).join('')}
                </ul>
            ` : ''}
            ${modulo.instrutores && modulo.instrutores.length > 0 ? `
                <div class="modulo-instrutores">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>${modulo.instrutores.map(i => escapeHtml(i.nome)).join(', ')}</span>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function verificarInscricoesAbertas(evento) {
    if (evento && evento.inscricoesAbertas === false) {
        document.getElementById('form-container').style.display = 'none';
        document.getElementById('closed-message').style.display = 'block';
    }

    if (evento && evento.vagasDisponiveis !== null && evento.vagasDisponiveis <= 0) {
        document.getElementById('form-container').style.display = 'none';
        document.getElementById('closed-message').style.display = 'block';
        document.querySelector('#closed-message h3').textContent = 'Vagas esgotadas';
        document.querySelector('#closed-message p').textContent =
            'Todas as vagas para este evento já foram preenchidas.';
    }
}

function setupFormulario() {
    const form = document.getElementById('form-inscricao');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            return;
        }

        const submitBtn = document.getElementById('btn-submit');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';

        const formData = {
            nome: document.getElementById('nome').value.trim(),
            email: document.getElementById('email').value.trim().toLowerCase(),
            telefone: document.getElementById('telefone').value.trim() || null,
            curso: document.getElementById('curso').value.trim(),
            periodo: document.getElementById('periodo').value.trim() || null,
            nivelProgramacao: document.getElementById('nivelProgramacao').value,
            expectativa: document.getElementById('expectativa').value.trim() || null
        };

        try {
            const checkResponse = await fetch(`${API_BASE_URL}/inscricao/check?email=${encodeURIComponent(formData.email)}`);
            if (checkResponse.ok) {
                const checkData = await checkResponse.json();
                if (checkData.exists) {
                    mostrarErro('email', 'Este e-mail já está inscrito');
                    submitBtn.disabled = false;
                    btnText.style.display = 'inline';
                    btnLoading.style.display = 'none';
                    return;
                }
            }

            const response = await fetch(`${API_BASE_URL}/inscricao`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                document.getElementById('form-container').style.display = 'none';
                document.getElementById('success-message').style.display = 'block';
                carregarContador();
            } else {
                const errorData = await response.json();
                const errorCode = errorData.errorCode;

                if (errorCode === 'EMAIL_DUPLICADO' || response.status === 409) {
                    mostrarErro('email', 'Este e-mail já está inscrito');
                } else if (errorCode === 'VAGAS_ESGOTADAS') {
                    mostrarMensagemBloqueio('Vagas esgotadas', 'Todas as vagas para este evento foram preenchidas.');
                } else if (errorCode === 'INSCRICOES_ENCERRADAS') {
                    mostrarMensagemBloqueio('Inscrições encerradas', 'As inscrições para este evento foram encerradas.');
                } else if (errorData.errors) {
                    errorData.errors.forEach(err => {
                        mostrarErro(err.field, err.message);
                    });
                } else {
                    alert('Ocorreu um erro ao processar sua inscrição. Tente novamente.');
                }
            }
        } catch (error) {
            console.error('Erro ao enviar inscricao:', error);
            alert('Erro de conexão. Verifique sua internet e tente novamente.');
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    });

    document.querySelectorAll('.form-group input, .form-group select').forEach(input => {
        input.addEventListener('input', () => {
            limparErro(input.id);
        });
    });
}

function setupCharCounter() {
    const expectativa = document.getElementById('expectativa');
    const counter = document.getElementById('expectativa-count');

    expectativa.addEventListener('input', () => {
        counter.textContent = expectativa.value.length;
    });
}

function validarFormulario() {
    let valido = true;

    limparTodosErros();

    const nome = document.getElementById('nome').value.trim();
    if (nome.length < 3) {
        mostrarErro('nome', 'Nome deve ter pelo menos 3 caracteres');
        valido = false;
    }

    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarErro('email', 'E-mail inválido');
        valido = false;
    }

    const curso = document.getElementById('curso').value.trim();
    if (!curso) {
        mostrarErro('curso', 'Curso é obrigatório');
        valido = false;
    }

    const nivel = document.getElementById('nivelProgramacao').value;
    if (!nivel) {
        mostrarErro('nivelProgramacao', 'Selecione seu nível de programação');
        valido = false;
    }

    return valido;
}

function mostrarErro(campo, mensagem) {
    const input = document.getElementById(campo);
    const errorSpan = document.getElementById(`error-${campo}`);

    if (input) {
        input.classList.add('error');
    }
    if (errorSpan) {
        errorSpan.textContent = mensagem;
    }
}

function limparErro(campo) {
    const input = document.getElementById(campo);
    const errorSpan = document.getElementById(`error-${campo}`);

    if (input) {
        input.classList.remove('error');
    }
    if (errorSpan) {
        errorSpan.textContent = '';
    }
}

function limparTodosErros() {
    document.querySelectorAll('.error-message').forEach(span => {
        span.textContent = '';
    });
    document.querySelectorAll('.form-group input, .form-group select').forEach(input => {
        input.classList.remove('error');
    });
}

function mostrarMensagemBloqueio(titulo, mensagem) {
    document.getElementById('form-container').style.display = 'none';
    const closedMsg = document.getElementById('closed-message');
    closedMsg.style.display = 'block';
    closedMsg.querySelector('h3').textContent = titulo;
    closedMsg.querySelector('p').textContent = mensagem;
    carregarContador();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function carregarInstrutores() {
    try {
        const response = await fetch(`${API_BASE_URL}/instrutores`);
        if (!response.ok) {
            throw new Error('Erro ao carregar instrutores');
        }

        const instrutores = await response.json();
        instrutores.sort((a, b) => {
            const ordemA = a.ordem !== null && a.ordem !== undefined ? a.ordem : 999;
            const ordemB = b.ordem !== null && b.ordem !== undefined ? b.ordem : 999;
            if (ordemA !== ordemB) return ordemA - ordemB;
            return a.nome.localeCompare(b.nome, 'pt-BR');
        });
        renderizarInstrutores(instrutores);
    } catch (error) {
        console.error('Erro ao carregar instrutores:', error);
        document.getElementById('instrutores-container').innerHTML =
            '<p class="no-instrutores">Informações sobre instrutores em breve.</p>';
    }
}

function renderizarInstrutores(instrutores) {
    const container = document.getElementById('instrutores-container');

    if (!instrutores || instrutores.length === 0) {
        container.innerHTML = '<p class="no-instrutores">Informações sobre instrutores em breve.</p>';
        return;
    }

    container.innerHTML = instrutores.map(instrutor => `
        <div class="instrutor-card-landing">
            <div class="instrutor-card-landing-header">
                <div class="instrutor-foto-landing">
                    <div class="instrutor-foto-landing-inner">
                        ${instrutor.fotoUrl
                            ? `<img src="${escapeHtml(instrutor.fotoUrl)}" alt="${escapeHtml(instrutor.nome)}">`
                            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
                        }
                    </div>
                </div>
                <h3 class="instrutor-nome-landing">${escapeHtml(instrutor.nome)}</h3>
                ${instrutor.localTrabalho ? `
                    <div class="instrutor-local-landing">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        ${escapeHtml(instrutor.localTrabalho)}
                    </div>
                ` : ''}
                ${instrutor.tempoCarreira ? `
                    <div class="instrutor-tempo-landing">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        ${escapeHtml(instrutor.tempoCarreira)}
                    </div>
                ` : ''}
            </div>
            <div class="instrutor-card-landing-body">
                ${instrutor.miniBio ? `<p class="instrutor-bio-landing">${escapeHtml(instrutor.miniBio)}</p>` : ''}
                ${instrutor.modulos && instrutor.modulos.length > 0 ? `
                    <div class="instrutor-modulos-landing">
                        ${instrutor.modulos.map(m => `<span class="instrutor-modulo-tag">${escapeHtml(m.titulo)}</span>`).join('')}
                    </div>
                ` : `
                    <div class="instrutor-modulos-landing">
                        <span class="instrutor-modulo-tag instrutor-geral-tag">Instrutor Geral</span>
                    </div>
                `}
                ${instrutor.linkedin ? `
                    <a href="${escapeHtml(instrutor.linkedin)}" target="_blank" rel="noopener" class="instrutor-linkedin-landing">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        Ver no LinkedIn
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function renderizarFaleConosco(evento) {
    const container = document.getElementById('footer-contact');
    container.innerHTML = ''; // Limpa qualquer conteúdo anterior

    if (evento.exibirFaleConosco && (evento.emailContato || evento.whatsappContato)) {
        let content = `
            <div class="footer-contact">
                <span class="footer-nav-title">Fale Conosco</span>
                <div class="footer-contact-links">
        `;

        if (evento.emailContato) {
            content += `
                <a href="mailto:${escapeHtml(evento.emailContato)}" target="_blank" rel="noopener" class="footer-link-contact">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span>${escapeHtml(evento.emailContato)}</span>
                </a>
            `;
        }

        if (evento.whatsappContato) {
            // Formatar WhatsApp para link (remover caracteres nao numericos)
            const whatsappLink = `https://wa.me/${evento.whatsappContato.replace(/\D/g, '')}`;
            content += `
                <a href="${whatsappLink}" target="_blank" rel="noopener" class="footer-link-contact">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <span>WhatsApp</span>
                </a>
            `;
        }

        content += `</div></div>`;
        container.innerHTML = content;
    }
}

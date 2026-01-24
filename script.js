const API_BASE_URL = 'http://localhost:8090/api/minicurso';

document.addEventListener('DOMContentLoaded', () => {
    carregarEvento();
    carregarContador();
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
            verificarInscricoesAbertas(evento);
        }
    } catch (error) {
        console.error('Erro ao carregar evento:', error);
        document.getElementById('modulos-container').innerHTML =
            '<p class="loading-placeholder">Nao foi possivel carregar o conteudo. Tente novamente mais tarde.</p>';
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
    if (evento.dataEvento) {
        const data = new Date(evento.dataEvento + 'T00:00:00');
        document.getElementById('info-data').textContent = data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    if (evento.horarioInicio && evento.horarioFim) {
        document.getElementById('info-horario').textContent =
            `${evento.horarioInicio} as ${evento.horarioFim}`;
    } else if (evento.horarioInicio) {
        document.getElementById('info-horario').textContent = evento.horarioInicio;
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
        container.innerHTML = '<p class="loading-placeholder">Conteudo programatico em breve.</p>';
        return;
    }

    container.innerHTML = modulos.map(modulo => `
        <div class="modulo-card">
            <div class="modulo-header">
                <div class="modulo-ordem">${modulo.ordem}</div>
                ${modulo.cargaHorariaFormatada ?
                    `<div class="modulo-carga">${modulo.cargaHorariaFormatada}</div>` : ''}
            </div>
            <h3 class="modulo-titulo">${escapeHtml(modulo.titulo)}</h3>
            ${modulo.descricao ?
                `<p class="modulo-descricao">${escapeHtml(modulo.descricao)}</p>` : ''}
            ${modulo.itens && modulo.itens.length > 0 ? `
                <ul class="modulo-itens">
                    ${modulo.itens.map(item => `
                        <li>${escapeHtml(item.titulo)}</li>
                    `).join('')}
                </ul>
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
            'Todas as vagas para este evento ja foram preenchidas.';
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
                    mostrarErro('email', 'Este email ja esta inscrito');
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

                if (response.status === 409 || (errorData.detail && errorData.detail.includes('Email'))) {
                    mostrarErro('email', 'Este email ja esta inscrito');
                } else if (errorData.detail && errorData.detail.includes('Vagas')) {
                    alert('Desculpe, as vagas foram esgotadas.');
                    location.reload();
                } else if (errorData.detail && errorData.detail.includes('encerradas')) {
                    alert('Desculpe, as inscricoes foram encerradas.');
                    location.reload();
                } else if (errorData.errors) {
                    errorData.errors.forEach(err => {
                        mostrarErro(err.field, err.message);
                    });
                } else {
                    alert('Ocorreu um erro ao processar sua inscricao. Tente novamente.');
                }
            }
        } catch (error) {
            console.error('Erro ao enviar inscricao:', error);
            alert('Erro de conexao. Verifique sua internet e tente novamente.');
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
        mostrarErro('email', 'Email invalido');
        valido = false;
    }

    const curso = document.getElementById('curso').value.trim();
    if (!curso) {
        mostrarErro('curso', 'Curso e obrigatorio');
        valido = false;
    }

    const nivel = document.getElementById('nivelProgramacao').value;
    if (!nivel) {
        mostrarErro('nivelProgramacao', 'Selecione seu nivel de programacao');
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

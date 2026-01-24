const API_BASE_URL = 'http://localhost:8090/api';
const AUTH_URL = `${API_BASE_URL}/auth`;
const MINICURSO_URL = `${API_BASE_URL}/minicurso`;

let currentToken = null;
let currentUser = null;
let eventoData = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');

    if (token && user) {
        currentToken = token;
        currentUser = JSON.parse(user);
        showAdminPage();
    }
}

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('form-evento').addEventListener('submit', handleSaveEvento);
    document.getElementById('btn-novo-modulo').addEventListener('click', () => abrirModalModulo());
    document.getElementById('form-modulo').addEventListener('submit', handleSaveModulo);
    document.getElementById('form-item').addEventListener('submit', handleSaveItem);
    document.getElementById('btn-export').addEventListener('click', handleExport);
    document.getElementById('search-inscricoes').addEventListener('input', handleSearch);
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const btn = document.getElementById('btn-login');

    btn.disabled = true;
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline';
    errorDiv.classList.remove('show');

    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            currentToken = data.token;
            currentUser = { username: data.username || username, roles: data.roles };

            if (!data.roles || (!data.roles.includes('ADMIN') && !data.roles.includes('ROLE_ADMIN'))) {
                errorDiv.textContent = 'Acesso negado. Usuario nao e administrador.';
                errorDiv.classList.add('show');
                return;
            }

            localStorage.setItem('admin_token', currentToken);
            localStorage.setItem('admin_user', JSON.stringify(currentUser));
            showAdminPage();
        } else {
            const error = await response.json();
            errorDiv.textContent = error.message || 'Usuario ou senha invalidos';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Erro de conexao. Tente novamente.';
        errorDiv.classList.add('show');
    } finally {
        btn.disabled = false;
        btn.querySelector('.btn-text').style.display = 'inline';
        btn.querySelector('.btn-loading').style.display = 'none';
    }
}

function handleLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    currentToken = null;
    currentUser = null;
    document.getElementById('admin-page').style.display = 'none';
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('login-form').reset();
}

function showAdminPage() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-page').style.display = 'block';
    document.getElementById('user-email').textContent = currentUser.username;
    loadDashboard();
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-${tabId}`);
    });

    switch (tabId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'evento':
            loadEvento();
            break;
        case 'modulos':
            loadModulos();
            break;
        case 'inscricoes':
            loadInscricoes();
            break;
    }
}

async function apiRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        handleLogout();
        throw new Error('Sessao expirada');
    }

    return response;
}

async function loadDashboard() {
    try {
        const [countRes, eventoRes] = await Promise.all([
            fetch(`${MINICURSO_URL}/inscricoes/count`),
            fetch(`${MINICURSO_URL}/evento`)
        ]);

        if (countRes.ok) {
            const countData = await countRes.json();
            document.getElementById('stat-inscritos').textContent = countData.total || 0;
        }

        if (eventoRes.ok) {
            const text = await eventoRes.text();
            if (text) {
                const evento = JSON.parse(text);
                if (evento) {
                    document.getElementById('stat-vagas').textContent =
                        evento.vagasDisponiveis !== null ? evento.vagasDisponiveis : '--';
                    document.getElementById('stat-modulos').textContent =
                        evento.modulos ? evento.modulos.length : 0;
                    document.getElementById('stat-status').textContent =
                        evento.inscricoesAbertas ? 'Abertas' : 'Fechadas';
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

async function loadEvento() {
    try {
        const response = await fetch(`${MINICURSO_URL}/evento`);
        if (response.ok) {
            const text = await response.text();
            eventoData = text ? JSON.parse(text) : null;
            if (eventoData) {
                document.getElementById('evento-titulo').value = eventoData.titulo || '';
                document.getElementById('evento-data').value = eventoData.dataEvento || '';
                document.getElementById('evento-horario-inicio').value = eventoData.horarioInicio || '';
                document.getElementById('evento-horario-fim').value = eventoData.horarioFim || '';
                document.getElementById('evento-local').value = eventoData.local || '';
                document.getElementById('evento-vagas').value = eventoData.quantidadeVagas || '';
                document.getElementById('evento-inscricoes-abertas').checked = eventoData.inscricoesAbertas;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar evento:', error);
    }
}

async function handleSaveEvento(e) {
    e.preventDefault();

    const data = {
        titulo: document.getElementById('evento-titulo').value,
        dataEvento: document.getElementById('evento-data').value || null,
        horarioInicio: document.getElementById('evento-horario-inicio').value || null,
        horarioFim: document.getElementById('evento-horario-fim').value || null,
        local: document.getElementById('evento-local').value || null,
        quantidadeVagas: document.getElementById('evento-vagas').value ?
            parseInt(document.getElementById('evento-vagas').value) : null,
        inscricoesAbertas: document.getElementById('evento-inscricoes-abertas').checked
    };

    try {
        const response = await apiRequest(`${MINICURSO_URL}/evento`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Configuracoes salvas com sucesso!');
            loadDashboard();
        } else {
            alert('Erro ao salvar configuracoes');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar configuracoes');
    }
}

async function loadModulos() {
    const container = document.getElementById('modulos-list');
    container.innerHTML = '<p class="empty-message">Carregando...</p>';

    try {
        const response = await fetch(`${MINICURSO_URL}/evento`);
        if (response.ok) {
            const text = await response.text();
            const evento = text ? JSON.parse(text) : null;
            if (evento && evento.modulos && evento.modulos.length > 0) {
                renderModulos(evento.modulos);
            } else {
                container.innerHTML = '<p class="empty-message">Nenhum modulo cadastrado. Cadastre o evento primeiro.</p>';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar modulos:', error);
        container.innerHTML = '<p class="empty-message">Erro ao carregar modulos.</p>';
    }
}

function renderModulos(modulos) {
    const container = document.getElementById('modulos-list');

    container.innerHTML = modulos.map(modulo => `
        <div class="modulo-item">
            <div class="modulo-header">
                <div class="modulo-info">
                    <div class="modulo-ordem">${modulo.ordem}</div>
                    <div>
                        <div class="modulo-titulo">
                            ${escapeHtml(modulo.titulo)}
                            ${!modulo.ativo ? '<span class="badge badge-inactive">Inativo</span>' : ''}
                        </div>
                        <div class="modulo-meta">
                            ${modulo.cargaHorariaFormatada || ''}
                            ${modulo.itens ? `| ${modulo.itens.length} itens` : ''}
                        </div>
                    </div>
                </div>
                <div class="modulo-actions">
                    <button class="btn btn-sm btn-outline" onclick="editarModulo(${modulo.id})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="confirmarExcluirModulo(${modulo.id})">Excluir</button>
                </div>
            </div>
            <div class="modulo-body">
                <div class="itens-list">
                    ${modulo.itens && modulo.itens.length > 0 ? modulo.itens.map(item => `
                        <div class="item-row ${!item.ativo ? 'item-inactive' : ''}">
                            <div class="item-info">
                                <span class="item-ordem">${item.ordem}.</span>
                                <span class="item-titulo">${escapeHtml(item.titulo)}</span>
                                ${!item.ativo ? '<span class="badge badge-inactive">Inativo</span>' : ''}
                            </div>
                            <div class="item-actions">
                                <button class="btn btn-sm btn-outline" onclick="editarItem(${item.id}, ${modulo.id})">Editar</button>
                                <button class="btn btn-sm btn-danger" onclick="confirmarExcluirItem(${item.id})">Excluir</button>
                            </div>
                        </div>
                    `).join('') : '<p class="empty-message">Nenhum item cadastrado.</p>'}
                </div>
                <button class="btn btn-sm btn-secondary btn-add-item" onclick="abrirModalItem(${modulo.id})">
                    + Adicionar Item
                </button>
            </div>
        </div>
    `).join('');
}

function abrirModalModulo(modulo = null) {
    document.getElementById('modal-modulo-title').textContent = modulo ? 'Editar Modulo' : 'Novo Modulo';
    document.getElementById('modulo-id').value = modulo ? modulo.id : '';
    document.getElementById('modulo-titulo').value = modulo ? modulo.titulo : '';
    document.getElementById('modulo-descricao').value = modulo ? modulo.descricao || '' : '';
    document.getElementById('modulo-ordem').value = modulo ? modulo.ordem : '';
    document.getElementById('modulo-carga').value = modulo ? modulo.cargaHoraria || '' : '';
    document.getElementById('modulo-ativo').checked = modulo ? modulo.ativo : true;
    document.getElementById('modal-modulo').style.display = 'flex';
}

function fecharModalModulo() {
    document.getElementById('modal-modulo').style.display = 'none';
    document.getElementById('form-modulo').reset();
}

async function editarModulo(id) {
    try {
        const response = await fetch(`${MINICURSO_URL}/evento`);
        if (response.ok) {
            const evento = await response.json();
            const modulo = evento.modulos.find(m => m.id === id);
            if (modulo) {
                abrirModalModulo(modulo);
            }
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function handleSaveModulo(e) {
    e.preventDefault();

    const id = document.getElementById('modulo-id').value;
    const data = {
        titulo: document.getElementById('modulo-titulo').value,
        descricao: document.getElementById('modulo-descricao').value || null,
        ordem: parseInt(document.getElementById('modulo-ordem').value),
        cargaHoraria: document.getElementById('modulo-carga').value ?
            parseInt(document.getElementById('modulo-carga').value) : null,
        ativo: document.getElementById('modulo-ativo').checked
    };

    try {
        const url = id ? `${MINICURSO_URL}/modulos/${id}` : `${MINICURSO_URL}/modulos`;
        const method = id ? 'PUT' : 'POST';

        const response = await apiRequest(url, {
            method,
            body: JSON.stringify(data)
        });

        if (response.ok) {
            fecharModalModulo();
            loadModulos();
            loadDashboard();
        } else {
            alert('Erro ao salvar modulo');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar modulo');
    }
}

function confirmarExcluirModulo(id) {
    document.getElementById('confirm-title').textContent = 'Excluir Modulo';
    document.getElementById('confirm-message').textContent =
        'Tem certeza que deseja excluir este modulo e todos os seus itens?';
    document.getElementById('btn-confirm-action').onclick = () => excluirModulo(id);
    document.getElementById('modal-confirm').style.display = 'flex';
}

async function excluirModulo(id) {
    try {
        const response = await apiRequest(`${MINICURSO_URL}/modulos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fecharModalConfirm();
            loadModulos();
            loadDashboard();
        } else {
            alert('Erro ao excluir modulo');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir modulo');
    }
}

function abrirModalItem(moduloId, item = null) {
    document.getElementById('modal-item-title').textContent = item ? 'Editar Item' : 'Novo Item';
    document.getElementById('item-id').value = item ? item.id : '';
    document.getElementById('item-modulo-id').value = moduloId;
    document.getElementById('item-titulo').value = item ? item.titulo : '';
    document.getElementById('item-descricao').value = item ? item.descricao || '' : '';
    document.getElementById('item-ordem').value = item ? item.ordem : '';
    document.getElementById('item-duracao').value = item ? item.duracao || '' : '';
    document.getElementById('item-ativo').checked = item ? item.ativo : true;
    document.getElementById('modal-item').style.display = 'flex';
}

function fecharModalItem() {
    document.getElementById('modal-item').style.display = 'none';
    document.getElementById('form-item').reset();
}

async function editarItem(itemId, moduloId) {
    try {
        const response = await fetch(`${MINICURSO_URL}/evento`);
        if (response.ok) {
            const evento = await response.json();
            const modulo = evento.modulos.find(m => m.id === moduloId);
            if (modulo) {
                const item = modulo.itens.find(i => i.id === itemId);
                if (item) {
                    abrirModalItem(moduloId, item);
                }
            }
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function handleSaveItem(e) {
    e.preventDefault();

    const id = document.getElementById('item-id').value;
    const moduloId = document.getElementById('item-modulo-id').value;
    const data = {
        titulo: document.getElementById('item-titulo').value,
        descricao: document.getElementById('item-descricao').value || null,
        ordem: parseInt(document.getElementById('item-ordem').value),
        duracao: document.getElementById('item-duracao').value ?
            parseInt(document.getElementById('item-duracao').value) : null,
        ativo: document.getElementById('item-ativo').checked
    };

    try {
        const url = id ? `${MINICURSO_URL}/itens/${id}` : `${MINICURSO_URL}/modulos/${moduloId}/itens`;
        const method = id ? 'PUT' : 'POST';

        const response = await apiRequest(url, {
            method,
            body: JSON.stringify(data)
        });

        if (response.ok) {
            fecharModalItem();
            loadModulos();
        } else {
            alert('Erro ao salvar item');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar item');
    }
}

function confirmarExcluirItem(id) {
    document.getElementById('confirm-title').textContent = 'Excluir Item';
    document.getElementById('confirm-message').textContent = 'Tem certeza que deseja excluir este item?';
    document.getElementById('btn-confirm-action').onclick = () => excluirItem(id);
    document.getElementById('modal-confirm').style.display = 'flex';
}

async function excluirItem(id) {
    try {
        const response = await apiRequest(`${MINICURSO_URL}/itens/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fecharModalConfirm();
            loadModulos();
        } else {
            alert('Erro ao excluir item');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir item');
    }
}

function fecharModalConfirm() {
    document.getElementById('modal-confirm').style.display = 'none';
}

let allInscricoes = [];

async function loadInscricoes() {
    const tbody = document.getElementById('inscricoes-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Carregando...</td></tr>';

    try {
        const response = await apiRequest(`${MINICURSO_URL}/inscricoes`);
        if (response.ok) {
            allInscricoes = await response.json();
            renderInscricoes(allInscricoes);
        }
    } catch (error) {
        console.error('Erro ao carregar inscricoes:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Erro ao carregar inscricoes.</td></tr>';
    }
}

function renderInscricoes(inscricoes) {
    const tbody = document.getElementById('inscricoes-tbody');

    if (inscricoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Nenhuma inscricao encontrada.</td></tr>';
        return;
    }

    tbody.innerHTML = inscricoes.map(inscricao => `
        <tr>
            <td>${escapeHtml(inscricao.nome)}</td>
            <td>${escapeHtml(inscricao.email)}</td>
            <td>${escapeHtml(inscricao.curso)}</td>
            <td>${inscricao.nivelProgramacao}</td>
            <td>${formatDate(inscricao.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="confirmarExcluirInscricao(${inscricao.id})">
                    Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const filtered = allInscricoes.filter(i =>
        i.nome.toLowerCase().includes(term) ||
        i.email.toLowerCase().includes(term)
    );
    renderInscricoes(filtered);
}

function confirmarExcluirInscricao(id) {
    document.getElementById('confirm-title').textContent = 'Excluir Inscricao';
    document.getElementById('confirm-message').textContent = 'Tem certeza que deseja excluir esta inscricao?';
    document.getElementById('btn-confirm-action').onclick = () => excluirInscricao(id);
    document.getElementById('modal-confirm').style.display = 'flex';
}

async function excluirInscricao(id) {
    try {
        const response = await apiRequest(`${MINICURSO_URL}/inscricoes/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fecharModalConfirm();
            loadInscricoes();
            loadDashboard();
        } else {
            alert('Erro ao excluir inscricao');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir inscricao');
    }
}

async function handleExport() {
    try {
        const response = await apiRequest(`${MINICURSO_URL}/inscricoes/export`);

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inscricoes_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } else {
            alert('Erro ao exportar');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao exportar');
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const API_BASE_URL = 'http://localhost:8090/api';
const AUTH_URL = `${API_BASE_URL}/auth`;
const MINICURSO_URL = `${API_BASE_URL}/minicurso`;

let currentToken = null;
let currentUser = null;
let eventoData = null;

// ========================================
// TOAST NOTIFICATIONS
// ========================================
function showToast(message, type = 'success', title = null) {
    const container = document.getElementById('toast-container');

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const titles = {
        success: 'Sucesso',
        error: 'Erro',
        warning: 'Atencao',
        info: 'Informacao'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title || titles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

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
    document.getElementById('items-per-page').addEventListener('change', handleItemsPerPageChange);
    document.getElementById('btn-first-page').addEventListener('click', handleFirstPage);
    document.getElementById('btn-prev-page').addEventListener('click', handlePrevPage);
    document.getElementById('btn-next-page').addEventListener('click', handleNextPage);
    document.getElementById('btn-last-page').addEventListener('click', handleLastPage);

    // Filtros por coluna
    document.getElementById('filter-nome').addEventListener('input', applyFilters);
    document.getElementById('filter-email').addEventListener('input', applyFilters);
    document.getElementById('filter-curso').addEventListener('input', applyFilters);
    document.getElementById('filter-nivel').addEventListener('change', applyFilters);
    document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);
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
            showToast('Configuracoes do evento salvas com sucesso!');
            loadDashboard();
        } else {
            showToast('Erro ao salvar configuracoes do evento', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao salvar configuracoes do evento', 'error');
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
            showToast('Modulo salvo com sucesso!');
        } else {
            showToast('Erro ao salvar modulo', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao salvar modulo', 'error');
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
            showToast('Modulo excluido com sucesso!');
        } else {
            showToast('Erro ao excluir modulo', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao excluir modulo', 'error');
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
            showToast('Item salvo com sucesso!');
        } else {
            showToast('Erro ao salvar item', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao salvar item', 'error');
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
            showToast('Item excluido com sucesso!');
        } else {
            showToast('Erro ao excluir item', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao excluir item', 'error');
    }
}

function fecharModalConfirm() {
    document.getElementById('modal-confirm').style.display = 'none';
}

let allInscricoes = [];
let filteredInscricoes = [];
let currentPage = 1;
let itemsPerPage = 10;

async function loadInscricoes() {
    const tbody = document.getElementById('inscricoes-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Carregando...</td></tr>';

    try {
        const response = await apiRequest(`${MINICURSO_URL}/inscricoes`);
        if (response.ok) {
            allInscricoes = await response.json();
            // Ordenar por nome alfabeticamente por padrao
            allInscricoes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
            filteredInscricoes = [...allInscricoes];
            currentPage = 1;
            clearFilters();
            renderInscricoes();
        }
    } catch (error) {
        console.error('Erro ao carregar inscricoes:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">Erro ao carregar inscricoes.</td></tr>';
    }
}

function applyFilters() {
    const filterNome = document.getElementById('filter-nome').value.toLowerCase();
    const filterEmail = document.getElementById('filter-email').value.toLowerCase();
    const filterCurso = document.getElementById('filter-curso').value.toLowerCase();
    const filterNivel = document.getElementById('filter-nivel').value;

    filteredInscricoes = allInscricoes.filter(i => {
        const matchNome = !filterNome || i.nome.toLowerCase().includes(filterNome);
        const matchEmail = !filterEmail || i.email.toLowerCase().includes(filterEmail);
        const matchCurso = !filterCurso || i.curso.toLowerCase().includes(filterCurso);
        const matchNivel = !filterNivel || i.nivelProgramacao === filterNivel;
        return matchNome && matchEmail && matchCurso && matchNivel;
    });

    currentPage = 1;
    renderInscricoes();
}

function clearFilters() {
    document.getElementById('filter-nome').value = '';
    document.getElementById('filter-email').value = '';
    document.getElementById('filter-curso').value = '';
    document.getElementById('filter-nivel').value = '';
    filteredInscricoes = [...allInscricoes];
    currentPage = 1;
    renderInscricoes();
}

function renderInscricoes() {
    const tbody = document.getElementById('inscricoes-tbody');

    if (filteredInscricoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">Nenhuma inscricao encontrada.</td></tr>';
        updatePagination(0, 0, 0);
        return;
    }

    // Calcular paginacao
    const totalItems = filteredInscricoes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageItems = filteredInscricoes.slice(startIndex, endIndex);

    // Render tabela
    tbody.innerHTML = pageItems.map(inscricao => `
        <tr>
            <td class="td-id">${inscricao.id}</td>
            <td>${escapeHtml(inscricao.nome)}</td>
            <td>${escapeHtml(inscricao.email)}</td>
            <td>${escapeHtml(inscricao.telefone || '-')}</td>
            <td>${escapeHtml(inscricao.curso)}</td>
            <td><span class="nivel-badge nivel-${inscricao.nivelProgramacao.toLowerCase()}">${inscricao.nivelProgramacao}</span></td>
            <td>${escapeHtml(inscricao.periodo || '-')}</td>
            <td class="td-date">${formatDate(inscricao.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="confirmarExcluirInscricao(${inscricao.id})">
                    Excluir
                </button>
            </td>
        </tr>
    `).join('');

    // Atualizar paginacao
    updatePagination(startIndex + 1, endIndex, totalItems);
    renderPaginationPages(totalPages);
}

function updatePagination(start, end, total) {
    document.getElementById('pagination-info').textContent =
        total > 0 ? `Mostrando ${start}-${end} de ${total}` : 'Nenhum resultado';

    const totalPages = Math.ceil(total / itemsPerPage);
    document.getElementById('btn-first-page').disabled = currentPage <= 1;
    document.getElementById('btn-prev-page').disabled = currentPage <= 1;
    document.getElementById('btn-next-page').disabled = currentPage >= totalPages;
    document.getElementById('btn-last-page').disabled = currentPage >= totalPages;
}

function renderPaginationPages(totalPages) {
    const container = document.getElementById('pagination-pages');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let pages = [];

    // Sempre mostrar primeira pagina
    pages.push(1);

    // Paginas ao redor da atual
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
    }

    // Sempre mostrar ultima pagina
    if (totalPages > 1) pages.push(totalPages);

    // Ordenar e remover duplicatas
    pages = [...new Set(pages)].sort((a, b) => a - b);

    let html = '';
    let lastPage = 0;

    pages.forEach(page => {
        if (lastPage && page - lastPage > 1) {
            html += '<span class="page-btn dots">...</span>';
        }
        html += `<button class="page-btn ${page === currentPage ? 'active' : ''}" onclick="goToPage(${page})">${page}</button>`;
        lastPage = page;
    });

    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderInscricoes();
}

function handleItemsPerPageChange(e) {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderInscricoes();
}

function handleFirstPage() {
    currentPage = 1;
    renderInscricoes();
}

function handlePrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderInscricoes();
    }
}

function handleNextPage() {
    const totalPages = Math.ceil(filteredInscricoes.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderInscricoes();
    }
}

function handleLastPage() {
    const totalPages = Math.ceil(filteredInscricoes.length / itemsPerPage);
    currentPage = totalPages;
    renderInscricoes();
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
            showToast('Inscricao excluida com sucesso!');
        } else {
            showToast('Erro ao excluir inscricao', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao excluir inscricao', 'error');
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
            showToast('Exportacao concluida com sucesso!');
        } else {
            showToast('Erro ao exportar inscricoes', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao exportar inscricoes', 'error');
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

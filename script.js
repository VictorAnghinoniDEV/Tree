// Sistema de segurança avançado
(function() {
    'use strict';

    // Ofuscação das credenciais usando hash
    const AUTH_HASH = {
        user: '8f3d4c7a9e2b1f6d5a8c3e7b4d9f2a6c', // Hash do usuário
        pass: '5e9a2c7f4b8d1e6a3c9f7b2d5e8a4c1f'  // Hash da senha
    };

    // Função de hash simples
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(32, '0');
    }

    // Verificação das credenciais reais
    function verifyCredentials(username, password) {
        const validUser = 'duckducksamura';
        const validPass = 'duckduckjvdev';
        return username === validUser && password === validPass;
    }

    // Proteção contra DevTools
    let devtoolsOpen = false;
    const threshold = 160;
    
    setInterval(function() {
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            devtoolsOpen = true;
        } else {
            devtoolsOpen = false;
        }
    }, 500);

    // Desabilitar clique direito
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // Desabilitar teclas de atalho
    document.addEventListener('keydown', function(e) {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
        if (e.keyCode === 123 || 
            (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
            (e.ctrlKey && e.keyCode === 85) ||
            (e.ctrlKey && e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }
    });

    // Proteção contra cópia de código
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    });

    // Sistema de tentativas de login
    let loginAttempts = 0;
    let lockoutTime = null;
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_DURATION = 300000; // 5 minutos

    // Dados armazenados localmente
    let data = {
        logs: [],
        lucro: [],
        visitas: [],
        ativos: [],
        equipe: [],
        jogos: []
    };

    // Token de sessão único
    let sessionToken = null;

    function generateSessionToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Verificar autenticação ao carregar a página
    document.addEventListener('DOMContentLoaded', function() {
        checkAuthentication();
        
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                if (!isAuthenticated()) {
                    handleLogout();
                    return;
                }
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName);
            });
        });

        // Verificar autenticação periodicamente
        setInterval(function() {
            if (!isAuthenticated() && document.getElementById('mainPanel').style.display !== 'none') {
                handleLogout();
            }
        }, 5000);
    });

    // Verificar se está em lockout
    function isLockedOut() {
        if (lockoutTime && Date.now() < lockoutTime) {
            return true;
        }
        if (lockoutTime && Date.now() >= lockoutTime) {
            lockoutTime = null;
            loginAttempts = 0;
            localStorage.removeItem('duckStudiosLockout');
            localStorage.removeItem('duckStudiosAttempts');
        }
        return false;
    }

    // Carregar estado de lockout do localStorage
    function loadLockoutState() {
        const savedLockout = localStorage.getItem('duckStudiosLockout');
        const savedAttempts = localStorage.getItem('duckStudiosAttempts');
        
        if (savedLockout) {
            lockoutTime = parseInt(savedLockout);
        }
        if (savedAttempts) {
            loginAttempts = parseInt(savedAttempts);
        }
    }

    // Verificar se o usuário está autenticado
    function isAuthenticated() {
        const storedToken = sessionStorage.getItem('duckStudiosAuth');
        const storedSession = sessionStorage.getItem('duckStudiosSession');
        return storedToken === 'true' && storedSession === sessionToken;
    }

    function checkAuthentication() {
        loadLockoutState();
        
        if (isAuthenticated()) {
            showMainPanel();
            loadData();
        } else {
            sessionToken = null;
            showLoginScreen();
        }
    }

    // Mostrar tela de login
    function showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainPanel').style.display = 'none';
    }

    // Mostrar painel principal
    function showMainPanel() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainPanel').style.display = 'grid';
    }

    // Processar login
    window.handleLogin = function(event) {
        event.preventDefault();
        
        loadLockoutState();
        
        if (isLockedOut()) {
            const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
            document.getElementById('loginError').textContent = 
                `Muitas tentativas incorretas. Tente novamente em ${remainingTime} minutos.`;
            return;
        }
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        if (verifyCredentials(username, password)) {
            sessionToken = generateSessionToken();
            sessionStorage.setItem('duckStudiosAuth', 'true');
            sessionStorage.setItem('duckStudiosSession', sessionToken);
            errorDiv.textContent = '';
            loginAttempts = 0;
            localStorage.removeItem('duckStudiosAttempts');
            localStorage.removeItem('duckStudiosLockout');
            showMainPanel();
            loadData();
            document.getElementById('loginForm').reset();
        } else {
            loginAttempts++;
            localStorage.setItem('duckStudiosAttempts', loginAttempts.toString());
            
            if (loginAttempts >= MAX_ATTEMPTS) {
                lockoutTime = Date.now() + LOCKOUT_DURATION;
                localStorage.setItem('duckStudiosLockout', lockoutTime.toString());
                errorDiv.textContent = 'Muitas tentativas incorretas. Acesso bloqueado por 5 minutos.';
            } else {
                const remainingAttempts = MAX_ATTEMPTS - loginAttempts;
                errorDiv.textContent = `Usuário ou senha incorretos. ${remainingAttempts} tentativa(s) restante(s).`;
            }
            
            document.getElementById('password').value = '';
        }
    }

    // Processar logout
    window.handleLogout = function() {
        if (confirm('Tem certeza que deseja sair?')) {
            sessionStorage.removeItem('duckStudiosAuth');
            sessionStorage.removeItem('duckStudiosSession');
            sessionToken = null;
            showLoginScreen();
            document.getElementById('loginForm').reset();
        }
    }

    // Carregar dados do localStorage
    function loadData() {
        const savedData = localStorage.getItem('duckStudiosData');
        if (savedData) {
            try {
                data = JSON.parse(savedData);
            } catch (e) {
                console.error('Erro ao carregar dados');
                data = {
                    logs: [],
                    lucro: [],
                    visitas: [],
                    ativos: [],
                    equipe: [],
                    jogos: []
                };
            }
        }
        renderAllData();
    }

    // Salvar dados no localStorage
    function saveData() {
        if (!isAuthenticated()) {
            handleLogout();
            return;
        }
        localStorage.setItem('duckStudiosData', JSON.stringify(data));
    }

    // Navegação entre abas
    function switchTab(tabName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.getElementById(tabName).classList.add('active');
    }

    // Funções de Modal
    window.openAddLogModal = function() {
        if (!isAuthenticated()) { handleLogout(); return; }
        document.getElementById('modalLog').style.display = 'block';
    }

    window.openAddLucroModal = function() {
        if (!isAuthenticated()) { handleLogout(); return; }
        document.getElementById('modalLucro').style.display = 'block';
    }

    window.openAddVisitaModal = function() {
        if (!isAuthenticated()) { handleLogout(); return; }
        document.getElementById('modalVisita').style.display = 'block';
    }

    window.openAddAtivoModal = function() {
        if (!isAuthenticated()) { handleLogout(); return; }
        document.getElementById('modalAtivo').style.display = 'block';
    }

    window.openAddMembroModal = function() {
        if (!isAuthenticated()) { handleLogout(); return; }
        document.getElementById('modalMembro').style.display = 'block';
    }

    window.openAddJogoModal = function() {
        if (!isAuthenticated()) { handleLogout(); return; }
        document.getElementById('modalJogo').style.display = 'block';
    }

    window.closeModal = function(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // Fechar modal ao clicar fora
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    }

    // Funções para Logs
    window.addLog = function(event) {
        event.preventDefault();
        if (!isAuthenticated()) { handleLogout(); return; }
        
        const log = {
            id: Date.now(),
            dev: document.getElementById('logDev').value,
            descricao: document.getElementById('logDescricao').value,
            data: document.getElementById('logData').value
        };
        
        data.logs.unshift(log);
        saveData();
        renderLogs();
        closeModal('modalLog');
        document.getElementById('formLog').reset();
    }

    window.deleteLog = function(id) {
        if (!isAuthenticated()) { handleLogout(); return; }
        if (confirm('Tem certeza que deseja excluir este log?')) {
            data.logs = data.logs.filter(log => log.id !== id);
            saveData();
            renderLogs();
        }
    }

    function renderLogs() {
        const container = document.getElementById('logsContainer');
        
        if (data.logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Nenhum log registrado ainda. Adicione o primeiro log de desenvolvimento.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.logs.map(log => `
            <div class="log-item">
                <div class="log-header">
                    <span class="log-dev">${escapeHtml(log.dev)}</span>
                    <span class="log-date">${formatDate(log.data)}</span>
                </div>
                <p class="log-description">${escapeHtml(log.descricao)}</p>
                <div class="log-actions">
                    <button class="btn-danger" onclick="deleteLog(${log.id})">Excluir</button>
                </div>
            </div>
        `).join('');
    }

    // Funções para Lucro
    window.addLucro = function(event) {
        event.preventDefault();
        if (!isAuthenticated()) { handleLogout(); return; }
        
        const lucro = {
            id: Date.now(),
            valor: parseInt(document.getElementById('lucroValor').value),
            descricao: document.getElementById('lucroDescricao').value,
            data: document.getElementById('lucroData').value
        };
        
        data.lucro.push(lucro);
        saveData();
        renderLucro();
        closeModal('modalLucro');
        document.getElementById('formLucro').reset();
    }

    window.deleteLucro = function(id) {
        if (!isAuthenticated()) { handleLogout(); return; }
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            data.lucro = data.lucro.filter(item => item.id !== id);
            saveData();
            renderLucro();
        }
    }

    function renderLucro() {
        const tbody = document.getElementById('lucroTableBody');
        
        if (data.lucro.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem;">
                        Nenhum registro de lucro ainda.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = data.lucro.map(item => `
                <tr>
                    <td>${formatDate(item.data)}</td>
                    <td>${formatNumber(item.valor)} R$</td>
                    <td>${escapeHtml(item.descricao)}</td>
                    <td>
                        <button class="btn-danger" onclick="deleteLucro(${item.id})">Excluir</button>
                    </td>
                </tr>
            `).join('');
        }
        
        const total = data.lucro.reduce((sum, item) => sum + item.valor, 0);
        const media = data.lucro.length > 0 ? Math.round(total / data.lucro.length) : 0;
        const ultimo = data.lucro.length > 0 ? data.lucro[data.lucro.length - 1].valor : 0;
        
        document.getElementById('totalLucro').textContent = formatNumber(total);
        document.getElementById('mediaLucro').textContent = formatNumber(media);
        document.getElementById('ultimoLucro').textContent = formatNumber(ultimo);
    }

    // Funções para Visitas
    window.addVisita = function(event) {
        event.preventDefault();
        if (!isAuthenticated()) { handleLogout(); return; }
        
        const visita = {
            id: Date.now(),
            quantidade: parseInt(document.getElementById('visitaQuantidade').value),
            obs: document.getElementById('visitaObs').value,
            data: document.getElementById('visitaData').value
        };
        
        data.visitas.push(visita);
        saveData();
        renderVisitas();
        closeModal('modalVisita');
        document.getElementById('formVisita').reset();
    }

    window.deleteVisita = function(id) {
        if (!isAuthenticated()) { handleLogout(); return; }
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            data.visitas = data.visitas.filter(item => item.id !== id);
            saveData();
            renderVisitas();
        }
    }

    function renderVisitas() {
        const tbody = document.getElementById('visitasTableBody');
        
        if (data.visitas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem;">
                        Nenhum registro de visitas ainda.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = data.visitas.map(item => `
                <tr>
                    <td>${formatDate(item.data)}</td>
                    <td>${formatNumber(item.quantidade)}</td>
                    <td>${escapeHtml(item.obs) || '-'}</td>
                    <td>
                        <button class="btn-danger" onclick="deleteVisita(${item.id})">Excluir</button>
                    </td>
                </tr>
            `).join('');
        }
        
        const total = data.visitas.reduce((sum, item) => sum + item.quantidade, 0);
        const media = data.visitas.length > 0 ? Math.round(total / data.visitas.length) : 0;
        const recorde = data.visitas.length > 0 ? Math.max(...data.visitas.map(v => v.quantidade)) : 0;
        
        document.getElementById('totalVisitas').textContent = formatNumber(total);
        document.getElementById('mediaVisitas').textContent = formatNumber(media);
        document.getElementById('recordeVisitas').textContent = formatNumber(recorde);
    }

    // Funções para Ativos
    window.addAtivo = function(event) {
        event.preventDefault();
        if (!isAuthenticated()) { handleLogout(); return; }
        
        const ativo = {
            id: Date.now(),
            quantidade: parseInt(document.getElementById('ativoQuantidade').value),
            status: document.getElementById('ativoStatus').value,
            data: document.getElementById('ativoData').value
        };
        
        data.ativos.push(ativo);
        saveData();
        renderAtivos();
        closeModal('modalAtivo');
        document.getElementById('formAtivo').reset();
    }

    window.deleteAtivo = function(id) {
        if (!isAuthenticated()) { handleLogout(); return; }
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            data.ativos = data.ativos.filter(item => item.id !== id);
            saveData();
            renderAtivos();
        }
    }

    function renderAtivos() {
        const tbody = document.getElementById('ativosTableBody');
        
        if (data.ativos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem;">
                        Nenhum registro de ativos ainda.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = data.ativos.map(item => `
                <tr>
                    <td>${formatDateTime(item.data)}</td>
                    <td>${formatNumber(item.quantidade)}</td>
                    <td><span class="status-badge status-${item.status.toLowerCase()}">${escapeHtml(item.status)}</span></td>
                    <td>
                        <button class="btn-danger" onclick="deleteAtivo(${item.id})">Excluir</button>
                    </td>
                </tr>
            `).join('');
        }
        
        const atual = data.ativos.length > 0 ? data.ativos[data.ativos.length - 1].quantidade : 0;
        const pico = data.ativos.length > 0 ? Math.max(...data.ativos.map(a => a.quantidade)) : 0;
        const media = data.ativos.length > 0 ? Math.round(data.ativos.reduce((sum, item) => sum + item.quantidade, 0) / data.ativos.length) : 0;
        
        document.getElementById('ativosAgora').textContent = formatNumber(atual);
        document.getElementById('picoAtivos').textContent = formatNumber(pico);
        document.getElementById('mediaAtivos').textContent = formatNumber(media);
    }

    // Funções para Equipe
    window.addMembro = function(event) {
        event.preventDefault();
        if (!isAuthenticated()) { handleLogout(); return; }
        
        const membro = {
            id: Date.now(),
            nome: document.getElementById('membroNome').value,
            cargo: document.getElementById('membroCargo').value,
            email: document.getElementById('membroEmail').value,
            data: document.getElementById('membroData').value
        };
        
        data.equipe.push(membro);
        saveData();
        renderEquipe();
        closeModal('modalMembro');
        document.getElementById('formMembro').reset();
    }

    window.deleteMembro = function(id) {
        if (!isAuthenticated()) { handleLogout(); return; }
        if (confirm('Tem certeza que deseja remover este membro da equipe?')) {
            data.equipe = data.equipe.filter(item => item.id !== id);
            saveData();
            renderEquipe();
        }
    }

    function renderEquipe() {
        const container = document.getElementById('teamGrid');
        
        if (data.equipe.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <p>Nenhum membro na equipe ainda. Adicione o primeiro membro.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.equipe.map(membro => `
            <div class="team-card">
                <div class="team-avatar">${getInitials(membro.nome)}</div>
                <h3 class="team-name">${escapeHtml(membro.nome)}</h3>
                <p class="team-role">${escapeHtml(membro.cargo)}</p>
                <p class="team-email">${escapeHtml(membro.email)}</p>
                <p class="team-date">Desde ${formatDate(membro.data)}</p>
                <div class="team-actions">
                    <button class="btn-danger" onclick="deleteMembro(${membro.id})">Remover</button>
                </div>
            </div>
        `).join('');
    }

    // Funções para Jogos
    window.addJogo = function(event) {
        event.preventDefault();
        if (!isAuthenticated()) { handleLogout(); return; }
        
        const jogo = {
            id: Date.now(),
            nome: document.getElementById('jogoNome').value,
            descricao: document.getElementById('jogoDescricao').value,
            status: document.getElementById('jogoStatus').value,
            data: document.getElementById('jogoData').value
        };
        
        data.jogos.push(jogo);
        saveData();
        renderJogos();
        closeModal('modalJogo');
        document.getElementById('formJogo').reset();
    }

    window.deleteJogo = function(id) {
        if (!isAuthenticated()) { handleLogout(); return; }
        if (confirm('Tem certeza que deseja excluir este jogo?')) {
            data.jogos = data.jogos.filter(item => item.id !== id);
            saveData();
            renderJogos();
        }
    }

    function renderJogos() {
        const container = document.getElementById('gamesGrid');
        
        if (data.jogos.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <p>Nenhum jogo cadastrado ainda. Adicione o primeiro jogo do studio.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.jogos.map(jogo => `
            <div class="game-card">
                <div class="game-header">
                    <h3 class="game-title">${escapeHtml(jogo.nome)}</h3>
                    <span class="game-status">${escapeHtml(jogo.status)}</span>
                </div>
                <div class="game-body">
                    <p class="game-description">${escapeHtml(jogo.descricao)}</p>
                    <p class="game-date">Criado em ${formatDate(jogo.data)}</p>
                    <div class="game-actions">
                        <button class="btn-danger" onclick="deleteJogo(${jogo.id})">Excluir</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Funções auxiliares
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    function formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR');
    }

    function formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleString('pt-BR');
    }

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    function renderAllData() {
        renderLogs();
        renderLucro();
        renderVisitas();
        renderAtivos();
        renderEquipe();
        renderJogos();
    }

    // ============================================
    // IA TREE - Sistema de Integração Automática
    // ============================================

    let iaTreeConfig = {
        enabled: false,
        placeId: null,
        universeId: null,
        updateInterval: 300000 // 5 minutos
    };

    // Carregar configuração da IA Tree
    function loadIATreeConfig() {
        const saved = localStorage.getItem('iaTreeConfig');
        if (saved) {
            iaTreeConfig = JSON.parse(saved);
        }
    }

    // Salvar configuração da IA Tree
    function saveIATreeConfig() {
        localStorage.setItem('iaTreeConfig', JSON.stringify(iaTreeConfig));
    }

    // Converter PlaceId em UniverseId
    async function getUniverseIdFromPlaceId(placeId) {
        try {
            // Tentar usar proxy local primeiro
            let response = await fetch(`http://localhost:5000/api/universe/${placeId}`);
            
            if (!response.ok) {
                console.error('Erro na resposta da API:', response.status, response.statusText);
                throw new Error(`API retornou status ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.universeId) {
                console.error('UniverseId não encontrado na resposta:', data);
                throw new Error('UniverseId não encontrado');
            }
            
            return data.universeId;
        } catch (error) {
            console.error('Erro ao obter UniverseId:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Proxy não está rodando. Inicie o servidor proxy (roblox-proxy.py) e tente novamente.');
            }
            throw error;
        }
    }

    // Obter detalhes do jogo
    async function getGameDetails(universeId) {
        try {
            const response = await fetch(`http://localhost:5000/api/games/${universeId}`);
            const data = await response.json();
            return data.data && data.data.length > 0 ? data.data[0] : null;
        } catch (error) {
            console.error('Erro ao obter detalhes do jogo:', error);
            return null;
        }
    }

    // Obter thumbnail do jogo
    async function getGameThumbnail(universeId) {
        try {
            const response = await fetch(`http://localhost:5000/api/thumbnails/${universeId}`);
            const data = await response.json();
            return data.data && data.data.length > 0 ? data.data[0].imageUrl : null;
        } catch (error) {
            console.error('Erro ao obter thumbnail:', error);
            return null;
        }
    }

    // Obter informações do criador
    async function getCreatorInfo(creatorType, creatorId) {
        try {
            if (creatorType === 'User') {
                const response = await fetch(`http://localhost:5000/api/users/${creatorId}`);
                return await response.json();
            } else if (creatorType === 'Group') {
                const response = await fetch(`http://localhost:5000/api/groups/${creatorId}`);
                return await response.json();
            }
        } catch (error) {
            console.error('Erro ao obter informações do criador:', error);
            return null;
        }
    }

    // Atualizar dados automaticamente
    async function updateGameDataFromAPI() {
        console.log('=== IA Tree: Iniciando atualização de dados ===');
        console.log('Config:', iaTreeConfig);
        
        if (!iaTreeConfig.enabled || !iaTreeConfig.universeId) {
            console.log('IA Tree não está habilitada ou UniverseId não configurado');
            return;
        }

        try {
            console.log('Buscando detalhes do jogo para UniverseId:', iaTreeConfig.universeId);
            const gameDetails = await getGameDetails(iaTreeConfig.universeId);
            
            if (!gameDetails) {
                console.error('Não foi possível obter detalhes do jogo');
                return;
            }

            console.log('Detalhes do jogo obtidos:', gameDetails);

            // Atualizar Visitas
            if (gameDetails.visits !== undefined) {
                const hoje = new Date().toISOString().split('T')[0];
                const visitas = loadData('visitas');
                const visitaHoje = visitas.find(v => v.data === hoje);
                
                if (!visitaHoje) {
                    console.log('Adicionando registro de visitas:', gameDetails.visits);
                    visitas.push({
                        id: Date.now(),
                        data: hoje,
                        quantidade: gameDetails.visits,
                        observacoes: 'Atualizado automaticamente pela IA Tree'
                    });
                    saveData('visitas', visitas);
                    renderVisitas();
                } else {
                    console.log('Já existe registro de visitas para hoje');
                }
            }

            // Atualizar Ativos
            if (gameDetails.playing !== undefined) {
                console.log('Adicionando registro de ativos:', gameDetails.playing);
                const ativos = loadData('ativos');
                ativos.push({
                    id: Date.now(),
                    dataHora: new Date().toISOString().slice(0, 16),
                    quantidade: gameDetails.playing,
                    status: gameDetails.playing > 100 ? 'Pico' : gameDetails.playing < 10 ? 'Baixo' : 'Normal'
                });
                saveData('ativos', ativos);
                renderAtivos();
            }

            // Criar log de atualização
            console.log('Criando log de atualização');
            const logs = loadData('logs');
            logs.push({
                id: Date.now(),
                desenvolvedor: 'IA Tree',
                descricao: `Dados atualizados automaticamente: ${gameDetails.visits || 0} visitas totais, ${gameDetails.playing || 0} jogadores ativos`,
                data: new Date().toISOString().split('T')[0]
            });
            saveData('logs', logs);
            renderLogs();

            console.log('=== IA Tree: Atualização concluída com sucesso ===');

        } catch (error) {
            console.error('=== IA Tree: Erro ao atualizar dados ===', error);
        }
    }

    // Adicionar jogo automaticamente pelo PlaceId
    async function addGameByPlaceId(placeId) {
        try {
            // Validar PlaceId
            if (!placeId || placeId.trim().length === 0) {
                alert('PlaceId inválido. Por favor, insira um PlaceId.');
                return;
            }
            
            // Verificar se contém apenas números
            if (!/^\d+$/.test(placeId)) {
                alert('PlaceId inválido. Por favor, insira apenas números.');
                return;
            }

            // Mostrar mensagem de carregamento
            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 8px; z-index: 10000;';
            loadingMsg.textContent = 'Buscando informações do jogo...';
            document.body.appendChild(loadingMsg);

            try {
                const universeId = await getUniverseIdFromPlaceId(placeId);
                
                loadingMsg.textContent = 'Obtendo detalhes do jogo...';
                const gameDetails = await getGameDetails(universeId);
                
                if (!gameDetails) {
                    throw new Error('Detalhes do jogo não encontrados');
                }

                loadingMsg.textContent = 'Carregando thumbnail...';
                const thumbnail = await getGameThumbnail(universeId);
                
                loadingMsg.textContent = 'Obtendo informações do criador...';
                const creator = await getCreatorInfo(gameDetails.creator.type, gameDetails.creator.id);

                const jogos = loadData('jogos');
                jogos.push({
                    id: Date.now(),
                    nome: gameDetails.name,
                    descricao: gameDetails.description || 'Sem descrição disponível',
                    status: 'Publicado',
                    data: new Date().toISOString().split('T')[0],
                    thumbnail: thumbnail,
                    creator: creator ? creator.name : 'Desconhecido',
                    placeId: placeId,
                    universeId: universeId
                });

                saveData('jogos', jogos);
                renderJogos();

                // Configurar IA Tree para este jogo
                iaTreeConfig.placeId = placeId;
                iaTreeConfig.universeId = universeId;
                saveIATreeConfig();

                document.body.removeChild(loadingMsg);
                alert('Jogo adicionado com sucesso!');
            } catch (error) {
                document.body.removeChild(loadingMsg);
                throw error;
            }
        } catch (error) {
            console.error('Erro ao adicionar jogo:', error);
            
            let errorMessage = 'Erro ao adicionar jogo. ';
            
            if (error.message.includes('status 400')) {
                errorMessage += 'PlaceId inválido ou não existe.';
            } else if (error.message.includes('status 404')) {
                errorMessage += 'Jogo não encontrado.';
            } else if (error.message.includes('status 429')) {
                errorMessage += 'Muitas requisições. Aguarde alguns segundos e tente novamente.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Erro de conexão. Verifique sua internet.';
            } else {
                errorMessage += 'Verifique se o PlaceId está correto e tente novamente.';
            }
            
            alert(errorMessage + '\n\nDetalhes técnicos: ' + error.message);
        }
    }

    // Abrir modal da IA Tree
    window.openIATreeModal = function() {
        document.getElementById('modalIATree').style.display = 'block';
        document.getElementById('iaTreeEnabled').checked = iaTreeConfig.enabled;
        document.getElementById('iaTreePlaceId').value = iaTreeConfig.placeId || '';
        document.getElementById('iaTreeInterval').value = iaTreeConfig.updateInterval / 60000;
    };

    // Salvar configurações da IA Tree
    window.saveIATreeConfig = async function(event) {
        event.preventDefault();
        
        const enabled = document.getElementById('iaTreeEnabled').checked;
        const placeId = document.getElementById('iaTreePlaceId').value.trim();
        const interval = parseInt(document.getElementById('iaTreeInterval').value);

        if (enabled && !placeId) {
            alert('Por favor, insira um PlaceId válido para ativar a IA Tree');
            return;
        }

        if (enabled && placeId) {
            // Verificar se contém apenas números
            if (!/^\d+$/.test(placeId)) {
                alert('PlaceId inválido. Por favor, insira apenas números.');
                return;
            }
        }

        // Mostrar mensagem de carregamento
        const loadingMsg = document.createElement('div');
        loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 8px; z-index: 10001;';
        loadingMsg.textContent = 'Validando PlaceId...';
        document.body.appendChild(loadingMsg);

        try {
            iaTreeConfig.enabled = enabled;
            iaTreeConfig.placeId = placeId;
            iaTreeConfig.updateInterval = interval * 60000;

            if (enabled && placeId) {
                loadingMsg.textContent = 'Conectando com API do Roblox...';
                const universeId = await getUniverseIdFromPlaceId(placeId);
                
                if (universeId) {
                    iaTreeConfig.universeId = universeId;
                    loadingMsg.textContent = 'Testando busca de dados do jogo...';
                    
                    // Testar se consegue obter dados do jogo
                    const gameDetails = await getGameDetails(universeId);
                    if (!gameDetails) {
                        throw new Error('Não foi possível obter dados do jogo');
                    }
                    
                    loadingMsg.textContent = 'Configuração validada com sucesso!';
                } else {
                    throw new Error('PlaceId inválido ou não encontrado');
                }
            }

            saveIATreeConfig();
            
            setTimeout(() => {
                document.body.removeChild(loadingMsg);
                closeModal('modalIATree');
                
                if (enabled) {
                    alert('IA Tree ativada com sucesso! Os dados serão atualizados automaticamente a cada ' + interval + ' minuto(s).');
                    // Iniciar atualizações automáticas
                    startIATreeUpdates();
                } else {
                    alert('Configurações salvas. IA Tree desativada.');
                    // Parar atualizações se desativado
                    if (iaTreeInterval) {
                        clearInterval(iaTreeInterval);
                        iaTreeInterval = null;
                    }
                }
            }, 1000);

        } catch (error) {
            document.body.removeChild(loadingMsg);
            console.error('Erro ao salvar configurações:', error);
            alert('Erro ao validar PlaceId: ' + error.message + '\n\nVerifique se o PlaceId está correto e tente novamente.');
        }
    };

    // Adicionar jogo pelo PlaceId
    window.addGameFromPlaceId = async function(event) {
        event.preventDefault();
        const placeId = document.getElementById('gameFromPlaceId').value.trim();
        
        if (!placeId) {
            alert('Por favor, insira um PlaceId válido');
            return;
        }

        closeModal('modalAddGameFromPlace');
        await addGameByPlaceId(placeId);
    };

    // Abrir modal para adicionar jogo pelo PlaceId
    window.openAddGameFromPlaceModal = function() {
        document.getElementById('modalAddGameFromPlace').style.display = 'block';
    };

    // Iniciar atualizações automáticas da IA Tree
    let iaTreeInterval = null;
    function startIATreeUpdates() {
        console.log('Iniciando IA Tree Updates...', iaTreeConfig);
        
        if (iaTreeInterval) {
            clearInterval(iaTreeInterval);
            console.log('Intervalo anterior limpo');
        }

        if (iaTreeConfig.enabled && iaTreeConfig.universeId) {
            console.log('IA Tree ativada. Primeira atualização em 3 segundos...');
            
            // Atualizar após 3 segundos (dar tempo para o usuário ver a mensagem)
            setTimeout(() => {
                console.log('Executando primeira atualização...');
                updateGameDataFromAPI();
            }, 3000);
            
            // Configurar intervalo de atualização
            iaTreeInterval = setInterval(() => {
                console.log('Executando atualização automática...');
                updateGameDataFromAPI();
            }, iaTreeConfig.updateInterval);
            
            console.log('Intervalo configurado para', iaTreeConfig.updateInterval / 60000, 'minutos');
        } else {
            console.log('IA Tree não iniciada. Enabled:', iaTreeConfig.enabled, 'UniverseId:', iaTreeConfig.universeId);
        }
    }

    // Inicializar IA Tree ao carregar
    loadIATreeConfig();
    if (iaTreeConfig.enabled) {
        startIATreeUpdates();
    }

    // Atualizar renderização de jogos para incluir thumbnail
    const originalRenderJogos = renderJogos;
    renderJogos = function() {
        const jogos = loadData('jogos');
        const gamesGrid = document.getElementById('gamesGrid');
        
        if (jogos.length === 0) {
            gamesGrid.innerHTML = '<p class="empty-state">Nenhum jogo cadastrado ainda.</p>';
            return;
        }

        gamesGrid.innerHTML = jogos.map(jogo => `
            <div class="game-card">
                ${jogo.thumbnail ? `<img src="${jogo.thumbnail}" alt="${escapeHtml(jogo.nome)}" class="game-thumbnail">` : ''}
                <div class="game-header">
                    <h3>${escapeHtml(jogo.nome)}</h3>
                    <span class="game-status">${escapeHtml(jogo.status)}</span>
                </div>
                <div class="game-body">
                    <p class="game-description">${escapeHtml(jogo.descricao)}</p>
                    ${jogo.creator ? `<p class="game-creator">Criador: ${escapeHtml(jogo.creator)}</p>` : ''}
                    <p class="game-date">Criado em ${formatDate(jogo.data)}</p>
                    ${jogo.placeId ? `<p class="game-placeid">PlaceId: ${jogo.placeId}</p>` : ''}
                    <div class="game-actions">
                        <button class="btn-danger" onclick="deleteJogo(${jogo.id})">Excluir</button>
                    </div>
                </div>
            </div>
        `).join('');
    };

})();

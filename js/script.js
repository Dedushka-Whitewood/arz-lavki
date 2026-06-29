// ================================================================
//  КОНФИГУРАЦИЯ
// ================================================================
const API_BASE = 'https://va-ta.com/api';

const ARZ_SERVERS = [
    { name: 'Все', id: -1 },
    { name: 'Vice City', id: 0 },
    { name: 'Phoenix', id: 1 },
    { name: 'Tucson', id: 2 },
    { name: 'Scottdale', id: 3 },
    { name: 'Chandler', id: 4 },
    { name: 'Brainburg', id: 5 },
    { name: 'SaintRose', id: 6 },
    { name: 'Mesa', id: 7 },
    { name: 'Red Rock', id: 8 },
    { name: 'Yuma', id: 9 },
    { name: 'Surprise', id: 10 },
    { name: 'Prescott', id: 11 },
    { name: 'Glendale', id: 12 },
    { name: 'Kingman', id: 13 },
    { name: 'Winslow', id: 14 },
    { name: 'Payson', id: 15 },
    { name: 'Gilbert', id: 16 },
    { name: 'Show Low', id: 17 },
    { name: 'CasaGrande', id: 18 },
    { name: 'Page', id: 19 },
    { name: 'Sun City', id: 20 },
    { name: 'Queen Creek', id: 21 },
    { name: 'Sedona', id: 22 },
    { name: 'Holiday', id: 23 },
    { name: 'Wednesday', id: 24 },
    { name: 'Yava', id: 25 },
    { name: 'Faraway', id: 26 },
    { name: 'Bumble Bee', id: 27 },
    { name: 'Christmas', id: 28 },
    { name: 'Mirage', id: 29 },
    { name: 'Love', id: 30 },
    { name: 'Drake', id: 31 },
    { name: 'Space', id: 32 },
    { name: 'Mobile I', id: 101 },
    { name: 'Mobile II', id: 102 },
    { name: 'Mobile III', id: 103 },
];

// ================================================================
//  СОСТОЯНИЕ
// ================================================================
let state = {
    sessionToken: '',
    shops: [],
    filteredShops: [],
    items: [],
    page: 1,
    pageSize: 20,
    serverId: -1,
    typeFilter: 'all',
    search: '',
    loading: false,
    mode: 'shops',
    dataLoaded: false,
};

// ================================================================
//  DOM-ССЫЛКИ (с проверкой на null)
// ================================================================
const $ = id => {
    const el = document.getElementById(id);
    if (!el) console.warn(`⚠️ Элемент с id="${id}" не найден!`);
    return el;
};

const splash = $('splash');
const menu = $('menu');
const app = $('app');
const container = $('shopsContainer');
const shopCount = $('shopCount');
const pageInfo = $('pageInfo');
const prevBtn = $('prevPageBtn');
const nextBtn = $('nextPageBtn');
const totalShops = $('totalShops');
const statusDot = $('statusDot');
const statusText = $('statusText');
const sessionStatus = $('sessionStatus');
const searchInput = $('searchInput');
const refreshBtn = $('refreshBtn');
const resetFiltersBtn = $('resetFiltersBtn');
const modalRoot = $('modalRoot');
const themeToggleBtn = $('themeToggleBtn');
const goToShopsBtn = $('goToShopsBtn');
const backToMenuBtn = $('backToMenuBtn');

const serverTrigger = $('serverTrigger');
const typeTrigger = $('typeTrigger');
const serverModal = $('serverModal');
const typeModal = $('typeModal');
const serverList = $('serverList');
const typeGrid = $('typeGrid');
const serverLabel = $('serverLabel');
const typeLabel = $('typeLabel');

// ================================================================
//  LOCALSTORAGE
// ================================================================
function saveState() {
    try {
        const data = {
            serverId: state.serverId,
            typeFilter: state.typeFilter,
            search: state.search,
            page: state.page,
            shops: state.shops,
            dataLoaded: state.dataLoaded,
        };
        localStorage.setItem('arizona_state', JSON.stringify(data));
    } catch (e) {}
}

function loadState() {
    try {
        const raw = localStorage.getItem('arizona_state');
        if (!raw) return false;
        const data = JSON.parse(raw);
        state.serverId = data.serverId ?? -1;
        state.typeFilter = data.typeFilter ?? 'all';
        state.search = data.search ?? '';
        state.page = data.page ?? 1;
        state.shops = data.shops ?? [];
        state.dataLoaded = data.dataLoaded ?? false;
        return true;
    } catch (e) {
        return false;
    }
}

// ================================================================
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ================================================================
function getApiBase() { return API_BASE.replace(/\/+$/, ''); }

function fmt(n) {
    if (n == null || n <= 0) return '—';
    n = Math.floor(n);
    return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function setStatus(type, msg) {
    if (statusDot) statusDot.className = 'dot ' + type;
    if (statusText) statusText.textContent = msg;
}

function getServerName(id) {
    const found = ARZ_SERVERS.find(s => s.id === id);
    return found ? found.name : String(id);
}

function toggleAccordion() {
    const acc = document.getElementById('settingsAccordion');
    if (acc) acc.classList.toggle('open');
}

function getOwnerName(shop) { return shop?.owner || 'Неизвестно'; }
function getShopNum(shop) { return shop?.shop_num ? '#' + shop.shop_num : 'Без номера'; }

function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '50px',
        fontSize: '16px',
        zIndex: 9999,
        maxWidth: '90%',
        textAlign: 'center',
        transition: 'opacity 0.3s',
        opacity: '1',
        backdropFilter: 'blur(8px)',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
    });
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function copyText(text) {
    if (!text) return;
    navigator.clipboard?.writeText(text)
        .then(() => showToast('Скопировано: ' + text))
        .catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            showToast('Скопировано: ' + text);
        });
}

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// ================================================================
//  API
// ================================================================
async function apiFetch(endpoint, options = {}) {
    const base = getApiBase();
    if (!base) throw new Error('API URL не задан');
    const headers = { 'Content-Type': 'application/json' };
    if (state.sessionToken) headers['X-MH-Session'] = state.sessionToken;
    const resp = await fetch(base + endpoint, { ...options, headers });
    if (!resp.ok) {
        let text = await resp.text();
        try { const j = JSON.parse(text); if (j.error) text = j.error; } catch (_) { }
        throw new Error(`Ошибка ${resp.status}: ${text.slice(0, 100)}`);
    }
    let data;
    try { data = await resp.json(); } catch (e) { throw new Error('Ответ не JSON'); }
    if (data?.error) throw new Error(data.error);
    return data;
}

async function fetchSession() {
    try {
        const resp = await fetch(getApiBase() + '/version?ver=4.6.7&size=0&nick=Player');
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        if (data?.session_token) {
            state.sessionToken = data.session_token;
            if (sessionStatus) sessionStatus.textContent = 'сессия: ' + state.sessionToken.slice(0, 8) + '…';
            return true;
        }
    } catch (e) { console.warn('Сессия не получена:', e); }
    return false;
}

// ================================================================
//  СКЕЛЕТОНЫ ЗАГРУЗКИ
// ================================================================
function renderSkeletons() {
    return Array(5).fill(0)
        .map(() => `
            <div class="shop-card skeleton">
                <div class="skeleton-line" style="width:70%;height:20px;"></div>
                <div class="skeleton-line" style="width:40%;height:14px;margin-top:8px;"></div>
                <div class="skeleton-line" style="width:50%;height:14px;margin-top:8px;"></div>
                <div class="skeleton-line" style="width:30%;height:30px;margin-top:12px;border-radius:50px;"></div>
            </div>
        `).join('');
}

// ================================================================
//  МОДАЛКИ
// ================================================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
    });
});

document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.dataset.modalClose;
        closeModal(modalId + 'Modal');
    });
});

function renderServerList() {
    if (!serverList) return;
    serverList.innerHTML = ARZ_SERVERS.map(s => `
        <button class="server-btn ${state.serverId === s.id ? 'active' : ''}" data-server-id="${s.id}">
            <i class="fas fa-${s.id === -1 ? 'globe' : 'server'}"></i>
            ${s.name}
        </button>
    `).join('');
    serverList.querySelectorAll('.server-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.serverId);
            state.serverId = id;
            state.page = 1;
            if (serverLabel) serverLabel.textContent = getServerName(id);
            closeModal('serverModal');
            if (state.dataLoaded) applyFiltersAndMode();
            else loadShops();
            saveState();
        });
    });
}

function initTypeButtons() {
    if (!typeGrid) return;
    typeGrid.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            state.typeFilter = type;
            state.page = 1;
            const labels = { all: 'Все', sell: 'Продажа', buy: 'Скупка' };
            if (typeLabel) typeLabel.textContent = labels[type] || 'Все';
            typeGrid.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            closeModal('typeModal');
            if (state.dataLoaded) applyFiltersAndMode();
            else loadShops();
            saveState();
        });
    });
}

// ================================================================
//  ОСНОВНЫЕ ФУНКЦИИ
// ================================================================
async function loadShops() {
    if (state.loading) return;
    state.loading = true;
    setStatus('loading', 'Загрузка…');
    if (container) container.innerHTML = `<div style="display:flex;flex-direction:column;gap:14px;">${renderSkeletons()}</div>`;

    try {
        if (!getApiBase()) throw new Error('API URL не задан');
        if (!state.sessionToken) await fetchSession();

        const params = new URLSearchParams();
        if (state.serverId !== -1) params.append('server', state.serverId);

        const data = await apiFetch('/shops/pull?' + params.toString());
        if (!data.shops || !Array.isArray(data.shops)) throw new Error('Нет массива shops');

        state.shops = data.shops;
        state.dataLoaded = true;
        applyFiltersAndMode();
        setStatus('online', 'OK');
        saveState();

        if (splash) splash.classList.add('hidden');
        if (!menu?.classList.contains('show') && !app?.classList.contains('show')) {
            if (menu) menu.classList.add('show');
        }
        updateLabels();
    } catch (err) {
        setStatus('offline', 'Ошибка');
        if (container) container.innerHTML = `
            <div style="text-align:center; padding:30px 0; color:#ff6b6b;">
                <i class="fas fa-exclamation-triangle" style="font-size:32px;"></i>
                <p style="margin:12px 0;">${err.message}</p>
                <button class="btn btn-primary" onclick="loadShops()">Повторить</button>
            </div>
        `;
        if (splash) splash.classList.add('hidden');
        if (menu) menu.classList.add('show');
        const sub = document.querySelector('.menu-subtitle');
        if (sub) sub.textContent = '⚠️ Ошибка загрузки данных';
    } finally {
        state.loading = false;
    }
}

// ================================================================
//  УМНЫЙ ПОИСК С ГРУППИРОВКОЙ И СОРТИРОВКОЙ
// ================================================================
function applyFiltersAndMode() {
    const search = state.search.toLowerCase().trim();
    const type = state.typeFilter;

    let filteredShops = state.shops.slice();

    if (state.serverId !== -1) {
        filteredShops = filteredShops.filter(s => s.server_id === state.serverId);
    }

    if (type === 'sell') {
        filteredShops = filteredShops.filter(s => (s.sell_slots || []).length > 0);
    } else if (type === 'buy') {
        filteredShops = filteredShops.filter(s => (s.buy_slots || []).length > 0);
    }

    if (search) {
        state.mode = 'items';
        const words = search.split(/\s+/).filter(w => w.length > 0);
        const items = [];

        for (const shop of filteredShops) {
            for (const slot of (shop.sell_slots || [])) {
                const name = (slot.name || '').toLowerCase();
                const match = words.every(word => name.includes(word));
                if (match) {
                    items.push({
                        type: 'sell',
                        name: slot.name,
                        price: slot.price || 0,
                        shop: shop,
                        matchCount: words.filter(w => name.includes(w)).length,
                        firstMatchIndex: name.indexOf(words[0]),
                    });
                }
            }
            for (const slot of (shop.buy_slots || [])) {
                const name = (slot.name || '').toLowerCase();
                const match = words.every(word => name.includes(word));
                if (match) {
                    items.push({
                        type: 'buy',
                        name: slot.name,
                        price: slot.price || 0,
                        shop: shop,
                        matchCount: words.filter(w => name.includes(w)).length,
                        firstMatchIndex: name.indexOf(words[0]),
                    });
                }
            }
        }

        const groups = {};
        for (const item of items) {
            const key = item.name.toLowerCase().trim();
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        }

        const sortedGroups = Object.values(groups).map(group => {
            group.sort((a, b) => a.price - b.price);
            return group;
        });

        sortedGroups.sort((a, b) => {
            const aMaxMatch = Math.max(...a.map(item => item.matchCount));
            const bMaxMatch = Math.max(...b.map(item => item.matchCount));
            if (aMaxMatch !== bMaxMatch) return bMaxMatch - aMaxMatch;
            const aMinIndex = Math.min(...a.map(item => item.firstMatchIndex));
            const bMinIndex = Math.min(...b.map(item => item.firstMatchIndex));
            return aMinIndex - bMinIndex;
        });

        state.items = sortedGroups.flat();
        state.filteredShops = [];
    } else {
        state.mode = 'shops';
        state.filteredShops = filteredShops;
        state.items = [];
    }

    state.page = 1;
    renderContent();
    saveState();
}

// ================================================================
//  ОТОБРАЖЕНИЕ
// ================================================================
function renderContent() {
    if (state.mode === 'items') {
        renderItems();
    } else {
        renderShops();
    }
}

function renderShops() {
    if (!container) return;
    const total = state.filteredShops.length;
    const pageSize = state.pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(state.page, totalPages);
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const pageShops = state.filteredShops.slice(start, end);

    if (shopCount) shopCount.textContent = total;
    if (totalShops) totalShops.textContent = 'Всего лавок: ' + total;
    if (pageInfo) pageInfo.textContent = `${page} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = (page <= 1);
    if (nextBtn) nextBtn.disabled = (page >= totalPages);

    if (total === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px 0; color:var(--text-secondary);">Нет лавок</div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '14px';

    pageShops.forEach((shop, idx) => {
        const sellCount = (shop.sell_slots || []).length;
        const buyCount = (shop.buy_slots || []).length;
        const upd = shop.updated_at || shop.scanned_at || 0;
        let updStr = '—';
        if (upd) {
            const d = new Date(upd * 1000);
            const now = Date.now();
            if (now - d.getTime() < 86400000) updStr = d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
            else updStr = d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
        }
        const owner = getOwnerName(shop);
        const shopNum = getShopNum(shop);

        const card = document.createElement('div');
        card.className = 'shop-card';
        card.dataset.shopIndex = idx;
        card.innerHTML = `
            <div class="top">
                <div>
                    <div class="title" data-nick="${shop.owner || ''}">
                        ${owner}
                    </div>
                    <div class="sub">${getServerName(shop.server_id)} · ${shopNum}</div>
                </div>
            </div>
            <div class="meta">
                <span>
                    <i class="fas fa-tag"></i> ${sellCount} &nbsp;
                    <i class="fas fa-shopping-cart"></i> ${buyCount}
                </span>
                <span>${updStr}</span>
            </div>
            <div class="action">
                <button class="btn btn-outline" data-shop-index="${idx}"><i class="fas fa-eye"></i> Товары</button>
            </div>
        `;
        wrapper.appendChild(card);
    });

    fragment.appendChild(wrapper);
    container.innerHTML = '';
    container.appendChild(fragment);

    container.querySelectorAll('.shop-card .btn[data-shop-index]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.shopIndex);
            const shop = state.filteredShops[idx];
            if (shop) openShopDetail(shop);
        });
    });
    container.querySelectorAll('.shop-card .title[data-nick]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const nick = el.dataset.nick;
            if (nick) copyText(nick);
        });
    });
}

function renderItems() {
    if (!container) return;
    const total = state.items.length;
    const pageSize = state.pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(state.page, totalPages);
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const pageItems = state.items.slice(start, end);

    if (shopCount) shopCount.textContent = total;
    if (totalShops) totalShops.textContent = 'Найдено товаров: ' + total;
    if (pageInfo) pageInfo.textContent = `${page} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = (page <= 1);
    if (nextBtn) nextBtn.disabled = (page >= totalPages);

    if (total === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px 0; color:var(--text-secondary);">Товары не найдены</div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '14px';

    pageItems.forEach((item) => {
        const shop = item.shop;
        const owner = getOwnerName(shop);
        const shopNum = getShopNum(shop);
        const srv = getServerName(shop.server_id);
        const typeLabelText = item.type === 'sell' ? 'Продажа' : 'Скупка';
        const icon = item.type === 'sell' ? 'fa-tag' : 'fa-shopping-cart';
        const priceStr = fmt(item.price);

        const card = document.createElement('div');
        card.className = 'shop-card';
        card.innerHTML = `
            <div class="top">
                <div>
                    <div class="title">
                        <i class="fas ${icon}"></i> ${item.name}
                    </div>
                    <div class="sub">${typeLabelText} · ${srv} · ${shopNum} · ${owner}</div>
                </div>
            </div>
            <div class="meta">
                <span><strong>${priceStr}</strong></span>
                <span>ID лавки: ${shop.shop_num || '?'}</span>
            </div>
            <div class="action">
                <button class="btn btn-outline" data-shop-id="${shop.shop_num || ''}"><i class="fas fa-map-pin"></i> GPS</button>
            </div>
        `;
        wrapper.appendChild(card);
    });

    fragment.appendChild(wrapper);
    container.innerHTML = '';
    container.appendChild(fragment);

    container.querySelectorAll('.shop-card .btn[data-shop-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const num = btn.dataset.shopId;
            if (num) {
                showToast('GPS: /findilavka ' + num);
            } else {
                showToast('Номер лавки не указан');
            }
        });
    });
}

// ================================================================
//  МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ЛАВКИ (ТОВАРЫ)
// ================================================================
function openShopDetail(shop) {
    if (!modalRoot) {
        console.error('❌ modalRoot не найден! Добавьте <div id="modalRoot"> в HTML');
        return;
    }
    if (!shop) {
        console.error('❌ shop не передан в openShopDetail');
        return;
    }

    modalRoot.innerHTML = '';
    modalRoot.style.display = 'flex';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-header">
            <h3>${getOwnerName(shop)} · ${getShopNum(shop)}</h3>
            <button class="modal-close" data-modal-close>&times;</button>
        </div>
        <div class="server-name">${getServerName(shop.server_id)}</div>
        <div class="grid-2">
            <div class="slot-box">
                <h4>Продаёт</h4>
                ${(shop.sell_slots || []).length ? shop.sell_slots.map(s => `<div class="slot-item"><span>${s.name || '?'}</span><span class="price">${fmt(s.price)}</span></div>`).join('') : '<div class="empty">—</div>'}
            </div>
            <div class="slot-box">
                <h4>Скупает</h4>
                ${(shop.buy_slots || []).length ? shop.buy_slots.map(s => `<div class="slot-item"><span>${s.name || '?'}</span><span class="price">${fmt(s.price)}</span></div>`).join('') : '<div class="empty">—</div>'}
            </div>
        </div>
        <div class="actions">
            <button class="btn btn-primary" data-modal-gps><i class="fas fa-map-pin"></i> GPS</button>
            <button class="btn btn-outline" data-modal-close>Закрыть</button>
        </div>
    `;
    modalRoot.appendChild(modal);

    const close = () => { modalRoot.style.display = 'none'; modalRoot.innerHTML = ''; };
    modal.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', close));
    modal.querySelector('[data-modal-gps]')?.addEventListener('click', () => {
        if (shop.shop_num) {
            showToast('GPS: /findilavka ' + shop.shop_num);
        } else {
            showToast('Номер лавки не указан');
        }
        close();
    });
    modalRoot.addEventListener('click', e => { if (e.target === modalRoot) close(); });
}

// ================================================================
//  ФОНОВОЕ ОБНОВЛЕНИЕ
// ================================================================
async function refreshInBackground() {
    if (state.loading) return;
    try {
        const params = new URLSearchParams();
        if (state.serverId !== -1) params.append('server', state.serverId);
        const data = await apiFetch('/shops/pull?' + params.toString());
        if (data.shops) {
            state.shops = data.shops;
            state.dataLoaded = true;
            if (app?.classList.contains('show')) {
                applyFiltersAndMode();
            }
            saveState();
            setStatus('online', 'Обновлено');
        }
    } catch (e) {
        console.warn('Фоновое обновление не удалось:', e);
    }
}

// ================================================================
//  НАВИГАЦИЯ
// ================================================================
function showShopsView() {
    if (menu) menu.classList.remove('show');
    if (app) app.classList.add('show');
    if (!state.dataLoaded) loadShops();
    else applyFiltersAndMode();
}
function showMenuView() {
    if (app) app.classList.remove('show');
    if (menu) menu.classList.add('show');
}

// ================================================================
//  ТЕМА
// ================================================================
function initTheme() {
    const saved = localStorage.getItem('mh_theme');
    if (saved === 'light') {
        document.body.classList.add('light-theme');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Тёмная';
    } else {
        document.body.classList.remove('light-theme');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Светлая';
    }
}
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('mh_theme', isLight ? 'light' : 'dark');
    if (themeToggleBtn) themeToggleBtn.innerHTML = isLight ? '<i class="fas fa-moon"></i> Тёмная' : '<i class="fas fa-sun"></i> Светлая';
}

function updateLabels() {
    if (serverLabel) serverLabel.textContent = getServerName(state.serverId);
    const labels = { all: 'Все', sell: 'Продажа', buy: 'Скупка' };
    if (typeLabel) typeLabel.textContent = labels[state.typeFilter] || 'Все';
    if (typeGrid) {
        typeGrid.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === state.typeFilter);
        });
    }
}

// ================================================================
//  ИНИЦИАЛИЗАЦИЯ
// ================================================================
async function init() {
    const hasSaved = loadState();
    if (hasSaved && state.shops.length) {
        if (splash) splash.classList.add('hidden');
        if (menu) menu.classList.add('show');
        updateLabels();
        if (state.shops.length) {
            state.dataLoaded = true;
            applyFiltersAndMode();
        }
    }

    initTheme();
    await fetchSession();
    if (!state.dataLoaded) loadShops();
    else refreshInBackground();

    renderServerList();
    initTypeButtons();

    if (serverTrigger) {
        serverTrigger.addEventListener('click', () => {
            renderServerList();
            openModal('serverModal');
        });
    }
    if (typeTrigger) {
        typeTrigger.addEventListener('click', () => openModal('typeModal'));
    }

    if (goToShopsBtn) goToShopsBtn.addEventListener('click', showShopsView);
    if (backToMenuBtn) backToMenuBtn.addEventListener('click', showMenuView);

    if (searchInput) {
        searchInput.addEventListener('input', debounce(function () {
            state.search = this.value;
            state.page = 1;
            if (state.dataLoaded) applyFiltersAndMode();
            else loadShops();
            saveState();
        }, 300));
    }

    if (refreshBtn) refreshBtn.addEventListener('click', loadShops);
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            state.serverId = -1;
            state.typeFilter = 'all';
            state.search = '';
            if (serverLabel) serverLabel.textContent = 'Все сервера';
            if (typeLabel) typeLabel.textContent = 'Все';
            if (searchInput) searchInput.value = '';
            state.page = 1;
            if (typeGrid) {
                typeGrid.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === 'all'));
            }
            loadShops();
            saveState();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (state.page > 1) { state.page--; renderContent(); saveState(); }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const total = state.mode === 'items' ? state.items.length : state.filteredShops.length;
            const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
            if (state.page < totalPages) { state.page++; renderContent(); saveState(); }
        });
    }

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    setInterval(refreshInBackground, 120000);
}

init().catch(err => {
    console.error(err);
    setStatus('offline', 'Ошибка');
    if (splash) splash.classList.add('hidden');
    if (menu) menu.classList.add('show');
    const sub = document.querySelector('.menu-subtitle');
    if (sub) sub.textContent = '⚠️ Ошибка загрузки данных';
});

window.loadShops = loadShops;

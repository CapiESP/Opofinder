/**
 * OpoFinder - Lógica Principal con Supabase Auth & Mobile-First
 * Exclusivo para usuarios autenticados
 */

// --- 1. Configuración de Supabase ---
const SUPABASE_URL = 'https://cnxlamwrkljwuifglzlp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qzW2YoR8jLfu_7mKb0mkFA_t9nqyom9';

let supabaseClient = null;
let currentUser = null;
let authMode = 'login'; // 'login' o 'register'

try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase Auth inicializado.');
  }
} catch (err) {
  console.error('Error al inicializar Supabase:', err);
}

// --- 2. Estado de la Aplicación ---
const state = {
  currentTab: 'buscador', // 'buscador', 'guardadas', 'filtros', 'ayuda'
  oposiciones: [],        // Convocatorias cargadas desde el BOE
  guardadas: [],          // Oposiciones marcadas por el usuario actual
  filtrosGuardados: [],   // Filtros de alerta del usuario actual
  loading: false,
  alertCount: 0
};

// --- 3. Inicialización al Cargar el DOM ---
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupEventListeners();
  registerServiceWorker();

  // Escuchar cambios de sesión en Supabase
  if (supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    handleAuthState(session);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      handleAuthState(session);
    });
  }
});

// --- 4. Gestión de Autenticación (Login / Registro / Logout) ---
function switchAuthMode(mode) {
  authMode = mode;
  const loginTab = document.getElementById('tab-btn-login');
  const registerTab = document.getElementById('tab-btn-register');
  const submitBtn = document.getElementById('auth-submit-btn');
  const alertEl = document.getElementById('auth-alert');
  
  alertEl.style.display = 'none';

  if (mode === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    submitBtn.textContent = 'Entrar a OpoFinder';
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    submitBtn.textContent = 'Crear Cuenta y Entrar';
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const submitBtn = document.getElementById('auth-submit-btn');
  const alertEl = document.getElementById('auth-alert');

  if (!email || !password) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:#fff;"></span> Procesando...';
  alertEl.style.display = 'none';

  try {
    if (authMode === 'login') {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('¡Bienvenido de nuevo!');
    } else {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      
      if (data?.session) {
        showToast('¡Cuenta creada con éxito!');
      } else {
        // En caso de que el proyecto de Supabase requiera confirmación por email
        alertEl.className = 'auth-alert success';
        alertEl.textContent = '¡Cuenta registrada! Si tienes activada la confirmación por correo, revisa tu bandeja de entrada para verificar tu cuenta.';
        alertEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear Cuenta y Entrar';
        return;
      }
    }
  } catch (err) {
    console.error('Error de autenticación:', err);
    alertEl.className = 'auth-alert error';
    alertEl.textContent = err.message || 'Error al autenticar. Revisa tus datos e inténtalo de nuevo.';
    alertEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = authMode === 'login' ? 'Entrar a OpoFinder' : 'Crear Cuenta y Entrar';
  }
}

async function handleLogout() {
  if (confirm('¿Deseas cerrar tu sesión?')) {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    currentUser = null;
    state.guardadas = [];
    state.filtrosGuardados = [];
    showToast('Sesión cerrada');
  }
}

function handleAuthState(session) {
  const authContainer = document.getElementById('auth-container');
  const appContent = document.getElementById('app-content');
  const userEmailDisplay = document.getElementById('user-display-email');

  if (session && session.user) {
    currentUser = session.user;
    authContainer.style.display = 'none';
    appContent.style.display = 'block';
    if (userEmailDisplay) {
      userEmailDisplay.textContent = currentUser.email;
    }

    // Cargar datos propios del usuario autenticado
    loadUserData();
  } else {
    currentUser = null;
    authContainer.style.display = 'flex';
    appContent.style.display = 'none';
  }
}

async function loadUserData() {
  await loadSavedOposiciones();
  await loadSavedFilters();
  if (state.oposiciones.length === 0) {
    await searchBOE();
  } else {
    checkFilterAlerts();
    applyFiltersAndRender();
  }
}

// --- 5. Navegación por Pestañas ---
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tabName) {
  state.currentTab = tabName;
  
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.style.display = 'none';
  });
  
  const activeSection = document.getElementById(`tab-${tabName}`);
  if (activeSection) {
    activeSection.style.display = 'block';
  }
  
  if (tabName === 'guardadas') {
    renderGuardadas();
  } else if (tabName === 'filtros') {
    renderFiltrosList();
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 6. Consulta a la API Oficial del BOE ---
async function searchBOE() {
  const container = document.getElementById('results-container');
  
  state.loading = true;
  container.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Consultando la API oficial del BOE...</p>
    </div>
  `;
  
  const daysRange = parseInt(document.getElementById('filter-days').value) || 7;
  const dates = getDatesList(daysRange);
  let allOpos = [];
  
  for (const dateStr of dates) {
    try {
      const url = `https://www.boe.es/datosabiertos/api/boe/sumario/${dateStr}`;
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!resp.ok) continue;
      
      const data = await resp.json();
      const diarios = data?.data?.sumario?.diario || [];
      
      for (const d of (Array.isArray(diarios) ? diarios : [diarios])) {
        const secciones = d?.seccion || [];
        for (const sec of (Array.isArray(secciones) ? secciones : [secciones])) {
          const secCode = sec?.['@codigo'] || sec?.codigo;
          if (secCode === '2B') { // Sección 2B: Oposiciones y concursos
            const deps = sec?.departamento || [];
            for (const dep of (Array.isArray(deps) ? deps : [deps])) {
              const depName = dep?.['@nombre'] || dep?.nombre || 'Administración Pública';
              const epigrafes = dep?.epigrafe || [];
              for (const epi of (Array.isArray(epigrafes) ? epigrafes : [epigrafes])) {
                const items = epi?.item || [];
                for (const item of (Array.isArray(items) ? items : [items])) {
                  const processed = processBoeItem(item, depName, dateStr);
                  if (processed) {
                    allOpos.push(processed);
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(`No se pudo cargar el BOE del día ${dateStr}:`, e);
    }
  }
  
  state.oposiciones = allOpos;
  state.loading = false;
  
  checkFilterAlerts();
  applyFiltersAndRender();
}

// --- 7. Procesamiento y Clasificación de Convocatorias ---
function processBoeItem(item, depName, dateStr) {
  const titulo = item?.titulo || '';
  const id = item?.identificador || '';
  if (!id || !titulo) return null;
  
  let urlPdf = '';
  if (typeof item?.url_pdf === 'object') {
    urlPdf = item?.url_pdf?.texto || '';
  } else if (typeof item?.url_pdf === 'string') {
    urlPdf = item?.url_pdf;
  }
  if (!urlPdf && id) {
    const y = dateStr.substring(0, 4);
    const m = dateStr.substring(4, 6);
    const d = dateStr.substring(6, 8);
    urlPdf = `https://www.boe.es/boe/dias/${y}/${m}/${d}/pdfs/${id}.pdf`;
  }
  
  const urlOficial = item?.url_html || `https://www.boe.es/diario_boe/txt.php?id=${id}`;
  const categoria = detectCategory(titulo, depName);
  const region = detectRegion(depName, titulo);
  const deadlineInfo = calculateDeadline(dateStr);
  
  return {
    id,
    titulo,
    organismo: depName,
    categoria,
    region,
    fechaPublicacion: formatDate(dateStr),
    fechaRaw: dateStr,
    plazoLimite: deadlineInfo.formattedDate,
    diasRestantes: deadlineInfo.daysLeft,
    estadoPlazo: deadlineInfo.status,
    urlPdf,
    urlOficial
  };
}

function detectCategory(titulo, depName) {
  const text = `${titulo} ${depName}`.toUpperCase();
  if (/\b(SUBGRUPO\s+A1|GRUPO\s+A1|A1)\b/.test(text) || text.includes('SUPERIOR') || text.includes('LETRADO') || text.includes('JUEZ') || text.includes('FISCAL')) {
    return 'A1';
  }
  if (/\b(SUBGRUPO\s+A2|GRUPO\s+A2|A2)\b/.test(text) || text.includes('GESTIÓN') || text.includes('GESTION') || text.includes('TÉCNICO MEDIO') || text.includes('TECNICO MEDIO')) {
    return 'A2';
  }
  if (/\b(SUBGRUPO\s+B|GRUPO\s+B)\b/.test(text) || text.includes('TÉCNICO SUPERIOR')) {
    return 'B';
  }
  if (/\b(SUBGRUPO\s+C1|GRUPO\s+C1|C1)\b/.test(text) || text.includes('ADMINISTRATIVO') || text.includes('POLICÍA') || text.includes('BOMBERO') || text.includes('AYUDANTE')) {
    return 'C1';
  }
  if (/\b(SUBGRUPO\s+C2|GRUPO\s+C2|C2)\b/.test(text) || text.includes('AUXILIAR')) {
    return 'C2';
  }
  if (text.includes('AGRUPACIÓN PROFESIONAL') || text.includes('OPERARIO') || text.includes('SUBALTERNO') || text.includes('ORDENANZA')) {
    return 'AP';
  }
  return 'OTRA';
}

function detectRegion(depName, titulo) {
  const text = `${depName} ${titulo}`.toUpperCase();
  const regionsMap = {
    'ANDALUCIA': 'Andalucía',
    'ARAGON': 'Aragón',
    'ASTURIAS': 'Asturias',
    'BALEARES': 'Baleares',
    'CANARIAS': 'Canarias',
    'CANTABRIA': 'Cantabria',
    'CASTILLA-LA MANCHA': 'Castilla-La Mancha',
    'CASTILLA Y LEON': 'Castilla y León',
    'CATALU': 'Cataluña',
    'EXTREMADURA': 'Extremadura',
    'GALICIA': 'Galicia',
    'MADRID': 'Madrid',
    'MURCIA': 'Murcia',
    'NAVARRA': 'Navarra',
    'PAIS VASCO': 'País Vasco',
    'EUSKADI': 'País Vasco',
    'RIOJA': 'La Rioja',
    'CEUTA': 'Ceuta y Melilla',
    'MELILLA': 'Ceuta y Melilla',
    'UNIVERSIDAD': 'Universidades',
    'JUDICIAL': 'Justicia',
    'AYUNTAMIENTO': 'Entidades Locales',
    'DIPUTACION': 'Entidades Locales'
  };
  
  for (const [key, val] of Object.entries(regionsMap)) {
    if (text.includes(key)) return val;
  }
  
  if (text.includes('MINISTERIO') || text.includes('ESTATAL') || text.includes('AGENCIA ESTATAL') || text.includes('CONSEJO')) {
    return 'Estatal';
  }
  return 'Otras';
}

function calculateDeadline(dateStr) {
  const y = parseInt(dateStr.substring(0, 4));
  const m = parseInt(dateStr.substring(4, 6)) - 1;
  const d = parseInt(dateStr.substring(6, 8));
  
  let current = new Date(y, m, d);
  current.setDate(current.getDate() + 1);
  
  let businessDays = 0;
  while (businessDays < 20) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    if (businessDays < 20) {
      current.setDate(current.getDate() + 1);
    }
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  
  const diffTime = current - today;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status = 'abierto';
  if (daysLeft < 0) status = 'caducada';
  else if (daysLeft <= 3) status = 'urgente';
  else if (daysLeft <= 7) status = 'medio';
  
  const formattedDate = `${String(current.getDate()).padStart(2, '0')}/${String(current.getMonth() + 1).padStart(2, '0')}/${current.getFullYear()}`;
  return { formattedDate, daysLeft, status };
}

// --- 8. Filtrado y Renderizado ---
function applyFiltersAndRender() {
  const selectedCat = document.getElementById('filter-category').value;
  const selectedRegion = document.getElementById('filter-region').value;
  const searchKeyword = document.getElementById('filter-search').value.toLowerCase().trim();
  const hideExpired = document.getElementById('filter-hide-expired').checked;
  
  let filtered = state.oposiciones.filter(item => {
    if (selectedCat !== 'TODAS' && item.categoria !== selectedCat) return false;
    if (selectedRegion !== 'TODAS' && item.region !== selectedRegion) return false;
    if (searchKeyword) {
      const matchText = `${item.titulo} ${item.organismo}`.toLowerCase();
      if (!matchText.includes(searchKeyword)) return false;
    }
    if (hideExpired && item.diasRestantes < 0) return false;
    return true;
  });
  
  renderCards(filtered, document.getElementById('results-container'));
  document.getElementById('results-count').textContent = `${filtered.length} convocatorias encontradas`;
}

function renderCards(list, containerEl) {
  if (!list || list.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No se encontraron convocatorias</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: 6px;">
          Prueba a ampliar el rango de días o cambiar los filtros de categoría y región.
        </p>
      </div>
    `;
    return;
  }
  
  containerEl.innerHTML = `
    <div class="cards-list">
      ${list.map(item => createCardHTML(item)).join('')}
    </div>
  `;
}

function createCardHTML(item) {
  const isSaved = state.guardadas.some(g => g.id === item.id);
  
  let trafficHtml = '';
  if (item.diasRestantes < 0) {
    trafficHtml = `<span class="traffic-light traffic-red">🔴 Plazo finalizado</span>`;
  } else if (item.diasRestantes === 0) {
    trafficHtml = `<span class="traffic-light traffic-red">🔴 ¡Último día hoy!</span>`;
  } else if (item.diasRestantes <= 5) {
    trafficHtml = `<span class="traffic-light traffic-yellow">🟡 Quedan ${item.diasRestantes} días</span>`;
  } else {
    trafficHtml = `<span class="traffic-light traffic-green">🟢 Quedan ${item.diasRestantes} días hábiles</span>`;
  }
  
  return `
    <div class="opo-card ${isSaved ? 'saved-highlight' : ''}" id="card-${item.id}">
      <div class="card-top">
        <div class="badges-row">
          <span class="badge badge-${item.categoria.toLowerCase()}">${item.categoria}</span>
          <span class="badge badge-region">${item.region}</span>
        </div>
        <button class="btn-bookmark ${isSaved ? 'active' : ''}" onclick="toggleBookmark('${item.id}')" title="${isSaved ? 'Desmarcar y borrar de tu cuenta' : 'Guardar oposición'}">
          ${isSaved ? '★' : '☆'}
        </button>
      </div>
      
      <h3 class="card-title">${escapeHTML(item.titulo)}</h3>
      <div class="card-organismo">🏛️ ${escapeHTML(item.organismo)}</div>
      
      <div class="card-meta-grid">
        <div class="meta-item">
          <span class="meta-label">Publicado en BOE:</span>
          <span class="meta-value">${item.fechaPublicacion}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Plazo estimado instancias:</span>
          <span class="meta-value">${item.plazoLimite}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Estado de la convocatoria:</span>
          <div class="meta-value">${trafficHtml}</div>
        </div>
        <div class="meta-item">
          <span class="meta-label">Fecha del examen:</span>
          <span class="meta-value" style="color: var(--text-muted); font-style: italic;">Por determinar en resolución</span>
        </div>
      </div>
      
      <div class="card-actions">
        <a href="${item.urlOficial}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
          🌐 Ver en BOE.es
        </a>
        <a href="${item.urlPdf}" target="_blank" rel="noopener" download="${item.id}.pdf" class="btn-download-pdf">
          📥 Descargar PDF Oficial
        </a>
      </div>
    </div>
  `;
}

// --- 9. Oposiciones Guardadas en Supabase (Multi-Usuario) ---
async function toggleBookmark(id) {
  if (!currentUser) {
    showToast('Inicia sesión para guardar oposiciones');
    return;
  }

  const item = state.oposiciones.find(o => o.id === id) || state.guardadas.find(g => g.id === id);
  if (!item) return;
  
  const index = state.guardadas.findIndex(g => g.id === id);
  const isCurrentlySaved = index !== -1;
  
  if (isCurrentlySaved) {
    state.guardadas.splice(index, 1);
    await deleteSavedOposicionFromStorage(id);
    showToast('Oposición desmarcada');
  } else {
    state.guardadas.push(item);
    await saveOposicionToStorage(item);
    showToast('Oposición guardada en tu cuenta');
  }
  
  updateSavedBadge();
  
  const card = document.getElementById(`card-${id}`);
  if (card) {
    const btn = card.querySelector('.btn-bookmark');
    if (btn) {
      btn.classList.toggle('active', !isCurrentlySaved);
      btn.innerHTML = !isCurrentlySaved ? '★' : '☆';
    }
    card.classList.toggle('saved-highlight', !isCurrentlySaved);
  }
  
  if (state.currentTab === 'guardadas') {
    renderGuardadas();
  }
}

function renderGuardadas() {
  const container = document.getElementById('saved-container');
  if (!state.guardadas || state.guardadas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⭐</div>
        <h3>No tienes oposiciones guardadas</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: 6px;">
          Pulsa la estrella (☆) en las convocatorias del buscador para guardarlas y descargarlas cuando quieras.
        </p>
      </div>
    `;
    return;
  }
  renderCards(state.guardadas, container);
}

async function saveOposicionToStorage(item) {
  // Caché local para velocidad
  localStorage.setItem(`opofinder_saved_${currentUser.id}`, JSON.stringify(state.guardadas));
  
  if (supabaseClient && currentUser) {
    try {
      await supabaseClient.from('oposiciones_guardadas').upsert({
        id: item.id,
        user_id: currentUser.id,
        titulo: item.titulo,
        organismo: item.organismo,
        categoria: item.categoria,
        region: item.region,
        fecha_convocatoria: item.fechaPublicacion,
        plazo_limite: item.plazoLimite,
        url_pdf: item.urlPdf,
        url_oficial: item.urlOficial
      });
    } catch (err) {
      console.warn('Error al guardar en Supabase:', err);
    }
  }
}

async function deleteSavedOposicionFromStorage(id) {
  localStorage.setItem(`opofinder_saved_${currentUser.id}`, JSON.stringify(state.guardadas));
  
  if (supabaseClient && currentUser) {
    try {
      await supabaseClient.from('oposiciones_guardadas')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);
    } catch (err) {
      console.warn('Error al borrar en Supabase:', err);
    }
  }
}

async function loadSavedOposiciones() {
  if (!currentUser) return;

  const local = localStorage.getItem(`opofinder_saved_${currentUser.id}`);
  if (local) {
    try { state.guardadas = JSON.parse(local); } catch(e){}
  }
  
  if (supabaseClient && currentUser) {
    try {
      const { data, error } = await supabaseClient
        .from('oposiciones_guardadas')
        .select('*')
        .eq('user_id', currentUser.id);

      if (!error && data) {
        state.guardadas = data.map(d => ({
          id: d.id,
          titulo: d.titulo,
          organismo: d.organismo,
          categoria: d.categoria,
          region: d.region,
          fechaPublicacion: d.fecha_convocatoria,
          plazoLimite: d.plazo_limite,
          diasRestantes: 15,
          estadoPlazo: 'abierto',
          urlPdf: d.url_pdf,
          urlOficial: d.url_oficial
        }));
        localStorage.setItem(`opofinder_saved_${currentUser.id}`, JSON.stringify(state.guardadas));
      }
    } catch (err) {
      console.log('Error o sin conexión remota al cargar guardadas.');
    }
  }
  updateSavedBadge();
}

function updateSavedBadge() {
  const badge = document.getElementById('saved-badge');
  if (badge) {
    const count = state.guardadas.length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// --- 10. Filtros Guardados en Supabase ---
async function saveCurrentFilter() {
  if (!currentUser) return;

  const cat = document.getElementById('filter-category').value;
  const region = document.getElementById('filter-region').value;
  const kw = document.getElementById('filter-search').value.trim();
  
  const name = prompt('Nombre para este filtro de alerta:', `${cat !== 'TODAS' ? cat : 'Todas'} - ${region !== 'TODAS' ? region : 'Cualquier Región'}`);
  if (!name) return;
  
  const newFilter = {
    id: 'f_' + Date.now(),
    nombre: name,
    categoria: cat,
    region: region,
    palabra_clave: kw,
    activo: true
  };
  
  state.filtrosGuardados.push(newFilter);
  localStorage.setItem(`opofinder_filters_${currentUser.id}`, JSON.stringify(state.filtrosGuardados));
  
  if (supabaseClient && currentUser) {
    try {
      await supabaseClient.from('filtros').insert({
        user_id: currentUser.id,
        nombre: newFilter.nombre,
        categoria: newFilter.categoria,
        region: newFilter.region,
        palabra_clave: newFilter.palabra_clave,
        activo: true
      });
    } catch(e){}
  }
  
  showToast('Filtro de alerta guardado');
  checkFilterAlerts();
}

async function loadSavedFilters() {
  if (!currentUser) return;

  const local = localStorage.getItem(`opofinder_filters_${currentUser.id}`);
  if (local) {
    try { state.filtrosGuardados = JSON.parse(local); } catch(e){}
  }
  
  if (supabaseClient && currentUser) {
    try {
      const { data, error } = await supabaseClient
        .from('filtros')
        .select('*')
        .eq('user_id', currentUser.id);

      if (!error && data) {
        state.filtrosGuardados = data;
        localStorage.setItem(`opofinder_filters_${currentUser.id}`, JSON.stringify(state.filtrosGuardados));
      }
    } catch(e){}
  }
}

function checkFilterAlerts() {
  if (!state.filtrosGuardados || state.filtrosGuardados.length === 0) return;
  
  let matchesCount = 0;
  for (const filter of state.filtrosGuardados) {
    if (!filter.activo) continue;
    const matches = state.oposiciones.filter(o => {
      const matchCat = filter.categoria === 'TODAS' || o.categoria === filter.categoria;
      const matchReg = filter.region === 'TODAS' || o.region === filter.region;
      const matchKw = !filter.palabra_clave || `${o.titulo} ${o.organismo}`.toLowerCase().includes(filter.palabra_clave.toLowerCase());
      return matchCat && matchReg && matchKw;
    });
    matchesCount += matches.length;
  }
  
  state.alertCount = matchesCount;
  const alertBadge = document.getElementById('filters-badge');
  if (alertBadge) {
    alertBadge.textContent = matchesCount;
    alertBadge.style.display = matchesCount > 0 ? 'inline-block' : 'none';
  }
  
  const alertBanner = document.getElementById('alert-banner');
  if (alertBanner && matchesCount > 0) {
    alertBanner.style.display = 'flex';
    document.getElementById('alert-banner-text').textContent = 
      `¡Atención! Hay ${matchesCount} convocatorias activas que coinciden con tus filtros de alerta guardados.`;
  }
}

function renderFiltrosList() {
  const listEl = document.getElementById('filters-list');
  if (!state.filtrosGuardados || state.filtrosGuardados.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔔</div>
        <h3>No tienes filtros de alerta guardados</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: 6px;">
          En el buscador, selecciona tu categoría y región y pulsa "Guardar Filtro de Alerta" para recibir avisos de nuevas publicaciones.
        </p>
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = state.filtrosGuardados.map(f => `
    <div class="opo-card" style="margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px;">
      <div>
        <h4 style="font-size: 15px; font-weight: 700;">${escapeHTML(f.nombre)}</h4>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
          Categoría: <strong>${f.categoria}</strong> | Región: <strong>${f.region}</strong>
          ${f.palabra_clave ? `| Término: <strong>${escapeHTML(f.palabra_clave)}</strong>` : ''}
        </div>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="btn btn-outline btn-sm" onclick="applyQuickFilter('${f.categoria}', '${f.region}', '${escapeHTML(f.palabra_clave || '')}')">
          Aplicar
        </button>
        <button class="btn btn-sm" style="background: #fee2e2; color: #dc2626;" onclick="deleteFilter('${f.id}')">
          Eliminar
        </button>
      </div>
    </div>
  `).join('');
}

function applyQuickFilter(cat, region, kw) {
  document.getElementById('filter-category').value = cat;
  document.getElementById('filter-region').value = region;
  document.getElementById('filter-search').value = kw || '';
  switchTab('buscador');
  applyFiltersAndRender();
}

async function deleteFilter(id) {
  if (!currentUser) return;
  state.filtrosGuardados = state.filtrosGuardados.filter(f => f.id !== id);
  localStorage.setItem(`opofinder_filters_${currentUser.id}`, JSON.stringify(state.filtrosGuardados));
  
  if (supabaseClient && currentUser) {
    try { 
      await supabaseClient.from('filtros')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id); 
    } catch(e){}
  }
  
  renderFiltrosList();
  checkFilterAlerts();
  showToast('Filtro eliminado');
}

// --- 11. Service Worker & Notificaciones PWA ---
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('Fallo SW:', err);
    });
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('Tu navegador no soporta notificaciones de escritorio.');
    return;
  }
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    new Notification('OpoFinder Activo', {
      body: 'Recibirás alertas cuando salgan nuevas convocatorias en el BOE que coincidan con tus filtros.',
      icon: './icon-192.png'
    });
    showToast('Notificaciones activadas');
  } else {
    showToast('Permiso de notificaciones denegado');
  }
}

// --- 12. Utilidades ---
function setupEventListeners() {
  document.getElementById('filter-category').addEventListener('change', applyFiltersAndRender);
  document.getElementById('filter-region').addEventListener('change', applyFiltersAndRender);
  document.getElementById('filter-hide-expired').addEventListener('change', applyFiltersAndRender);
  document.getElementById('filter-search').addEventListener('input', applyFiltersAndRender);
  document.getElementById('filter-days').addEventListener('change', searchBOE);
  document.getElementById('btn-save-filter').addEventListener('click', saveCurrentFilter);
  document.getElementById('btn-refresh-boe').addEventListener('click', searchBOE);
  
  const closeIos = document.getElementById('close-ios-banner');
  if (closeIos) {
    closeIos.addEventListener('click', () => {
      document.getElementById('ios-banner').style.display = 'none';
      localStorage.setItem('opofinder_hide_ios_banner', 'true');
    });
    if (localStorage.getItem('opofinder_hide_ios_banner') === 'true') {
      document.getElementById('ios-banner').style.display = 'none';
    }
  }
}

function getDatesList(days) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getDay() !== 0) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}${m}${day}`);
    }
  }
  return dates;
}

function formatDate(dateStr) {
  return `${dateStr.substring(6, 8)}/${dateStr.substring(4, 6)}/${dateStr.substring(0, 4)}`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      bottom: 85px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      color: white;
      padding: 10px 18px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      z-index: 300;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 2500);
}

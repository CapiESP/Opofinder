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

function getSupabaseClient() {
  if (!supabaseClient && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('Supabase Auth inicializado.');
    } catch (e) {
      console.error('Error al instanciar Supabase:', e);
    }
  }
  return supabaseClient;
}

// Inicialización inmediata si ya está disponible
getSupabaseClient();

// --- 2. Estado de la Aplicación ---
const state = {
  currentTab: 'buscador', // 'buscador', 'guardadas', 'filtros', 'ayuda'
  oposiciones: [],        // Convocatorias cargadas desde el BOE y CCAA
  guardadas: [],          // Oposiciones marcadas por el usuario actual
  filtrosGuardados: [],   // Filtros de alerta del usuario actual
  loading: false,
  alertCount: 0,
  currentModalOpo: null,  // Oposición actualmente abierta en el modal
  currentModalTab: 'requerimientos'// 'requerimientos', 'temario', 'boletin', 'notas'
};

// --- 3. Inicialización al Cargar el DOM ---
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupNavigation();
  setupEventListeners();
  registerServiceWorker();

  // Asegurar que la pantalla de login esté visible por defecto mientras se comprueba la sesión
  handleAuthState(null);

  // Esperar brevemente a que el SDK de Supabase cargue si la red es lenta
  let client = getSupabaseClient();
  let retries = 0;
  while (!client && retries < 20) {
    await new Promise(r => setTimeout(r, 100));
    client = getSupabaseClient();
    retries++;
  }

  // Escuchar cambios de sesión en Supabase
  if (client) {
    try {
      const { data } = await client.auth.getSession();
      handleAuthState(data?.session || null);

      client.auth.onAuthStateChange((_event, session) => {
        handleAuthState(session);
      });
    } catch (e) {
      console.warn('Error verificando sesión:', e);
      handleAuthState(null);
    }
  } else {
    console.warn('Librería de Supabase no disponible en este momento.');
    handleAuthState(null);
  }
});

// --- 4. Gestión de Autenticación (Login / Registro / Logout) ---
async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const submitBtn = document.getElementById('auth-submit-btn');
  const alertEl = document.getElementById('auth-alert');
  const loadingScreen = document.getElementById('login-loading-screen');
  const loadingStep = document.getElementById('loading-step-text');

  if (!email || !password) return;

  submitBtn.disabled = true;
  alertEl.style.display = 'none';

  // Activar pantalla de carga corporativa
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
    if (loadingStep) loadingStep.textContent = 'Verificando credenciales oficiales...';
  }

  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('No se pudo conectar con el servidor de autenticación');

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (loadingStep) {
      loadingStep.textContent = 'Sincronizando convocatorias del BOE y CCAA...';
    }
    await new Promise(r => setTimeout(r, 650));

    showToast('Sesión autorizada en Beta Cerrada');
  } catch (err) {
    console.error('Error de autenticación:', err);
    if (loadingScreen) loadingScreen.style.display = 'none';
    alertEl.className = 'auth-alert error';
    alertEl.textContent = err.message === 'Invalid login credentials' 
      ? 'Credenciales no autorizadas o incorrectas en esta fase de Beta Cerrada.' 
      : (err.message || 'Error al autenticar. Revisa tus credenciales e inténtalo de nuevo.');
    alertEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleLogout() {
  if (confirm('¿Deseas cerrar tu sesión?')) {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    currentUser = null;
    state.guardadas = [];
    state.filtrosGuardados = [];
    handleAuthState(null);
    showToast('Sesión cerrada');
  }
}

function handleAuthState(session) {
  const authContainer = document.getElementById('auth-container');
  const appContent = document.getElementById('app-content');
  const userEmailDisplay = document.getElementById('user-display-email');
  const loadingScreen = document.getElementById('login-loading-screen');

  if (session && session.user) {
    currentUser = session.user;
    if (authContainer) authContainer.style.display = 'none';
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
    if (userEmailDisplay) {
      userEmailDisplay.textContent = currentUser.email;
    }

    // Cargar datos propios del usuario autenticado
    loadUserData();
    initTerminalAlertsUI();
  } else {
    currentUser = null;
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (authContainer) authContainer.style.display = 'flex';
    if (appContent) appContent.style.display = 'none';
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

// --- Dataset de Convocatorias Autonómicas y OEPs (BOC, etc.) ---
const CCAA_PRELOADED_DATA = [
  {
    id: 'BOC-2026-148',
    titulo: 'Auxiliar Administrativo (Subgrupo C2)',
    organismo: 'Gobierno de Cantabria',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 71,
    tipo: 'Convocatoria',
    boletin: 'BOC',
    fechaPublicacion: '01/10/2026',
    fechaRaw: '20261001',
    plazoLimite: '21/10/2026',
    diasRestantes: 15,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://aplicacionesweb.cantabria.es/opecan/'
  },
  {
    id: 'BOC-2026-149',
    titulo: 'Auxiliar Administrativo (Promoción Interna)',
    organismo: 'Gobierno de Cantabria',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 4,
    tipo: 'Convocatoria',
    boletin: 'BOC',
    fechaPublicacion: '01/10/2026',
    fechaRaw: '20261001',
    plazoLimite: '21/10/2026',
    diasRestantes: 15,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://aplicacionesweb.cantabria.es/opecan/'
  },
  {
    id: 'BOC-2026-SANTONA',
    titulo: 'Auxiliar Administrativo de Administración General',
    organismo: 'Ayuntamiento de Santoña (Cantabria)',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 1,
    tipo: 'Convocatoria',
    boletin: 'BOC',
    fechaPublicacion: '28/09/2026',
    fechaRaw: '20260928',
    plazoLimite: '18/10/2026',
    diasRestantes: 12,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://boc.cantabria.es'
  },
  {
    id: 'BOC-2026-BAREYO',
    titulo: 'Auxiliar Administrativo',
    organismo: 'Ayuntamiento de Bareyo (Cantabria)',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 1,
    tipo: 'Oferta OEP',
    boletin: 'BOC',
    fechaPublicacion: '01/06/2026',
    fechaRaw: '20260601',
    plazoLimite: 'Pendiente de convocatoria',
    diasRestantes: 99,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://boc.cantabria.es'
  },
  {
    id: 'BOC-2026-LIEBANA',
    titulo: 'Auxiliar de Enfermería',
    organismo: 'Ayuntamiento de Cabezón de Liébana (Cantabria)',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 2,
    tipo: 'Oferta OEP',
    boletin: 'BOC',
    fechaPublicacion: '13/05/2026',
    fechaRaw: '20260513',
    plazoLimite: 'Pendiente de convocatoria',
    diasRestantes: 99,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://boc.cantabria.es'
  },
  {
    id: 'BOC-2026-BUELNA',
    titulo: 'Auxiliar Administrativo',
    organismo: 'Ayuntamiento de San Felices de Buelna',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 1,
    tipo: 'Oferta OEP',
    boletin: 'BOC',
    fechaPublicacion: '13/04/2026',
    fechaRaw: '20260413',
    plazoLimite: 'Pendiente de convocatoria',
    diasRestantes: 99,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://boc.cantabria.es'
  },
  {
    id: 'BOC-2026-SANTILLANA',
    titulo: 'Auxiliar Administrativo',
    organismo: 'Ayuntamiento de Santillana del Mar (Cantabria)',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 1,
    tipo: 'Oferta OEP',
    boletin: 'BOC',
    fechaPublicacion: '13/04/2026',
    fechaRaw: '20260413',
    plazoLimite: 'Pendiente de convocatoria',
    diasRestantes: 99,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://boc.cantabria.es'
  },
  {
    id: 'BOC-2026-ALTAMIRA',
    titulo: 'Auxiliar Administrativo',
    organismo: 'Mancomunidad Altamira Los Valles (Cantabria)',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 1,
    tipo: 'Oferta OEP',
    boletin: 'BOC',
    fechaPublicacion: '10/04/2026',
    fechaRaw: '20260410',
    plazoLimite: 'Pendiente de convocatoria',
    diasRestantes: 99,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://boc.cantabria.es'
  },
  {
    id: 'BOC-2026-SALUD',
    titulo: 'Auxiliar Administrativo Servicios de Salud',
    organismo: 'Servicio Cántabro de Salud (SCS)',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 25,
    tipo: 'Oferta OEP',
    boletin: 'BOC',
    fechaPublicacion: '09/01/2026',
    fechaRaw: '20260109',
    plazoLimite: 'Pendiente de convocatoria',
    diasRestantes: 99,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://boc.cantabria.es'
  },
  {
    id: 'BOC-2026-CASTRO',
    titulo: 'Auxiliar Administrativo',
    organismo: 'Ayuntamiento de Castro Urdiales (Cantabria)',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 1,
    tipo: 'Oferta OEP',
    boletin: 'BOC',
    fechaPublicacion: '07/01/2026',
    fechaRaw: '20260107',
    plazoLimite: 'Pendiente de convocatoria',
    diasRestantes: 99,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://boc.cantabria.es'
  },
  {
    id: 'BOC-2025-SUANCES',
    titulo: 'Auxiliar Administrativo',
    organismo: 'Ayuntamiento de Suances (Cantabria)',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 1,
    tipo: 'Oferta OEP',
    boletin: 'BOC',
    fechaPublicacion: '03/12/2025',
    fechaRaw: '20251203',
    plazoLimite: 'Pendiente de convocatoria',
    diasRestantes: 99,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://boc.cantabria.es'
  },
  {
    id: 'BOC-2025-RIBAMONTAN',
    titulo: 'Auxiliar Administrativo',
    organismo: 'Ayuntamiento de Ribamontán al Mar',
    categoria: 'C2',
    region: 'Cantabria',
    plazas: 1,
    tipo: 'Oferta OEP',
    boletin: 'BOC',
    fechaPublicacion: '27/11/2025',
    fechaRaw: '20251127',
    plazoLimite: 'Pendiente de convocatoria',
    diasRestantes: 99,
    estadoPlazo: 'abierto',
    urlOficial: 'https://boc.cantabria.es',
    urlPdf: 'https://boc.cantabria.es'
  }
];

// --- 6. Consulta Conjunta (BOE + Boletines Autonómicos y OEPs) ---
async function searchBOE() {
  const container = document.getElementById('results-container');
  
  state.loading = true;
  container.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Cargando convocatorias del BOE y boletines autonómicos...</p>
    </div>
  `;
  
  const daysRange = parseInt(document.getElementById('filter-days').value) || 7;
  const dates = getDatesList(daysRange);
  let allOpos = [];

  // 1. Cargar convocatorias autonómicas preconfiguradas
  allOpos.push(...CCAA_PRELOADED_DATA);

  // 2. Cargar convocatorias adicionales desde Supabase si la tabla existe
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data: dbData, error } = await client.from('convocatorias').select('*');
      if (!error && dbData && dbData.length > 0) {
        for (const item of dbData) {
          if (!allOpos.some(o => o.id === item.id)) {
            allOpos.push({
              id: item.id,
              titulo: item.titulo,
              organismo: item.organismo,
              categoria: item.categoria,
              region: item.region,
              plazas: item.plazas || 1,
              tipo: item.tipo || 'Convocatoria',
              boletin: item.boletin || 'BOC',
              fechaPublicacion: item.fecha_publicacion,
              fechaRaw: item.fecha_publicacion.replace(/\//g, ''),
              plazoLimite: item.plazo_limite || 'Pendiente',
              diasRestantes: item.dias_restantes ?? 15,
              estadoPlazo: item.estado_plazo || 'abierto',
              urlPdf: item.url_pdf || '',
              urlOficial: item.url_oficial || ''
            });
          }
        }
      }
    } catch (e) {
      console.warn('Convocatorias en Supabase no disponibles o aún no sincronizadas:', e);
    }
  }

  // 3. Cargar en vivo desde la API del BOE
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
          if (secCode === '2B') {
            const deps = sec?.departamento || [];
            for (const dep of (Array.isArray(deps) ? deps : [deps])) {
              const depName = dep?.['@nombre'] || dep?.nombre || 'Administración Pública';
              const epigrafes = dep?.epigrafe || [];
              for (const epi of (Array.isArray(epigrafes) ? epigrafes : [epigrafes])) {
                const items = epi?.item || [];
                for (const item of (Array.isArray(items) ? items : [items])) {
                  const processed = processBoeItem(item, depName, dateStr);
                  if (processed && !allOpos.some(o => o.id === processed.id)) {
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
    plazas: 1,
    tipo: 'Convocatoria',
    boletin: 'BOE',
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
function toggleFiltersPanel() {
  const panel = document.getElementById('filter-panel');
  const btn = document.getElementById('btn-toggle-filters');
  if (!panel) return;

  const isHidden = panel.style.display === 'none';
  if (isHidden) {
    panel.style.display = 'block';
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
    }
  } else {
    panel.style.display = 'none';
    if (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    }
  }
}

function updateActiveFilterBadges() {
  const cat = document.getElementById('filter-category')?.value || 'TODAS';
  const reg = document.getElementById('filter-region')?.value || 'TODAS';
  const type = document.getElementById('filter-type')?.value || 'TODOS';
  const days = document.getElementById('filter-days')?.value || '7';
  const searchInput = document.getElementById('filter-search');
  const search = searchInput ? searchInput.value.trim() : '';

  let activeCount = 0;
  const activeChips = [];

  if (cat !== 'TODAS') {
    activeCount++;
    activeChips.push({ key: 'category', label: `Cat: ${cat}` });
  }
  if (reg !== 'TODAS') {
    activeCount++;
    activeChips.push({ key: 'region', label: `Ámbito: ${reg}` });
  }
  if (type !== 'TODOS') {
    activeCount++;
    activeChips.push({ key: 'type', label: type === 'Convocatoria' ? 'Convocatorias' : 'Ofertas OEP' });
  }
  if (days !== '7') {
    activeCount++;
    activeChips.push({ key: 'days', label: `${days} días` });
  }
  if (search) {
    activeCount++;
    activeChips.push({ key: 'search', label: `"${search}"` });
  }

  // Actualizar Badge en el botón de Filtros
  const badgeEl = document.getElementById('active-filters-badge');
  if (badgeEl) {
    badgeEl.textContent = activeCount;
    badgeEl.style.display = activeCount > 0 ? 'inline-block' : 'none';
  }

  // Renderizar chips de filtros activos
  const chipsContainer = document.getElementById('active-filter-chips');
  if (chipsContainer) {
    if (activeChips.length > 0) {
      chipsContainer.style.display = 'flex';
      chipsContainer.innerHTML = activeChips.map(c => `
        <span class="filter-chip">
          <span>${escapeHTML(c.label)}</span>
          <button type="button" class="filter-chip-remove" onclick="removeActiveFilter('${c.key}')" title="Quitar este filtro">&times;</button>
        </span>
      `).join('') + `
        <button type="button" class="filter-chip-clear-all" onclick="resetAllFilters()">Restablecer todo</button>
      `;
    } else {
      chipsContainer.style.display = 'none';
      chipsContainer.innerHTML = '';
    }
  }
}

function removeActiveFilter(key) {
  if (key === 'category') {
    const el = document.getElementById('filter-category');
    if (el) el.value = 'TODAS';
  } else if (key === 'region') {
    const el = document.getElementById('filter-region');
    if (el) el.value = 'TODAS';
  } else if (key === 'type') {
    const el = document.getElementById('filter-type');
    if (el) el.value = 'TODOS';
  } else if (key === 'days') {
    const el = document.getElementById('filter-days');
    if (el) {
      el.value = '7';
      searchBOE();
      return;
    }
  } else if (key === 'search') {
    const el = document.getElementById('filter-search');
    if (el) el.value = '';
    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) clearBtn.style.display = 'none';
  }

  applyFiltersAndRender();
}

function resetAllFilters() {
  const cat = document.getElementById('filter-category');
  const reg = document.getElementById('filter-region');
  const type = document.getElementById('filter-type');
  const days = document.getElementById('filter-days');
  const search = document.getElementById('filter-search');
  const hideExp = document.getElementById('filter-hide-expired');
  const clearBtn = document.getElementById('clear-search-btn');

  if (cat) cat.value = 'TODAS';
  if (reg) reg.value = 'TODAS';
  if (type) type.value = 'TODOS';
  if (search) search.value = '';
  if (hideExp) hideExp.checked = true;
  if (clearBtn) clearBtn.style.display = 'none';

  const needsBoeReload = days && days.value !== '7';
  if (days) days.value = '7';

  applyFiltersAndRender();

  if (needsBoeReload) {
    searchBOE();
  }

  showToast('Filtros restablecidos');
}

function clearSearchInput() {
  const searchInput = document.getElementById('filter-search');
  const clearBtn = document.getElementById('clear-search-btn');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }
  if (clearBtn) {
    clearBtn.style.display = 'none';
  }
  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  const selectedCat = document.getElementById('filter-category')?.value || 'TODAS';
  const selectedRegion = document.getElementById('filter-region')?.value || 'TODAS';
  const selectedType = document.getElementById('filter-type')?.value || 'TODOS';
  const searchInput = document.getElementById('filter-search');
  const searchKeyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const hideExpired = document.getElementById('filter-hide-expired')?.checked ?? true;
  
  // Mostrar u ocultar botón de limpiar búsqueda
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) {
    clearBtn.style.display = searchKeyword ? 'inline-block' : 'none';
  }

  // Actualizar indicadores de filtros activos
  updateActiveFilterBadges();

  let filtered = state.oposiciones.filter(item => {
    // 1. Filtro por Categoría
    if (selectedCat !== 'TODAS' && item.categoria !== selectedCat) return false;
    
    // 2. Filtro por Región
    if (selectedRegion !== 'TODAS' && item.region !== selectedRegion) return false;
    
    // 3. Filtro por Tipo de Proceso (Convocatoria vs Oferta OEP)
    if (selectedType !== 'TODOS' && item.tipo !== selectedType) return false;
    
    // 4. Filtro por Palabra Clave
    if (searchKeyword) {
      const matchText = `${item.titulo} ${item.organismo}`.toLowerCase();
      if (!matchText.includes(searchKeyword)) return false;
    }
    
    // 5. Omitir caducadas (solo aplica si es Convocatoria cerrada)
    if (hideExpired && item.tipo === 'Convocatoria' && item.diasRestantes < 0) return false;
    
    return true;
  });
  
  renderCards(filtered, document.getElementById('results-container'));
  document.getElementById('results-count').textContent = `${filtered.length} convocatorias encontradas`;
}

function renderCards(list, containerEl) {
  if (!list || list.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <svg class="icon-inline" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); margin-bottom: 8px;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <h3 style="font-size: 15px; font-weight: 700; color: var(--text-main);">No se encontraron convocatorias</h3>
        <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">
          Ajusta los filtros territoriales o amplía el rango de días de publicación.
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
  const plazasCount = item.plazas || 1;
  const plazasText = `${plazasCount} ${plazasCount === 1 ? 'plaza' : 'plazas'}`;

  return `
    <div class="opo-card ${isSaved ? 'saved-highlight' : ''}" id="card-${item.id}" onclick="openDetailModal('${item.id}')">
      <div class="card-summary-header">
        <div class="badges-row">
          <span class="badge badge-${item.categoria.toLowerCase()}">${item.categoria}</span>
          <span class="badge badge-region">${escapeHTML(item.region)}</span>
          <span class="badge badge-plazas">${plazasText}</span>
        </div>
        <button class="btn-bookmark ${isSaved ? 'active' : ''}" onclick="event.stopPropagation(); toggleBookmark('${item.id}')" title="${isSaved ? 'Quitar de guardadas' : 'Guardar oposición'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
      
      <h3 class="card-summary-title">${escapeHTML(item.titulo)}</h3>
      
      <div class="card-summary-footer">
        <span class="card-summary-org" title="${escapeHTML(item.organismo)}">
          <svg class="icon-inline" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 3px; vertical-align: -1px;">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="9" y1="22" x2="9" y2="18"></line>
            <line x1="15" y1="22" x2="15" y2="18"></line>
            <line x1="9" y1="18" x2="15" y2="18"></line>
          </svg>
          ${escapeHTML(item.organismo)}
        </span>
        <span class="card-summary-cta">
          <span>Ver ficha completa</span>
          <svg class="icon-inline" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </span>
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
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${!isCurrentlySaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
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
        <svg class="icon-inline" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); margin-bottom: 8px;">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <h3 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Sin oposiciones en seguimiento</h3>
        <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">
          Pulsa el marcador en las convocatorias del buscador para guardarlas y hacer seguimiento de fechas y temarios.
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
        <svg class="icon-inline" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); margin-bottom: 8px;">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <h3 style="font-size: 15px; font-weight: 700; color: var(--text-main);">Sin filtros de alerta guardados</h3>
        <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">
          Define tus parámetros en el buscador y pulsa "Guardar Filtro de Alerta" para ser notificado de nuevas convocatorias.
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
    navigator.serviceWorker.register('./sw.js?v=6').catch(err => {
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
  document.getElementById('filter-type')?.addEventListener('change', applyFiltersAndRender);
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

// --- 13. Modo Claro / Oscuro Institucional ---
function initTheme() {
  const savedTheme = localStorage.getItem('opofinder_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('opofinder_theme', newTheme);
  showToast(`Modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} activado`);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    if (theme === 'dark') {
      toggleBtn.innerHTML = `
        <svg class="icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
      toggleBtn.title = 'Cambiar a modo claro';
    } else {
      toggleBtn.innerHTML = `
        <svg class="icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      `;
      toggleBtn.title = 'Cambiar a modo oscuro';
    }
  }
}

// --- 14. Modal de Detalle, Requerimientos, Temario & Hitos ---
function openDetailModal(id) {
  const opo = state.oposiciones.find(o => o.id === id) || state.guardadas.find(g => g.id === id);
  if (!opo) return;

  state.currentModalOpo = opo;
  state.currentModalTab = 'requerimientos';

  const titleEl = document.getElementById('modal-opo-title');
  const orgEl = document.getElementById('modal-opo-organismo');
  const plazasCount = opo.plazas || 1;
  const plazasText = `${plazasCount} ${plazasCount === 1 ? 'plaza' : 'plazas'}`;

  if (titleEl) titleEl.textContent = opo.titulo;
  if (orgEl) orgEl.textContent = `${opo.organismo} • ${opo.region} • ${opo.categoria} • ${plazasText}`;

  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-modaltab') === 'requerimientos');
  });

  renderModalContent();

  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeDetailModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  state.currentModalOpo = null;
}

function handleModalOverlayClick(e) {
  if (e.target && e.target.id === 'detail-modal') {
    closeDetailModal();
  }
}

function switchModalTab(tabName) {
  state.currentModalTab = tabName;
  document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-modaltab') === tabName);
  });
  renderModalContent();
}

function renderModalContent() {
  const container = document.getElementById('modal-opo-body');
  const opo = state.currentModalOpo;
  if (!container || !opo) return;

  if (state.currentModalTab === 'requerimientos') {
    renderModalRequerimientos(container, opo);
  } else if (state.currentModalTab === 'temario') {
    renderModalTemario(container, opo);
  } else if (state.currentModalTab === 'boletin' || state.currentModalTab === 'hitos') {
    renderModalHitos(container, opo);
  } else if (state.currentModalTab === 'notas') {
    renderModalNotas(container, opo);
  }
}

function getRequerimientosForOposicion(opo) {
  const cat = (opo.categoria || '').toUpperCase();
  const title = (opo.titulo || '').toLowerCase();
  
  let titulacion = 'Título de Bachiller, Formación Profesional de Grado Medio o titulación académica equivalente.';
  let tagTitulacion = 'Bachiller o equivalente';
  
  if (cat === 'C2') {
    titulacion = 'Título de Graduado en Educación Secundaria Obligatoria (ESO), Graduado Escolar o titulación equivalente.';
    tagTitulacion = 'Graduado en ESO (Mínimo C2)';
  } else if (cat === 'C1') {
    titulacion = 'Título de Bachiller, Técnico de Formación Profesional (Grado Medio) o titulación equivalente.';
    tagTitulacion = 'Bachillerato o Técnico FP (C1)';
  } else if (cat === 'A2') {
    titulacion = 'Título Universitario oficial de Grado, Diplomatura Universitaria, Ingeniería Técnica o Arquitectura Técnica (240 créditos ECTS).';
    tagTitulacion = 'Grado Universitario / Diplomatura (A2)';
  } else if (cat === 'A1') {
    titulacion = 'Título Universitario oficial de Grado, Licenciatura, Máster Universitario oficial, Ingeniería Superior o Arquitectura.';
    tagTitulacion = 'Grado / Licenciatura / Máster (A1)';
  } else if (cat === 'B') {
    titulacion = 'Título de Técnico Superior de Formación Profesional (Ciclo Formativo de Grado Superior).';
    tagTitulacion = 'Técnico Superior FP (Subgrupo B)';
  } else if (cat === 'AP') {
    titulacion = 'Sin titulación académica formal requerida (Agrupaciones Profesionales sin exigencia de titulación previa).';
    tagTitulacion = 'Sin titulación académica (AP)';
  }

  let especificos = 'Haber abonado la tasa por derechos de examen y formalizar la solicitud telemática dentro del plazo oficial.';
  if (title.includes('polic') || title.includes('guardia')) {
    especificos = 'Permiso de conducción de clase B en vigor, compromiso formal de portar armas de fuego y superar el cuadro de aptitud médica y pruebas físicas.';
  } else if (title.includes('bomber')) {
    especificos = 'Permiso de conducción de clase C (o C+E) en vigor y acreditar aptitud médica conforme al cuadro oficial de exclusiones.';
  } else if (title.includes('sanitar') || title.includes('enferm') || title.includes('médic')) {
    especificos = 'Colegiación preceptiva en el correspondiente colegio profesional y certificación negativa del Registro Central de Delincuentes Sexuales.';
  }

  return { titulacion, tagTitulacion, especificos };
}

function renderModalRequerimientos(container, opo) {
  const reqs = getRequerimientosForOposicion(opo);
  const boletinName = opo.boletin || 'BOE';

  container.innerHTML = `
    <!-- Acceso Directo al Boletín y Bases Oficiales -->
    <div class="modal-quick-actions">
      <a href="${opo.urlOficial}" target="_blank" rel="noopener" class="btn btn-outline">
        <svg class="icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        <span>Acceso a la Publicación en ${boletinName}</span>
      </a>
      <a href="${opo.urlPdf}" target="_blank" rel="noopener" download="${opo.id}.pdf" class="btn btn-primary">
        <svg class="icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="12" y2="18"></line>
          <line x1="15" y1="15" x2="12" y2="18"></line>
        </svg>
        <span>Bases Oficiales (PDF)</span>
      </a>
    </div>

    <!-- Requisito: Titulación Académica -->
    <div class="requirement-card">
      <div class="requirement-card-header">
        <svg class="icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
        <span>Titulación Académica Mínima (${opo.categoria})</span>
      </div>
      <div class="requirement-card-body">
        <p>${escapeHTML(reqs.titulacion)}</p>
        <span class="requirement-tag">${escapeHTML(reqs.tagTitulacion)}</span>
      </div>
    </div>

    <!-- Requisito: Requisitos Generales TREBEP -->
    <div class="requirement-card">
      <div class="requirement-card-header">
        <svg class="icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>Requisitos Generales de Acceso (TREBEP Art. 56)</span>
      </div>
      <div class="requirement-card-body">
        <ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px;">
          <li><strong>Nacionalidad:</strong> Tener nacionalidad española o ser nacional de un Estado miembro de la UE (o régimen de residencia y trabajo legalmente aplicable).</li>
          <li><strong>Edad:</strong> Tener cumplidos 16 años y no exceder de la edad legal máxima de jubilación forzosa.</li>
          <li><strong>Capacidad funcional:</strong> Poseer la capacidad psicofísica y funcional requerida para el desempeño de las tareas del puesto.</li>
          <li><strong>Habilitación legal:</strong> No haber sido separado mediante expediente disciplinario del servicio de las Administraciones Públicas ni hallarse inhabilitado para funciones públicas.</li>
        </ul>
      </div>
    </div>

    <!-- Requisito: Trámite y Plazo de Presentación -->
    <div class="requirement-card">
      <div class="requirement-card-header">
        <svg class="icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>Requisitos Específicos & Trámite de Solicitud</span>
      </div>
      <div class="requirement-card-body">
        <p>${escapeHTML(reqs.especificos)}</p>
        <p style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">
          Plazo límite oficial: <strong>${opo.plazoLimite || 'Consultar bases oficiales'}</strong>
          ${opo.diasRestantes >= 0 ? `(Quedan ${opo.diasRestantes} días)` : '(Plazo finalizado)'}
        </p>
      </div>
    </div>
  `;
}

function renderModalHitos(container, opo) {
  const notifKey = `opofinder_notif_${opo.id}`;
  const isNotifActive = localStorage.getItem(notifKey) === 'true';
  const isOep = opo.tipo === 'Oferta OEP';
  const isCerrado = !isOep && opo.diasRestantes < 0;

  container.innerHTML = `
    <!-- Resumen del Estado -->
    <div style="background: var(--bg-subtle); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; border: 1px solid var(--border);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 13px; font-weight: 700; color: var(--text-main);">
          ${isOep ? 'Oferta de Empleo Público (OEP)' : 'Convocatoria Oficial Publicada'}
        </span>
        <span class="badge ${isOep ? 'badge-oep' : 'badge-convocatoria'}">
          ${isOep ? 'OEP Aprobada' : (isCerrado ? 'Plazo Cerrado' : `Plazo Abierto (${opo.diasRestantes} días)`)}
        </span>
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
        Publicado en <strong>${opo.boletin || 'BOE'}</strong> el ${opo.fechaPublicacion}
        ${opo.plazas ? `&bull; <strong>${opo.plazas} plazas</strong>` : ''}
      </div>
    </div>

    <!-- Timeline del Ciclo de Vida -->
    <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px; color: var(--text-main);">
      Fases del Procedimiento Selectivo
    </h4>

    <div class="lifecycle-timeline">
      <!-- Paso 1 -->
      <div class="timeline-step completed">
        <div class="timeline-dot">1</div>
        <div class="timeline-content">
          <h4>1. Publicación de la OEP</h4>
          <p>Aprobada en Consejo de Gobierno / Pleno Municipal.</p>
        </div>
      </div>

      <!-- Paso 2 -->
      <div class="timeline-step ${isOep ? 'current' : 'completed'}">
        <div class="timeline-dot">2</div>
        <div class="timeline-content">
          <h4>2. Publicación de Bases y Convocatoria</h4>
          <p>${isOep ? 'Pendiente de publicación en boletín oficial.' : `Publicado en ${opo.boletin || 'BOE'} (${opo.fechaPublicacion}).`}</p>
        </div>
      </div>

      <!-- Paso 3 -->
      <div class="timeline-step ${isOep ? '' : (isCerrado ? 'completed' : 'current')}">
        <div class="timeline-dot">3</div>
        <div class="timeline-content">
          <h4>3. Plazo de Presentación de Solicitudes</h4>
          <p>${isOep ? 'Se abrirá tras la publicación oficial.' : (isCerrado ? `Finalizado el ${opo.plazoLimite}` : `Abierto hasta el ${opo.plazoLimite} (quedan ${opo.diasRestantes} días)`)}</p>
        </div>
      </div>

      <!-- Paso 4 -->
      <div class="timeline-step">
        <div class="timeline-dot">4</div>
        <div class="timeline-content">
          <h4>4. Listas Provisionales de Admitidos y Excluidos</h4>
          <p>Publicación de relaciones provisionales y plazo de 10 días para subsanación.</p>
        </div>
      </div>

      <!-- Paso 5: Clave Fecha de Examen -->
      <div class="timeline-step" style="background: var(--bg-subtle); padding: 12px; border-radius: 8px; border: 1px solid var(--border);">
        <div class="timeline-dot" style="background: var(--gold); color: #fff; border-color: var(--gold);">5</div>
        <div class="timeline-content">
          <h4 style="color: var(--text-main);">5. Fecha de Examen y Sedes Oficiales</h4>
          <p style="color: var(--text-muted); font-weight: 500;">
            ${opo.fechaExamen ? `Fecha anunciada: <strong>${opo.fechaExamen}</strong>` : 'Pendiente de resolución por el Tribunal Calificador.'}
          </p>
        </div>
      </div>

      <!-- Paso 6 -->
      <div class="timeline-step">
        <div class="timeline-dot">6</div>
        <div class="timeline-content">
          <h4>6. Celebración del Ejercicio y Calificaciones</h4>
          <p>Realización de las pruebas, plantilla correctora y lista de aprobados.</p>
        </div>
      </div>
    </div>

    <!-- Caja de Notificación de Alertas -->
    <div class="alert-toggle-box">
      <div class="alert-toggle-text">
        <strong>Notificar cambios y fecha de examen en este terminal</strong>
        <span>Recibirás una alerta cuando el tribunal publique listas o determine la fecha oficial de examen.</span>
      </div>
      <div>
        <label class="switch">
          <input type="checkbox" id="notif-toggle-input" ${isNotifActive ? 'checked' : ''} onchange="toggleOpoNotification('${opo.id}')">
        </label>
      </div>
    </div>

    <!-- Enlaces directos oficiales -->
    <div style="display: flex; gap: 8px; margin-top: 16px;">
      <a href="${opo.urlOficial}" target="_blank" rel="noopener" class="btn btn-outline btn-block" style="text-align: center; font-size: 13px;">
        <svg class="icon-inline" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        <span>Ficha en ${opo.boletin || 'BOE'}</span>
      </a>
      <a href="${opo.urlPdf}" target="_blank" rel="noopener" class="btn btn-primary btn-block" style="text-align: center; font-size: 13px;">
        <svg class="icon-inline" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="12" y2="18"></line><line x1="15" y1="15" x2="12" y2="18"></line></svg>
        <span>Bases Oficiales PDF</span>
      </a>
    </div>
  `;
}

function toggleOpoNotification(id) {
  const notifKey = `opofinder_notif_${id}`;
  const current = localStorage.getItem(notifKey) === 'true';
  const next = !current;
  
  localStorage.setItem(notifKey, next ? 'true' : 'false');
  
  if (next) {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    showToast('Aviso de examen activado en este terminal');
  } else {
    showToast('Aviso de examen desactivado');
  }
}

function getPruebasForOposicion(opo) {
  const cat = (opo.categoria || '').toUpperCase();
  const title = (opo.titulo || '').toLowerCase();

  let ejercicio1 = 'Cuestionario teórico de 60 a 100 preguntas tipo test sobre el programa de materias oficiales. Las respuestas erróneas penalizan (un tercio del valor de un acierto).';
  let ejercicio2 = 'Resolución de supuestos de carácter práctico sobre las materias del temario o ejercicio de destreza ofimática e informática (Word y Excel).';
  let faseConcurso = 'Baremo de méritos (en fase concurso-oposición): valoración de servicios previos prestados en la Administración Pública, titulaciones académicas y formación homologada.';

  if (title.includes('bomber') || title.includes('polic') || title.includes('guardia')) {
    ejercicio1 = 'Prueba de conocimientos tipo test y batería de ejercicios psicotécnicos de aptitud intelectual.';
    ejercicio2 = 'Pruebas físicas oficiales (velocidad, resistencia, circuito de agilidad, fuerza) y reconocimiento médico excluyente.';
  } else if (cat === 'A1' || cat === 'A2') {
    ejercicio1 = 'Examen tipo test o preguntas de desarrollo sobre materias comunes y de Derecho Constitucional, Administrativo y Financiero.';
    ejercicio2 = 'Resolución por escrito y defensa oral ante el Tribunal de un caso práctico o dictamen sobre la especialidad del cuerpo.';
  }

  return { ejercicio1, ejercicio2, faseConcurso };
}

function renderModalTemario(container, opo) {
  const pruebas = getPruebasForOposicion(opo);
  const temario = getTemarioForOposicion(opo);
  const checkedKey = `opofinder_temario_${opo.id}`;
  let checkedTopics = [];
  try {
    checkedTopics = JSON.parse(localStorage.getItem(checkedKey) || '[]');
  } catch(e){}

  const totalTopics = temario.reduce((acc, b) => acc + b.temas.length, 0);
  const completedTopics = checkedTopics.length;
  const percent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  let blocksHtml = temario.map((bloque, bIdx) => `
    <div class="temario-block">
      <div class="temario-block-header">
        📖 ${escapeHTML(bloque.bloque)} (${bloque.temas.length} temas)
      </div>
      <div>
        ${bloque.temas.map((tema, tIdx) => {
          const topicId = `${bIdx}_${tIdx}`;
          const isChecked = checkedTopics.includes(topicId);
          return `
            <label class="temario-item" style="cursor: pointer; background: ${isChecked ? 'var(--bg-subtle)' : 'transparent'};">
              <input type="checkbox" class="temario-check" ${isChecked ? 'checked' : ''} onchange="toggleTopicCheck('${opo.id}', '${topicId}')">
              <div style="flex: 1; ${isChecked ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">
                <span style="font-weight: 600;">Tema ${tIdx + 1}:</span> ${escapeHTML(tema)}
              </div>
            </label>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <!-- Botón Temporalmente Deshabilitado para Acceder al Temario -->
    <div class="syllabus-access-box">
      <button class="btn btn-syllabus-disabled" disabled title="Función en preparación para la próxima versión">
        <svg class="icon-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Acceso al Temario y Test Oficiales (Próximamente)</span>
      </button>
      <div class="syllabus-disabled-note">
        La descarga directa de temarios en PDF y los simuladores de test oficiales se activarán en la siguiente actualización de la versión Beta.
      </div>
    </div>

    <!-- Estructura de Pruebas Oficiales -->
    <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px; color: var(--text-main);">
      Pruebas del Proceso Selectivo
    </h4>

    <div class="pruebas-phase-card">
      <div class="pruebas-phase-header">
        <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>Ejercicio 1: Cuestionario Teórico Tipo Test</span>
      </div>
      <div class="pruebas-phase-body">
        <p>${escapeHTML(pruebas.ejercicio1)}</p>
      </div>
    </div>

    <div class="pruebas-phase-card">
      <div class="pruebas-phase-header">
        <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 7 4 4 20 4 20 7"></polyline>
          <line x1="9" y1="20" x2="15" y2="20"></line>
          <line x1="12" y1="4" x2="12" y2="20"></line>
        </svg>
        <span>Ejercicio 2: Supuesto Práctico / Prueba Específica</span>
      </div>
      <div class="pruebas-phase-body">
        <p>${escapeHTML(pruebas.ejercicio2)}</p>
      </div>
    </div>

    <div class="pruebas-phase-card">
      <div class="pruebas-phase-header">
        <svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span>Fase de Concurso: Valoración de Méritos</span>
      </div>
      <div class="pruebas-phase-body">
        <p>${escapeHTML(pruebas.faseConcurso)}</p>
      </div>
    </div>

    <!-- Progreso del Temario Oficial -->
    <div style="background: var(--bg-subtle); padding: 14px; border-radius: 10px; margin-top: 16px; margin-bottom: 16px; border: 1px solid var(--border);">
      <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 6px;">
        <span>Progreso de estudio:</span>
        <span>${completedTopics} de ${totalTopics} temas (${percent}%)</span>
      </div>
      <div style="width: 100%; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
        <div style="width: ${percent}%; height: 100%; background: var(--success); transition: width 0.3s ease;"></div>
      </div>
      <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
        Marca los temas conforme vayas completando vueltas de estudio. El avance se conserva automáticamente.
      </p>
    </div>

    ${blocksHtml}
  `;
}

function toggleTopicCheck(opoId, topicId) {
  const key = `opofinder_temario_${opoId}`;
  let checked = [];
  try {
    checked = JSON.parse(localStorage.getItem(key) || '[]');
  } catch(e){}

  const idx = checked.indexOf(topicId);
  if (idx !== -1) {
    checked.splice(idx, 1);
  } else {
    checked.push(topicId);
  }
  localStorage.setItem(key, JSON.stringify(checked));

  // Volver a renderizar temario para actualizar barra de progreso y tachados
  const container = document.getElementById('modal-opo-body');
  if (container && state.currentModalOpo) {
    renderModalTemario(container, state.currentModalOpo);
  }
}

function renderModalNotas(container, opo) {
  const notesKey = `opofinder_notes_${opo.id}`;
  const savedNotes = localStorage.getItem(notesKey) || opo.notas || '';

  container.innerHTML = `
    <div style="margin-bottom: 12px;">
      <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 6px; color: var(--text-main);">
        📝 Cuaderno de Estudio y Anotaciones
      </h4>
      <p style="font-size: 12px; color: var(--text-muted);">
        Apunta aquí fechas estimadas de examen, enlaces de tu academia, dudas de leyes o recordatorios de presentación de méritos.
      </p>
    </div>

    <textarea id="opo-notes-input" class="notes-textarea" placeholder="Escribe tus notas personales aquí...">${escapeHTML(savedNotes)}</textarea>

    <div style="margin-top: 12px; display: flex; justify-content: flex-end;">
      <button class="btn btn-primary btn-sm" onclick="saveOpoNotes('${opo.id}')">
        💾 Guardar Notas
      </button>
    </div>
  `;
}

async function saveOpoNotes(id) {
  const input = document.getElementById('opo-notes-input');
  if (!input) return;
  const notes = input.value;
  localStorage.setItem(`opofinder_notes_${id}`, notes);

  if (state.currentModalOpo) {
    state.currentModalOpo.notas = notes;
  }

  // Sincronizar en Supabase si está guardada
  if (supabaseClient && currentUser) {
    try {
      await supabaseClient.from('oposiciones_guardadas')
        .update({ notas: notes })
        .eq('id', id)
        .eq('user_id', currentUser.id);
    } catch(e){}
  }

  showToast('Notas guardadas');
}

function getTemarioForOposicion(opo) {
  const title = (opo.titulo || '').toLowerCase();
  const cat = (opo.categoria || '').toUpperCase();
  const org = (opo.organismo || '').toLowerCase();

  // 1. Auxiliar Administrativo (C2)
  if (title.includes('auxiliar') || cat === 'C2') {
    return [
      {
        bloque: 'Bloque I: Organización Pública y Derecho Administrativo',
        temas: [
          'La Constitución Española de 1978: Principios generales, derechos y deberes fundamentales.',
          'La Corona y las Cortes Generales: Composición, atribuciones y funcionamiento del Congreso y Senado.',
          'El Gobierno y la Administración: Organización de la Administración General del Estado y de las CCAA.',
          'El Acto Administrativo: Eficacia, nulidad, anulabilidad y régimen de notificaciones.',
          'El Procedimiento Administrativo Común (Ley 39/2015): Fases de iniciación, ordenación, instrucción y finalización.',
          'El Estatuto Básico del Empleado Público (TREBEP): Clases de personal, derechos, deberes y código de conducta.',
          'Políticas de Igualdad de Género (Ley Orgánica 3/2007) y contra la Violencia de Género.',
          'Régimen Local y Autonómico aplicable al organismo convocante.'
        ]
      },
      {
        bloque: 'Bloque II: Actividad Administrativa y Ofimática',
        temas: [
          'Atención a la ciudadanía: Información administrativa y servicios de registro.',
          'Los documentos administrativos: Registro electrónico, archivo y clasificación de expedientes.',
          'Informática básica: Conceptos de hardware, software y sistemas operativos modernos.',
          'Procesador de textos: Configuración de página, formatos de párrafo, tablas y combinación de correspondencia.',
          'Hoja de cálculo: Fórmulas fundamentales, funciones condicionales y formato de celdas.',
          'Administración Electrónica: Sede electrónica, certificado digital y firma electrónica (Ley 40/2015).'
        ]
      }
    ];
  }

  // 2. Administrativo (C1)
  if (title.includes('administrativo') || cat === 'C1') {
    return [
      {
        bloque: 'Bloque I: Organización del Estado y Administración Pública',
        temas: [
          'La Constitución de 1978: Derechos y libertades fundamentales y garantías constitucionales.',
          'El Poder Judicial y el Tribunal Constitucional.',
          'La Administración General del Estado y la organización territorial del Estado: Estatutos de Autonomía.',
          'La Unión Europea: Instituciones comunitarias y ordenamiento jurídico de la UE.',
          'Régimen Local Español: Tipología de entidades locales y competencias municipales.'
        ]
      },
      {
        bloque: 'Bloque II: Derecho Administrativo General y Procedimiento',
        temas: [
          'Fuentes del ordenamiento administrativo: La Ley y el Reglamento.',
          'El Procedimiento Administrativo Común (Ley 39/2015): Estructura, plazos y recursos administrativos.',
          'La Ley de Régimen Jurídico del Sector Público (Ley 40/2015): Funcionamiento de los órganos colegiados.',
          'La potestad sancionadora y la responsabilidad patrimonial de la Administración Pública.',
          'Contratos del Sector Público (Ley 9/2017): Tipos de contratos, preparación y adjudicación.'
        ]
      },
      {
        bloque: 'Bloque III: Gestión de Personal y Presupuestaria',
        temas: [
          'El TREBEP: Selección de personal, carrera profesional, situaciones administrativas y retribuciones.',
          'La Seguridad Social del personal al servicio de las Administraciones Públicas.',
          'El Presupuesto público: Concepto, principios y ciclo presupuestario.',
          'Procedimiento de ordenación del gasto y pago: Fases de compromiso, reconocimiento y liquidación.'
        ]
      }
    ];
  }

  // 3. Cuerpos Superiores y de Gestión (A1 / A2)
  if (cat === 'A1' || cat === 'A2' || title.includes('gesti') || title.includes('técnico') || title.includes('letrado')) {
    return [
      {
        bloque: 'Bloque I: Derecho Constitucional y Teoría Política',
        temas: [
          'La estructura constitucional española y el Estado Social y Democrático de Derecho.',
          'El sistema electoral y los partidos políticos en el marco constitucional.',
          'Las Comunidades Autónomas: Distribución de competencias y relaciones intergubernamentales.',
          'El Derecho de la Unión Europea y su aplicación por los tribunales españoles.'
        ]
      },
      {
        bloque: 'Bloque II: Derecho Administrativo y Contratación Pública Avanzada',
        temas: [
          'La actividad convencional de la Administración: Convenios administrativos y encomiendas de gestión.',
          'La potestad reglamentaria y su control judicial en la jurisdicción contencioso-administrativa.',
          'Régimen exhaustivo de la Ley 9/2017 de Contratos del Sector Público: Modificados y resolución.',
          'Régimen jurídico de subvenciones y ayudas públicas (Ley 38/2003).'
        ]
      },
      {
        bloque: 'Bloque III: Gestión Financiera, Recursos Humanos y Dirección Pública',
        temas: [
          'Ley General Presupuestaria y Ley Orgánica de Estabilidad Presupuestaria y Sostenibilidad Financiera.',
          'Auditoría y control del sector público: Control interno (Intervención) y control externo (Tribunal de Cuentas).',
          'Políticas de personal y dirección pública en las Administraciones del siglo XXI.',
          'Gobernanza pública, transparencia, ética pública y conflicto de intereses.'
        ]
      }
    ];
  }

  // 4. Sanidad / Salud (SCS, SERMAS, SAS, Celadores, Enfermería)
  if (title.includes('salud') || title.includes('sanit') || title.includes('enferm') || title.includes('médic') || title.includes('celador') || org.includes('salud') || org.includes('scs')) {
    return [
      {
        bloque: 'Bloque I: Legislación y Marco Normativo Común',
        temas: [
          'La Constitución Española y el derecho a la protección de la salud (Artículo 43).',
          'Ley General de Sanidad (Ley 14/1986): Principios generales y Sistema Nacional de Salud.',
          'Ley 16/2003 de Cohesión y Calidad del Sistema Nacional de Salud: Cartera de servicios.',
          'Estatuto Marco del personal estatutario de los servicios de salud (Ley 55/2003).',
          'Ley 41/2002 de Autonomía del Paciente: Consentimiento informado e historia clínica.',
          'Estatuto de Autonomía y estructura del Servicio Autonómico de Salud correspondiente.'
        ]
      },
      {
        bloque: 'Bloque II: Materia Específica del Puesto',
        temas: [
          'Estructura de Atención Primaria y Asistencia Especializada.',
          'Prevención de riesgos laborales y biológicos en el entorno sanitario.',
          'Higiene del medio hospitalario, esterilización y gestión de residuos biosanitarios.',
          'Bioética sanitaria, deber de confidencialidad y secreto profesional.',
          'Protocolos de actuación en situaciones de urgencia y primeros auxilios.'
        ]
      }
    ];
  }

  // 5. Policía Local y Fuerzas de Seguridad
  if (title.includes('polic') || title.includes('seguridad') || title.includes('bombero') || title.includes('agente')) {
    return [
      {
        bloque: 'Bloque I: Derecho Constitucional y Penal',
        temas: [
          'La Constitución Española: Derechos fundamentales y libertades públicas.',
          'Ley Orgánica 2/1986 de Fuerzas y Cuerpos de Seguridad: Principios básicos de actuación.',
          'El Código Penal: Delitos contra las personas, la propiedad y la seguridad vial.',
          'El procedimiento de Habeas Corpus y la detención policial: Derechos del detenido.'
        ]
      },
      {
        bloque: 'Bloque II: Tráfico, Seguridad Vial y Régimen Local',
        temas: [
          'Ley sobre Tráfico, Circulación de Vehículos a Motor y Seguridad Vial.',
          'Reglamento General de Circulación: Velocidad, prioridades y maniobras.',
          'Protocolos ante accidentes de circulación y pruebas de alcoholemia y estupefacientes.',
          'Ordenanzas Municipales de convivencia ciudadana y venta ambulante.',
          'Protección civil y planes de emergencia local.'
        ]
      }
    ];
  }

  // 6. Temario General Predeterminado (para oficios, subalternos o servicios)
  return [
    {
      bloque: 'Bloque I: Materias Comunes de la Función Pública',
      temas: [
        'La Constitución Española de 1978: Valores superiores y principios informadores.',
        'Organización del Estado y de las Administraciones Públicas.',
        'El Estatuto Básico del Empleado Público (TREBEP): Derechos y deberes.',
        'Políticas públicas de igualdad y no discriminación.'
      ]
    },
    {
      bloque: 'Bloque II: Materias Específicas del Puesto',
      temas: [
        'Funciones y tareas propias de la plaza convocada en el organismo oficial.',
        'Seguridad y salud laboral: Prevención de riesgos en el puesto de trabajo.',
        'Atención y trato al usuario de los servicios públicos.',
        'Uso responsable de los recursos materiales e instalaciones públicas.'
      ]
    }
  ];
}

// --- 15. Sistema de Avisos en el Terminal ---
function initTerminalAlertsUI() {
  const savedToggle = document.getElementById('terminal-notif-saved');
  const appToggle = document.getElementById('terminal-notif-app');
  
  if (savedToggle) {
    savedToggle.checked = localStorage.getItem('opofinder_terminal_saved') !== 'false';
  }
  if (appToggle) {
    appToggle.checked = localStorage.getItem('opofinder_terminal_app') !== 'false';
  }

  updateTerminalPermissionBadge();
}

function updateTerminalPermissionBadge() {
  const badge = document.getElementById('terminal-permission-badge');
  if (!badge) return;

  if (!('Notification' in window)) {
    badge.textContent = 'No soportado';
    badge.className = 'badge badge-region';
  } else if (Notification.permission === 'granted') {
    badge.textContent = 'Autorizado (Activo)';
    badge.className = 'badge badge-convocatoria';
  } else if (Notification.permission === 'denied') {
    badge.textContent = 'Bloqueado en el navegador';
    badge.className = 'badge';
    badge.style.color = 'var(--danger)';
  } else {
    badge.textContent = 'Pendiente de autorización';
    badge.className = 'badge badge-region';
  }
}

function toggleTerminalSetting(type, isChecked) {
  if (type === 'saved') {
    localStorage.setItem('opofinder_terminal_saved', isChecked ? 'true' : 'false');
    showToast(isChecked ? 'Avisos de convocatorias guardadas activados en este terminal' : 'Avisos de convocatorias desactivados');
  } else if (type === 'app') {
    localStorage.setItem('opofinder_terminal_app', isChecked ? 'true' : 'false');
    showToast(isChecked ? 'Avisos de novedades del sistema activados en este terminal' : 'Avisos de novedades desactivados');
  }

  if (isChecked && 'Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission().then(() => updateTerminalPermissionBadge());
  }
}

async function sendTerminalTestAlert() {
  if (!('Notification' in window)) {
    alert('Tu terminal o navegador actual no soporta la API de Notificaciones.');
    return;
  }

  let perm = Notification.permission;
  if (perm !== 'granted') {
    perm = await Notification.requestPermission();
    updateTerminalPermissionBadge();
  }

  if (perm === 'granted') {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    
    new Notification('OpoFinder • Terminal Vinculado', {
      body: 'Canal de avisos operativo. Recibirás alertas inmediatas de cambios en tus oposiciones guardadas y novedades oficiales.',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'opofinder-test-alert'
    });

    showToast('Aviso de prueba enviado a este terminal con éxito');
  } else {
    showToast('Permiso de notificaciones no concedido');
  }
}



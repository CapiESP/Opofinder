/**
 * OpoFinder - Lógica Principal de la Aplicación
 * Conexión a API del BOE + Supabase + Almacenamiento Local PWA
 */

// --- 1. Configuración de Supabase ---
const SUPABASE_URL = 'https://cnxlamwrkljwuifglzlp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qzW2YoR8jLfu_7mKb0mkFA_t9nqyom9';

let supabaseClient = null;
let useCloudStorage = false;

try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    useCloudStorage = true;
    console.log('Supabase inicializado correctamente.');
  }
} catch (err) {
  console.warn('Modo local activado (sin conexión Supabase):', err);
}

// --- 2. Estado de la Aplicación ---
const state = {
  currentTab: 'buscador', // 'buscador', 'guardadas', 'filtros', 'ayuda'
  oposiciones: [],        // Convocatorias cargadas desde el BOE
  guardadas: [],          // Oposiciones marcadas como favoritas
  filtrosGuardados: [],   // Filtros de alerta del usuario
  loading: false,
  alertCount: 0
};

// --- 3. Inicialización al Cargar el DOM ---
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupEventListeners();
  registerServiceWorker();
  
  // Cargar datos guardados (desde Supabase con fallback a LocalStorage)
  await loadSavedOposiciones();
  await loadSavedFilters();
  
  // Realizar búsqueda inicial (Últimos 7 días)
  await searchBOE();
});

// --- 4. Navegación por Pestañas ---
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
  
  // Actualizar botones de navegación
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Mostrar sección correspondiente
  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.style.display = 'none';
  });
  
  const activeSection = document.getElementById(`tab-${tabName}`);
  if (activeSection) {
    activeSection.style.display = 'block';
  }
  
  // Acciones al cambiar de pestaña
  if (tabName === 'guardadas') {
    renderGuardadas();
  } else if (tabName === 'filtros') {
    renderFiltrosList();
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 5. Consulta a la API Oficial del BOE ---
async function searchBOE() {
  const container = document.getElementById('results-container');
  const countEl = document.getElementById('results-count');
  
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
          // Sección 2B = Oposiciones y concursos
          if (secCode === '2B') {
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
  
  // Comprobar alertas de filtros guardados
  checkFilterAlerts();
  
  // Aplicar filtros locales y renderizar
  applyFiltersAndRender();
}

// --- 6. Procesamiento y Clasificación de Convocatorias ---
function processBoeItem(item, depName, dateStr) {
  const titulo = item?.titulo || '';
  const id = item?.identificador || '';
  if (!id || !titulo) return null;
  
  // Extraer enlace del PDF
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
  
  // Extraer enlace oficial web
  const urlOficial = item?.url_html || `https://www.boe.es/diario_boe/txt.php?id=${id}`;
  
  // 1. Detección Inteligente de Categoría (Subgrupo)
  const categoria = detectCategory(titulo, depName);
  
  // 2. Detección de Región / Ámbito
  const region = detectRegion(depName, titulo);
  
  // 3. Cálculo de Plazo (20 días hábiles)
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

// Clasificador de Categorías (A1, A2, B, C1, C2, AP)
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

// Clasificador de Región / Ámbito
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
    if (text.includes(key)) {
      return val;
    }
  }
  
  if (text.includes('MINISTERIO') || text.includes('ESTATAL') || text.includes('AGENCIA ESTATAL') || text.includes('CONSEJO')) {
    return 'Estatal';
  }
  
  return 'Otras';
}

// Cálculo de 20 días hábiles (excluyendo sábados y domingos)
function calculateDeadline(dateStr) {
  const y = parseInt(dateStr.substring(0, 4));
  const m = parseInt(dateStr.substring(4, 6)) - 1;
  const d = parseInt(dateStr.substring(6, 8));
  
  let current = new Date(y, m, d);
  current.setDate(current.getDate() + 1); // El plazo cuenta desde el día siguiente
  
  let businessDays = 0;
  while (businessDays < 20) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Omitir fin de semana
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
  if (daysLeft < 0) {
    status = 'caducada';
  } else if (daysLeft <= 3) {
    status = 'urgente';
  } else if (daysLeft <= 7) {
    status = 'medio';
  }
  
  const formattedDate = `${String(current.getDate()).padStart(2, '0')}/${String(current.getMonth() + 1).padStart(2, '0')}/${current.getFullYear()}`;
  return { formattedDate, daysLeft, status };
}

// --- 7. Filtrado Local y Renderizado ---
function applyFiltersAndRender() {
  const selectedCat = document.getElementById('filter-category').value;
  const selectedRegion = document.getElementById('filter-region').value;
  const searchKeyword = document.getElementById('filter-search').value.toLowerCase().trim();
  const hideExpired = document.getElementById('filter-hide-expired').checked;
  
  let filtered = state.oposiciones.filter(item => {
    // 1. Filtro por Categoría
    if (selectedCat !== 'TODAS' && item.categoria !== selectedCat) {
      return false;
    }
    // 2. Filtro por Región
    if (selectedRegion !== 'TODAS' && item.region !== selectedRegion) {
      return false;
    }
    // 3. Filtro por Palabra Clave
    if (searchKeyword) {
      const matchText = `${item.titulo} ${item.organismo}`.toLowerCase();
      if (!matchText.includes(searchKeyword)) {
        return false;
      }
    }
    // 4. Omitir caducadas
    if (hideExpired && item.diasRestantes < 0) {
      return false;
    }
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
  
  // Semáforo de plazo
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
        <button class="btn-bookmark ${isSaved ? 'active' : ''}" onclick="toggleBookmark('${item.id}')" title="${isSaved ? 'Desmarcar y borrar de local' : 'Guardar oposición'}">
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

// --- 8. Gestión de Oposiciones Guardadas (Favoritos) ---
async function toggleBookmark(id) {
  const item = state.oposiciones.find(o => o.id === id) || state.guardadas.find(g => g.id === id);
  if (!item) return;
  
  const index = state.guardadas.findIndex(g => g.id === id);
  const isCurrentlySaved = index !== -1;
  
  if (isCurrentlySaved) {
    // Desmarcar y borrar
    state.guardadas.splice(index, 1);
    await deleteSavedOposicionFromStorage(id);
    showToast('Oposición desmarcada y eliminada de local');
  } else {
    // Guardar
    state.guardadas.push(item);
    await saveOposicionToStorage(item);
    showToast('Oposición guardada con éxito');
  }
  
  updateSavedBadge();
  
  // Actualizar tarjeta en pantalla si existe
  const card = document.getElementById(`card-${id}`);
  if (card) {
    const btn = card.querySelector('.btn-bookmark');
    if (btn) {
      btn.classList.toggle('active', !isCurrentlySaved);
      btn.innerHTML = !isCurrentlySaved ? '★' : '☆';
      btn.title = !isCurrentlySaved ? 'Desmarcar y borrar de local' : 'Guardar oposición';
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
          En el buscador, pulsa la estrella (☆) en las convocatorias que te interesen para guardarlas aquí y consultar sus PDFs oficiales.
        </p>
      </div>
    `;
    return;
  }
  renderCards(state.guardadas, container);
}

// Persistencia en Supabase + LocalStorage
async function saveOposicionToStorage(item) {
  localStorage.setItem('opofinder_saved', JSON.stringify(state.guardadas));
  
  if (useCloudStorage && supabaseClient) {
    try {
      await supabaseClient.from('oposiciones_guardadas').upsert({
        id: item.id,
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
      console.warn('Error al guardar en Supabase (usando local):', err);
    }
  }
}

async function deleteSavedOposicionFromStorage(id) {
  localStorage.setItem('opofinder_saved', JSON.stringify(state.guardadas));
  
  if (useCloudStorage && supabaseClient) {
    try {
      await supabaseClient.from('oposiciones_guardadas').delete().eq('id', id);
    } catch (err) {
      console.warn('Error al borrar en Supabase:', err);
    }
  }
}

async function loadSavedOposiciones() {
  // Primero leer de LocalStorage
  const local = localStorage.getItem('opofinder_saved');
  if (local) {
    try { state.guardadas = JSON.parse(local); } catch(e){}
  }
  
  // Sincronizar con Supabase si está disponible
  if (useCloudStorage && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('oposiciones_guardadas').select('*');
      if (!error && data && data.length > 0) {
        // Mapear campos de la base de datos a formato de la app
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
        localStorage.setItem('opofinder_saved', JSON.stringify(state.guardadas));
      }
    } catch (err) {
      console.log('Modo sin conexión remota, datos locales cargados.');
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

// --- 9. Filtros Guardados y Alertas de Nuevas Convocatorias ---
async function saveCurrentFilter() {
  const cat = document.getElementById('filter-category').value;
  const region = document.getElementById('filter-region').value;
  const kw = document.getElementById('filter-search').value.trim();
  
  const name = prompt('Nombre para este filtro de alerta (ej: "Auxiliares Madrid", "C1 Estatal"):', `${cat !== 'TODAS' ? cat : 'Todas'} - ${region !== 'TODAS' ? region : 'Cualquier Región'}`);
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
  localStorage.setItem('opofinder_filters', JSON.stringify(state.filtrosGuardados));
  
  if (useCloudStorage && supabaseClient) {
    try {
      await supabaseClient.from('filtros').insert({
        nombre: newFilter.nombre,
        categoria: newFilter.categoria,
        region: newFilter.region,
        palabra_clave: newFilter.palabra_clave,
        activo: true
      });
    } catch(e){}
  }
  
  showToast('Filtro de alerta guardado con éxito');
  checkFilterAlerts();
}

async function loadSavedFilters() {
  const local = localStorage.getItem('opofinder_filters');
  if (local) {
    try { state.filtrosGuardados = JSON.parse(local); } catch(e){}
  }
  
  if (useCloudStorage && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('filtros').select('*');
      if (!error && data && data.length > 0) {
        state.filtrosGuardados = data;
        localStorage.setItem('opofinder_filters', JSON.stringify(state.filtrosGuardados));
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
          En el buscador, selecciona tu categoría y región preferida y pulsa "Guardar Filtro de Alerta" para recibir avisos cuando salgan nuevas convocatorias.
        </p>
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = state.filtrosGuardados.map(f => `
    <div class="opo-card" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h4 style="font-size: 15px; font-weight: 700;">${escapeHTML(f.nombre)}</h4>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
          Categoría: <strong>${f.categoria}</strong> | Región: <strong>${f.region}</strong>
          ${f.palabra_clave ? `| Término: <strong>${escapeHTML(f.palabra_clave)}</strong>` : ''}
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
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
  state.filtrosGuardados = state.filtrosGuardados.filter(f => f.id !== id);
  localStorage.setItem('opofinder_filters', JSON.stringify(state.filtrosGuardados));
  
  if (useCloudStorage && supabaseClient) {
    try { await supabaseClient.from('filtros').delete().eq('id', id); } catch(e){}
  }
  
  renderFiltrosList();
  checkFilterAlerts();
  showToast('Filtro eliminado');
}

// --- 10. Service Worker y PWA ---
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(() => {
      console.log('Service Worker registrado con éxito.');
    }).catch(err => {
      console.warn('Fallo al registrar Service Worker:', err);
    });
  }
}

// Solicitar permisos de Notificaciones Push
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
    showToast('Notificaciones activadas correctamente');
  } else {
    showToast('Permiso de notificaciones denegado');
  }
}

// --- 11. Utilidades ---
function setupEventListeners() {
  // Filtros reactivos
  document.getElementById('filter-category').addEventListener('change', applyFiltersAndRender);
  document.getElementById('filter-region').addEventListener('change', applyFiltersAndRender);
  document.getElementById('filter-hide-expired').addEventListener('change', applyFiltersAndRender);
  document.getElementById('filter-search').addEventListener('input', applyFiltersAndRender);
  
  // Rango de días en el BOE
  document.getElementById('filter-days').addEventListener('change', searchBOE);
  
  // Botón guardar filtro
  document.getElementById('btn-save-filter').addEventListener('click', saveCurrentFilter);
  
  // Botón refrescar BOE
  document.getElementById('btn-refresh-boe').addEventListener('click', searchBOE);
  
  // Cerrar banner iOS
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
    // Omitir domingos (habitualmente no hay BOE)
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
      background: rgba(15, 23, 42, 0.9);
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

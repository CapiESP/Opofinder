# ⚖️ OpoFinder - Buscador y Seguidor de Oposiciones del Estado

**OpoFinder** es una aplicación web progresiva (**PWA**) diseñada para preparar y seguir convocatorias de oposiciones oficiales en España directamente desde tu ordenador o tu móvil (iPhone / Android).

---

## 🚀 Características Principales

* 🔍 **Búsqueda Oficial en Tiempo Real:** Conexión directa a la **API de datos abiertos del BOE** (Sección 2B: Oposiciones y Concursos).
* 🏷️ **Filtros por Categoría y Región:**
  * Categorías: **C2** (Auxiliares), **C1** (Administrativos), **A2** (Gestión), **A1** (Superiores), **B** y **Agrupaciones Profesionales**.
  * Regiones: **Estatal**, todas las **Comunidades Autónomas**, Entidades Locales (Ayuntamientos), Universidades y Justicia.
* 🚦 **Semáforo y Cálculo de Plazos:** Calcula los **20 días hábiles** desde la publicación en el BOE y alerta con código de colores (🟢 Plazo amplio, 🟡 Últimos días, 🔴 Último día).
* 🛡️ **Omitir Oposiciones Caducadas:** Filtro automático para no saturar la pantalla con procesos fuera de plazo.
* ⭐ **Mis Oposiciones Guardadas:** Guarda las convocatorias de tu interés y desmárcalas para borrarlas cuando quieras.
* 📥 **Descarga Directa de PDFs:** Enlace directo al documento oficial del boletín con las bases de la convocatoria.
* 🔔 **Filtros de Alerta:** Guarda tus combinaciones preferidas y recibe avisos cuando se publiquen nuevas convocatorias que coincidan.
* ☁️ **Sincronización en la Nube con Supabase:** Accede a tus mismas oposiciones y filtros desde el PC y desde el iPhone.
* 📲 **Instalable en iPhone (PWA):** Añádelo a la pantalla de inicio desde Safari para usarlo como una app nativa con soporte de notificaciones.

---

## 🛠️ Puesta en Marcha

### 1. Activar GitHub Pages (Despliegue Gratuito)
1. Ve a tu repositorio en GitHub: `https://github.com/CapiESP/Opofinder`.
2. Haz clic en **Settings** ➔ **Pages** (en el menú lateral izquierdo).
3. En **Build and deployment**:
   * **Source:** Selecciona `Deploy from a branch`.
   * **Branch:** Selecciona `main` y carpeta `/ (root)`.
4. Haz clic en **Save**.
5. En 1-2 minutos tu web estará disponible públicamente en:
   👉 **`https://capiesp.github.io/Opofinder/`**

---

### 2. Configurar la Base de Datos en Supabase (1 minuto)
1. Entra a tu proyecto en [Supabase](https://supabase.com/dashboard/project/cnxlamwrkljwuifglzlp).
2. En el menú de la izquierda, entra en **SQL Editor**.
3. Abre el archivo [`supabase_schema.sql`](./supabase_schema.sql) de este repositorio, copia su contenido y pégalo en el editor.
4. Pulsa el botón verde **Run**. ¡Listo! Las tablas `filtros` y `oposiciones_guardadas` estarán creadas con sus políticas de seguridad.

---

### 3. Cómo instalar en tu iPhone
1. Abre `https://capiesp.github.io/Opofinder/` en **Safari**.
2. Pulsa el botón de **Compartir** (icono de cuadrado con flecha hacia arriba).
3. Pulsa en **"Añadir a la pantalla de inicio"**.
4. ¡OpoFinder aparecerá con su icono nativo en tu pantalla de inicio!

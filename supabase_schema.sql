-- ========================================================
-- OPOFINDER: Esquema de Base de Datos para Supabase
-- Ejecuta este script en el 'SQL Editor' de tu panel de Supabase
-- ========================================================

-- 1. Tabla de Filtros Guardados por el usuario
CREATE TABLE IF NOT EXISTS public.filtros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nombre TEXT NOT NULL,
    categoria TEXT DEFAULT 'TODAS',
    region TEXT DEFAULT 'TODAS',
    palabra_clave TEXT DEFAULT '',
    activo BOOLEAN DEFAULT true
);

-- 2. Tabla de Oposiciones Guardadas (Favoritos / Seguimiento)
CREATE TABLE IF NOT EXISTS public.oposiciones_guardadas (
    id TEXT PRIMARY KEY, -- Identificador BOE, ej: BOE-A-2024-3966
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo TEXT NOT NULL,
    organismo TEXT,
    categoria TEXT,
    region TEXT,
    fecha_convocatoria TEXT,
    plazo_limite TEXT,
    url_pdf TEXT,
    url_oficial TEXT,
    estado TEXT DEFAULT 'interesado', -- interesado, inscripcion_presentada, admitido
    notas TEXT DEFAULT ''
);

-- 3. Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE public.filtros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oposiciones_guardadas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acceso para la API pública (anon / publishable key)
-- Permite leer, insertar, actualizar y borrar filtros y oposiciones
DROP POLICY IF EXISTS "Acceso publico filtros" ON public.filtros;
CREATE POLICY "Acceso publico filtros" 
    ON public.filtros 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso publico oposiciones" ON public.oposiciones_guardadas;
CREATE POLICY "Acceso publico oposiciones" 
    ON public.oposiciones_guardadas 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

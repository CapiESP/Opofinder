-- ========================================================
-- OPOFINDER: Esquema Multi-Usuario para Supabase Auth
-- Ejecuta este script en el 'SQL Editor' de tu panel de Supabase
-- ========================================================

-- 1. Tabla de Filtros Guardados por Usuario
CREATE TABLE IF NOT EXISTS public.filtros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nombre TEXT NOT NULL,
    categoria TEXT DEFAULT 'TODAS',
    region TEXT DEFAULT 'TODAS',
    palabra_clave TEXT DEFAULT '',
    activo BOOLEAN DEFAULT true
);

-- 2. Tabla de Oposiciones Guardadas por Usuario
-- Nota: La clave primaria es (id, user_id) para que diferentes usuarios puedan guardar la misma oposición
CREATE TABLE IF NOT EXISTS public.oposiciones_guardadas (
    id TEXT NOT NULL, -- Identificador BOE, ej: BOE-A-2024-3966
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo TEXT NOT NULL,
    organismo TEXT,
    categoria TEXT,
    region TEXT,
    fecha_convocatoria TEXT,
    plazo_limite TEXT,
    url_pdf TEXT,
    url_oficial TEXT,
    estado TEXT DEFAULT 'interesado',
    notas TEXT DEFAULT '',
    PRIMARY KEY (id, user_id)
);

-- 3. Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE public.filtros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oposiciones_guardadas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (Cada usuario solo ve y modifica sus propios datos)
DROP POLICY IF EXISTS "Usuarios gestionan sus propios filtros" ON public.filtros;
CREATE POLICY "Usuarios gestionan sus propios filtros" 
    ON public.filtros 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios gestionan sus propias oposiciones" ON public.oposiciones_guardadas;
CREATE POLICY "Usuarios gestionan sus propias oposiciones" 
    ON public.oposiciones_guardadas 
    FOR ALL 
    TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- OPOFINDER: Tabla de Convocatorias y OEPs (Nacional y CCAA)
-- Permite incluir boletines autonómicos (BOC, BOCM, etc.) y Ofertas (OEP)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.convocatorias (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    organismo TEXT NOT NULL,
    categoria TEXT NOT NULL, -- C1, C2, A1, A2, etc.
    region TEXT NOT NULL,    -- Cantabria, Madrid, Estatal, etc.
    plazas INTEGER DEFAULT 1,
    tipo TEXT DEFAULT 'Convocatoria', -- 'Convocatoria' o 'Oferta OEP'
    boletin TEXT DEFAULT 'BOE',       -- 'BOC', 'BOE', 'BOCM', etc.
    fecha_publicacion TEXT NOT NULL,
    plazo_limite TEXT,
    dias_restantes INTEGER DEFAULT 20,
    estado_plazo TEXT DEFAULT 'abierto',
    url_oficial TEXT,
    url_pdf TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS y lectura pública para todos los usuarios autenticados
ALTER TABLE public.convocatorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica convocatorias" ON public.convocatorias;
CREATE POLICY "Lectura publica convocatorias" 
    ON public.convocatorias 
    FOR SELECT 
    TO authenticated, anon 
    USING (true);

-- Insertar convocatorias y OEPs de ejemplo de Cantabria (incluyendo las de OpoBusca)
INSERT INTO public.convocatorias 
(id, titulo, organismo, categoria, region, plazas, tipo, boletin, fecha_publicacion, plazo_limite, dias_restantes, estado_plazo, url_oficial, url_pdf)
VALUES
('BOC-2026-148', 'Auxiliar Administrativo (Subgrupo C2)', 'Gobierno de Cantabria', 'C2', 'Cantabria', 71, 'Convocatoria', 'BOC', '01/10/2026', '21/10/2026', 15, 'abierto', 'https://boc.cantabria.es', 'https://aplicacionesweb.cantabria.es/opecan/'),
('BOC-2026-149', 'Auxiliar Administrativo (Promoción Interna)', 'Gobierno de Cantabria', 'C2', 'Cantabria', 4, 'Convocatoria', 'BOC', '01/10/2026', '21/10/2026', 15, 'abierto', 'https://boc.cantabria.es', 'https://aplicacionesweb.cantabria.es/opecan/'),
('BOC-2026-SANTONA', 'Auxiliar Administrativo de Administración General', 'Ayuntamiento de Santoña (Cantabria)', 'C2', 'Cantabria', 1, 'Convocatoria', 'BOC', '28/09/2026', '18/10/2026', 12, 'abierto', 'https://boc.cantabria.es', 'https://boc.cantabria.es'),
('BOC-2026-BAREYO', 'Auxiliar Administrativo', 'Ayuntamiento de Bareyo (Cantabria)', 'C2', 'Cantabria', 1, 'Oferta OEP', 'BOC', '01/06/2026', 'Pendiente convocatoria', 99, 'abierto', 'https://boc.cantabria.es', 'https://boc.cantabria.es'),
('BOC-2026-LIEBANA', 'Auxiliar de Enfermería', 'Ayuntamiento de Cabezón de Liébana (Cantabria)', 'C2', 'Cantabria', 2, 'Oferta OEP', 'BOC', '13/05/2026', 'Pendiente convocatoria', 99, 'abierto', 'https://boc.cantabria.es', 'https://boc.cantabria.es'),
('BOC-2026-BUELNA', 'Auxiliar Administrativo', 'Ayuntamiento de San Felices de Buelna', 'C2', 'Cantabria', 1, 'Oferta OEP', 'BOC', '13/04/2026', 'Pendiente convocatoria', 99, 'abierto', 'https://boc.cantabria.es', 'https://boc.cantabria.es'),
('BOC-2026-SANTILLANA', 'Auxiliar Administrativo', 'Ayuntamiento de Santillana del Mar (Cantabria)', 'C2', 'Cantabria', 1, 'Oferta OEP', 'BOC', '13/04/2026', 'Pendiente convocatoria', 99, 'abierto', 'https://boc.cantabria.es', 'https://boc.cantabria.es'),
('BOC-2026-ALTAMIRA', 'Auxiliar Administrativo', 'Mancomunidad Altamira Los Valles (Cantabria)', 'C2', 'Cantabria', 1, 'Oferta OEP', 'BOC', '10/04/2026', 'Pendiente convocatoria', 99, 'abierto', 'https://boc.cantabria.es', 'https://boc.cantabria.es'),
('BOC-2026-SALUD', 'Auxiliar Administrativo Servicios de Salud', 'Servicio Cántabro de Salud (SCS)', 'C2', 'Cantabria', 25, 'Oferta OEP', 'BOC', '09/01/2026', 'Pendiente convocatoria', 99, 'abierto', 'https://boc.cantabria.es', 'https://boc.cantabria.es'),
('BOC-2026-CASTRO', 'Auxiliar Administrativo', 'Ayuntamiento de Castro Urdiales (Cantabria)', 'C2', 'Cantabria', 1, 'Oferta OEP', 'BOC', '07/01/2026', 'Pendiente convocatoria', 99, 'abierto', 'https://boc.cantabria.es', 'https://boc.cantabria.es'),
('BOC-2025-SUANCES', 'Auxiliar Administrativo', 'Ayuntamiento de Suances (Cantabria)', 'C2', 'Cantabria', 1, 'Oferta OEP', 'BOC', '03/12/2025', 'Pendiente convocatoria', 99, 'abierto', 'https://boc.cantabria.es', 'https://boc.cantabria.es'),
('BOC-2025-RIBAMONTAN', 'Auxiliar Administrativo', 'Ayuntamiento de Ribamontán al Mar', 'C2', 'Cantabria', 1, 'Oferta OEP', 'BOC', '27/11/2025', 'Pendiente convocatoria', 99, 'abierto', 'https://boc.cantabria.es', 'https://boc.cantabria.es')
ON CONFLICT (id) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    organismo = EXCLUDED.organismo,
    plazas = EXCLUDED.plazas;

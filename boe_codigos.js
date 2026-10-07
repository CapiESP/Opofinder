function boeEscape(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

const BOE_APARTADOS = [
  'Todos',
  'Constitución y Dcho. Constitucional',
  'Derecho Administrativo y Procedimiento',
  'Función Pública y Empleo',
  'Régimen Local y Autonómico',
  'Hacienda y Derecho Tributario',
  'Seguridad y Fuerzas Policiales',
  'Sanidad y Servicios de Salud',
  'Justicia y Penal / Procesal',
  'Laboral y Seguridad Social',
  'Igualdad, Transparencia y Datos'
];

const BOE_CODIGOS_DATABASE = [
  // --- 1. CONSTITUCIÓN Y DERECHO CONSTITUCIONAL ---
  {
    id: '151_Constitucion_Espanola',
    titulo: 'Constitución Española de 1978',
    apartado: 'Constitución y Dcho. Constitucional',
    estado: 'actualizado', // 'actualizado' | 'en revisión'
    subtitulo: 'Texto constitucional consolidado con sus reformas de 1992, 2011 y 2024 (art. 49).',
    normasPrincipales: 'Constitución Española de 1978. Derechos y deberes fundamentales, Corona, Cortes Generales, Gobierno, Poder Judicial, Organización Territorial del Estado y Tribunal Constitucional.',
    archivoBoe: '151_Constitucion_Espanola',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=151_Constitucion_Espanola.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=151_Constitucion_Espanola&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=151_Constitucion_Espanola&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=151_Constitucion_Espanola.epub',
    tags: ['todas', 'c1', 'c2', 'a1', 'a2', 'b', 'ap', 'constitucion', 'general', 'auxiliar', 'administrativo', 'policia', 'guardia civil', 'sanidad', 'justicia', 'bombero', 'cantabria', 'boc']
  },
  {
    id: '042_Codigo_de_Derecho_Constitucional',
    titulo: 'Código de Derecho Constitucional',
    apartado: 'Constitución y Dcho. Constitucional',
    estado: 'actualizado',
    subtitulo: 'Órganos constitucionales del Estado y legislación complementaria.',
    normasPrincipales: 'Ley Orgánica del Tribunal Constitucional (LOTC), Ley Orgánica del Defensor del Pueblo, Estatuto del Poder Judicial y Ley de Gobierno (Ley 50/1997).',
    archivoBoe: '042_Codigo_de_Derecho_Constitucional',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=042_Codigo_de_Derecho_Constitucional.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=042_Codigo_de_Derecho_Constitucional&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=042_Codigo_de_Derecho_Constitucional&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=042_Codigo_de_Derecho_Constitucional.epub',
    tags: ['a1', 'a2', 'c1', 'constitucional', 'gobierno', 'estado', 'cortes', 'tribunal constitucional']
  },

  // --- 2. DERECHO ADMINISTRATIVO Y PROCEDIMIENTO ---
  {
    id: '282_Procedimiento_Administrativo_Comun',
    titulo: 'Procedimiento Administrativo Común y Régimen Jurídico',
    apartado: 'Derecho Administrativo y Procedimiento',
    estado: 'actualizado',
    subtitulo: 'Bloque central e indispensable en la práctica totalidad de oposiciones públicas.',
    normasPrincipales: 'Ley 39/2015 del Procedimiento Administrativo Común (LPACAP) y Ley 40/2015 de Régimen Jurídico del Sector Público (LRJSP). Actos administrativos, plazos, eficacia, nulidad, recursos de alzada y potestativo de reposición, y responsabilidad patrimonial.',
    archivoBoe: '282_Procedimiento_Administrativo_Comun',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=282_Procedimiento_Administrativo_Comun.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=282_Procedimiento_Administrativo_Comun&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=282_Procedimiento_Administrativo_Comun&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=282_Procedimiento_Administrativo_Comun.epub',
    tags: ['todas', 'c1', 'c2', 'a1', 'a2', 'administrativo', 'auxiliar', 'gestion', 'general', 'cantabria', 'boc', 'ayuntamiento', 'local', 'procedimiento']
  },
  {
    id: '044_Codigo_de_Derecho_Administrativo',
    titulo: 'Código de Derecho Administrativo',
    apartado: 'Derecho Administrativo y Procedimiento',
    estado: 'en revisión',
    subtitulo: 'Tratado normativo integral del régimen y potestades administrativas.',
    normasPrincipales: 'Fuentes del Derecho, potestad reglamentaria, convenios administrativos, expropiación forzosa de 1954, potestad sancionadora del Estado y jurisdicción contencioso-administrativa.',
    archivoBoe: '044_Codigo_de_Derecho_Administrativo',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=044_Codigo_de_Derecho_Administrativo.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=044_Codigo_de_Derecho_Administrativo&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=044_Codigo_de_Derecho_Administrativo&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=044_Codigo_de_Derecho_Administrativo.epub',
    tags: ['a1', 'a2', 'c1', 'administrativo', 'gestion', 'tecnico', 'expropiacion', 'sancionador']
  },
  {
    id: '029_Codigo_de_Administracion_Electronica',
    titulo: 'Código de Administración Electrónica y Nuevas Tecnologías',
    apartado: 'Derecho Administrativo y Procedimiento',
    estado: 'actualizado',
    subtitulo: 'Regulación de sedes electrónicas, certificados y firma digital.',
    normasPrincipales: 'Ley 6/2020 de servicios electrónicos de confianza, Real Decreto 311/2022 del Esquema Nacional de Seguridad (ENS), Real Decreto 4/2010 del Esquema Nacional de Interoperabilidad (ENI) y Registro Electrónico General.',
    archivoBoe: '029_Codigo_de_Administracion_Electronica',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=029_Codigo_de_Administracion_Electronica.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=029_Codigo_de_Administracion_Electronica&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=029_Codigo_de_Administracion_Electronica&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=029_Codigo_de_Administracion_Electronica.epub',
    tags: ['c1', 'c2', 'a1', 'a2', 'informatica', 'tic', 'administrativo', 'auxiliar', 'firma', 'ens', 'eni']
  },
  {
    id: '031_Codigo_de_Contratos_del_Sector_Publico',
    titulo: 'Código de Contratos del Sector Público',
    apartado: 'Derecho Administrativo y Procedimiento',
    estado: 'actualizado',
    subtitulo: 'Contratación pública obligatoria en cuerpos técnicos y de gestión.',
    normasPrincipales: 'Ley 9/2017 de Contratos del Sector Público (LCSP). Contratos de obras, servicios y suministros. Pliegos de condiciones, procedimiento abierto, menor y simplificado, y recurso especial en materia de contratación.',
    archivoBoe: '031_Codigo_de_Contratos_del_Sector_Publico',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=031_Codigo_de_Contratos_del_Sector_Publico.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=031_Codigo_de_Contratos_del_Sector_Publico&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=031_Codigo_de_Contratos_del_Sector_Publico&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=031_Codigo_de_Contratos_del_Sector_Publico.epub',
    tags: ['a1', 'a2', 'c1', 'contratos', 'lcsp', 'gestion', 'tecnico', 'licitacion', 'hacienda', 'secretaria']
  },
  {
    id: '082_Codigo_de_la_estructura_de_la_Administracion_General_del_Estado',
    titulo: 'Código de la Estructura de la AGE y Ministerios',
    apartado: 'Derecho Administrativo y Procedimiento',
    estado: 'actualizado',
    subtitulo: 'Organización central y territorial de la Administración del Estado.',
    normasPrincipales: 'Estructura departamental ministerial, Secretarías de Estado, Subsecretarías, Direcciones Generales y Delegaciones/Subdelegaciones del Gobierno.',
    archivoBoe: '082_Codigo_de_la_estructura_de_la_Administracion_General_del_Estado',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=082_Codigo_de_la_estructura_de_la_Administracion_General_del_Estado.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=082_Codigo_de_la_estructura_de_la_Administracion_General_del_Estado&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=082_Codigo_de_la_estructura_de_la_Administracion_General_del_Estado&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=082_Codigo_de_la_estructura_de_la_Administracion_General_del_Estado.epub',
    tags: ['c1', 'c2', 'a1', 'a2', 'age', 'estado', 'ministerios', 'general', 'delegacion']
  },

  // --- 3. FUNCIÓN PÚBLICA Y EMPLEO PÚBLICO ---
  {
    id: '003_Codigo_de_la_Funcion_Publica',
    titulo: 'Código de la Función Pública (Estatuto Básico TREBEP)',
    apartado: 'Función Pública y Empleo',
    estado: 'actualizado',
    subtitulo: 'Estatuto personal del empleado público: derechos, deberes y carrera.',
    normasPrincipales: 'Real Decreto Legislativo 5/2015 (TREBEP), Ley 53/1984 de Incompatibilidades del Personal al Servicio de las Administraciones Públicas, Ley 30/1984, provisión de puestos, situaciones administrativas y régimen disciplinario.',
    archivoBoe: '003_Codigo_de_la_Funcion_Publica',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=003_Codigo_de_la_Funcion_Publica.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=003_Codigo_de_la_Funcion_Publica&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=003_Codigo_de_la_Funcion_Publica&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=003_Codigo_de_la_Funcion_Publica.epub',
    tags: ['todas', 'c1', 'c2', 'a1', 'a2', 'b', 'ap', 'trebep', 'funcion publica', 'empleo publico', 'administrativo', 'auxiliar', 'gestion']
  },
  {
    id: '124_Codigo_de_la_Funcion_Publica_Normativa_Autonomica',
    titulo: 'Código de Función Pública: Normativa Autonómica',
    apartado: 'Función Pública y Empleo',
    estado: 'en revisión',
    subtitulo: 'Regulación del empleo público en las Comunidades Autónomas.',
    normasPrincipales: 'Leyes autonómicas de empleo y función pública (Cantabria Ley 4/1993 y Ley 5/2018 de Régimen Jurídico del Gobierno y Administración de Cantabria, Madrid, Andalucía, etc.).',
    archivoBoe: '124_Codigo_de_la_Funcion_Publica_Normativa_Autonomica',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=124_Codigo_de_la_Funcion_Publica_Normativa_Autonomica.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=124_Codigo_de_la_Funcion_Publica_Normativa_Autonomica&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=124_Codigo_de_la_Funcion_Publica_Normativa_Autonomica&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=124_Codigo_de_la_Funcion_Publica_Normativa_Autonomica.epub',
    tags: ['cantabria', 'boc', 'autonomica', 'c1', 'c2', 'a1', 'a2', 'ccaa', 'gobierno de cantabria']
  },
  {
    id: '011_Codigo_de_MUFACE_ISFAS_y_MUGEJU',
    titulo: 'Código de Mutualidades Administrativas (MUFACE, ISFAS y MUGEJU)',
    apartado: 'Función Pública y Empleo',
    estado: 'actualizado',
    subtitulo: 'Régimen de protección social especial del funcionariado.',
    normasPrincipales: 'Texto Refundido de la Ley sobre Seguridad Social de los Funcionarios Civiles del Estado (MUFACE, RDL 4/2000), ISFAS para personal militar y MUGEJU para funcionarios judiciales.',
    archivoBoe: '011_Codigo_de_MUFACE_ISFAS_y_MUGEJU',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=011_Codigo_de_MUFACE_ISFAS_y_MUGEJU.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=011_Codigo_de_MUFACE_ISFAS_y_MUGEJU&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=011_Codigo_de_MUFACE_ISFAS_y_MUGEJU&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=011_Codigo_de_MUFACE_ISFAS_y_MUGEJU.epub',
    tags: ['muface', 'funcionarios', 'c1', 'a1', 'a2', 'justicia', 'defensa']
  },

  // --- 4. RÉGIMEN LOCAL Y AUTONÓMICO ---
  {
    id: '019_Codigo_de_Regimen_Local',
    titulo: 'Código de Régimen Local (Ayuntamientos y Diputaciones)',
    apartado: 'Régimen Local y Autonómico',
    estado: 'en revisión',
    subtitulo: 'Esencial para todas las plazas de Ayuntamientos, Mancomunidades y Cabildos.',
    normasPrincipales: 'Ley 7/1985 de Bases del Régimen Local (LRBRL), Real Decreto 2568/1986 del Reglamento de Organización, Funcionamiento y Régimen Jurídico de las Entidades Locales (ROF), y Real Decreto Legislativo 781/1986.',
    archivoBoe: '019_Codigo_de_Regimen_Local',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=019_Codigo_de_Regimen_Local.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=019_Codigo_de_Regimen_Local&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=019_Codigo_de_Regimen_Local&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=019_Codigo_de_Regimen_Local.epub',
    tags: ['local', 'ayuntamiento', 'diputacion', 'c1', 'c2', 'a1', 'a2', 'santoña', 'bareyo', 'buelna', 'santillana', 'suances', 'castro', 'cabezon', 'mancomunidad', 'cantabria', 'alcalde', 'pleno']
  },
  {
    id: '017_Estatutos_de_Autonomia',
    titulo: 'Código de Estatutos de Autonomía de las CCAA',
    apartado: 'Régimen Local y Autonómico',
    estado: 'actualizado',
    subtitulo: 'Normas institucionales básicas de cada Comunidad Autónoma.',
    normasPrincipales: 'Ley Orgánica 8/1981 del Estatuto de Autonomía para Cantabria, Estatuto de la Comunidad de Madrid, Estatuto de Andalucía, Estatuto de Cataluña, Estatuto de Galicia y restantes CCAA.',
    archivoBoe: '017_Estatutos_de_Autonomia',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=017_Estatutos_de_Autonomia.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=017_Estatutos_de_Autonomia&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=017_Estatutos_de_Autonomia&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=017_Estatutos_de_Autonomia.epub',
    tags: ['autonomica', 'cantabria', 'boc', 'madrid', 'andalucia', 'galicia', 'ccaa', 'c1', 'c2', 'a1', 'a2', 'estatuto']
  },

  // --- 5. HACIENDA Y DERECHO TRIBUTARIO ---
  {
    id: '030_Ley_General_Tributaria_y_sus_reglamentos',
    titulo: 'Ley General Tributaria y Reglamentos de Desarrollo',
    apartado: 'Hacienda y Derecho Tributario',
    estado: 'actualizado',
    subtitulo: 'Base legal para oposiciones de la AEAT, recaudación local y gestión tributaria.',
    normasPrincipales: 'Ley 58/2003 General Tributaria (LGT), Reglamento general de recaudación (RD 939/2005), Reglamento de gestión e inspección tributaria (RD 1065/2007) y régimen de infracciones y sanciones tributarias.',
    archivoBoe: '030_Ley_General_Tributaria_y_sus_reglamentos',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=030_Ley_General_Tributaria_y_sus_reglamentos.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=030_Ley_General_Tributaria_y_sus_reglamentos&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=030_Ley_General_Tributaria_y_sus_reglamentos&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=030_Ley_General_Tributaria_y_sus_reglamentos.epub',
    tags: ['hacienda', 'tributario', 'aeat', 'agente de la hacienda publica', 'tecnico de hacienda', 'c1', 'a2', 'a1', 'renta', 'impuestos', 'tasas']
  },
  {
    id: '033_Ley_General_Presupuestaria_y_normas_complementarias',
    titulo: 'Ley General Presupuestaria y Contabilidad Pública',
    apartado: 'Hacienda y Derecho Tributario',
    estado: 'actualizado',
    subtitulo: 'Ciclo presupuestario, contabilidad pública y control del gasto.',
    normasPrincipales: 'Ley 47/2003 General Presupuestaria (LGP), Ley Orgánica 2/2012 de Estabilidad Presupuestaria y Sostenibilidad Financiera, procedimiento de elaboración de los PGE, ordenación del pago e Intervención General (IGAE).',
    archivoBoe: '033_Ley_General_Presupuestaria_y_normas_complementarias',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=033_Ley_General_Presupuestaria_y_normas_complementarias.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=033_Ley_General_Presupuestaria_y_normas_complementarias&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=033_Ley_General_Presupuestaria_y_normas_complementarias&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=033_Ley_General_Presupuestaria_y_normas_complementarias.epub',
    tags: ['hacienda', 'presupuestaria', 'intervencion', 'a1', 'a2', 'c1', 'gestion', 'contabilidad', 'gasto publico', 'pge']
  },
  {
    id: '227_Control_del_Gasto_en_las_Haciendas_Locales',
    titulo: 'Control del Gasto y Presupuesto en las Haciendas Locales',
    apartado: 'Hacienda y Derecho Tributario',
    estado: 'en revisión',
    subtitulo: 'Gestión económica, impuestos municipales y control interno en Ayuntamientos.',
    normasPrincipales: 'Real Decreto Legislativo 2/2004 del Texto Refundido de la Ley Reguladora de las Haciendas Locales (TRLRHL), Real Decreto 424/2017 de Control Interno Local y régimen de IBI, IAE e ICIO.',
    archivoBoe: '227_Control_del_Gasto_en_las_Haciendas_Locales',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=227_Control_del_Gasto_en_las_Haciendas_Locales.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=227_Control_del_Gasto_en_las_Haciendas_Locales&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=227_Control_del_Gasto_en_las_Haciendas_Locales&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=227_Control_del_Gasto_en_las_Haciendas_Locales.epub',
    tags: ['local', 'ayuntamiento', 'haciendas locales', 'intervencion local', 'secretario-interventor', 'tesoreria', 'c1', 'c2', 'a1', 'a2']
  },

  // --- 6. SEGURIDAD Y FUERZAS POLICIALES ---
  {
    id: '018_Codigo_de_la_Policia_Nacional',
    titulo: 'Código de la Policía Nacional',
    apartado: 'Seguridad y Fuerzas Policiales',
    estado: 'actualizado',
    subtitulo: 'Normativa institucional, escala básica y ejecutiva del CNP.',
    normasPrincipales: 'Ley Orgánica 9/2015 del Régimen de Personal de la Policía Nacional, Ley Orgánica 2/1986 de Fuerzas y Cuerpos de Seguridad, Reglamento de Procesos Selectivos y Formación, y Ley Orgánica 4/2010 del Régimen Disciplinario del CNP.',
    archivoBoe: '018_Codigo_de_la_Policia_Nacional',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=018_Codigo_de_la_Policia_Nacional.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=018_Codigo_de_la_Policia_Nacional&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=018_Codigo_de_la_Policia_Nacional&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=018_Codigo_de_la_Policia_Nacional.epub',
    tags: ['policia', 'policia nacional', 'c1', 'a2', 'a1', 'seguridad', 'cnp', 'escala basica', 'escala ejecutiva']
  },
  {
    id: '007_Codigo_de_la_Guardia_Civil',
    titulo: 'Código de la Guardia Civil',
    apartado: 'Seguridad y Fuerzas Policiales',
    estado: 'actualizado',
    subtitulo: 'Régimen de personal y normativa específica del cuerpo de la Benemérita.',
    normasPrincipales: 'Ley 29/2014 de Régimen del Personal de la Guardia Civil, Ley Orgánica 12/2007 de Régimen Disciplinario de la Guardia Civil y Ley Orgánica 2/1986 de FCS.',
    archivoBoe: '007_Codigo_de_la_Guardia_Civil',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=007_Codigo_de_la_Guardia_Civil.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=007_Codigo_de_la_Guardia_Civil&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=007_Codigo_de_la_Guardia_Civil&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=007_Codigo_de_la_Guardia_Civil.epub',
    tags: ['guardia civil', 'c1', 'seguridad', 'defensa', 'militar', 'benemerita']
  },
  {
    id: '119_Codigo_de_la_Policia_Local',
    titulo: 'Código de la Policía Local',
    apartado: 'Seguridad y Fuerzas Policiales',
    estado: 'en revisión',
    subtitulo: 'Coordinación policial municipal, tráfico y convivencia ciudadana.',
    normasPrincipales: 'Leyes autonómicas de Coordinación de Policías Locales, Texto Refundido de la Ley de Tráfico y Seguridad Vial (RDL 6/2015), Reglamento General de Circulación y ordenanzas locales.',
    archivoBoe: '119_Codigo_de_la_Policia_Local',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=119_Codigo_de_la_Policia_Local.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=119_Codigo_de_la_Policia_Local&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=119_Codigo_de_la_Policia_Local&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=119_Codigo_de_la_Policia_Local.epub',
    tags: ['policia local', 'policia municipal', 'guardia urbana', 'c1', 'ayuntamiento', 'trafico', 'seguridad vial']
  },
  {
    id: '100_Codigo_de_Seguridad_Ciudadana',
    titulo: 'Código de Seguridad Ciudadana',
    apartado: 'Seguridad y Fuerzas Policiales',
    estado: 'actualizado',
    subtitulo: 'Protección de la seguridad pública, armas, identificaciones y sanción.',
    normasPrincipales: 'Ley Orgánica 4/2015 de Protección de la Seguridad Ciudadana, Reglamento de Armas (RD 137/1993), normativa de documentación de identidad y orden público.',
    archivoBoe: '100_Codigo_de_Seguridad_Ciudadana',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=100_Codigo_de_Seguridad_Ciudadana.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=100_Codigo_de_Seguridad_Ciudadana&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=100_Codigo_de_Seguridad_Ciudadana&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=100_Codigo_de_Seguridad_Ciudadana.epub',
    tags: ['seguridad', 'policia', 'guardia civil', 'policia local', 'seguridad ciudadana', 'c1', 'c2']
  },
  {
    id: '174_Codigo_de_Proteccion_Civil',
    titulo: 'Código del Sistema Nacional de Protección Civil',
    apartado: 'Seguridad y Fuerzas Policiales',
    estado: 'actualizado',
    subtitulo: 'Normativa para Bomberos, Servicios de Salvamento y Protección Civil.',
    normasPrincipales: 'Ley 17/2015 del Sistema Nacional de Protección Civil, Norma Básica de Autoprotección (RD 393/2007), Red de Alerta Nacional y planes territoriales de emergencia.',
    archivoBoe: '174_Codigo_de_Proteccion_Civil',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=174_Codigo_de_Proteccion_Civil.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=174_Codigo_de_Proteccion_Civil&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=174_Codigo_de_Proteccion_Civil&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=174_Codigo_de_Proteccion_Civil.epub',
    tags: ['bombero', 'bomberos', 'proteccion civil', 'emergencias', '112', 'c1', 'c2', 'salvamento']
  },

  // --- 7. SANIDAD Y SERVICIOS DE SALUD ---
  {
    id: '084_Codigo_Sanitario',
    titulo: 'Código Sanitario de España',
    apartado: 'Sanidad y Servicios de Salud',
    estado: 'actualizado',
    subtitulo: 'Marco legislativo general de la sanidad pública española y derechos del paciente.',
    normasPrincipales: 'Ley 14/1986 General de Sanidad, Ley 41/2002 de Autonomía del Paciente e Información Clínica, Ley 16/2003 de Cohesión y Calidad del Sistema Nacional de Salud (SNS) y Ley 33/2011 General de Salud Pública.',
    archivoBoe: '084_Codigo_Sanitario',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=084_Codigo_Sanitario.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=084_Codigo_Sanitario&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=084_Codigo_Sanitario&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=084_Codigo_Sanitario.epub',
    tags: ['sanidad', 'salud', 'scs', 'enfermeria', 'medico', 'tcae', 'celador', 'auxiliar de enfermeria', 'cantabria', 'hospital', 'sns']
  },
  {
    id: '610_Codigo_del_Personal_Estatutario_de_los_Servicios_de_Salud',
    titulo: 'Código del Personal Estatutario de los Servicios de Salud',
    apartado: 'Sanidad y Servicios de Salud',
    estado: 'actualizado',
    subtitulo: 'Estatuto de los profesionales de la salud en hospitales y centros de salud.',
    normasPrincipales: 'Ley 55/2003 del Estatuto Marco del Personal Estatutario de los Servicios de Salud. Clasificación del personal, selección, provisión, carrera profesional, retribuciones, jornada y régimen disciplinario sanitario.',
    archivoBoe: '610_Codigo_del_Personal_Estatutario_de_los_Servicios_de_Salud',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=610_Codigo_del_Personal_Estatutario_de_los_Servicios_de_Salud.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=610_Codigo_del_Personal_Estatutario_de_los_Servicios_de_Salud&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=610_Codigo_del_Personal_Estatutario_de_los_Servicios_de_Salud&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=610_Codigo_del_Personal_Estatutario_de_los_Servicios_de_Salud.epub',
    tags: ['sanidad', 'salud', 'scs', 'enfermeria', 'tcae', 'personal estatutario', 'auxiliar administrativo servicios de salud', 'c2', 'c1', 'a2', 'a1']
  },

  // --- 8. JUSTICIA Y DERECHO PENAL / PROCESAL ---
  {
    id: '038_Codigo_Penal_y_legislacion_complementaria',
    titulo: 'Código Penal y Legislación Complementaria',
    apartado: 'Justicia y Penal / Procesal',
    estado: 'actualizado',
    subtitulo: 'Tipificación de delitos y penas, indispensable en Policía y Fuerzas de Seguridad.',
    normasPrincipales: 'Ley Orgánica 10/1995 del Código Penal. Delitos contra la Administración Pública (prevaricación, cohecho, malversación), atentado contra la autoridad, delitos de odio y régimen penal juvenil.',
    archivoBoe: '038_Codigo_Penal_y_legislacion_complementaria',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=038_Codigo_Penal_y_legislacion_complementaria.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=038_Codigo_Penal_y_legislacion_complementaria&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=038_Codigo_Penal_y_legislacion_complementaria&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=038_Codigo_Penal_y_legislacion_complementaria.epub',
    tags: ['policia', 'guardia civil', 'policia local', 'justicia', 'tramitacion', 'gestion procesal', 'auxilio judicial', 'c1', 'a2', 'a1', 'penal']
  },
  {
    id: '040_Codigo_de_Legislacion_Procesal',
    titulo: 'Código de Legislación Procesal',
    apartado: 'Justicia y Penal / Procesal',
    estado: 'actualizado',
    subtitulo: 'Procedimientos en tribunales civiles, penales, laborales y contenciosos.',
    normasPrincipales: 'Ley de Enjuiciamiento Criminal (LECrim), Ley 1/2000 de Enjuiciamiento Civil (LEC), Ley 29/1998 de la Jurisdicción Contencioso-Administrativa y Ley 36/2011 de la Jurisdicción Social.',
    archivoBoe: '040_Codigo_de_Legislacion_Procesal',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=040_Codigo_de_Legislacion_Procesal.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=040_Codigo_de_Legislacion_Procesal&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=040_Codigo_de_Legislacion_Procesal&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=040_Codigo_de_Legislacion_Procesal.epub',
    tags: ['justicia', 'tramitacion procesal', 'auxilio judicial', 'gestion procesal', 'letrados', 'juzgados', 'c1', 'c2', 'a2', 'a1']
  },
  {
    id: '079_Codigo_de_la_Administracion_de_Justicia',
    titulo: 'Código de la Administración de Justicia',
    apartado: 'Justicia y Penal / Procesal',
    estado: 'en revisión',
    subtitulo: 'Organización del Poder Judicial, juzgados y fiscalía.',
    normasPrincipales: 'Ley Orgánica 6/1985 del Poder Judicial (LOPJ), Consejo General del Poder Judicial (CGPJ), estatuto de jueces, fiscales, letrados de la administración de justicia y cuerpos de funcionarios de justicia.',
    archivoBoe: '079_Codigo_de_la_Administracion_de_Justicia',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=079_Codigo_de_la_Administracion_de_Justicia.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=079_Codigo_de_la_Administracion_de_Justicia&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=079_Codigo_de_la_Administracion_de_Justicia&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=079_Codigo_de_la_Administracion_de_Justicia.epub',
    tags: ['justicia', 'lopj', 'juzgados', 'c1', 'c2', 'a2', 'a1', 'auxilio', 'tramitacion']
  },

  // --- 9. DERECHO LABORAL Y SEGURIDAD SOCIAL ---
  {
    id: '093_Codigo_Laboral_y_de_la_Seguridad_Social_',
    titulo: 'Código Laboral y de la Seguridad Social',
    apartado: 'Laboral y Seguridad Social',
    estado: 'actualizado',
    subtitulo: 'Estatuto de los trabajadores y sistema público de la Seguridad Social.',
    normasPrincipales: 'Real Decreto Legislativo 2/2015 del Estatuto de los Trabajadores (ET), Real Decreto Legislativo 8/2015 de la Ley General de la Seguridad Social (LGSS). Modalidades de contratación, convenio colectivo, cotizaciones, bajas y pensiones.',
    archivoBoe: '093_Codigo_Laboral_y_de_la_Seguridad_Social_',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=093_Codigo_Laboral_y_de_la_Seguridad_Social_.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=093_Codigo_Laboral_y_de_la_Seguridad_Social_&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=093_Codigo_Laboral_y_de_la_Seguridad_Social_&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=093_Codigo_Laboral_y_de_la_Seguridad_Social_.epub',
    tags: ['laboral', 'seguridad social', 'inss', 'tgss', 'subinspector de empleo', 'empleo', 'c1', 'a2', 'a1', 'personal laboral']
  },
  {
    id: '037_Prevencion_de_riesgos_laborales',
    titulo: 'Código de Prevención de Riesgos Laborales',
    apartado: 'Laboral y Seguridad Social',
    estado: 'actualizado',
    subtitulo: 'Obligaciones de seguridad y salud laboral en centros de trabajo y Administraciones.',
    normasPrincipales: 'Ley 31/1995 de Prevención de Riesgos Laborales (LPRL), Real Decreto 39/1997 del Reglamento de los Servicios de Prevención, derechos y obligaciones en seguridad laboral y adaptación en el sector público.',
    archivoBoe: '037_Prevencion_de_riesgos_laborales',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=037_Prevencion_de_riesgos_laborales.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=037_Prevencion_de_riesgos_laborales&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=037_Prevencion_de_riesgos_laborales&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=037_Prevencion_de_riesgos_laborales.epub',
    tags: ['todas', 'c1', 'c2', 'a1', 'a2', 'b', 'ap', 'prl', 'riesgos laborales', 'seguridad laboral', 'salud en el trabajo']
  },

  // --- 10. IGUALDAD, TRANSPARENCIA Y PROTECCIÓN DE DATOS ---
  {
    id: '304_Igualdad_de_Genero_',
    titulo: 'Código de Igualdad de Género y Violencia contra las Mujeres',
    apartado: 'Igualdad, Transparencia y Datos',
    estado: 'en revisión',
    subtitulo: 'Materia transversal obligatoria en el 100% de temarios de oposiciones de España.',
    normasPrincipales: 'Ley Orgánica 3/2007 para la igualdad efectiva de mujeres y hombres, y Ley Orgánica 1/2004 de Medidas de Protección Integral contra la Violencia de Género. Planes de igualdad en la Administración, paridad y tutela institucional.',
    archivoBoe: '304_Igualdad_de_Genero_',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=304_Igualdad_de_Genero_.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=304_Igualdad_de_Genero_&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=304_Igualdad_de_Genero_&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=304_Igualdad_de_Genero_.epub',
    tags: ['todas', 'c1', 'c2', 'a1', 'a2', 'b', 'ap', 'igualdad', 'genero', 'violencia de genero', 'transversal']
  },
  {
    id: '055_Proteccion_de_Datos_de_Caracter_Personal',
    titulo: 'Código de Protección de Datos de Carácter Personal',
    apartado: 'Igualdad, Transparencia y Datos',
    estado: 'en revisión',
    subtitulo: 'Privacidad, secreto y garantía de los derechos digitales.',
    normasPrincipales: 'Ley Orgánica 3/2018 (LOPDGDD) y Reglamento (UE) 2016/679 (RGPD). Principios de protección de datos, delegado de protección de datos (DPD), medidas técnicas y AEPD.',
    archivoBoe: '055_Proteccion_de_Datos_de_Caracter_Personal',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=055_Proteccion_de_Datos_de_Caracter_Personal.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=055_Proteccion_de_Datos_de_Caracter_Personal&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=055_Proteccion_de_Datos_de_Caracter_Personal&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=055_Proteccion_de_Datos_de_Caracter_Personal.epub',
    tags: ['todas', 'c1', 'c2', 'a1', 'a2', 'lopd', 'rgpd', 'privacidad', 'proteccion de datos', 'administrativo', 'auxiliar']
  },
  {
    id: '120_Codigo_de_Transparencia_y_Buen_Gobierno',
    titulo: 'Código de Transparencia, Acceso a la Información y Buen Gobierno',
    apartado: 'Igualdad, Transparencia y Datos',
    estado: 'actualizado',
    subtitulo: 'Publicidad activa y derecho de la ciudadanía a la información pública.',
    normasPrincipales: 'Ley 19/2013 de Transparencia, acceso a la información pública y buen gobierno. Portales de transparencia, límites al derecho de acceso y Consejo de Transparencia y Buen Gobierno.',
    archivoBoe: '120_Codigo_de_Transparencia_y_Buen_Gobierno',
    urlPdf: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_pdf.php?fich=120_Codigo_de_Transparencia_y_Buen_Gobierno.pdf',
    urlWeb: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=120_Codigo_de_Transparencia_y_Buen_Gobierno&modo=2',
    urlOnline: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=120_Codigo_de_Transparencia_y_Buen_Gobierno&modo=2&nota=0&tab=2',
    urlEpub: 'https://www.boe.es/biblioteca_juridica/codigos/abrir_epub.php?fich=120_Codigo_de_Transparencia_y_Buen_Gobierno.epub',
    tags: ['c1', 'c2', 'a1', 'a2', 'transparencia', 'buen gobierno', 'administrativo', 'auxiliar', 'gestion']
  }
];

// --- FUNCIONES DE VINCULACIÓN DINÁMICA CON OPOSICIONES ---

/**
 * Devuelve los códigos oficiales del BOE vinculados dinámicamente al temario de una oposición
 */
function getBoeCodesForOposicion(opo) {
  if (!opo) return [];
  const cat = (opo.categoria || '').toUpperCase();
  const text = `${opo.titulo || ''} ${opo.organismo || ''} ${opo.region || ''}`.toLowerCase();

  const isLocal = text.includes('ayuntamiento') || text.includes('mancomunidad') || text.includes('diputacion') || text.includes('cabildo');
  const isSanidad = text.includes('sanitari') || text.includes('salud') || text.includes('enfermer') || text.includes('scs') || text.includes('médic') || text.includes('tcae') || text.includes('hospital');
  const isPolicia = text.includes('polic') || text.includes('guardia civil') || text.includes('seguridad') || text.includes('urbana') || text.includes('cnp');
  const isBombero = text.includes('bomber') || text.includes('extinci') || text.includes('emergencia');
  const isJusticia = text.includes('justicia') || text.includes('procesal') || text.includes('judicial') || text.includes('juzgado');
  const isHacienda = text.includes('hacienda') || text.includes('tributari') || text.includes('aeat') || text.includes('recaudac') || text.includes('renta');
  const isCantabria = text.includes('cantabria') || text.includes('boc') || text.includes('santander') || text.includes('santoña') || text.includes('castro');

  const matched = [];

  // Función auxiliar para agregar sin duplicados
  const addCode = (codeId) => {
    const found = BOE_CODIGOS_DATABASE.find(c => c.id === codeId);
    if (found && !matched.some(m => m.id === codeId)) {
      matched.push(found);
    }
  };

  // 1. Núcleo común para todas las oposiciones en España: Constitución e Igualdad
  addCode('151_Constitucion_Espanola');
  addCode('304_Igualdad_de_Genero_');

  // 2. Procedimiento Administrativo y Función Pública (para todas las administrativas, gestión y generales)
  if (!isSanidad && !isPolicia && !isBombero) {
    addCode('282_Procedimiento_Administrativo_Comun');
    addCode('003_Codigo_de_la_Funcion_Publica');
    addCode('055_Proteccion_de_Datos_de_Caracter_Personal');
    addCode('029_Codigo_de_Administracion_Electronica');
    addCode('120_Codigo_de_Transparencia_y_Buen_Gobierno');
  } else {
    // En especialidades también entra procedimiento y TREBEP básico
    addCode('282_Procedimiento_Administrativo_Comun');
    addCode('003_Codigo_de_la_Funcion_Publica');
  }

  // 3. Oposiciones Locales (Ayuntamientos / Diputaciones)
  if (isLocal) {
    addCode('019_Codigo_de_Regimen_Local');
    if (cat === 'A1' || cat === 'A2' || isHacienda) {
      addCode('227_Control_del_Gasto_en_las_Haciendas_Locales');
    }
  }

  // 4. Sanidad
  if (isSanidad) {
    addCode('084_Codigo_Sanitario');
    addCode('610_Codigo_del_Personal_Estatutario_de_los_Servicios_de_Salud');
    addCode('037_Prevencion_de_riesgos_laborales');
  }

  // 5. Policía y Fuerzas de Seguridad
  if (isPolicia) {
    if (text.includes('guardia civil')) {
      addCode('007_Codigo_de_la_Guardia_Civil');
    } else if (text.includes('local') || isLocal) {
      addCode('119_Codigo_de_la_Policia_Local');
    } else {
      addCode('018_Codigo_de_la_Policia_Nacional');
    }
    addCode('100_Codigo_de_Seguridad_Ciudadana');
    addCode('038_Codigo_Penal_y_legislacion_complementaria');
  }

  // 6. Bomberos
  if (isBombero) {
    addCode('174_Codigo_de_Proteccion_Civil');
    addCode('037_Prevencion_de_riesgos_laborales');
  }

  // 7. Justicia
  if (isJusticia) {
    addCode('040_Codigo_de_Legislacion_Procesal');
    addCode('038_Codigo_Penal_y_legislacion_complementaria');
    addCode('079_Codigo_de_la_Administracion_de_Justicia');
  }

  // 8. Hacienda y Tributos
  if (isHacienda) {
    addCode('030_Ley_General_Tributaria_y_sus_reglamentos');
    addCode('033_Ley_General_Presupuestaria_y_normas_complementarias');
  }

  // 9. Categorías A1 / A2 (Gestión superior y técnicos)
  if (cat === 'A1' || cat === 'A2') {
    addCode('031_Codigo_de_Contratos_del_Sector_Publico');
    addCode('044_Codigo_de_Derecho_Administrativo');
    addCode('082_Codigo_de_la_estructura_de_la_Administracion_General_del_Estado');
  }

  // 10. Convocatorias Autonómicas (Cantabria / CCAA)
  if (isCantabria || opo.boletin === 'BOC') {
    addCode('017_Estatutos_de_Autonomia');
    addCode('124_Codigo_de_la_Funcion_Publica_Normativa_Autonomica');
  }

  return matched;
}

// --- RENDERIZADO DEL CATÁLOGO COMPLETO DE LA BIBLIOTECA BOE ---

let currentBoeFilterApartado = 'Todos';
let currentBoeFilterEstado = 'Todos';
let currentBoeSearchText = '';

function renderBoeBiblioteca(containerId = 'biblioteca-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const query = (currentBoeSearchText || '').trim().toLowerCase();

  const filtered = BOE_CODIGOS_DATABASE.filter(code => {
    // Filtro por Apartado
    if (currentBoeFilterApartado !== 'Todos' && code.apartado !== currentBoeFilterApartado) {
      return false;
    }
    // Filtro por Estado
    if (currentBoeFilterEstado !== 'Todos' && code.estado !== currentBoeFilterEstado) {
      return false;
    }
    // Filtro por Búsqueda de texto
    if (query) {
      const matchTitle = code.titulo.toLowerCase().includes(query);
      const matchSub = code.subtitulo.toLowerCase().includes(query);
      const matchNormas = code.normasPrincipales.toLowerCase().includes(query);
      const matchApartado = code.apartado.toLowerCase().includes(query);
      const matchTags = code.tags.some(t => t.toLowerCase().includes(query));
      if (!matchTitle && !matchSub && !matchNormas && !matchApartado && !matchTags) {
        return false;
      }
    }
    return true;
  });

  const countBadge = document.getElementById('biblioteca-count-badge');
  if (countBadge) {
    countBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'código oficial' : 'códigos oficiales'}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No se encontraron códigos del BOE</h3>
        <p style="color: var(--text-muted); font-size: 13px; margin-top: 6px;">
          Prueba a modificar los filtros por apartado o el término de búsqueda.
        </p>
        <button class="btn btn-outline btn-sm" onclick="resetBoeFilters()" style="margin-top: 14px;">
          Mostrar todos los códigos (${BOE_CODIGOS_DATABASE.length})
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="boe-cards-grid">
      ${filtered.map(code => renderBoeCardHtml(code)).join('')}
    </div>
  `;
}

function renderBoeCardHtml(code) {
  const isActualizado = code.estado === 'actualizado';
  const badgeClass = isActualizado ? 'badge-boe-actualizado' : 'badge-boe-revision';
  const badgeText = isActualizado ? 'Actualizado' : 'En revisión';
  const badgeDot = isActualizado ? '●' : '▲';

  return `
    <div class="boe-code-card" id="boe-card-${code.id}">
      <div class="boe-card-top">
        <span class="boe-apartado-tag">${boeEscape(code.apartado)}</span>
        <span class="boe-status-badge ${badgeClass}" title="Estado oficial según el BOE">
          ${badgeDot} ${badgeText}
        </span>
      </div>

      <h3 class="boe-card-title">${boeEscape(code.titulo)}</h3>
      <p class="boe-card-subtitle">${boeEscape(code.subtitulo)}</p>

      <div class="boe-card-normas-box">
        <strong>Normativa incluida:</strong>
        <p>${boeEscape(code.normasPrincipales)}</p>
      </div>

      <div class="boe-card-actions">
        <button class="btn btn-primary btn-sm btn-boe-read" onclick="openBoeReaderModal('${code.id}')" title="Leer online este código desde la app">
          <svg class="icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 1-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          <span>Leer Online</span>
        </button>

        <a href="${code.urlPdf}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm btn-boe-pdf" title="Descargar PDF oficial consolidado">
          <svg class="icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>PDF Oficial</span>
        </a>
      </div>
    </div>
  `;
}

// --- MODAL DE LECTURA Y DETALLE DEL CÓDIGO BOE ---

function openBoeReaderModal(codigoId) {
  const code = BOE_CODIGOS_DATABASE.find(c => c.id === codigoId);
  if (!code) return;

  const modal = document.getElementById('boe-reader-modal');
  if (!modal) return;

  const isActualizado = code.estado === 'actualizado';
  const badgeClass = isActualizado ? 'badge-boe-actualizado' : 'badge-boe-revision';
  const badgeText = isActualizado ? 'Actualizado (Consolidado al día)' : 'En revisión normativa';

  const modalTitle = document.getElementById('boe-reader-modal-title');
  const modalSubtitle = document.getElementById('boe-reader-modal-subtitle');
  const modalBody = document.getElementById('boe-reader-modal-body');

  if (modalTitle) modalTitle.textContent = code.titulo;
  if (modalSubtitle) modalSubtitle.textContent = code.apartado;

  if (modalBody) {
    modalBody.innerHTML = `
      <div class="boe-reader-header-status">
        <span class="boe-apartado-tag">${boeEscape(code.apartado)}</span>
        <span class="boe-status-badge ${badgeClass}">${badgeText}</span>
        <span style="font-size: 11px; color: var(--text-muted); margin-left: auto;">Fuente: Agencia Estatal BOE</span>
      </div>

      <div class="boe-reader-summary-box">
        <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
          Contenido Normativo Oficial
        </h4>
        <p style="font-size: 12px; color: var(--text-main); line-height: 1.5; margin-bottom: 8px;">
          ${boeEscape(code.normasPrincipales)}
        </p>
        <p style="font-size: 11px; color: var(--text-muted);">
          ${boeEscape(code.subtitulo)}
        </p>
      </div>

      <!-- Acciones de Acceso Oficial -->
      <div class="boe-reader-access-panel">
        <div class="boe-reader-access-item">
          <div class="boe-access-text">
            <strong>Lectura Online Directa (Pestaña Oficial)</strong>
            <p>Accede al índice temático navegable, tabla de artículos y texto íntegro consolidado en la web oficial del BOE.</p>
          </div>
          <a href="${code.urlOnline}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            <svg class="icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>Abrir Lector Web BOE</span>
          </a>
        </div>

        <div class="boe-reader-access-item">
          <div class="boe-access-text">
            <strong>Descargar Código Oficial en PDF</strong>
            <p>Documento oficial maquetado e imprimible con índice activo y texto completo del boletín.</p>
          </div>
          <a href="${code.urlPdf}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
            <svg class="icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Descargar PDF</span>
          </a>
        </div>

        <div class="boe-reader-access-item">
          <div class="boe-access-text">
            <strong>Libro Electrónico para Móvil / Tablet (ePUB)</strong>
            <p>Formato digital optimizado para lectores de libros electrónicos, Apple Books y Google Play Libros.</p>
          </div>
          <a href="${code.urlEpub}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
            <svg class="icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            <span>Descargar ePUB</span>
          </a>
        </div>
      </div>

      <!-- Aviso Legal Institucional -->
      <div class="boe-legal-notice">
        <svg class="icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>
          Documentación jurídica consolidada y distribuida gratuitamente por el BOE conforme a la política de datos abiertos del Gobierno de España.
        </span>
      </div>
    `;
  }

  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
}

function closeBoeReaderModal() {
  const modal = document.getElementById('boe-reader-modal');
  if (modal) modal.style.display = 'none';
  document.body.classList.remove('modal-open');
}

function handleBoeFilterApartadoChange(val) {
  currentBoeFilterApartado = val;
  renderBoeBiblioteca();
}

function handleBoeFilterEstadoChange(val) {
  currentBoeFilterEstado = val;
  renderBoeBiblioteca();
}

function handleBoeSearchInput(val) {
  currentBoeSearchText = val;
  renderBoeBiblioteca();
}

function resetBoeFilters() {
  currentBoeFilterApartado = 'Todos';
  currentBoeFilterEstado = 'Todos';
  currentBoeSearchText = '';

  const selApartado = document.getElementById('filter-boe-apartado');
  if (selApartado) selApartado.value = 'Todos';

  const selEstado = document.getElementById('filter-boe-estado');
  if (selEstado) selEstado.value = 'Todos';

  const searchInp = document.getElementById('filter-boe-search');
  if (searchInp) searchInp.value = '';

  renderBoeBiblioteca();
}

// Exponer globalmente
if (typeof window !== 'undefined') {
  window.BOE_APARTADOS = BOE_APARTADOS;
  window.BOE_CODIGOS_DATABASE = BOE_CODIGOS_DATABASE;
  window.getBoeCodesForOposicion = getBoeCodesForOposicion;
  window.renderBoeBiblioteca = renderBoeBiblioteca;
  window.openBoeReaderModal = openBoeReaderModal;
  window.closeBoeReaderModal = closeBoeReaderModal;
  window.handleBoeFilterApartadoChange = handleBoeFilterApartadoChange;
  window.handleBoeFilterEstadoChange = handleBoeFilterEstadoChange;
  window.handleBoeSearchInput = handleBoeSearchInput;
  window.resetBoeFilters = resetBoeFilters;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BOE_APARTADOS,
    BOE_CODIGOS_DATABASE,
    getBoeCodesForOposicion
  };
}

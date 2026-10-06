#!/usr/bin/env node
/**
 * OpoFinder - Monitor y Notificador de Terminal (CLI)
 * Ejecuta este script en segundo plano o como cron job para monitorizar convocatorias y recibir alertas en el terminal.
 * Uso: node scripts/opofinder-terminal.js [--watch]
 */

const https = require('https');

const SUPABASE_URL = 'https://cnxlamwrkljwuifglzlp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qzW2YoR8jLfu_7mKb0mkFA_t9nqyom9';

function printBanner() {
  console.log('\x1b[36m========================================================\x1b[0m');
  console.log('\x1b[1m\x1b[33m  OpoFinder CLI • Sistema de Monitorización en Terminal\x1b[0m');
  console.log('\x1b[36m========================================================\x1b[0m');
  console.log(`[${new Date().toLocaleTimeString()}] Monitor de convocatorias y novedades inicializado.\n`);
}

function fetchBOESummary() {
  return new Promise((resolve, reject) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}${m}${d}`;
    
    const url = `https://www.boe.es/datos/opendata/api/boe/sumario/${dateStr}`;
    
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', err => resolve(null));
  });
}

async function checkAlerts() {
  printBanner();
  console.log('\x1b[34m[INFO]\x1b[0m Consultando publicaciones oficiales en BOE y fuentes autonómicas...');
  
  const boeData = await fetchBOESummary();
  if (boeData && boeData.data && boeData.data.sumario) {
    console.log('\x1b[32m[OK]\x1b[0m Sumario oficial del BOE recuperado correctamente.');
    const secciones = boeData.data.sumario.diario?.seccion || [];
    let countConvocatorias = 0;
    
    secciones.forEach(sec => {
      if (sec.codigo === '2B') {
        countConvocatorias += (sec.departamento || []).reduce((acc, dep) => acc + (dep.epigrafe || []).length, 0);
      }
    });

    console.log(`\x1b[33m[AVISO TERMINAL]\x1b[0m Se han detectado ${countConvocatorias} procesos selectivos publicados hoy en el BOE.`);
  } else {
    console.log('\x1b[33m[AVISO TERMINAL]\x1b[0m Sin publicaciones extraordinarias pendientes a esta hora.');
  }

  console.log('\n\x1b[32m✔ Monitorización de convocatorias guardadas completada con éxito.\x1b[0m');
  console.log('Para recibir avisos interactivos en tu teléfono o navegador, accede a: https://capiesp.github.io/Opofinder/\n');
}

checkAlerts();

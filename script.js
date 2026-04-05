// --- VARIABLES DE ESTADO ---
let baseHealth = 100;
let magicEnergy = 0;
const maxMagicEnergy = 10;
let oleadaActual = 1;
let enemigosPorGenerar = 5;
let framesDesdeUltimoEnemigo = 0;
let framesParaSiguienteEnemigo = 180;
let framesEnergia = 0;
let personajeSeleccionado = null;

const guardianesActivos = [];
const enemigosActivos = [];

const uiBaseHealth = document.getElementById('base-health');
const uiMagicEnergy = document.getElementById('magic-energy');
const uiWaveNumber = document.getElementById('wave-number');
const botonesGuardianes = document.querySelectorAll('.guardian-btn');
const lanesDivs = document.querySelectorAll('.lane');

// --- CLASE BASE DE PERSONAJES ---
class Personaje {
  constructor(vida, dano, velocidad, archivoImagen) {
    this.vidaMaxima = vida;
    this.vidaActual = vida;
    this.dano = dano;
    this.velocidad = velocidad;
    this.icono = archivoImagen; // Aquí guardamos el nombre del .webp
  }
}

// --- TUS PERSONAJES (NOMBRES SEGÚN TU FOTO) ---
class G_Caballero extends Personaje { constructor() { super(300, 10, 0.4, 'guardiancaballero.webp'); } }
class G_Arquero extends Personaje { constructor() { super(80, 25, 1.2, 'guardianarquero.webp'); } }
class G_Mago extends Personaje { constructor() { super(100, 40, 0.8, 'magoguardian.webp'); } }
class G_Peca extends Personaje { constructor() { super(250, 60, 0.5, 'peca.webp'); } }

// Tu enemigo según la lista
class Enemigo_1 extends Personaje { constructor() { super(70, 15, 0.5, 'enemigo1.webp'); } }

const dicG = {
  tanque: { c: G_Caballero, costo: 3 },
  arquero: { c: G_Arquero, costo: 2 },
  mago: { c: G_Mago, costo: 4 },
  ninja: { c: G_Peca, costo: 5 }
};

// --- FUNCIONES LÓGICAS ---
function updateHUD() {
  uiBaseHealth.textContent = Math.floor(baseHealth);
  uiMagicEnergy.textContent = magicEnergy;
  uiWaveNumber.textContent = oleadaActual;
  botonesGuardianes.forEach(b => {
    const t = b.getAttribute('data-type');
    if (magicEnergy >= dicG[t].costo) b.classList.remove('disabled');
    else b.classList.add('disabled');
  });
}

function crearVisual(archivo, x, parent) {
  const el = document.createElement('div');
  el.classList.add('entidad');
  el.style.left = x + 'px';
  // IMPORTANTE: Aquí creamos la etiqueta <img> para que se vea tu .webp
  el.innerHTML = `
    <div class="health-bar-container"><div class="health-bar-fill"></div></div>
    <img src="${archivo}" class="imagen-personaje">
  `;
  parent.appendChild(el);
  return { el: el, bar: el.querySelector('.health-bar-fill') };
}

botonesGuardianes.forEach(b => {
  b.addEventListener('click', () => {
    if (b.classList.contains('disabled')) return;
    botonesGuardianes.forEach(btn => btn.classList.remove('selected'));
    personajeSeleccionado = b.getAttribute('data-type');
    b.classList.add('selected');
  });
});

lanesDivs.forEach((lane, i) => {
  lane.addEventListener('click', (e) => {
    if (!personajeSeleccionado) return;
    const d = dicG[personajeSeleccionado];
    magicEnergy -= d.costo;
    const rect = lane.getBoundingClientRect();
    let posX = Math.max(110, e.clientX - rect.left);
    const nG = new d.c();
    const vis = crearVisual(nG.icono, posX, lane);
    guardianesActivos.push({ logica: nG, visual: vis.el, barra: vis.bar, posX: posX, carril: i + 1, peleando: false });
    personajeSeleccionado = null;
    botonesGuardianes.forEach(btn => btn.classList.remove('selected'));
    updateHUD();
  });
});

function generarEnemigo() {
  const nE = new Enemigo_1();
  const c = Math.floor(Math.random() * 3) + 1;
  const vis = crearVisual(nE.icono, 780, document.getElementById(`lane-${c}`));
  enemigosActivos.push({ logica: nE, visual: vis.el, barra: vis.bar, posX: 780, carril: c, peleando: false });
}

function gameLoop() {
  framesEnergia++;
  if (framesEnergia >= 120 && magicEnergy < maxMagicEnergy) { magicEnergy++; updateHUD(); framesEnergia = 0; }
  
  if (enemigosPorGenerar > 0) {
    framesDesdeUltimoEnemigo++;
    if (framesDesdeUltimoEnemigo >= framesParaSiguienteEnemigo) { generarEnemigo(); enemigosPorGenerar--; framesDesdeUltimoEnemigo = 0; }
  } else if (enemigosActivos.length === 0) {
    oleadaActual++; 
    enemigosPorGenerar = 5 + oleadaActual;
    updateHUD();
  }
  
  guardianesActivos.forEach(g => g.peleando = false);
  enemigosActivos.forEach(e => e.peleando = false);

  guardianesActivos.forEach(g => {
    enemigosActivos.forEach(e => {
      if (g.carril === e.carril && Math.abs(e.posX - g.posX) < 50) {
        g.peleando = true; e.peleando = true;
        e.logica.vidaActual -= g.logica.dano/60; g.logica.vidaActual -= e.logica.dano/60;
        e.barra.style.width = (e.logica.vidaActual/e.logica.vidaMaxima)*100 + "%";
        g.barra.style.width = (g.logica.vidaActual/g.logica.vidaMaxima)*100 + "%";
      }
    });
  });

  for (let i = 0; i < guardianesActivos.length; i++) {
    let g = guardianesActivos[i];
    if (!g.peleando) { g.posX += g.logica.velocidad; g.visual.style.left = g.posX + 'px'; }
    if (g.logica.vidaActual <= 0 || g.posX > 850) { g.visual.remove(); guardianesActivos.splice(i, 1); i--; }
  }

  for (let j = 0; j < enemigosActivos.length; j++) {
    let e = enemigosActivos[j];
    if (!e.peleando) { e.posX -= e.logica.velocidad; e.visual.style.left = e.posX + 'px'; }
    if (e.posX <= 90) { baseHealth -= 0.5; updateHUD(); }
    if (e.logica.vidaActual <= 0) { e.visual.remove(); enemigosActivos.splice(j, 1); j--; }
  }

  if (baseHealth <= 0) { alert("¡Derrota! Tu casa ha sido destruida."); location.reload(); return; }
  requestAnimationFrame(gameLoop);
}

// INICIO
updateHUD();
gameLoop();

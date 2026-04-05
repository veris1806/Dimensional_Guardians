// --- ESTADO DEL JUEGO ---
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

// --- CLASES ---
class Personaje {
  constructor(vida, dano, velocidad, icono) {
    this.vidaMaxima = vida;
    this.vidaActual = vida;
    this.dano = dano;
    this.velocidad = velocidad;
    this.icono = icono; // Aquí ahora guardamos la ruta del archivo .webp
  }
}

// MODIFICACIÓN: Usando tus archivos específicos
class Guardian_Tanque extends Personaje { constructor() { super(300, 10, 0.4, 'guardiancaballero.webp'); } }
class Guardian_Arquero extends Personaje { constructor() { super(80, 25, 1.2, 'guardianarquero.webp'); } }
class Guardian_Mago extends Personaje { constructor() { super(100, 40, 0.8, 'magoguardian.webp'); } }
class Guardian_Peca extends Personaje { constructor() { super(200, 60, 0.5, 'peca.webp'); } }

class Enemigo_Basico extends Personaje { constructor() { super(70, 15, 0.5, 'enemigo1.webp'); } }

const diccionarioGuardianes = {
  tanque: { clase: Guardian_Tanque, costo: 3 },
  arquero: { clase: Guardian_Arquero, costo: 2 },
  mago: { clase: Guardian_Mago, costo: 4 },
  ninja: { clase: Guardian_Peca, costo: 5 } // El PEKA reemplaza al Ninja
};

// --- INTERFAZ ---
function updateHUD() {
  uiBaseHealth.textContent = Math.floor(baseHealth);
  uiMagicEnergy.textContent = magicEnergy;
  uiWaveNumber.textContent = oleadaActual;

  botonesGuardianes.forEach(boton => {
    const tipo = boton.getAttribute('data-type');
    if (magicEnergy >= diccionarioGuardianes[tipo].costo) {
      boton.classList.remove('disabled');
    } else {
      boton.classList.add('disabled');
      if (personajeSeleccionado === tipo) deseleccionarPersonaje();
    }
  });
}

function deseleccionarPersonaje() {
  personajeSeleccionado = null;
  botonesGuardianes.forEach(b => b.classList.remove('selected'));
  lanesDivs.forEach(lane => lane.classList.remove('selectable'));
}

// --- SELECCIÓN Y COLOCACIÓN ---
botonesGuardianes.forEach(boton => {
  boton.addEventListener('click', () => {
    if (boton.classList.contains('disabled')) return;
    const tipo = boton.getAttribute('data-type');
    if (personajeSeleccionado === tipo) { deseleccionarPersonaje(); return; }
    deseleccionarPersonaje(); 
    personajeSeleccionado = tipo;
    boton.classList.add('selected');
    lanesDivs.forEach(lane => lane.classList.add('selectable'));
  });
});

lanesDivs.forEach((lane, index) => {
  lane.addEventListener('click', (eventoClic) => {
    if (!personajeSeleccionado) return;
    const datos = diccionarioGuardianes[personajeSeleccionado];
    const rect = lane.getBoundingClientRect();
    let posX = eventoClic.clientX - rect.left;

    if (posX < 110) posX = 110; 

    magicEnergy -= datos.costo;
    updateHUD();

    const nuevoGuardian = new datos.clase();
    const carrilSeleccionado = index + 1;
    const { elementoDOM, barraRelleno } = crearElementoVisual(nuevoGuardian.icono);
    
    elementoDOM.style.left = posX + 'px'; 
    lane.appendChild(elementoDOM);

    guardianesActivos.push({
      logica: nuevoGuardian,
      visual: elementoDOM,
      barra: barraRelleno,
      posX: posX,
      carril: carrilSeleccionado,
      peleando: false
    });
    deseleccionarPersonaje();
  });
});

// MODIFICACIÓN: Función actualizada para mostrar IMÁGENES en vez de emojis
function crearElementoVisual(archivo) {
  const elementoDOM = document.createElement('div');
  elementoDOM.classList.add('entidad');
  elementoDOM.innerHTML = `
    <div class="health-bar-container"><div class="health-bar-fill"></div></div>
    <img src="${archivo}" class="imagen-personaje">
  `;
  const barraRelleno = elementoDOM.querySelector('.health-bar-fill');
  return { elementoDOM, barraRelleno };
}

function generarEnemigo() {
  const nuevoEnemigo = new Enemigo_Basico();
  const carrilAleatorio = Math.floor(Math.random() * 3) + 1;
  const { elementoDOM, barraRelleno } = crearElementoVisual(nuevoEnemigo.icono);
  
  elementoDOM.style.left = '780px'; 
  document.getElementById(`lane-${carrilAleatorio}`).appendChild(elementoDOM);

  enemigosActivos.push({
    logica: nuevoEnemigo,
    visual: elementoDOM,
    barra: barraRelleno,
    posX: 780,
    carril: carrilAleatorio,
    peleando: false
  });
}

// --- MOTOR DEL JUEGO ---
function gameLoop() {
  framesEnergia++;
  if (framesEnergia >= 180 && magicEnergy < maxMagicEnergy) {
    magicEnergy++;
    updateHUD();
    framesEnergia = 0;
  }

  if (enemigosPorGenerar > 0) {
    framesDesdeUltimoEnemigo++;
    if (framesDesdeUltimoEnemigo >= framesParaSiguienteEnemigo) {
      generarEnemigo();
      enemigosPorGenerar--;
      framesDesdeUltimoEnemigo = 0;
    }
  } else if (enemigosActivos.length === 0) {
    oleadaActual++;
    enemigosPorGenerar = 5 + (oleadaActual * 2);
    framesParaSiguienteEnemigo = Math.max(60, 180 - (oleadaActual * 15)); 
    updateHUD();
  }

  guardianesActivos.forEach(g => g.peleando = false);
  enemigosActivos.forEach(e => e.peleando = false);

  // Lógica de colisión y combate
  for (let i = 0; i < guardianesActivos.length; i++) {
    let g = guardianesActivos[i];
    for (let j = 0; j < enemigosActivos.length; j++) {
      let e = enemigosActivos[j];
      if (g.carril === e.carril && Math.abs(e.posX - g.posX) < 50) {
        g.peleando = true;
        e.peleando = true;
        e.logica.vidaActual -= (g.logica.dano / 60);
        g.logica.vidaActual -= (e.logica.dano / 60);
        e.barra.style.width = Math.max(0, (e.logica.vidaActual / e.logica.vidaMaxima) * 100) + '%';
        g.barra.style.width = Math.max(0, (g.logica.vidaActual / g.logica.vidaMaxima) * 100) + '%';
        break; 
      }
    }
  }

  // Movimiento Guardianes
  for (let i = 0; i < guardianesActivos.length; i++) {
    let g = guardianesActivos[i];
    if (!g.peleando) {
      g.posX += g.logica.velocidad;
      g.visual.style.left = g.posX + 'px';
    }
    if (g.logica.vidaActual <= 0 || g.posX > 850) {
      g.visual.remove();
      guardianesActivos.splice(i, 1);
      i--;
    }
  }

  // Movimiento Enemigos
  for (let j = 0; j < enemigosActivos.length; j++) {
    let e = enemigosActivos[j];
    if (!e.peleando) {
      e.posX -= e.logica.velocidad;
      e.visual.style.left = e.posX + 'px';
    }
    if (e.posX <= 90) {
      baseHealth -= (e.logica.dano / 100); // Daño progresivo a la base
      updateHUD();
      const casa = document.getElementById('home-zone');
      casa.classList.add('recibiendo-dano');
      setTimeout(() => casa.classList.remove('recibiendo-dano'), 150);
    }
    if (e.logica.vidaActual <= 0) {
      e.visual.remove();
      enemigosActivos.splice(j, 1);
      j--;
    }
  }

  if (baseHealth <= 0) {
    alert("¡Juego Terminado! Oleada alcanzada: " + oleadaActual);
    location.reload();
    return; 
  }
  requestAnimationFrame(gameLoop);
}

updateHUD();
requestAnimationFrame(gameLoop);
¡Último paso importante!
Como ahora estamos usando fotos, si no les das tamaño en el CSS, se verán mal. Por favor, ve a tu archivo styles.css y pega esto al final (si no lo tienes ya):

CSS
.imagen-personaje {
  width: 65px;         /* Tamaño del personaje */
  height: 65px;        /* Tamaño del personaje */
  object-fit: contain; /* Para que no se estire la imagen */
  display: block;
}

.entidad {
  pointer-events: none; /* Para que no interfieran con los clics del carril */
}

// --- CONFIGURACIÓN DE PERSONAJES (Tus archivos exactos) ---
const dicG = {
    tanque:  { icono: 'tanquee.png', costo: 3, vida: 300, dano: 10, vel: 0.4 },
    arquero: { icono: 'arqueroo.png', costo: 2, vida: 80, dano: 25, vel: 1.2 },
    mago:    { icono: 'magoo.png', costo: 4, vida: 100, dano: 40, vel: 0.8 },
    ninja:   { icono: 'ninjaa.png', costo: 5, vida: 150, dano: 60, vel: 0.6 }
};

// --- VARIABLES DE ESTADO ---
let baseHealth = 100;
let magicEnergy = 5;
let oleada = 1;
let seleccionado = null;
let guardianesActivos = [];
let enemigosActivos = [];
let frames = 0;

// --- ELEMENTOS DE LA INTERFAZ ---
const uiVida = document.getElementById('base-health');
const uiEnergia = document.getElementById('magic-energy');
const uiOleada = document.getElementById('wave-number');
const botones = document.querySelectorAll('.guardian-btn');
const carriles = document.querySelectorAll('.lane');

function actualizarInterfaz() {
    uiVida.textContent = Math.floor(baseHealth);
    uiEnergia.textContent = magicEnergy;
    uiOleada.textContent = oleada;

    botones.forEach(btn => {
        const tipo = btn.getAttribute('data-type');
        if (magicEnergy >= dicG[tipo].costo) {
            btn.classList.remove('disabled');
        } else {
            btn.classList.add('disabled');
        }
    });
}

// --- LÓGICA DE SELECCIÓN ---
botones.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.classList.contains('disabled')) return;
        
        botones.forEach(b => b.classList.remove('selected'));
        seleccionado = btn.getAttribute('data-type');
        btn.classList.add('selected');
        
        carriles.forEach(l => l.classList.add('selectable'));
    });
});

// --- INVOCACIÓN EN CARRILES ---
carriles.forEach((lane, index) => {
    lane.addEventListener('click', (e) => {
        if (!seleccionado) return;
        const datos = dicG[seleccionado];
        
        if (magicEnergy >= datos.costo) {
            magicEnergy -= datos.costo;
            
            const rect = lane.getBoundingClientRect();
            const xInicial = e.clientX - rect.left;

            const personajeObj = {
                visual: crearVisual(datos.icono, xInicial, lane, true),
                vida: datos.vida,
                vidaMax: datos.vida,
                dano: datos.dano,
                vel: datos.vel,
                x: xInicial,
                lane: index + 1
            };

            guardianesActivos.push(personajeObj);
            
            // Limpiar selección
            seleccionado = null;
            botones.forEach(b => b.classList.remove('selected'));
            carriles.forEach(l => l.classList.remove('selectable'));
            actualizarInterfaz();
        }
    });
});

function crearVisual(imgSrc, x, padre, esGuardian) {
    const div = document.createElement('div');
    div.classList.add('entidad');
    div.style.left = x + 'px';
    
    div.innerHTML = `
        <div class="health-bar-container"><div class="health-bar-fill"></div></div>
        <img src="${imgSrc}" class="imagen-personaje" style="${esGuardian ? '' : 'transform: scaleX(-1)'}">
    `;
    padre.appendChild(div);
    return div;
}

// --- ENEMIGOS ---
function spawnEnemigo() {
    const carrilRandom = Math.floor(Math.random() * 3);
    const padre = carriles[carrilRandom];
    
    // Usamos enemigo1.png o enemigo2.png al azar
    const imgEnemigo = Math.random() > 0.5 ? 'enemigo1.png' : 'enemigo2.png';

    const enemigoObj = {
        visual: crearVisual(imgEnemigo, 780, padre, false),
        vida: 80,
        vidaMax: 80,
        dano: 20,
        vel: 0.7,
        x: 780,
        lane: carrilRandom + 1
    };
    enemigosActivos.push(enemigoObj);
}

// --- LOOP DEL JUEGO (60 veces por segundo) ---
function gameLoop() {
    frames++;
    
    // Recuperar energía cada 2 segundos
    if (frames % 120 === 0 && magicEnergy < 10) {
        magicEnergy++;
        actualizarInterfaz();
    }

    // Aparecer enemigo cada 3 segundos
    if (frames % 180 === 0) spawnEnemigo();

    // Mover Guardianes y detectar combate
    guardianesActivos.forEach((g, i) => {
        let enCombate = false;
        
        enemigosActivos.forEach(e => {
            if (g.lane === e.lane && Math.abs(g.x - e.x) < 50) {
                enCombate = true;
                e.vida -= g.dano / 60;
                g.vida -= e.dano / 60;
                
                // Actualizar barras de vida
                e.visual.querySelector('.health-bar-fill').style.width = (e.vida / e.vidaMax) * 100 + "%";
                g.visual.querySelector('.health-bar-fill').style.width = (g.vida / g.vidaMax) * 100 + "%";
            }
        });

        if (!enCombate) {
            g.x += g.vel;
            g.visual.style.left = g.x + 'px';
        }

        if (g.vida <= 0 || g.x > 820) {
            g.visual.remove();
            guardianesActivos.splice(i, 1);
        }
    });

    // Mover Enemigos
    enemigosActivos.forEach((e, i) => {
        let enCombate = false;
        guardianesActivos.forEach(g => {
            if (e.lane === g.lane && Math.abs(e.x - g.x) < 50) enCombate = true;
        });

        if (!enCombate) {
            e.x -= e.vel;
            e.visual.style.left = e.x + 'px';
        }

        if (e.x < 50) {
            baseHealth -= 0.2;
            actualizarInterfaz();
        }

        if (e.vida <= 0) {
            e.visual.remove();
            enemigosActivos.splice(i, 1);
        }
    });

    if (baseHealth <= 0) {
        alert("¡GAME OVER! El bosque ha sido invadido.");
        location.reload();
    } else {
        requestAnimationFrame(gameLoop);
    }
}

// INICIAR
actualizarInterfaz();
gameLoop();

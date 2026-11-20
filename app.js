"use strict";

// ═══════════════════════════════════════════════════════════════════════
// Parte 1 — Tablero de Tareas del Equipo
// ═══════════════════════════════════════════════════════════════════════

// ─── Estado central de la aplicación ───────────────────────────────────
let tareas = [];
let filtroEstado = "todas";
let filtroPrioridad = "todas";

// Secuencia de estados posibles, en el orden en que una tarea avanza
const SECUENCIA_ESTADOS = ["pendiente", "en-progreso", "completada"];

// Obtiene el valor de un campo de texto y lo limpia
const leerCampo = (selector) => {
  const campo = document.querySelector(selector);
  const valor = campo.value.trim();
  campo.value = "";
  return valor;
};

// Escapa caracteres especiales para que el texto del usuario no se
// interprete como HTML al insertarlo con innerHTML.
const escaparHTML = (texto) =>
  texto.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);

// Referencia al contenedor del tablero
const tablero = document.querySelector("#tablero");

// ─── Generador de ID (Decisión de diseño: Estrategia A — closure) ──────
// El contador vive dentro del closure de crearGeneradorId: ningún otro
// código del archivo puede leerlo ni reasignarlo; solo se avanza a través
// de la función devuelta (generarId).
function crearGeneradorId() {
  let contador = 1;              // variable privada, solo visible dentro del closure
  return () => contador++;
}
const generarId = crearGeneradorId();

// ─── Configuración por prioridad (switch) ──────────────────────────────
// Checkpoint de comprensión: uso switch porque las tres ramas preguntan
// por la misma variable (prioridad) y la comparan con valores fijos que
// ya conozco ("alta", "media", "baja"). No hay rangos ni condiciones
// combinadas, así que un switch se lee más limpio que una cadena de
// if/else-if y deja un default claro para valores inesperados.
function obtenerConfigPrioridad(prioridad) {
  switch (prioridad) {
    case "alta":
      return { clase: "prioridad-alta", etiqueta: "Alta" };
    case "media":
      return { clase: "prioridad-media", etiqueta: "Media" };
    case "baja":
      return { clase: "prioridad-baja", etiqueta: "Baja" };
    default:
      return { clase: "prioridad-media", etiqueta: "Media" };
  }
}

// ─── Creación del elemento DOM de una tarea ────────────────────────────
function crearElementoTarea({ id, titulo, descripcion, prioridad, estado }) {
  const { clase: clasePrioridad, etiqueta: etiquetaPrioridad } = obtenerConfigPrioridad(prioridad);

  const tarea = document.createElement("article");
  tarea.classList.add("tarea", `estado-${estado}`, clasePrioridad);
  tarea.dataset.id = id;

  const puedeAvanzar = estado !== "completada";

  tarea.innerHTML = `
    <span class="badge-prioridad">${etiquetaPrioridad}</span>
    <span class="badge-estado">${estado}</span>
    <h3>${escaparHTML(titulo)}</h3>
    <p>${escaparHTML(descripcion)}</p>
    <div class="acciones-tarea">
      ${puedeAvanzar
        ? `<button class="btn-avanzar" data-id="${id}" data-action="avanzar">Avanzar estado</button>`
        : ""}
      <button class="btn-eliminar" data-id="${id}" data-action="eliminar">Eliminar</button>
    </div>
  `;

  return tarea;
}

// ─── Agregar tareas ────────────────────────────────────────────────────
function agregarTarea() {
  const titulo      = leerCampo("#input-titulo");
  const descripcion = leerCampo("#input-descripcion");
  const prioridad   = document.querySelector("#select-prioridad").value;

  // Validación básica: título y descripción son obligatorios
  if (!titulo || !descripcion) {
    alert("El título y la descripción son obligatorios.");
    return;
  }

  // Crear objeto tarea y agregarlo al estado
  const nuevaTarea = { id: generarId(), titulo, descripcion, prioridad, estado: "pendiente" };
  tareas.push(nuevaTarea);

  // Crear el elemento DOM y añadirlo al tablero
  const elemento = crearElementoTarea(nuevaTarea);
  tablero.appendChild(elemento);

  // La tarjeta nueva respeta los filtros activos (p. ej. si se está
  // viendo solo "Completadas", la nueva tarea pendiente queda oculta)
  aplicarFiltros();
  actualizarStats();
}

// Registrar el evento del botón
document.querySelector("#btn-agregar").addEventListener("click", agregarTarea);

// Permitir agregar con Enter desde los campos de texto
["#input-titulo", "#input-descripcion"].forEach((selector) => {
  document.querySelector(selector).addEventListener("keydown", (e) => {
    if (e.key === "Enter") agregarTarea();
  });
});

// ─── Estadísticas con reduce() y for...of ──────────────────────────────
function actualizarStats() {
  // reduce: construye un objeto { estado: cantidad } a partir del array de tareas
  const conteos = tareas.reduce((acumulador, tarea) => {
    acumulador[tarea.estado] = (acumulador[tarea.estado] || 0) + 1;
    return acumulador;
  }, {});

  // for...of: recorre SECUENCIA_ESTADOS para mantener siempre el mismo orden
  const partes = [];
  for (const estado of SECUENCIA_ESTADOS) {
    const cantidad = conteos[estado] || 0;
    partes.push(`${cantidad} ${estado}`);
  }

  document.querySelector("#stats").textContent =
    `Tareas: ${partes.join(" · ")} (total ${tareas.length})`;
}

// ─── Actualización del DOM al avanzar estado ───────────────────────────
// Decisión de diseño: Estrategia A — actualización dirigida.
// Solo se toca la tarjeta que cambió (clase de estado, badge y botón);
// el resto del tablero queda intacto.
function actualizarEstadoEnDOM(id, nuevoEstado) {
  const elementoTarea = tablero.querySelector(`.tarea[data-id="${id}"]`);
  if (!elementoTarea) return;

  SECUENCIA_ESTADOS.forEach((estado) => elementoTarea.classList.remove(`estado-${estado}`));
  elementoTarea.classList.add(`estado-${nuevoEstado}`);

  const badgeEstado = elementoTarea.querySelector(".badge-estado");
  badgeEstado.textContent = nuevoEstado;

  // Si ya no se puede avanzar más, se quita el botón "Avanzar estado"
  if (nuevoEstado === "completada") {
    const btnAvanzar = elementoTarea.querySelector(".btn-avanzar");
    if (btnAvanzar) btnAvanzar.remove();
  }
}

// ─── Delegación de eventos: un solo listener para avanzar y eliminar ───
// El listener vive en #tablero, que existe desde el inicio; los clics en
// los botones de tarjetas creadas dinámicamente "suben" hasta aquí y se
// distinguen por su atributo data-action.
tablero.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-action]");
  if (!boton) return;

  const id = Number(boton.dataset.id);

  if (boton.dataset.action === "eliminar") {
    tareas = tareas.filter((t) => t.id !== id);
    boton.closest(".tarea").remove();
    actualizarStats();
    return;
  }

  if (boton.dataset.action === "avanzar") {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea) return;

    const indiceActual = SECUENCIA_ESTADOS.indexOf(tarea.estado);
    if (indiceActual >= SECUENCIA_ESTADOS.length - 1) return;
    tarea.estado = SECUENCIA_ESTADOS[indiceActual + 1];

    // Estrategia A: actualización dirigida del nodo existente
    actualizarEstadoEnDOM(id, tarea.estado);

    // Si hay un filtro de estado activo, la tarjeta puede dejar de cumplirlo
    aplicarFiltros();
    actualizarStats();
  }
});

// ─── Filtrado combinado por estado y prioridad ─────────────────────────
const btnsFiltroEstado = document.querySelectorAll(".btn-filtro-estado");

btnsFiltroEstado.forEach((btn) => {
  btn.addEventListener("click", () => {
    btnsFiltroEstado.forEach((b) => b.classList.remove("activo"));
    btn.classList.add("activo");
    filtroEstado = btn.dataset.estado;
    aplicarFiltros();
  });
});

document.querySelector("#select-filtro-prioridad").addEventListener("change", (e) => {
  filtroPrioridad = e.target.value;
  aplicarFiltros();
});

function aplicarFiltros() {
  const todasLasTareas = tablero.querySelectorAll(".tarea");

  todasLasTareas.forEach((elementoTarea) => {
    const id = Number(elementoTarea.dataset.id);
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea) return;

    const coincideEstado    = filtroEstado === "todas" || tarea.estado === filtroEstado;
    const coincidePrioridad = filtroPrioridad === "todas" || tarea.prioridad === filtroPrioridad;

    // Ambas condiciones deben cumplirse a la vez (AND)
    elementoTarea.classList.toggle("oculta", !(coincideEstado && coincidePrioridad));
  });
}

// Estado inicial del resumen (tablero vacío)
actualizarStats();

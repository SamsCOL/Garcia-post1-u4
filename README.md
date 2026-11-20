# Post-contenido — Unidad 4: JavaScript Básico

**Estudiante:** Samuel García
**Curso:** Programación Web — Unidad 4

## Descripción
Repositorio del laboratorio de la Unidad 4 de Programación Web.
Contiene dos partes que forman un mismo sistema interno de equipo:
un tablero de tareas con manipulación del DOM y eventos, y un
formulario de registro de colaborador con validación manual y
Constraint Validation API. Ambas partes usan JavaScript puro
(sin librerías externas, sin `var`).

Todos los archivos están en la raíz del repositorio:

```
Garcia-post1-u4/
├── tablero.html      ← Parte 1: página del tablero de tareas
├── tablero.css       ← Parte 1: estilos del tablero
├── app.js            ← Parte 1: lógica del tablero
├── formulario.html   ← Parte 2: página del formulario de registro
├── formulario.css    ← Parte 2: estilos del formulario
├── validacion.js     ← Parte 2: validación del formulario
└── README.md
```

## Parte 1 — Tablero de tareas del equipo
Tablero de tareas en JavaScript puro que implementa:

- **Creación** de tareas con `createElement`, `appendChild` y `classList`.
- **Avance de estado** (pendiente → en-progreso → completada) y
  **eliminación** con un **único listener delegado** en `#tablero` que
  distingue la acción por el atributo `data-action` usando
  `event.target.closest()`.
- **Filtrado combinado** por estado (botones) y prioridad (select): una
  tarjeta solo se ve si cumple ambos criterios a la vez.
- Un **`switch`** (`obtenerConfigPrioridad`) que define la clase CSS y la
  etiqueta de cada prioridad.
- **Estadísticas** calculadas con `reduce()` (conteo por estado) y
  `for...of` (orden fijo pendiente → en-progreso → completada).

Archivos: `tablero.html`, `tablero.css`, `app.js`.

## Parte 2 — Formulario de registro de colaborador
Formulario de registro con validación completa del lado del cliente:

- Nombre y correo validados con la Constraint Validation API
  (`valueMissing`, `tooShort`, `typeMismatch`).
- Nombre de usuario validado con el atributo `pattern` y `patternMismatch`.
- Contraseña con reglas de mayúscula, número y carácter especial, más
  confirmación de contraseña.
- Select de rol y campo condicional **"Equipo a cargo"** que solo aparece
  y se exige cuando el rol es *Líder de equipo*.
- Campo numérico de horas validado con `rangeUnderflow` / `rangeOverflow`.
- Checkbox de términos validado por `.checked` (evento `change`).
- Validación en tiempo real (`blur` / `change`), control del evento
  `submit` con `preventDefault()`, foco en el primer campo inválido y
  mensaje de éxito que limpia el formulario a los 2 segundos.
- Indicador de fortaleza de contraseña en tiempo real.

Archivos: `formulario.html`, `formulario.css`, `validacion.js`.

## Decisiones de diseño

### Parte 1 — Generador de ID
**Elegida: Estrategia A (closure / patrón módulo).**
`crearGeneradorId()` guarda el contador en una variable local y devuelve
una función que lo incrementa. Lo elegí porque el contador queda
encapsulado: ninguna otra función de `app.js` puede leerlo, reasignarlo
o decrementarlo por error, y la única forma de obtener un ID nuevo es
`generarId()`. Con una variable `let` global (Estrategia B) el código
sería un poco más corto, pero el contador quedaría expuesto junto al
resto del estado y un descuido en otra parte del archivo podría generar
IDs repetidos, lo que rompería la delegación de eventos y los filtros
(ambos buscan la tarea por su `id`). El costo extra en legibilidad es
mínimo y además practica el concepto de closure de la unidad.

### Parte 1 — Actualización del DOM al avanzar estado
**Elegida: Estrategia A (actualización dirigida).**
Al avanzar una tarea, `actualizarEstadoEnDOM()` localiza solo la tarjeta
afectada con `querySelector`, cambia su clase `estado-*`, el texto del
badge y, si llega a *completada*, elimina el botón "Avanzar estado". La
elegí porque no reconstruye nada que no cambió y es coherente con cómo
ya funcionan `agregarTarea` (que hace `appendChild` de una sola tarjeta)
y la eliminación (que hace `remove()` de una sola tarjeta), así que no
hubo que adaptar esas funciones y el tablero tiene una sola forma de
actualizarse. Los filtros también trabajan sobre los nodos existentes
alternando la clase `oculta`. Después de avanzar o agregar se llama a
`aplicarFiltros()`, para que una tarjeta que deja de cumplir el filtro
activo se oculte de inmediato. La contrapartida, que asumo, es que
`actualizarEstadoEnDOM` debe mantenerse sincronizada con la estructura
HTML de `crearElementoTarea` (clases `.badge-estado` y `.btn-avanzar`).

### Parte 2 — Validación de contraseña
**Elegida: Estrategia B (validaciones independientes encadenadas).**
Cada regla (mayúscula, número, carácter especial) se comprueba con su
propia expresión regular y muestra un mensaje específico ("Falta al
menos un número.", etc.). La elegí porque, en un formulario real, un
mensaje genérico obliga al usuario a adivinar qué regla incumplió;
con mensajes por regla sabe exactamente qué corregir. Requiere más
líneas que una regex compuesta con lookaheads, pero cada comprobación
es más fácil de leer y de modificar (agregar o quitar una regla no
obliga a reescribir una expresión grande). Además complementa el
indicador de fortaleza, que usa las mismas reglas.

### Parte 2 — Campo condicional "equipo a cargo"
**Elegida: Estrategia A (alternar el atributo `required` nativo).**
En el listener `change` de `#rol` se asigna
`campoEquipo.required = esLider`, y `validarEquipo()` sale de inmediato
si el campo no es requerido; si lo es, usa `validity.valueMissing`. La
elegí porque aprovecha la Constraint Validation API tal como está
diseñada: el estado "este campo aplica o no" vive en el propio campo, de
forma que `checkValidity()` y `validity` lo reflejan automáticamente y
el resto de validadores siguen el mismo patrón. El riesgo de que el
atributo quede desincronizado se controla en los dos únicos puntos donde
cambia la situación: el `change` del rol y el reinicio del formulario
tras un envío exitoso (donde se vuelve a poner `required = false` y se
oculta el grupo). Adicionalmente, se rechaza un valor de solo espacios.

## Cómo visualizar el proyecto
1. Clonar el repositorio: `git clone [URL-del-repo]`
2. Abrir la carpeta en Visual Studio Code.
3. Clic derecho en `tablero.html` (Parte 1) o `formulario.html`
   (Parte 2) → **"Open with Live Server"**.
4. Cada página tiene un enlace para ir a la otra.

## Tecnologías
HTML5, CSS3 (Grid y Flexbox) y JavaScript ES6+ (const/let, arrow
functions, template literals, destructuring, closures, delegación de
eventos, Constraint Validation API). Sin librerías externas.

## Capturas de pantalla
![Tablero de tareas](captura-tablero.png)
![Formulario - validación de errores](captura-formulario-error.png)
![Formulario - registro exitoso](captura-formulario-exito.png)

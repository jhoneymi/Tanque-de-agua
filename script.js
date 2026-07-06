// ===================================================================
// ITLA TRACK — Prototype interactivity
// ===================================================================

const ROUTES = {
  r01: {
    tag: "R-01", name: "Ruta Los Mameyes", status: "ok", statusLabel: "Activa",
    eta: "4 min", occLabel: "Baja", occLevel: 1,
    stops: [
      { name: "Terminal Centro", state: "done" },
      { name: "Av. Jacobo Majluta", state: "done" },
      { name: "Máximo Gómez", state: "current", now: "Bus aquí ahora" },
      { name: "Entrada Principal ITLA", state: "upcoming", final: true }
    ],
    progress: 2 // index of current stop
  },
  r02: {
    tag: "R-02", name: "Ruta Cristo Rey", status: "ok", statusLabel: "Activa",
    eta: "11 min", occLabel: "Media", occLevel: 2,
    stops: [
      { name: "Parada Charles de Gaulle", state: "done" },
      { name: "Av. Winston Churchill", state: "current", now: "Bus aquí ahora" },
      { name: "Av. 27 de Febrero", state: "upcoming" },
      { name: "Entrada Principal ITLA", state: "upcoming", final: true }
    ],
    progress: 1
  },
  r03: {
    tag: "R-03", name: "Ruta Villa Mella", status: "warn", statusLabel: "Retrasada",
    eta: "22 min", occLabel: "Alta", occLevel: 3,
    stops: [
      { name: "Terminal Villa Mella", state: "done" },
      { name: "Autopista Duarte", state: "current", now: "Bus aquí ahora · tráfico" },
      { name: "Km 9 Autopista Duarte", state: "upcoming" },
      { name: "Entrada Principal ITLA", state: "upcoming", final: true }
    ],
    progress: 1
  },
  r05: {
    tag: "R-05", name: "Ruta Zona Colonial", status: "ok", statusLabel: "Activa",
    eta: "16 min", occLabel: "Baja", occLevel: 1,
    stops: [
      { name: "Parque Colón", state: "done" },
      { name: "Av. del Puerto", state: "current", now: "Bus aquí ahora" },
      { name: "Malecón Centro", state: "upcoming" },
      { name: "Entrada Principal ITLA", state: "upcoming", final: true }
    ],
    progress: 1
  },
  r04: {
    tag: "R-04", name: "Ruta Herrera", status: "off", statusLabel: "Inactiva",
    eta: "—", occLabel: "—", occLevel: 0,
    stops: [
      { name: "Terminal Herrera", state: "upcoming" },
      { name: "Av. Luperón", state: "upcoming" },
      { name: "Entrada Principal ITLA", state: "upcoming", final: true }
    ],
    progress: 0
  }
};

let currentRouteId = "r01";
let history = ["splash"];

// ----------------- VIEW NAVIGATION -----------------

function showView(name, opts = {}){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
  const target = document.getElementById("view-" + name);
  if(target) target.classList.add("is-active");

  // bottom nav visibility + active state
  const nav = document.getElementById("bottomNav");
  const hideNavOn = ["splash", "role"];
  nav.style.display = hideNavOn.includes(name) ? "none" : "flex";

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("is-active", item.dataset.tab === navTabFor(name));
  });

  if(!opts.skipHistory) history.push(name);

  // view-specific setup
  if(name === "route-detail") renderRouteDetail(currentRouteId);
  if(name === "live-map") renderLiveMap(currentRouteId);
}

function navTabFor(viewName){
  if(viewName === "home") return "home";
  if(viewName === "route-detail" || viewName === "live-map") return "map";
  if(viewName === "alerts") return "alerts";
  if(viewName === "driver") return "driver";
  return "home";
}

// ----------------- CLICK DELEGATION -----------------

document.addEventListener("click", (e) => {
  const goEl = e.target.closest("[data-go]");
  if(goEl){
    const target = goEl.dataset.go;
    if(goEl.dataset.route) currentRouteId = goEl.dataset.route;
    showView(target);
  }
});

// ----------------- SPLASH -> ROLE AUTO ADVANCE -----------------

setTimeout(() => {
  if(document.getElementById("view-splash").classList.contains("is-active")){
    showView("role", { skipHistory: true });
  }
}, 1900);

// animate the bus along the onboarding thread
function animateRoleThread(){
  const bus = document.getElementById("roleThreadBus");
  const path = document.querySelector(".thread-path");
  if(!bus || !path) return;
  const len = path.getTotalLength();
  let t = 0;
  function frame(){
    t += 0.0035;
    if(t > 1) t = 0;
    const pt = path.getPointAtLength(t * len);
    bus.setAttribute("cx", pt.x);
    bus.setAttribute("cy", pt.y);
    requestAnimationFrame(frame);
  }
  frame();
}
animateRoleThread();

// ----------------- HOME: TAB FILTERS -----------------

document.querySelectorAll("#homeTabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("#homeTabs .tab").forEach(t => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    const filter = tab.dataset.filter;
    document.querySelectorAll(".route-card").forEach(card => {
      const show = filter === "todas" || card.dataset.status === filter;
      card.classList.toggle("is-hidden", !show);
    });
  });
});

// ----------------- ROUTE DETAIL RENDER -----------------

function renderRouteDetail(id){
  const r = ROUTES[id];
  if(!r) return;

  document.getElementById("detailTag").textContent = r.tag;
  document.getElementById("detailTitle").textContent = r.name;
  document.getElementById("detailETA").textContent = r.eta;
  document.getElementById("detailOcc").textContent = r.occLabel;
  document.getElementById("detailState").textContent = r.statusLabel;
  document.getElementById("mapTitle").textContent = r.name;

  const statusDot = document.getElementById("detailStatus");
  statusDot.textContent = r.statusLabel;
  statusDot.className = "status-dot status-dot--" + r.status;

  // occupancy bars (16 segments, filled proportional to level)
  const occBars = document.getElementById("occBars");
  occBars.innerHTML = "";
  const totalBars = 16;
  const filledCount = r.occLevel === 1 ? 6 : r.occLevel === 2 ? 10 : r.occLevel === 3 ? 14 : 0;
  const levelClass = r.occLevel === 2 ? "is-mid" : r.occLevel === 3 ? "is-high" : "";
  for(let i = 0; i < totalBars; i++){
    const bar = document.createElement("div");
    bar.className = "occ-bar" + (i < filledCount ? " is-filled " + levelClass : "");
    occBars.appendChild(bar);
  }
  const occHint = document.getElementById("occHint");
  if(r.occLevel === 1) occHint.textContent = "Bus con espacio disponible. Buen momento para abordar.";
  else if(r.occLevel === 2) occHint.textContent = "Ocupación moderada. Aún hay espacio cómodo.";
  else if(r.occLevel === 3) occHint.textContent = "Capacidad alta. Considera esperar el siguiente recorrido.";
  else occHint.textContent = "Esta ruta no está operando en este momento.";

  // stops timeline
  const stopsList = document.getElementById("stopsList");
  stopsList.innerHTML = "";
  r.stops.forEach(stop => {
    const el = document.createElement("div");
    el.className = "stop" + (stop.state === "done" ? " is-done" : stop.state === "current" ? " is-current" : "");
    el.innerHTML = `
      <span class="stop-dot"></span>
      <span class="stop-line"></span>
      <span class="stop-text">
        <strong>${stop.name}</strong>
        ${stop.now ? `<span class="stop-now">${stop.now}</span>` : (stop.final ? `<span>Destino final</span>` : "")}
      </span>
    `;
    stopsList.appendChild(el);
  });
}

// ----------------- LIVE MAP RENDER + BUS ANIMATION -----------------

let mapAnimFrame = null;

function renderLiveMap(id){
  const r = ROUTES[id];
  if(!r) return;

  document.getElementById("liveETA").textContent = r.eta;
  const currentStop = r.stops.find(s => s.state === "current");
  const lastStop = r.stops[r.stops.length - 1];
  document.getElementById("nextStop").textContent = lastStop ? lastStop.name : "—";

  // mini progress dots/segments based on stop count
  const mini = document.getElementById("miniProgress");
  mini.innerHTML = "";
  r.stops.forEach((stop, i) => {
    const dot = document.createElement("span");
    dot.className = "mp-dot" + (stop.state === "done" ? " is-done" : stop.state === "current" ? " is-current" : "");
    mini.appendChild(dot);
    if(i < r.stops.length - 1){
      const seg = document.createElement("span");
      seg.className = "mp-seg" + (stop.state === "done" ? " is-done" : "");
      mini.appendChild(seg);
    }
  });

  // stop markers along the SVG path
  const path = document.getElementById("routePath");
  const markersGroup = document.getElementById("stopMarkers");
  markersGroup.innerHTML = "";
  const len = path.getTotalLength();
  const n = r.stops.length;
  const positions = [];
  for(let i = 0; i < n; i++){
    const t = n === 1 ? 0 : i / (n - 1);
    const pt = path.getPointAtLength(t * len);
    positions.push(pt);
    const passed = i <= r.progress;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "map-stop-marker" + (passed ? " is-passed" : ""));
    g.innerHTML = `<circle cx="${pt.x}" cy="${pt.y}" r="6"></circle>`;
    markersGroup.appendChild(g);
  }

  // animate bus moving smoothly from progress point toward the next stop, looping gently
  if(mapAnimFrame) cancelAnimationFrame(mapAnimFrame);
  const startT = n === 1 ? 0 : r.progress / (n - 1);
  const endT = n === 1 ? 0 : Math.min(r.progress + 1, n - 1) / (n - 1);
  let t = startT;
  let dir = 1;
  const bus = document.getElementById("busMarker");
  const pulse = document.getElementById("busPulse");

  function frame(){
    t += dir * 0.0009;
    if(t > endT){ t = endT; dir = -1; }
    if(t < startT){ t = startT; dir = 1; }
    const pt = path.getPointAtLength(t * len);
    bus.setAttribute("cx", pt.x); bus.setAttribute("cy", pt.y);
    pulse.setAttribute("cx", pt.x); pulse.setAttribute("cy", pt.y);
    mapAnimFrame = requestAnimationFrame(frame);
  }
  frame();
}

// ----------------- ALERTS: MARK AS READ -----------------

document.getElementById("markReadBtn").addEventListener("click", () => {
  document.querySelectorAll(".alert-item.is-unread").forEach(item => {
    item.classList.remove("is-unread");
    item.classList.add("is-read-now");
  });
  document.getElementById("unreadCount").textContent = "Sin notificaciones nuevas";
  const badge = document.getElementById("navAlertBadge");
  badge.classList.add("is-hidden");
});

document.querySelectorAll(".alert-item").forEach(item => {
  item.addEventListener("click", () => {
    if(item.classList.contains("is-unread")){
      item.classList.remove("is-unread");
      const stillUnread = document.querySelectorAll(".alert-item.is-unread").length;
      document.getElementById("unreadCount").textContent = stillUnread > 0 ? `${stillUnread} sin leer` : "Sin notificaciones nuevas";
      const badge = document.getElementById("navAlertBadge");
      if(stillUnread === 0) badge.classList.add("is-hidden");
      else badge.textContent = stillUnread;
    }
  });
});

// ----------------- DRIVER PANEL -----------------

let selectedDriverRoute = { code: "R-01", name: "Los Mameyes" };
let routeStarted = false;

document.querySelectorAll(".driver-route").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".driver-route").forEach(b => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    selectedDriverRoute = { code: btn.dataset.route, name: btn.dataset.name };
  });
});

document.getElementById("startRouteBtn").addEventListener("click", () => {
  routeStarted = !routeStarted;
  const gpsCard = document.getElementById("gpsCard");
  const gpsStatus = document.getElementById("gpsStatus");
  const gpsBadge = document.getElementById("gpsBadge");
  const startLabel = document.getElementById("startRouteLabel");
  const startBtn = document.getElementById("startRouteBtn");
  const hint = document.getElementById("driverHint");

  if(routeStarted){
    gpsCard.classList.add("is-online");
    gpsStatus.textContent = `Transmitiendo ubicación · ${selectedDriverRoute.code}`;
    gpsBadge.textContent = "EN VIVO";
    startLabel.textContent = "Detener ruta";
    startBtn.classList.add("is-stop");
    hint.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg><span>Tu ubicación se está compartiendo con los estudiantes de ${selectedDriverRoute.name} en tiempo real.</span>`;
  } else {
    gpsCard.classList.remove("is-online");
    gpsStatus.textContent = "Sin señal GPS";
    gpsBadge.textContent = "OFFLINE";
    startLabel.textContent = "Iniciar ruta";
    startBtn.classList.remove("is-stop");
    hint.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg><span>Selecciona tu ruta asignada e inicia para que los estudiantes puedan ver tu ubicación en tiempo real.</span>`;
  }
});

// ----------------- INIT -----------------

showView("splash", { skipHistory: true });
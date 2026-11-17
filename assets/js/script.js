STORAGE_KEY = "libri";

class Libro {
  letto = false;

  constructor(titolo, autore, anno) {
    this.id = crypto.randomUUID();
    this.titolo = titolo;
    this.autore = autore;
    this.anno = anno;
  }

  segnaComeLetto() {
    this.letto = true;
  }

  formato() {
    return "cartaceo";
  }

  static fromJSON(d) {
    return Object.assign(new this(d.titolo, d.autore, d.anno), d);
  }
}

class LibroDigitale extends Libro {
  constructor(titolo, autore, anno, dimensioneMb) {
    super(titolo, autore, anno);
    this.dimensioneMb = dimensioneMb;
  }

  formato() {
    return `digitale (${this.dimensioneMb} MB)`;
  }
}

class LibroAudio extends Libro {
  constructor(titolo, autore, anno, durataMinuti) {
    super(titolo, autore, anno);
    this.durataMinuti = durataMinuti;
  }

  formato() {
    return `audio (${this.durataMinuti} min)`;
  }
}

const selectFormato = document.getElementById("formato");
const campoDimensione = document.getElementById("campo-dimensione");
const campoDurata = document.getElementById("campo-durata");
const formLibro = document.getElementById("aggiungi-libro");
const listaLibri = document.getElementById("lista-libri");
const svuota = document.getElementById("svuota-tutto");
let libri = caricaLibri();

function renderLibri() {
  const righe = libri.map((l) => {
    const li = document.createElement("li");
    li.className =
      "libro d-flex justify-content-between align-items-center gap-3 bg-white rounded shadow-sm p-3";
    if (l.letto) {
      li.classList.add("letto");
    }
    li.dataset.id = l.id;

    const info = document.createElement("div");
    info.className = "info";

    const titolo = document.createElement("span");
    titolo.className = "fw-bold me-2";
    titolo.textContent = l.titolo;

    const badge = document.createElement("span");
    badge.className = "badge rounded-pill bg-secondary-subtle text-secondary";
    badge.textContent = l.formato();

    const meta = document.createElement("p");
    meta.className = "meta fs-6 text-muted m-0";
    meta.textContent = `${l.autore} - ${l.anno}`;

    info.appendChild(titolo);
    info.appendChild(badge);
    info.appendChild(meta);

    const azioni = document.createElement("div");
    azioni.className = "azioni d-flex align-items-center";

    if (l.letto) {
      azioni.textContent = "✓ letto";
      azioni.className = "text-success";
    } else {
      const bottone = document.createElement("button");
      bottone.type = "button";
      bottone.className = "btn btn-sm btn-outline-dark";
      bottone.dataset.azione = "leggi";
      bottone.textContent = "Segna come letto";
      azioni.appendChild(bottone);
    }

    const rimuovi = document.createElement("button");
    rimuovi.type = "button";
    rimuovi.className = "btn btn-sm btn-outline-danger ms-2";
    rimuovi.dataset.azione = "rimuovi";
    rimuovi.textContent = "Rimuovi";

    azioni.append(rimuovi);
    li.appendChild(info);
    li.appendChild(azioni);

    return li;
  });

  document.getElementById("lista-libri").replaceChildren(...righe);
  document.getElementById("contatore").textContent = libri.length;
}

selectFormato.addEventListener("change", (e) => {
  campoDimensione.hidden = e.target.value !== "digitale";
  campoDurata.hidden = e.target.value !== "audio";
});

formLibro.addEventListener("submit", (e) => {
  e.preventDefault();
  const dati = Object.fromEntries(new FormData(e.target));
  const anno = Number(dati.anno);
  let nuovo;

  if (dati.formato === "digitale") {
    nuovo = new LibroDigitale(
      dati.titolo,
      dati.autore,
      anno,
      Number(dati["dimensione-mb"]),
    );
  } else if (dati.formato === "audio") {
    nuovo = new LibroAudio(
      dati.titolo,
      dati.autore,
      anno,
      Number(dati["durata-minuti"]),
    );
  } else {
    nuovo = new Libro(dati.titolo, dati.autore, anno);
  }

  libri.push(nuovo);
  salvaLibri();
  renderLibri();
  e.target.reset();
  campoDimensione.hidden = true;
  campoDurata.hidden = true;
});

listaLibri.addEventListener("click", (e) => {
  const bottone = e.target.closest("[data-azione]");

  if (!bottone) {
    return;
  }

  const id = bottone.closest("li").dataset.id;

  if (bottone.dataset.azione === "leggi") {
    const libro = libri.find((l) => l.id === id);
    libro.segnaComeLetto();
  } else if (bottone.dataset.azione === "rimuovi") {
    libri = libri.filter((l) => l.id !== id);
  }

  salvaLibri();
  renderLibri();
});

svuota.addEventListener("click", () => {
  libri = [];
  localStorage.removeItem(STORAGE_KEY);
  renderLibri();
});

function salvaLibri() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libri));
}

function caricaLibri() {
  const datiJSON = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");

  return datiJSON.map((d) => {
    if (d.dimensioneMb !== undefined) {
      return LibroDigitale.fromJSON(d);
    } else if (d.durataMinuti !== undefined) {
      return LibroAudio.fromJSON(d);
    } else {
      return Libro.fromJSON(d);
    }
  });
}

// ----------------------
// ELEMENTOS
// ----------------------
const pokemonContainer = document.getElementById("pokemonContainer");
const searchInput = document.getElementById("searchInput");

const modal = document.getElementById("pokemonModal");
const closeModal = document.getElementById("closeModal");
const modalDetails = document.getElementById("modalDetails");

const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");

const menuPokemons = document.getElementById("menuPokemons");
const menuLocalidades = document.getElementById("menuLocalidades");
const menuItens = document.getElementById("menuItens");

// Adicionando novos menus
const menuMoves = document.createElement("li");
menuMoves.innerHTML = `<a href="#" id="menuMoves">Moves</a>`;
sideMenu.querySelector("ul").appendChild(menuMoves);

const menuGames = document.createElement("li");
menuGames.innerHTML = `<a href="#" id="menuGames">Games</a>`;
sideMenu.querySelector("ul").appendChild(menuGames);

const menuMovesBtn = document.getElementById("menuMoves");
const menuGamesBtn = document.getElementById("menuGames");

let allData = []; // dataset atual
let currentType = "pokemon";
let arceusInterval = null; // Intervalo para animação de Arceus

// ----------------------
// TIPOS E CORES
// ----------------------
const typeColors = {
  normal: "#a8a878",
  fogo: "#f08030",
  água: "#6890f0",
  grama: "#78c850",
  elétrico: "#f8d030",
  gelo: "#98d8d8",
  lutador: "#c03028",
  voador: "#a890f0",
  venenoso: "#a040a0",
  terrestre: "#e0c068",
  pedra: "#b8a038",
  psíquico: "#f85888",
  inseto: "#a8b820",
  fantasma: "#705898",
  metal: "#b8b8d0",
  dragão: "#7038f8",
  sombrio: "#705848",
  fada: "#ffaec9"
};

const arceusTypes = Object.keys(typeColors);

// ----------------------
// MENU HAMBURGUER
// ----------------------
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  sideMenu.classList.toggle("active");
  const isOpen = sideMenu.classList.contains("active");
  sideMenu.setAttribute("aria-hidden", String(!isOpen));
});

document.addEventListener("click", (e) => {
  if (sideMenu.classList.contains("active") && !sideMenu.contains(e.target) && e.target !== menuBtn) {
    sideMenu.classList.remove("active");
    sideMenu.setAttribute("aria-hidden", "true");
  }
});

// ----------------------
// MODAL
// ----------------------
function openModal() {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}
function closeModalFunc() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}
closeModal.addEventListener("click", closeModalFunc);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModalFunc(); });

// ----------------------
// FUNÇÕES DE TAGS
// ----------------------
function getTypeTags(types, pokemonName) {
  if (pokemonName.toLowerCase() === "arceus") {
    return `<span class="type-tag" id="arceusType">Deus</span>`;
  }
  return types.map(t => {
    const typeName = t.type.name.toLowerCase();
    const color = typeColors[typeName] || "#777";
    return `<span class="type-tag" style="background:${color};">${capitalize(typeName)}</span>`;
  }).join(" ");
}

// ----------------------
// LOADERS
// ----------------------
async function loadPokemons() {
  currentType = "pokemon";
  pokemonContainer.innerHTML = "<p>Carregando Pokémons...</p>";
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=2000`);
  const data = await res.json();

  const promises = data.results.map(async (p) => {
    const poke = await fetch(p.url).then(r => r.json());
    try {
      const species = await fetch(poke.species.url).then(r => r.json());
      poke.isLegendary = !!species.is_legendary;

      // geração do Pokémon
      const gen = await fetch(species.generation.url).then(r => r.json());
      poke.generation = gen.name.replace("generation-", "").toUpperCase();
    } catch { 
      poke.isLegendary = false;
      poke.generation = "Desconhecida";
    }
    return poke;
  });

  allData = await Promise.all(promises);
  displayCards(allData);
}

async function loadItens() {
  currentType = "item";
  pokemonContainer.innerHTML = "<p>Carregando Itens...</p>";
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/item?limit=2000`);
    const data = await res.json();

    const promises = data.results.map(async (i) => {
      try {
        const itemRes = await fetch(i.url);
        if (!itemRes.ok) throw new Error(`Erro HTTP: ${itemRes.status}`);
        const item = await itemRes.json();

        const gen = item.version_group?.name ? item.version_group.name.toUpperCase() : "Desconhecida";

        return {
          id: item.id,
          name: item.name,
          category: item.category?.name || "desconhecida",
          sprite: item.sprites?.default || null,
          effect: item.effect_entries?.[0]?.effect || "Sem descrição",
          generation: gen,
          url: i.url
        };
      } catch (err) {
        console.warn("Falha ao carregar item:", i.name, err);
        return {
          id: null,
          name: i.name,
          category: "desconhecida",
          sprite: null,
          effect: "Não foi possível carregar detalhes",
          generation: "Desconhecida",
          url: i.url
        };
      }
    });

    allData = await Promise.all(promises);
    displayCards(allData);
  } catch (err) {
    console.error("Erro ao carregar itens:", err);
    pokemonContainer.innerHTML = "<p style='padding:20px'>Erro ao carregar Itens.</p>";
  }
}

async function loadLocalidades() {
  currentType = "location";
  pokemonContainer.innerHTML = "<p>Carregando Localidades...</p>";
  const res = await fetch(`https://pokeapi.co/api/v2/location?limit=1000`);
  const data = await res.json();

  allData = data.results.map((loc, idx) => ({
    id: idx + 1,
    name: loc.name,
    url: loc.url,
    generation: "Desconhecida"
  }));

  displayCards(allData);
}

async function loadMoves() {
  currentType = "move";
  pokemonContainer.innerHTML = "<p>Carregando Moves...</p>";
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/move?limit=2000`);
    const data = await res.json();

    const promises = data.results.map(async (m) => {
      try {
        const moveRes = await fetch(m.url);
        if (!moveRes.ok) throw new Error(`Erro HTTP: ${moveRes.status}`);
        const move = await moveRes.json();

        const gen = move.generation?.name ? move.generation.name.toUpperCase() : "Desconhecida";

        return {
          id: move.id,
          name: move.name,
          type: move.type?.name || "desconhecido",
          power: move.power || "-",
          pp: move.pp || "-",
          accuracy: move.accuracy || "-",
          effect: move.effect_entries?.[0]?.effect || "Sem descrição",
          generation: gen,
          url: m.url
        };
      } catch (err) {
        console.warn("Falha ao carregar move:", m.name, err);
        return {
          id: null,
          name: m.name,
          type: "desconhecido",
          power: "-",
          pp: "-",
          accuracy: "-",
          effect: "Não foi possível carregar detalhes",
          generation: "Desconhecida",
          url: m.url
        };
      }
    });

    allData = await Promise.all(promises);
    displayCards(allData);
  } catch (err) {
    console.error("Erro ao carregar Moves:", err);
    pokemonContainer.innerHTML = "<p style='padding:20px'>Erro ao carregar Moves.</p>";
  }
}

async function loadGames() {
  currentType = "game";
  pokemonContainer.innerHTML = "<p>Carregando Games...</p>";
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/version?limit=2000`);
    const data = await res.json();

    const promises = data.results.map(async (g, idx) => {
      try {
        const gameRes = await fetch(g.url);
        if (!gameRes.ok) throw new Error(`Erro HTTP: ${gameRes.status}`);
        const gameData = await gameRes.json();

        return {
          id: idx + 1,
          name: g.name,
          url: g.url,
          generation: gameData.generation?.name.replace("generation-", "").toUpperCase() || "Desconhecida"
        };
      } catch (err) {
        console.warn("Falha ao carregar game:", g.name, err);
        return {
          id: idx + 1,
          name: g.name,
          url: g.url,
          generation: "Desconhecida"
        };
      }
    });

    allData = await Promise.all(promises);
    displayCards(allData);
  } catch (err) {
    console.error("Erro ao carregar Games:", err);
    pokemonContainer.innerHTML = "<p style='padding:20px'>Erro ao carregar Games.</p>";
  }
}

// ----------------------
// RENDERIZAÇÃO
// ----------------------
function displayCards(list) {
  pokemonContainer.innerHTML = "";
  if (!list.length) {
    pokemonContainer.innerHTML = '<p style="padding:20px">Nenhum resultado.</p>';
    return;
  }

  if (arceusInterval) clearInterval(arceusInterval); // limpa interval anterior

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "pokemon-card";

    if (currentType === "pokemon") {
      if (item.isLegendary) card.classList.add("legendary");
      const imgSrc = item.sprites.front_default || (item.sprites.other?.['official-artwork']?.front_default) || "";
      card.innerHTML = `
        <img src="${imgSrc}" alt="${item.name}" />
        <h3>#${item.id} - ${capitalize(item.name)}</h3>
        <p class="tag-types">${getTypeTags(item.types, item.name)}</p>
        <p class="generation">Geração: ${item.generation}</p>
      `;
      card.addEventListener("click", () => showPokemonDetails(item));

    } else if (currentType === "item") {
      card.innerHTML = `
        ${item.sprite ? `<img src="${item.sprite}" alt="${item.name}"/>` : ""} 
        <h3>#${item.id} - ${capitalize(item.name)}</h3>
        <p><strong>Categoria:</strong> ${capitalize(item.category)}</p>
        <p class="generation">Geração: ${item.generation}</p>
      `;
      card.addEventListener("click", () => showItemDetails(item));

    } else if (currentType === "location") {
      card.innerHTML = `
        <h3>#${item.id} - ${capitalize(item.name)}</h3>
        <p class="generation">Geração: ${item.generation}</p>
      `;
      card.addEventListener("click", () => showLocationDetails(item));

    } else if (currentType === "move") {
      card.innerHTML = `
        <h3>#${item.id} - ${capitalize(item.name)}</h3>
        <p class="tag-types">Tipo: ${capitalize(item.type)}</p>
        <p class="generation">Geração: ${item.generation}</p>
      `;
      card.addEventListener("click", () => showMoveDetails(item));

    } else if (currentType === "game") {
      card.innerHTML = `
        <h3>#${item.id} - ${capitalize(item.name)}</h3>
        <p class="generation">Geração: ${item.generation}</p>
      `;
      card.addEventListener("click", () => showGameDetails(item));
    }

    pokemonContainer.appendChild(card);
  });

  // Ativa animação de Arceus
  const arceusTag = document.getElementById("arceusType");
  if (arceusTag) {
    let idx = 0;
    arceusInterval = setInterval(() => {
      const type = arceusTypes[idx];
      arceusTag.textContent = "Deus";
      arceusTag.style.background = typeColors[type];
      idx = (idx + 1) % arceusTypes.length;
    }, 5000);
  }
}

// ----------------------
// DETALHES NO MODAL
// ----------------------
function showPokemonDetails(pokemon) {
  const artwork = pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default || "";
  modalDetails.innerHTML = `
    <h2>#${pokemon.id} - ${capitalize(pokemon.name)}</h2>
    ${artwork ? `<img src="${artwork}" alt="${pokemon.name}" style="max-width:220px;">` : ""}
    <p><strong>Tipo:</strong> ${pokemon.types.map(t => capitalize(t.type.name)).join(", ")}</p>
    <p><strong>Altura:</strong> ${pokemon.height / 10} m</p>
    <p><strong>Peso:</strong> ${pokemon.weight / 10} kg</p>
    <p><strong>Lendário:</strong> ${pokemon.isLegendary ? "✅ Sim" : "❌ Não"}</p>
    <p><strong>Geração:</strong> ${pokemon.generation}</p>
    <h4>Status Base:</h4>
    <ul style="text-align:left; display:inline-block; margin-top:8px;">
      ${pokemon.stats.map(s => `<li>${capitalize(s.stat.name)}: ${s.base_stat}</li>`).join("")}
    </ul>
  `;
  openModal();
}

function showItemDetails(item) {
  modalDetails.innerHTML = `
    <h2>#${item.id} - ${capitalize(item.name)}</h2>
    ${item.sprite ? `<img src="${item.sprite}" alt="${item.name}" style="max-width:120px;">` : ""}
    <p><strong>Categoria:</strong> ${capitalize(item.category)}</p>
    <p><strong>Efeito:</strong> ${item.effect}</p>
    <p><strong>Geração:</strong> ${item.generation}</p>
  `;
  openModal();
}

async function showLocationDetails(loc) {
  modalDetails.innerHTML = "<p>Carregando...</p>";
  const res = await fetch(loc.url);
  const data = await res.json();

  modalDetails.innerHTML = `
    <h2>#${loc.id} - ${capitalize(loc.name)}</h2>
    <p><strong>Região:</strong> ${data.region?.name || "Desconhecida"}</p>
    <p><strong>Áreas:</strong> ${data.areas?.map(a => capitalize(a.name)).join(", ") || "Nenhuma"}</p>
    <p><strong>Geração:</strong> ${loc.generation}</p>
  `;
  openModal();
}

function showMoveDetails(move) {
  modalDetails.innerHTML = `
    <h2>#${move.id} - ${capitalize(move.name)}</h2>
    <p><strong>Tipo:</strong> ${capitalize(move.type)}</p>
    <p><strong>Power:</strong> ${move.power}</p>
    <p><strong>PP:</strong> ${move.pp}</p>
    <p><strong>Accuracy:</strong> ${move.accuracy}</p>
    <p><strong>Efeito:</strong> ${move.effect}</p>
    <p><strong>Geração:</strong> ${move.generation}</p>
  `;
  openModal();
}

function showGameDetails(game) {
  modalDetails.innerHTML = `
    <h2>#${game.id} - ${capitalize(game.name)}</h2>
    <p>Jogo Pokemon</p>
    <p><strong>Geração:</strong> ${game.generation}</p>
  `;
  openModal();
}

// ----------------------
// PESQUISA
// ----------------------
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) {
    displayCards(allData);
    return;
  }
  const filtered = allData.filter(item =>
    item.name.includes(q) || (item.id && item.id.toString() === q)
  );
  displayCards(filtered);
});

// ----------------------
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ----------------------
// INICIALIZAÇÃO
menuPokemons.addEventListener("click", (e) => { e.preventDefault(); loadPokemons(); });
menuItens.addEventListener("click", (e) => { e.preventDefault(); loadItens(); });
menuLocalidades.addEventListener("click", (e) => { e.preventDefault(); loadLocalidades(); });
menuMovesBtn.addEventListener("click", (e) => { e.preventDefault(); loadMoves(); });
menuGamesBtn.addEventListener("click", (e) => { e.preventDefault(); loadGames(); });

// carrega pokémons na inicial
loadPokemons();

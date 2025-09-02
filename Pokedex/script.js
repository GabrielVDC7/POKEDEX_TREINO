// elementos
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

let allData = []; // dataset atual (pode ser pokemons, itens ou localizações)
let currentType = "pokemon";

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
// POKEAPI LOADERS
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
    } catch { poke.isLegendary = false; }
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
  
          return {
            id: item.id,
            name: item.name,
            category: item.category?.name || "desconhecida",
            sprite: item.sprites?.default || null,
            effect: item.effect_entries?.[0]?.effect || "Sem descrição",
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
  
  function showItemDetails(item) {
    modalDetails.innerHTML = `
      <h2>${item.id ? "#" + item.id : ""} - ${capitalize(item.name)}</h2>
      ${item.sprite ? `<img src="${item.sprite}" alt="${item.name}" style="max-width:120px;">` : ""}
      <p><strong>Categoria:</strong> ${capitalize(item.category)}</p>
      <p><strong>Efeito:</strong> ${item.effect}</p>
    `;
    openModal();
  }

async function loadLocalidades() {
  currentType = "location";
  pokemonContainer.innerHTML = "<p>Carregando Localidades...</p>";
  const res = await fetch(`https://pokeapi.co/api/v2/location?limit=1000`);
  const data = await res.json();

  allData = data.results.map((loc, idx) => ({
    id: idx + 1,
    name: loc.name,
    url: loc.url
  }));

  displayCards(allData);
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

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "pokemon-card";

    if (currentType === "pokemon") {
      if (item.isLegendary) card.classList.add("legendary");
      const imgSrc = item.sprites.front_default || (item.sprites.other?.['official-artwork']?.front_default) || "";
      card.innerHTML = `
        <img src="${imgSrc}" alt="${item.name}" />
        <h3>#${item.id} - ${capitalize(item.name)}</h3>
      `;
      card.addEventListener("click", () => showPokemonDetails(item));

    } else if (currentType === "item") {
      card.innerHTML = `
        ${item.sprite ? `<img src="${item.sprite}" alt="${item.name}"/>` : ""}
        <h3>#${item.id} - ${capitalize(item.name)}</h3>
        <p><strong>Categoria:</strong> ${capitalize(item.category)}</p>
      `;
      card.addEventListener("click", () => showItemDetails(item));

    } else if (currentType === "location") {
      card.innerHTML = `
        <h3>#${item.id} - ${capitalize(item.name)}</h3>
      `;
      card.addEventListener("click", () => showLocationDetails(item));
    }

    pokemonContainer.appendChild(card);
  });
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
// ----------------------
menuPokemons.addEventListener("click", (e) => { e.preventDefault(); loadPokemons(); });
menuItens.addEventListener("click", (e) => { e.preventDefault(); loadItens(); });
menuLocalidades.addEventListener("click", (e) => { e.preventDefault(); loadLocalidades(); });

// carrega pokémons na inicial
loadPokemons();

const pokemonContainer = document.getElementById("pokemonContainer");
const searchInput = document.getElementById("searchInput");

const modal = document.getElementById("pokemonModal");
const closeModal = document.getElementById("closeModal");
const modalDetails = document.getElementById("modalDetails");

let allPokemons = []; // Armazena todos os pokémons carregados

// Função principal: carrega TODOS os pokémons
async function loadAllPokemons() {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=10000`); 
    const data = await res.json();

    // Busca detalhes de cada pokemon
    const promises = data.results.map(p => fetch(p.url).then(r => r.json()));
    allPokemons = await Promise.all(promises);

    displayPokemons(allPokemons);
  } catch (error) {
    console.error("Erro ao carregar Pokémons:", error);
  }
}

// Mostrar pokémons no container
function displayPokemons(pokemons) {
  pokemonContainer.innerHTML = "";
  pokemons.forEach(pokemon => {
    const card = document.createElement("div");
    card.classList.add("pokemon-card");

    card.innerHTML = `
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <h3>#${pokemon.id} - ${capitalize(pokemon.name)}</h3>
    `;

    card.addEventListener("click", () => showPokemonDetails(pokemon));
    pokemonContainer.appendChild(card);
  });
}

// Mostrar modal com detalhes
function showPokemonDetails(pokemon) {
  modalDetails.innerHTML = `
    <h2>#${pokemon.id} - ${capitalize(pokemon.name)}</h2>
    <img src="${pokemon.sprites.other['official-artwork'].front_default}" width="150">
    <p><strong>Tipo:</strong> ${pokemon.types.map(t => t.type.name).join(", ")}</p>
    <p><strong>Altura:</strong> ${pokemon.height / 10} m</p>
    <p><strong>Peso:</strong> ${pokemon.weight / 10} kg</p>
    <h4>Status Base:</h4>
    <ul>
      ${pokemon.stats.map(s => `<li>${s.stat.name}: ${s.base_stat}</li>`).join("")}
    </ul>
  `;
  modal.style.display = "block";
}

// Fechar modal
closeModal.onclick = () => { modal.style.display = "none"; }
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

// Busca em tempo real
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allPokemons.filter(p =>
    p.name.includes(query) || p.id.toString() === query
  );
  displayPokemons(filtered);
});

// Capitalizar nome
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Inicial
loadAllPokemons();

var fetch = require('node-fetch')
var request = require('request')
var express = require('express')
var bodyParser = require('body-parser')
const { resolve } = require('path')
const { type } = require('os')


var app = express()

const hostname = 'http://pokeapi.co/api/v2'
const path = '/pokemon?limit=5'

// Create a separate async function to fetch the Pokemon data
async function getPokemonData(offset, limit) {
  const baseURL = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
  const data = await fetch(baseURL).then(res => res.json());

  const result = await Promise.all(data.results.map(async pokemon => {
    const pokemonData = await fetch(pokemon.url)
      .then(res => res.json())
      .then(pokemon => {
        const types = pokemon.types.map(t => t.type.name);
        return {
          id: pokemon.id,
          name: pokemon.name,
          type: types,
          image: pokemon.sprites.other['official-artwork'].front_default
        };
      });
    return pokemonData;
  }));

  return { data: result };
}

// Use async/await syntax in the route handler
app.get('/pokemon', async (req, res, next) => {
  const offset = req.query.offset || 0;
  const limit = req.query.limit || 20;

  try {
    const pokemonData = await getPokemonData(offset, limit);
    res.json(pokemonData);
  } catch (error) {
    next(error);
  }
});



const fetchPokemonData = async (pokemonId) => {
  const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
  const pokemonData = await pokemonResponse.json();
  const speciesResponse = await fetch(pokemonData.species.url);
  const speciesData = await speciesResponse.json();
  const typeResponse = await fetch(pokemonData.types[0].type.url);
  const typeData = await typeResponse.json();

  const speciesName = speciesData.genera.find(g => g.language.name === "en").genus;
  const weight = (pokemonData.weight * 0.1).toFixed(2) + "kg";
  const height = (pokemonData.height * 0.1).toFixed(2) + "m";
  const abilities = pokemonData.abilities.map(a => {
      if (a.is_hidden) {
          return `${a.ability.name} (hidden)`;
      } else {
          return a.ability.name;
      }
  });
  const stats = buildStatData(pokemonData.stats);
  const weakness = buildWeaknessData(typeData);
  const eggGroup = speciesData.egg_groups.map(egg => egg.name);
  const about = speciesData.flavor_text_entries.filter(species => species.language.name === "en")
                                                .map(species => species.flavor_text.replace(/(\r\n|\n|\r|\f)/gm,""))
                                                .join("");
  const pokemonInfo = {
      id: pokemonData.id,
      name: pokemonData.name,
      about: about,
      pokedexData: {
          speciesName: speciesName,
          weight: weight,
          height: height,
          abilities: abilities
      },
      stats: stats,
      weakness: weakness,
      shape: speciesData.shape.name,
      growthRate: speciesData.growth_rate.name,
      eggGroup: eggGroup,
      habitat: speciesData.habitat.name,
      capture_rate: speciesData.capture_rate
  };
  return pokemonInfo;
};

app.get("/pokemon/:id", async (req, res, next) => {
  try {
      const pokemonId = req.params.id;
      const pokemonInfo = await fetchPokemonData(pokemonId);
      console.log(pokemonInfo);
      res.send(pokemonInfo);
  } catch (err) {
      console.error(err);
      next(err);
  }
});

/* app.get("/pokemon", async (req, response, next) => {
    const data = await fetch('http://pokeapi.co/api/v2/pokemon?limit=5').then(res => res.json());
    const pokemonList = await data.results.map(async (pokemon) => {
        const pokemonData = await fetch(pokemon.url).then(res => res.json());
        response.send({
            image: pokemonData.sprites.other['official-artwork'].front_default
        })
    })
}) */


app.listen(process.env.PORT || 3000)

Array.prototype.unique = function() {
    var arr = [];
    for (var i = 0; i < this.length; i++) {
      if (!arr.contains(this[i])) {
        arr.push(this[i]);
      }
    }
    return arr;
  }

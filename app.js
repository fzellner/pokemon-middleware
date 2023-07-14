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
  const evolutionResponse = await fetch(speciesData.evolution_chain.url)
  const evolutionData = await evolutionResponse.json()
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
  const about = speciesData.flavor_text_entries.filter(species => species.language.name === "en")[0].flavor_text.replace(/(\r\n|\n|\r|\f)/gm,"")
  const types = pokemonData.types.map(t => t.type.name);
  const evolution = await getEvolutionChain(evolutionData.chain)
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
      capture_rate: speciesData.capture_rate,
      types:types,
      image: pokemonData.sprites.other['official-artwork'].front_default,
      evolution: evolution
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

  async function getEvolutionChain(chain) {
    const evolutionChain = [];
  
    const pokemonName = chain.species.name;
    const evolutionLevel = chain.evolution_details.length > 0 ? chain.evolution_details[0].min_level : null;

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    const responseData = await response.json();
    const officialArtworkUrl = responseData.sprites.other['official-artwork'].front_default;
     
    
     const pokemonInfo = {
        name: pokemonName,
        evolutionLevel: evolutionLevel,
        image: officialArtworkUrl
      }
 
    evolutionChain.push(pokemonInfo);
  
    if (chain.evolves_to && chain.evolves_to.length > 0) {
      const nextChains = chain.evolves_to;
      const nextPromises = nextChains.map(nextChain => getEvolutionChain(nextChain));
      const nextEvolutions = await Promise.all(nextPromises);
      evolutionChain.push(...nextEvolutions.flat());
    }
  
    return evolutionChain;
  }

/* app.get("/pokemon", async (req, response, next) => {
    const data = await fetch('http://pokeapi.co/api/v2/pokemon?limit=5').then(res => res.json());
    const pokemonList = await data.results.map(async (pokemon) => {
        const pokemonData = await fetch(pokemon.url).then(res => res.json());
        response.send({
            image: pokemonData.sprites.other['official-artwork'].front_default
        })
    })
}) */


function buildStatData(statsData){
  var data = statsData.map( s => {
     var x = {
          'name': s.stat.name,
          'base_value': s.base_stat
      }
      return x
  })

  return data
}

function buildWeaknessData(typeData){
  var doubleDamageFrom = typeData.damage_relations.double_damage_from.map(t => {
      var x = {
          'name':t.name
      }
      return x
  })

  var halfDamageFrom = typeData.damage_relations.half_damage_from.map(t => {
      var x = {
          'name':t.name
      }
      return x
  })


  var doubleDamageTo = typeData.damage_relations.double_damage_to.map(t => {
      var x = {
          'name':t.name
      }
      return x
  })

  var halfDamageTo = typeData.damage_relations.half_damage_to.map(t => {
      var x = {
          'name':t.name
      }
      return x
  })


  var data = {
      'double_damage_from': doubleDamageFrom,
      'half_damage_from': halfDamageFrom,
      'double_damage_to': doubleDamageTo,
      'half_damage_to': halfDamageTo
  }

  return data
}

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

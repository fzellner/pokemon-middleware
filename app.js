var fetch = require('node-fetch')
var request = require('request')
var express = require('express')
var bodyParser = require('body-parser')
const { resolve } = require('path')
const { type } = require('os')


var app = express()

const hostname = 'http://pokeapi.co/api/v2'
const path = '/pokemon?limit=5'


/* const req = request(`${hostname}${path}`, (err, res, body) => {
    console.log(body);
    });

 */

app.get("/pokemon", async (req, response, next) => {
    
    var offset = req.query.offset;
    var limit = 20;

    if (req.query.limit != null)
       limit = req.query.limit;

    const baseURL = 'https://pokeapi.co/api/v2/pokemon?offset='+offset+'&limit='+limit;
    const data = await fetch(baseURL).then(res => res.json());

    var result = await Promise.all(data.results.map(async pokemon => {
        const pokemonData = await fetch(pokemon.url)
            .then(res => res.json())
            .then(pokemon => {
                var types = pokemon.types.map(t => {
                    return t.type.name
                });
                var abc = {
                    id: pokemon.id,
                    name: pokemon.name,
                    type: types,
                    image: pokemon.sprites.other['official-artwork'].front_default
                };
                return abc;

            });
        return pokemonData;
    }))


    var x = {data: result}

    response.send(x);

})


app.get("/pokemon/:id", async (req, response, next) => {
    var pokemonId = req.params.id
    
    const baseURL = 'https://pokeapi.co/api/v2/pokemon/'+pokemonId
    const pokemonData = await fetch(baseURL).then(res => res.json());
    const speciesData =  await fetch(pokemonData.species.url)
                         .then(res => res.json())

                         
    const typeData = await(fetch(pokemonData.types[0].type.url))
                            .then(res => res.json())
                   

    var specie = speciesData.genera.filter(g => 
          g.language.name == "en"
    )

    var aboutSet = new Set(speciesData.flavor_text_entries.filter(species =>
        species.language.name == "en"
        ).map( species => 
            species.flavor_text.replace(/(\r\n|\n|\r|\f)/gm,"")
        ))

    var aboutArray = Array.from(aboutSet.values())
 
    var about = ""
    aboutArray.forEach(element => {
       about+= element
    });
    
   var eggGroup = speciesData.egg_groups.map(egg => egg.name)

   var abilites = pokemonData.abilities.map(a => {
       if(a.is_hidden)
       return a.ability.name+" (hidden)"
       else
       return a.ability.name
   })

   const pokedexData = {
    'speciesName': specie[0].genus,
    'weight':Number(pokemonData.weight*0.1).toFixed(2) + "kg",
    'height':Number(pokemonData.height*0.1).toFixed(2) + "m",
    'abilities':abilites
   }

  
   var stats = buildStatData(pokemonData.stats)

   var weakness = buildWeaknessData(typeData)

    const pokemonInfo = {
        'id':pokemonData.id,
        'name':pokemonData.name,
        'about': about,
        'pokedexData':pokedexData,
        'stats':stats,
        'weakness': weakness,
        'shape': speciesData.shape.name,
        'growthRate':speciesData.growth_rate.name,
        'eggGroup':eggGroup,
        'habitat':speciesData.habitat.name,
        'capture_rate':speciesData.capture_rate,
        

    }

    console.log(pokemonInfo)
    response.send(pokemonInfo);
})

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



function getPokemonData(url) {
    var data = fetch(url).then(res => res.json())
    return data
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

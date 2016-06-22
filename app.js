"use strict";

const Hapi = require('hapi'),
  server = new Hapi.Server(),
  request = require("request"),
  cheerio = require("cheerio"),
  boom = require("boom"), 
  URL = "http://www.cidades.ibge.gov.br/xtras/home.php";

// server connection
server.connection({ 
    host: 'localhost', 
    port: 8000 
});

// classes
class UF {
  constructor(codigoIBGE, nome, sigla, link) {
    this.codigoIBGE = codigoIBGE;
    this.nome = nome;
    this.sigla = sigla;
    this.link = link;
  }
}

class Municipio {
  constructor(codigoIBGE, nome, link) {
    this.codigoIBGE = codigoIBGE;
    this.nome = nome;
    this.link = link;
  }
}

// utils
function getParameterByName(url, name) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// routes
server.route({
  method: 'GET',
  path:'/ufs', 
  handler: (req, reply) => {
    request(URL, (error, response, body) => {
      if (error) {
        return reply(boom.badImplementation('Erro consultar ufs. Trace: ' + error)); 
      }           
        
      const $ = cheerio.load(body),
        ufs = $("#menu_ufs li a"),
        ufsResponse = [];
        
      for (var count = 0, len = ufs.length; count < len; count++) {
        if (ufs[count].attribs) {                    
          ufsResponse.push(
            new UF(+getParameterByName(ufs[count].attribs.href, "coduf"),
              ufs[count].attribs.title,
              ufs[count].children[0].data
           ));
        }
      }
      
      return reply(ufsResponse);       
    });        
  },
  config: {
    cache: { expiresIn: 30000 }
  }
});

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log(`Servidor executando ${ server.info.uri }.`);
});
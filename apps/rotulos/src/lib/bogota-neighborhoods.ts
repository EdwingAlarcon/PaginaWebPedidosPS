// Generated from Datos Abiertos Bogotá - Sector Catastral and Localidad. Bogotá D.C.
// Sources:
// - https://datosabiertos.bogota.gov.co/dataset/sector-catastral
// - https://datosabiertos.bogota.gov.co/dataset/localidad-bogota-d-c
// Sector-to-locality relation was derived by assigning each sector centroid to an official locality polygon.
// One edge-case sector (009255 SANTA RITA DE SUBA) was assigned to SUBA after centroid matching left it unmatched.

export type BogotaNeighborhoodOption = { code: string; name: string };
export type BogotaNeighborhoodGroup = { locality: string; neighborhoods: BogotaNeighborhoodOption[] };

export const BOGOTA_NEIGHBORHOODS_BY_LOCALITY: BogotaNeighborhoodGroup[] = [
  {
    "locality": "ANTONIO NARIÑO",
    "neighborhoods": [
      {
        "code": "001203",
        "name": "CARACAS"
      },
      {
        "code": "001202",
        "name": "CIUDAD BERNA"
      },
      {
        "code": "001204",
        "name": "CIUDAD JARDIN SUR"
      },
      {
        "code": "002301",
        "name": "EDUARDO FREY"
      },
      {
        "code": "002107",
        "name": "LA FRAGUA"
      },
      {
        "code": "002101",
        "name": "LA FRAGUITA"
      },
      {
        "code": "001208",
        "name": "LA HORTUA"
      },
      {
        "code": "001211",
        "name": "POLICARPA"
      },
      {
        "code": "002103",
        "name": "RESTREPO"
      },
      {
        "code": "002104",
        "name": "RESTREPO OCCIDENTAL"
      },
      {
        "code": "002102",
        "name": "SAN ANTONIO"
      },
      {
        "code": "002105",
        "name": "SANTANDER"
      },
      {
        "code": "002302",
        "name": "SANTANDER SUR"
      },
      {
        "code": "002106",
        "name": "SENA"
      },
      {
        "code": "001201",
        "name": "SEVILLA"
      },
      {
        "code": "002309",
        "name": "VILLA MAYOR ORIENTAL"
      }
    ]
  },
  {
    "locality": "BARRIOS UNIDOS",
    "neighborhoods": [
      {
        "code": "007302",
        "name": "ALCAZARES"
      },
      {
        "code": "007404",
        "name": "ALCAZARES NORTE"
      },
      {
        "code": "007306",
        "name": "BAQUERO"
      },
      {
        "code": "007309",
        "name": "BENJAMIN HERRERA"
      },
      {
        "code": "007303",
        "name": "COLOMBIA"
      },
      {
        "code": "007304",
        "name": "CONCEPCION NORTE"
      },
      {
        "code": "005202",
        "name": "DOCE DE OCTUBRE"
      },
      {
        "code": "005104",
        "name": "EL ROSARIO"
      },
      {
        "code": "005306",
        "name": "ENTRERIOS"
      },
      {
        "code": "005310",
        "name": "ESCUELA MILITAR"
      },
      {
        "code": "005201",
        "name": "JORGE ELIECER GAITAN"
      },
      {
        "code": "005101",
        "name": "JOSE JOAQUIN VARGAS"
      },
      {
        "code": "007402",
        "name": "JUAN XXIII"
      },
      {
        "code": "007407",
        "name": "LA AURORA"
      },
      {
        "code": "005304",
        "name": "LA CASTELLANA"
      },
      {
        "code": "007305",
        "name": "LA ESPERANZA"
      },
      {
        "code": "005206",
        "name": "LA LIBERTAD"
      },
      {
        "code": "007301",
        "name": "LA MERCED NORTE"
      },
      {
        "code": "005305",
        "name": "LA PATRIA"
      },
      {
        "code": "007310",
        "name": "LA PAZ"
      },
      {
        "code": "005307",
        "name": "LOS ANDES"
      },
      {
        "code": "005207",
        "name": "METROPOLIS"
      },
      {
        "code": "007307",
        "name": "MUEQUETA"
      },
      {
        "code": "007405",
        "name": "ONCE DE NOVIEMBRE"
      },
      {
        "code": "005112",
        "name": "PARQUE DISTRITAL SALITRE"
      },
      {
        "code": "005115",
        "name": "PARQUE POPULAR SALITRE"
      },
      {
        "code": "007401",
        "name": "POLO CLUB"
      },
      {
        "code": "005102",
        "name": "POPULAR MODELO"
      },
      {
        "code": "007308",
        "name": "QUINTA MUTIS"
      },
      {
        "code": "007312",
        "name": "RAFAEL URIBE"
      },
      {
        "code": "005308",
        "name": "RIONEGRO"
      },
      {
        "code": "007403",
        "name": "SAN FELIPE"
      },
      {
        "code": "005203",
        "name": "SAN FERNANDO"
      },
      {
        "code": "005204",
        "name": "SAN FERNANDO OCCIDENTAL"
      },
      {
        "code": "005103",
        "name": "SAN MIGUEL"
      },
      {
        "code": "007406",
        "name": "SANTA SOFIA"
      },
      {
        "code": "007311",
        "name": "SIETE DE AGOSTO"
      },
      {
        "code": "005205",
        "name": "SIMON BOLIVAR"
      }
    ]
  },
  {
    "locality": "BOSA",
    "neighborhoods": [
      {
        "code": "004553",
        "name": "ANDALUCIA II"
      },
      {
        "code": "004570",
        "name": "ANTONIA SANTOS"
      },
      {
        "code": "004583",
        "name": "ARGELIA II"
      },
      {
        "code": "004628",
        "name": "BETANIA"
      },
      {
        "code": "004522",
        "name": "BOSA"
      },
      {
        "code": "205325",
        "name": "BOSA 37"
      },
      {
        "code": "004526",
        "name": "BOSA NOVA"
      },
      {
        "code": "004580",
        "name": "BOSA NOVA EL PORVENIR"
      },
      {
        "code": "004622",
        "name": "BRASIL"
      },
      {
        "code": "004604",
        "name": "BRASILIA"
      },
      {
        "code": "205322",
        "name": "CAMPO VERDE"
      },
      {
        "code": "004634",
        "name": "CANAVERALEJO"
      },
      {
        "code": "205308",
        "name": "CANAVERALEJO RURAL"
      },
      {
        "code": "004645",
        "name": "CAÑAVERALEJO I"
      },
      {
        "code": "004574",
        "name": "CHARLES DE GAULLE"
      },
      {
        "code": "004605",
        "name": "CHICALA"
      },
      {
        "code": "004595",
        "name": "CHICO SUR"
      },
      {
        "code": "004573",
        "name": "CIUDADELA EL RECREO"
      },
      {
        "code": "004638",
        "name": "CIUDADELA EL RECREO II"
      },
      {
        "code": "004631",
        "name": "EL CORZO"
      },
      {
        "code": "004643",
        "name": "EL CORZO I"
      },
      {
        "code": "004646",
        "name": "EL CORZO II"
      },
      {
        "code": "004588",
        "name": "EL DANUBIO AZUL"
      },
      {
        "code": "004561",
        "name": "EL JARDIN"
      },
      {
        "code": "004591",
        "name": "EL PORTAL DEL BRASIL"
      },
      {
        "code": "205320",
        "name": "EL REMANSO"
      },
      {
        "code": "004625",
        "name": "EL REMANSO I"
      },
      {
        "code": "004533",
        "name": "EL RETAZO"
      },
      {
        "code": "004519",
        "name": "ESCOCIA"
      },
      {
        "code": "004579",
        "name": "ESCOCIA"
      },
      {
        "code": "004539",
        "name": "GRAN COLOMBIANO"
      },
      {
        "code": "004552",
        "name": "GUALOCHE"
      },
      {
        "code": "004642",
        "name": "ISLANDIA"
      },
      {
        "code": "004523",
        "name": "JIMENEZ DE QUESADA"
      },
      {
        "code": "004586",
        "name": "JIMENEZ DE QUESADA II SECTOR"
      },
      {
        "code": "004568",
        "name": "JORGE URIBE BOTERO"
      },
      {
        "code": "004569",
        "name": "JOSE ANTONIO GALAN"
      },
      {
        "code": "004550",
        "name": "JOSE MARIA CARBONEL"
      },
      {
        "code": "004632",
        "name": "LA CABANA"
      },
      {
        "code": "004521",
        "name": "LA ESTACION BOSA"
      },
      {
        "code": "004641",
        "name": "LA INDEPENDENCIA"
      },
      {
        "code": "004593",
        "name": "LA LIBERTAD"
      },
      {
        "code": "004624",
        "name": "LA VEGA SAN BERNARDINO"
      },
      {
        "code": "004637",
        "name": "LAS MARGARITAS"
      },
      {
        "code": "004575",
        "name": "LOS LAURELES"
      },
      {
        "code": "004587",
        "name": "LOS SAUCES"
      },
      {
        "code": "004527",
        "name": "NUEVA GRANADA BOSA"
      },
      {
        "code": "004538",
        "name": "OLARTE"
      },
      {
        "code": "105210",
        "name": "OSORIO X"
      },
      {
        "code": "004616",
        "name": "OSORIO X URBANO"
      },
      {
        "code": "105223",
        "name": "OSORIO XXIII"
      },
      {
        "code": "004630",
        "name": "PARCELA EL PORVENIR"
      },
      {
        "code": "004528",
        "name": "PASO ANCHO"
      },
      {
        "code": "004602",
        "name": "REMANSO URBANO"
      },
      {
        "code": "004594",
        "name": "SAN ANTONIO"
      },
      {
        "code": "004597",
        "name": "SAN BERNARDINO I"
      },
      {
        "code": "004635",
        "name": "SAN BERNARDINO II"
      },
      {
        "code": "105324",
        "name": "SAN BERNARDINO IX"
      },
      {
        "code": "004623",
        "name": "SAN BERNARDINO POTRERITOS"
      },
      {
        "code": "105326",
        "name": "SAN BERNARDINO X"
      },
      {
        "code": "205319",
        "name": "SAN BERNARDINO XIX"
      },
      {
        "code": "105318",
        "name": "SAN BERNARDINO XVIII"
      },
      {
        "code": "205318",
        "name": "SAN BERNARDINO XVIII"
      },
      {
        "code": "004577",
        "name": "SAN BERNARDINO XXII URBANO"
      },
      {
        "code": "105325",
        "name": "SAN BERNARDINO XXV"
      },
      {
        "code": "004590",
        "name": "SAN BERNARDINO XXV URBANO"
      },
      {
        "code": "004513",
        "name": "SAN DIEGO-BOSA"
      },
      {
        "code": "004592",
        "name": "SAN MARTIN"
      },
      {
        "code": "004524",
        "name": "SAN PABLO BOSA"
      },
      {
        "code": "004589",
        "name": "SAN PEDRO"
      },
      {
        "code": "004633",
        "name": "SANTA FE BOSA"
      },
      {
        "code": "004598",
        "name": "VILLA ANNY I"
      },
      {
        "code": "004599",
        "name": "VILLA ANNY II"
      },
      {
        "code": "004546",
        "name": "VILLA DEL RIO"
      },
      {
        "code": "205316",
        "name": "VILLA EMMA"
      },
      {
        "code": "004567",
        "name": "VILLAS DEL PROGRESO"
      }
    ]
  },
  {
    "locality": "CANDELARIA",
    "neighborhoods": [
      {
        "code": "003204",
        "name": "BELEN"
      },
      {
        "code": "003106",
        "name": "CENTRO ADMINISTRATIVO"
      },
      {
        "code": "003105",
        "name": "EGIPTO"
      },
      {
        "code": "003110",
        "name": "LA CATEDRAL"
      },
      {
        "code": "003104",
        "name": "LA CONCORDIA"
      },
      {
        "code": "003103",
        "name": "LAS AGUAS"
      },
      {
        "code": "008114",
        "name": "PARQUE NACIONAL URBANO"
      },
      {
        "code": "003215",
        "name": "SAN FRANCISCO RURAL"
      },
      {
        "code": "003203",
        "name": "SANTA BARBARA"
      }
    ]
  },
  {
    "locality": "CHAPINERO",
    "neighborhoods": [
      {
        "code": "008314",
        "name": "ANTIGUO COUNTRY"
      },
      {
        "code": "008305",
        "name": "BELLAVISTA"
      },
      {
        "code": "008207",
        "name": "BOSQUE CALDERON"
      },
      {
        "code": "008111",
        "name": "CATALUNA"
      },
      {
        "code": "008213",
        "name": "CHAPINERO CENTRAL"
      },
      {
        "code": "008214",
        "name": "CHAPINERO NORTE"
      },
      {
        "code": "008307",
        "name": "CHICO NORTE"
      },
      {
        "code": "008301",
        "name": "CHICO NORTE II SECTOR"
      },
      {
        "code": "008315",
        "name": "CHICO NORTE III SECTOR"
      },
      {
        "code": "101101",
        "name": "EL BAGAZAL"
      },
      {
        "code": "008319",
        "name": "EL BAGAZAL"
      },
      {
        "code": "008308",
        "name": "EL CHICO"
      },
      {
        "code": "008311",
        "name": "EL NOGAL"
      },
      {
        "code": "008110",
        "name": "EL PARAISO"
      },
      {
        "code": "008303",
        "name": "EL REFUGIO"
      },
      {
        "code": "201105",
        "name": "EL REFUGIO I"
      },
      {
        "code": "201108",
        "name": "EL REFUGIO II"
      },
      {
        "code": "008320",
        "name": "EL REFUGIO ZONA II"
      },
      {
        "code": "008310",
        "name": "EL RETIRO"
      },
      {
        "code": "008202",
        "name": "EMAUS"
      },
      {
        "code": "008312",
        "name": "ESPARTILLAL"
      },
      {
        "code": "008204",
        "name": "GRANADA"
      },
      {
        "code": "101201",
        "name": "HOYA TEUSACA"
      },
      {
        "code": "008215",
        "name": "INGEMAR"
      },
      {
        "code": "201109",
        "name": "INGEMAR I"
      },
      {
        "code": "201110",
        "name": "INGEMAR ORIENTAL I"
      },
      {
        "code": "008321",
        "name": "INGEMAR ORIENTAL II"
      },
      {
        "code": "101103",
        "name": "INGEMAR ORIENTAL RURAL"
      },
      {
        "code": "008211",
        "name": "JUAN XXIII"
      },
      {
        "code": "008309",
        "name": "LA CABRERA"
      },
      {
        "code": "208107",
        "name": "LA ESPERANZA"
      },
      {
        "code": "008206",
        "name": "LA SALLE"
      },
      {
        "code": "008313",
        "name": "LAGO GAITAN"
      },
      {
        "code": "008203",
        "name": "LAS ACACIAS"
      },
      {
        "code": "008304",
        "name": "LOS ROSALES"
      },
      {
        "code": "008205",
        "name": "MARIA CRISTINA"
      },
      {
        "code": "008212",
        "name": "MARLY"
      },
      {
        "code": "108109",
        "name": "PARAMO I"
      },
      {
        "code": "101110",
        "name": "PARAMO I RURAL"
      },
      {
        "code": "108108",
        "name": "PARAMO II"
      },
      {
        "code": "208101",
        "name": "PARAMO IV"
      },
      {
        "code": "208104",
        "name": "PARAMO URBANO"
      },
      {
        "code": "008208",
        "name": "PARDO RUBIO"
      },
      {
        "code": "201508",
        "name": "PARDO RUBIO I"
      },
      {
        "code": "008306",
        "name": "PORCIUNCULA"
      },
      {
        "code": "008201",
        "name": "QUINTA CAMACHO"
      },
      {
        "code": "208111",
        "name": "SAN ISIDRO"
      },
      {
        "code": "208108",
        "name": "SAN ISIDRO RURAL"
      },
      {
        "code": "208126",
        "name": "SAN ISIDRO RURAL II"
      },
      {
        "code": "208110",
        "name": "SAN LUIS ALTOS DEL CABO RURAL"
      },
      {
        "code": "208125",
        "name": "SAN LUIS ALTOS DEL CABO RURAL II"
      },
      {
        "code": "008302",
        "name": "SEMINARIO"
      },
      {
        "code": "101502",
        "name": "SIBERIA"
      },
      {
        "code": "008220",
        "name": "SIBERIA CENTRAL"
      },
      {
        "code": "201503",
        "name": "SIBERIA II"
      },
      {
        "code": "008322",
        "name": "SIBERIA URBANO"
      },
      {
        "code": "008221",
        "name": "SIBERIA URBANO"
      },
      {
        "code": "008112",
        "name": "SUCRE"
      }
    ]
  },
  {
    "locality": "CIUDAD BOLIVAR",
    "neighborhoods": [
      {
        "code": "002578",
        "name": "ARABIA"
      },
      {
        "code": "204127",
        "name": "ARABIA I"
      },
      {
        "code": "204130",
        "name": "ARABIA II"
      },
      {
        "code": "002568",
        "name": "ARBORIZADORA ALTA"
      },
      {
        "code": "002569",
        "name": "ARBORIZADORA ALTA"
      },
      {
        "code": "002573",
        "name": "ARBORIZADORA ALTA"
      },
      {
        "code": "002461",
        "name": "ARBORIZADORA ALTA  II"
      },
      {
        "code": "002460",
        "name": "ARBORIZADORA ALTA I"
      },
      {
        "code": "002422",
        "name": "ATLANTA"
      },
      {
        "code": "002417",
        "name": "BARLOVENTO"
      },
      {
        "code": "002580",
        "name": "BELLA FLOR"
      },
      {
        "code": "104305",
        "name": "BELLA FLOR RURAL"
      },
      {
        "code": "002582",
        "name": "BELLA FLOR SUR"
      },
      {
        "code": "104107",
        "name": "BELLA FLOR SUR"
      },
      {
        "code": "104134",
        "name": "BELLA FLOR SUR RURAL"
      },
      {
        "code": "002436",
        "name": "BELLAVISTA"
      },
      {
        "code": "002560",
        "name": "BELLAVISTA LUCERO ALTO"
      },
      {
        "code": "002591",
        "name": "BRAZUELOS OCCIDENTAL"
      },
      {
        "code": "104130",
        "name": "BRAZUELOS OCCIDENTAL RURAL"
      },
      {
        "code": "002587",
        "name": "BRISAS DEL VOLADOR"
      },
      {
        "code": "002531",
        "name": "CANDELARIA LA NUEVA"
      },
      {
        "code": "002445",
        "name": "CARACOLI"
      },
      {
        "code": "002534",
        "name": "CASA DE TEJA"
      },
      {
        "code": "002574",
        "name": "CEDRITOS DEL SUR"
      },
      {
        "code": "002562",
        "name": "CENTRAL DE MEZCLAS"
      },
      {
        "code": "002575",
        "name": "CERRO COLORADO"
      },
      {
        "code": "002453",
        "name": "CIUDAD BOLIVAR"
      },
      {
        "code": "104119",
        "name": "CIUDAD BOLIVAR RURAL I"
      },
      {
        "code": "104118",
        "name": "CIUDAD BOLIVAR RURAL III"
      },
      {
        "code": "002504",
        "name": "COMPARTIR"
      },
      {
        "code": "002561",
        "name": "CORDILLERA DEL SUR"
      },
      {
        "code": "002435",
        "name": "EL CHIRCAL SUR"
      },
      {
        "code": "002416",
        "name": "EL ENSUENO"
      },
      {
        "code": "002564",
        "name": "EL MINUTO DE MARIA"
      },
      {
        "code": "002570",
        "name": "EL MIRADOR"
      },
      {
        "code": "002447",
        "name": "EL MIRADOR DE LA ESTANCIA"
      },
      {
        "code": "204107",
        "name": "EL MIRADOR II"
      },
      {
        "code": "002584",
        "name": "EL MOCHUELO"
      },
      {
        "code": "104306",
        "name": "EL MOCHUELO ALTO RURAL"
      },
      {
        "code": "104129",
        "name": "EL MOCHUELO II"
      },
      {
        "code": "204129",
        "name": "EL MOCHUELO II NORTE"
      },
      {
        "code": "104136",
        "name": "EL MOCHUELO II RURAL"
      },
      {
        "code": "002598",
        "name": "EL MOCHUELO II URBANO"
      },
      {
        "code": "104128",
        "name": "EL MOCHUELO III"
      },
      {
        "code": "104133",
        "name": "EL MOCHUELO III RURAL"
      },
      {
        "code": "002522",
        "name": "EL MOCHUELO ORIENTAL"
      },
      {
        "code": "002585",
        "name": "EL MOCHUELO URBANO"
      },
      {
        "code": "002646",
        "name": "EL MOCHUELO V"
      },
      {
        "code": "104137",
        "name": "EL MOCHUELO VI"
      },
      {
        "code": "002433",
        "name": "EL PENON DEL CORTIJO"
      },
      {
        "code": "002545",
        "name": "EL SATELITE"
      },
      {
        "code": "002547",
        "name": "EL TESORO"
      },
      {
        "code": "002423",
        "name": "ESPINO"
      },
      {
        "code": "002449",
        "name": "ESPINO I"
      },
      {
        "code": "002540",
        "name": "ESTRELLA DEL SUR"
      },
      {
        "code": "002427",
        "name": "GALICIA"
      },
      {
        "code": "002554",
        "name": "GIBRALTAR SUR"
      },
      {
        "code": "004563",
        "name": "GUADALUPE"
      },
      {
        "code": "002414",
        "name": "ISMAEL PERDOMO"
      },
      {
        "code": "002434",
        "name": "JERUSALEN"
      },
      {
        "code": "002557",
        "name": "JUAN JOSE RONDON"
      },
      {
        "code": "002552",
        "name": "JUAN PABLO II"
      },
      {
        "code": "002523",
        "name": "LA ALAMEDA"
      },
      {
        "code": "002420",
        "name": "LA CORUNA"
      },
      {
        "code": "002418",
        "name": "LA ESTANCIA"
      },
      {
        "code": "002437",
        "name": "LA PRADERA"
      },
      {
        "code": "002443",
        "name": "LA PRIMAVERA I"
      },
      {
        "code": "002581",
        "name": "LA TORRE"
      },
      {
        "code": "002455",
        "name": "LA VALVANERA"
      },
      {
        "code": "204304",
        "name": "LAGUNITAS"
      },
      {
        "code": "002595",
        "name": "LAGUNITAS URBANO"
      },
      {
        "code": "002513",
        "name": "LAS ACACIAS"
      },
      {
        "code": "002430",
        "name": "LAS BRISAS"
      },
      {
        "code": "002520",
        "name": "LAS MANAS"
      },
      {
        "code": "104108",
        "name": "LAS MERCEDES"
      },
      {
        "code": "002559",
        "name": "LOS ALPES SUR"
      },
      {
        "code": "002544",
        "name": "LOS LAURELES II"
      },
      {
        "code": "002446",
        "name": "LOS TRES REYES"
      },
      {
        "code": "002441",
        "name": "LOS TRES REYES I"
      },
      {
        "code": "002521",
        "name": "LUCERO ALTO"
      },
      {
        "code": "002517",
        "name": "LUCERO DEL SUR"
      },
      {
        "code": "002415",
        "name": "MADELENA"
      },
      {
        "code": "002429",
        "name": "MARIA CANO"
      },
      {
        "code": "002514",
        "name": "MEISSEN"
      },
      {
        "code": "002516",
        "name": "MEXICO"
      },
      {
        "code": "002502",
        "name": "MILLAN"
      },
      {
        "code": "104131",
        "name": "MOCHUELO ALTO RURAL"
      },
      {
        "code": "234131",
        "name": "MOCHUELO ALTO URBANO"
      },
      {
        "code": "204132",
        "name": "MOCHUELO V"
      },
      {
        "code": "002546",
        "name": "NACIONES UNIDAS"
      },
      {
        "code": "204106",
        "name": "NUEVA ESPERANZA"
      },
      {
        "code": "002565",
        "name": "PARAISO QUIBA"
      },
      {
        "code": "104104",
        "name": "PASQUILLA"
      },
      {
        "code": "234104",
        "name": "PASQUILLA URBANA"
      },
      {
        "code": "104102",
        "name": "PASQUILLITA"
      },
      {
        "code": "002448",
        "name": "PERDOMO ALTO"
      },
      {
        "code": "002450",
        "name": "PERDOMO ALTO"
      },
      {
        "code": "002431",
        "name": "POTOSI"
      },
      {
        "code": "002428",
        "name": "PRIMAVERA II"
      },
      {
        "code": "002530",
        "name": "QUIBA"
      },
      {
        "code": "104114",
        "name": "QUIBA ALTO"
      },
      {
        "code": "104110",
        "name": "QUIBA BAJO"
      },
      {
        "code": "204108",
        "name": "QUIBA BAJO I"
      },
      {
        "code": "204109",
        "name": "QUIBA BAJO II"
      },
      {
        "code": "204110",
        "name": "QUIBA BAJO III"
      },
      {
        "code": "204111",
        "name": "QUIBA BAJO IV"
      },
      {
        "code": "234110",
        "name": "QUIBA BAJO URBANO"
      },
      {
        "code": "204119",
        "name": "QUIBA BAJO V"
      },
      {
        "code": "002456",
        "name": "QUIBA I"
      },
      {
        "code": "204128",
        "name": "QUIBA RURAL"
      },
      {
        "code": "002583",
        "name": "QUIBA URBANO"
      },
      {
        "code": "002532",
        "name": "QUINTAS DEL SUR"
      },
      {
        "code": "002421",
        "name": "RAFAEL ESCAMILLA"
      },
      {
        "code": "002424",
        "name": "RINCON DE GALICIA"
      },
      {
        "code": "002419",
        "name": "RINCON DE LA VALVANERA"
      },
      {
        "code": "002518",
        "name": "RONDA"
      },
      {
        "code": "002451",
        "name": "SAN ANTONIO DEL MIRADOR"
      },
      {
        "code": "002515",
        "name": "SAN FRANCISCO"
      },
      {
        "code": "002539",
        "name": "SAN RAFAEL"
      },
      {
        "code": "104113",
        "name": "SANTA BARBARA"
      },
      {
        "code": "104112",
        "name": "SANTA ROSA"
      },
      {
        "code": "002442",
        "name": "SANTA VIVIANA"
      },
      {
        "code": "002426",
        "name": "SANTO DOMINGO"
      },
      {
        "code": "002440",
        "name": "SIERRA MORENA"
      },
      {
        "code": "002439",
        "name": "SIERRA MORENA"
      },
      {
        "code": "002438",
        "name": "SIERRA MORENA"
      },
      {
        "code": "002444",
        "name": "SIERRA MORENA II"
      },
      {
        "code": "002533",
        "name": "SOTAVENTO"
      },
      {
        "code": "002553",
        "name": "SUMAPAZ"
      },
      {
        "code": "002412",
        "name": "VERONA"
      },
      {
        "code": "002579",
        "name": "VILLA CANDELARIA"
      },
      {
        "code": "002549",
        "name": "VILLA GLORIA"
      },
      {
        "code": "002558",
        "name": "VILLAS EL DIAMANTE"
      }
    ]
  },
  {
    "locality": "ENGATIVA",
    "neighborhoods": [
      {
        "code": "005643",
        "name": "ALAMOS"
      },
      {
        "code": "005611",
        "name": "AUTOPISTA MEDELLIN"
      },
      {
        "code": "005503",
        "name": "BELLAVISTA OCCIDENTAL"
      },
      {
        "code": "005632",
        "name": "BOCHICA"
      },
      {
        "code": "005644",
        "name": "BOCHICA II"
      },
      {
        "code": "005622",
        "name": "BOLIVIA"
      },
      {
        "code": "005675",
        "name": "BOLIVIA"
      },
      {
        "code": "005640",
        "name": "BOLIVIA ORIENTAL"
      },
      {
        "code": "005406",
        "name": "BONANZA"
      },
      {
        "code": "005505",
        "name": "BOSQUE POPULAR"
      },
      {
        "code": "005603",
        "name": "BOYACA"
      },
      {
        "code": "005667",
        "name": "CENTRO ENGATIVA II"
      },
      {
        "code": "005630",
        "name": "CIUDAD BACHUE"
      },
      {
        "code": "005631",
        "name": "CIUDAD BACHUE I ETAPA"
      },
      {
        "code": "005682",
        "name": "CIUDAD BACHUE II"
      },
      {
        "code": "005650",
        "name": "CIUDADELA COLSUBSIDIO"
      },
      {
        "code": "206502",
        "name": "DORADO INDUSTRIAL I"
      },
      {
        "code": "005662",
        "name": "EL CEDRO"
      },
      {
        "code": "005629",
        "name": "EL CEDRO"
      },
      {
        "code": "206154",
        "name": "EL CEDRO I"
      },
      {
        "code": "005634",
        "name": "EL CORTIJO"
      },
      {
        "code": "005664",
        "name": "EL DORADO"
      },
      {
        "code": "005663",
        "name": "EL DORADO INDUSTRIAL"
      },
      {
        "code": "106303",
        "name": "EL DORADO RURAL"
      },
      {
        "code": "005605",
        "name": "EL ENCANTO"
      },
      {
        "code": "005669",
        "name": "EL GACO"
      },
      {
        "code": "005510",
        "name": "EL LAUREL"
      },
      {
        "code": "005635",
        "name": "EL MADRIGAL"
      },
      {
        "code": "005601",
        "name": "EL MINUTO DE DIOS"
      },
      {
        "code": "005652",
        "name": "EL MUELLE"
      },
      {
        "code": "106201",
        "name": "EL PANTANO"
      },
      {
        "code": "005604",
        "name": "EL REAL"
      },
      {
        "code": "106301",
        "name": "ENGATIVA EL DORADO"
      },
      {
        "code": "005636",
        "name": "ENGATIVA ZONA URBANA"
      },
      {
        "code": "005620",
        "name": "FLORENCIA"
      },
      {
        "code": "005621",
        "name": "FLORIDA BLANCA"
      },
      {
        "code": "005627",
        "name": "GARCES NAVAS"
      },
      {
        "code": "005628",
        "name": "GARCES NAVAS ORIENTAL"
      },
      {
        "code": "005655",
        "name": "GARCES NAVAS SUR"
      },
      {
        "code": "005654",
        "name": "GRAN GRANADA"
      },
      {
        "code": "005506",
        "name": "JARDIN BOTANICO"
      },
      {
        "code": "005508",
        "name": "LA CABANA"
      },
      {
        "code": "005502",
        "name": "LA ESTRADA"
      },
      {
        "code": "005504",
        "name": "LA ESTRADITA"
      },
      {
        "code": "005666",
        "name": "LA FAENA"
      },
      {
        "code": "005610",
        "name": "LA GRANJA"
      },
      {
        "code": "005670",
        "name": "LA RIVIERA"
      },
      {
        "code": "005613",
        "name": "LA SERENA"
      },
      {
        "code": "005615",
        "name": "LA SOLEDAD NORTE"
      },
      {
        "code": "005404",
        "name": "LAS FERIAS"
      },
      {
        "code": "005405",
        "name": "LAS FERIAS OCCIDENTAL"
      },
      {
        "code": "005626",
        "name": "LOS ALAMOS"
      },
      {
        "code": "005625",
        "name": "LOS ALAMOS"
      },
      {
        "code": "005623",
        "name": "LOS ANGELES"
      },
      {
        "code": "005616",
        "name": "LOS CEREZOS"
      },
      {
        "code": "005661",
        "name": "LUIS CARLOS GALAN"
      },
      {
        "code": "005665",
        "name": "MARANDU"
      },
      {
        "code": "005507",
        "name": "NORMANDIA"
      },
      {
        "code": "005606",
        "name": "NORMANDIA OCCIDENTAL"
      },
      {
        "code": "005501",
        "name": "PALO BLANCO"
      },
      {
        "code": "005619",
        "name": "PARIS"
      },
      {
        "code": "005612",
        "name": "PARIS GAITAN"
      },
      {
        "code": "005617",
        "name": "PRIMAVERA"
      },
      {
        "code": "005683",
        "name": "QUIRIGUA I"
      },
      {
        "code": "005684",
        "name": "QUIRIGUA II"
      },
      {
        "code": "005639",
        "name": "QUIRIGUA ORIENTAL"
      },
      {
        "code": "005657",
        "name": "SABANA DEL DORADO"
      },
      {
        "code": "005679",
        "name": "SAN ANTONIO ENGATIVA"
      },
      {
        "code": "005660",
        "name": "SAN ANTONIO URBANO"
      },
      {
        "code": "005607",
        "name": "SAN IGNACIO"
      },
      {
        "code": "005509",
        "name": "SAN JOAQUIN"
      },
      {
        "code": "005638",
        "name": "SANTA CECILIA"
      },
      {
        "code": "005608",
        "name": "SANTA HELENITA"
      },
      {
        "code": "005602",
        "name": "SANTA MARIA"
      },
      {
        "code": "005641",
        "name": "SANTA MONICA"
      },
      {
        "code": "005609",
        "name": "TABORA"
      },
      {
        "code": "005648",
        "name": "VILLA AMALIA"
      },
      {
        "code": "005680",
        "name": "VILLA DEL MAR"
      },
      {
        "code": "005637",
        "name": "VILLA GLADYS"
      },
      {
        "code": "005614",
        "name": "VILLA LUZ"
      },
      {
        "code": "005658",
        "name": "VILLA SAGRARIO"
      },
      {
        "code": "005668",
        "name": "VILLAS DE ALCALA"
      },
      {
        "code": "005647",
        "name": "VILLAS DE GRANADA"
      },
      {
        "code": "005649",
        "name": "VILLAS DE GRANADA I"
      }
    ]
  },
  {
    "locality": "FONTIBON",
    "neighborhoods": [
      {
        "code": "005624",
        "name": "AEROPUERTO EL DORADO"
      },
      {
        "code": "006416",
        "name": "ATAHUALPA"
      },
      {
        "code": "006409",
        "name": "BELEN FONTIBON"
      },
      {
        "code": "006316",
        "name": "BOSQUE DE MODELIA"
      },
      {
        "code": "006414",
        "name": "BRISAS ALDEA FONTIBON"
      },
      {
        "code": "006302",
        "name": "CAPELLANIA"
      },
      {
        "code": "006410",
        "name": "CENTRO FONTIBON"
      },
      {
        "code": "105402",
        "name": "CHARCO RURAL"
      },
      {
        "code": "006411",
        "name": "CHARCO URBANO"
      },
      {
        "code": "006320",
        "name": "CIUDAD HAYUELOS"
      },
      {
        "code": "006408",
        "name": "EL CARMEN FONTIBON"
      },
      {
        "code": "006525",
        "name": "EL CHANCO I"
      },
      {
        "code": "205401",
        "name": "EL CHANCO II"
      },
      {
        "code": "006535",
        "name": "EL CHANCO III"
      },
      {
        "code": "105401",
        "name": "EL CHANCO RURAL II"
      },
      {
        "code": "105403",
        "name": "EL CHANCO RURAL III"
      },
      {
        "code": "205402",
        "name": "EL CHARCO"
      },
      {
        "code": "006419",
        "name": "EL REFUGIO"
      },
      {
        "code": "105104",
        "name": "EL TINTAL"
      },
      {
        "code": "006423",
        "name": "EL TINTAL CENTRAL"
      },
      {
        "code": "006522",
        "name": "EL TINTAL II"
      },
      {
        "code": "006405",
        "name": "FERROCAJA FONTIBON"
      },
      {
        "code": "006308",
        "name": "FRANCO"
      },
      {
        "code": "006306",
        "name": "GRANJAS DE TECHO"
      },
      {
        "code": "006407",
        "name": "GUADUAL FONTIBON"
      },
      {
        "code": "006527",
        "name": "INTERINDUSTRIAL"
      },
      {
        "code": "006532",
        "name": "KASANDRA"
      },
      {
        "code": "006402",
        "name": "LA CABANA FONTIBON"
      },
      {
        "code": "006303",
        "name": "LA ESPERANZA NORTE"
      },
      {
        "code": "006315",
        "name": "LA ESPERANZA SUR"
      },
      {
        "code": "006420",
        "name": "LA GIRALDA"
      },
      {
        "code": "006415",
        "name": "LA LAGUNA FONTIBON"
      },
      {
        "code": "005672",
        "name": "LAS NAVETAS"
      },
      {
        "code": "006311",
        "name": "MODELIA"
      },
      {
        "code": "006312",
        "name": "MODELIA OCCIDENTAL"
      },
      {
        "code": "006307",
        "name": "MONTEVIDEO"
      },
      {
        "code": "006519",
        "name": "MORAVIA"
      },
      {
        "code": "005673",
        "name": "PUEBLO VIEJO"
      },
      {
        "code": "006418",
        "name": "PUENTE GRANDE"
      },
      {
        "code": "006404",
        "name": "PUERTA DE TEJA"
      },
      {
        "code": "006521",
        "name": "SABANA GRANDE"
      },
      {
        "code": "105342",
        "name": "SABANA GRANDE RURAL"
      },
      {
        "code": "006313",
        "name": "SALITRE OCCIDENTAL"
      },
      {
        "code": "006403",
        "name": "SAN JOSE DE FONTIBON"
      },
      {
        "code": "006413",
        "name": "SAN PABLO JERICO"
      },
      {
        "code": "105103",
        "name": "SAN PEDRO"
      },
      {
        "code": "006523",
        "name": "SAN PEDRO DE LOS ROBLES"
      },
      {
        "code": "006301",
        "name": "SANTA CECILIA"
      },
      {
        "code": "006319",
        "name": "TERMINAL DE TRANSPORTES"
      },
      {
        "code": "006401",
        "name": "VERSALLES FONTIBON"
      },
      {
        "code": "006417",
        "name": "VILLA CARMENZA"
      },
      {
        "code": "006406",
        "name": "VILLEMAR"
      },
      {
        "code": "006520",
        "name": "ZONA FRANCA"
      }
    ]
  },
  {
    "locality": "KENNEDY",
    "neighborhoods": [
      {
        "code": "004543",
        "name": "ALQUERIA LA FRAGUA"
      },
      {
        "code": "004596",
        "name": "ALQUERIA LA FRAGUA II"
      },
      {
        "code": "004542",
        "name": "ALQUERIA LA FRAGUA NORTE"
      },
      {
        "code": "006504",
        "name": "BAVARIA"
      },
      {
        "code": "004516",
        "name": "BOITA"
      },
      {
        "code": "004601",
        "name": "CALANDAIMA"
      },
      {
        "code": "004558",
        "name": "CAMPO HERMOSO"
      },
      {
        "code": "004576",
        "name": "CASA BLANCA SUR"
      },
      {
        "code": "004537",
        "name": "CASABLANCA"
      },
      {
        "code": "006506",
        "name": "CASTILLA"
      },
      {
        "code": "004545",
        "name": "CATALINA"
      },
      {
        "code": "004540",
        "name": "CATALINA II"
      },
      {
        "code": "004529",
        "name": "CEMENTERIO JARDINES APOGEO"
      },
      {
        "code": "004621",
        "name": "CHUCUA DE LA VACA I"
      },
      {
        "code": "004620",
        "name": "CHUCUA DE LA VACA II"
      },
      {
        "code": "004619",
        "name": "CHUCUA DE LA VACA III"
      },
      {
        "code": "004607",
        "name": "CIUDAD DE CALI"
      },
      {
        "code": "004509",
        "name": "CIUDAD KENNEDY"
      },
      {
        "code": "004511",
        "name": "CIUDAD KENNEDY CENTRAL"
      },
      {
        "code": "004514",
        "name": "CIUDAD KENNEDY NORTE"
      },
      {
        "code": "004508",
        "name": "CIUDAD KENNEDY OCCIDENTAL"
      },
      {
        "code": "004510",
        "name": "CIUDAD KENNEDY ORIENTAL"
      },
      {
        "code": "004507",
        "name": "CIUDAD KENNEDY SUR"
      },
      {
        "code": "006531",
        "name": "CIUDAD TECHO II"
      },
      {
        "code": "004535",
        "name": "CLASS"
      },
      {
        "code": "006501",
        "name": "COOPERATIVA DE SUB-OFICIALES"
      },
      {
        "code": "004547",
        "name": "CORABASTOS"
      },
      {
        "code": "004572",
        "name": "CORREDOR FERREO DEL SUR"
      },
      {
        "code": "004612",
        "name": "DINDALITO"
      },
      {
        "code": "004614",
        "name": "DINDALITO"
      },
      {
        "code": "004618",
        "name": "DINTALITO"
      },
      {
        "code": "004559",
        "name": "EL CARMELO"
      },
      {
        "code": "004611",
        "name": "EL JAZMIN"
      },
      {
        "code": "205209",
        "name": "EL JAZMIN"
      },
      {
        "code": "004603",
        "name": "EL PARAISO"
      },
      {
        "code": "004541",
        "name": "EL PARAISO BOSA"
      },
      {
        "code": "004536",
        "name": "EL RUBI"
      },
      {
        "code": "006533",
        "name": "EL TINTAL III"
      },
      {
        "code": "006534",
        "name": "EL TINTAL IV"
      },
      {
        "code": "006528",
        "name": "EL VERGEL"
      },
      {
        "code": "006529",
        "name": "EL VERGEL ORIENTAL"
      },
      {
        "code": "004627",
        "name": "GALAN"
      },
      {
        "code": "205221",
        "name": "GALAN RURAL"
      },
      {
        "code": "004557",
        "name": "GRAN BRITALIA"
      },
      {
        "code": "004556",
        "name": "GRAN BRITALIA I"
      },
      {
        "code": "004501",
        "name": "HIPOTECHO"
      },
      {
        "code": "004502",
        "name": "HIPOTECHO OCCIDENTAL"
      },
      {
        "code": "004551",
        "name": "HIPOTECHO SUR"
      },
      {
        "code": "004517",
        "name": "JACQUELINE"
      },
      {
        "code": "004506",
        "name": "LA CAMPINA"
      },
      {
        "code": "004532",
        "name": "LA CECILIA"
      },
      {
        "code": "006524",
        "name": "LA MAGDALENA"
      },
      {
        "code": "205109",
        "name": "LA MAGDALENA I"
      },
      {
        "code": "105106",
        "name": "LA MAGDALENA RURAL"
      },
      {
        "code": "006511",
        "name": "LA PAMPA"
      },
      {
        "code": "004520",
        "name": "LA PAZ BOSA"
      },
      {
        "code": "004626",
        "name": "LAS ACACIAS"
      },
      {
        "code": "205225",
        "name": "LAS ACACIAS RURAL"
      },
      {
        "code": "004544",
        "name": "LAS DELICIAS"
      },
      {
        "code": "006508",
        "name": "LAS DOS AVENIDAS"
      },
      {
        "code": "004316",
        "name": "LAS MARGARITAS"
      },
      {
        "code": "004562",
        "name": "LLANO GRANDE"
      },
      {
        "code": "004609",
        "name": "LOS ALMENDROS"
      },
      {
        "code": "006509",
        "name": "LUSITANIA"
      },
      {
        "code": "004531",
        "name": "MANDALAY"
      },
      {
        "code": "006517",
        "name": "MARIA PAZ"
      },
      {
        "code": "006502",
        "name": "MARSELLA"
      },
      {
        "code": "004549",
        "name": "NUEVA YORK"
      },
      {
        "code": "006507",
        "name": "NUEVO TECHO"
      },
      {
        "code": "205229",
        "name": "OSORIO"
      },
      {
        "code": "105203",
        "name": "OSORIO II"
      },
      {
        "code": "006518",
        "name": "OSORIO III"
      },
      {
        "code": "205227",
        "name": "OSORIO IV"
      },
      {
        "code": "004615",
        "name": "OSORIO XII"
      },
      {
        "code": "105211",
        "name": "OSORIO XII RURAL"
      },
      {
        "code": "004525",
        "name": "PASTRANA"
      },
      {
        "code": "004554",
        "name": "PATIO BONITO"
      },
      {
        "code": "004555",
        "name": "PATIO BONITO II"
      },
      {
        "code": "004566",
        "name": "PATIO BONITO III"
      },
      {
        "code": "006505",
        "name": "PIO XII"
      },
      {
        "code": "004504",
        "name": "PROVIVIENDA"
      },
      {
        "code": "004613",
        "name": "PROVIVIENDA OCCIDENTAL"
      },
      {
        "code": "004505",
        "name": "PROVIVIENDA OCCIDENTAL"
      },
      {
        "code": "004503",
        "name": "PROVIVIENDA ORIENTAL"
      },
      {
        "code": "004582",
        "name": "RENANIA URAPANES"
      },
      {
        "code": "004534",
        "name": "ROMA"
      },
      {
        "code": "004584",
        "name": "SANTA CATALINA"
      },
      {
        "code": "004560",
        "name": "SAUCEDAL"
      },
      {
        "code": "004564",
        "name": "TAIRONA"
      },
      {
        "code": "004548",
        "name": "TECHO"
      },
      {
        "code": "004512",
        "name": "TIMIZA"
      },
      {
        "code": "004518",
        "name": "TIMIZA A"
      },
      {
        "code": "004530",
        "name": "TIMIZA B"
      },
      {
        "code": "004581",
        "name": "TIMIZA C"
      },
      {
        "code": "006516",
        "name": "TINTALA"
      },
      {
        "code": "004617",
        "name": "TINTALITO"
      },
      {
        "code": "004565",
        "name": "TOCAREMA"
      },
      {
        "code": "004515",
        "name": "TUNDAMA"
      },
      {
        "code": "006515",
        "name": "VALLADOLID"
      },
      {
        "code": "205102",
        "name": "VEREDA EL TINTAL"
      },
      {
        "code": "105105",
        "name": "VEREDA EL TINTAL RURAL"
      },
      {
        "code": "205101",
        "name": "VEREDA EL TINTAL URBANO"
      },
      {
        "code": "006514",
        "name": "VERGEL OCCIDENTAL"
      },
      {
        "code": "006512",
        "name": "VILLA ALSACIA"
      },
      {
        "code": "006510",
        "name": "VILLA ALSACIA II"
      },
      {
        "code": "004578",
        "name": "VILLA NELLY III SECTOR"
      },
      {
        "code": "006503",
        "name": "VISION DE ORIENTE"
      }
    ]
  },
  {
    "locality": "LOS MARTIRES",
    "neighborhoods": [
      {
        "code": "006109",
        "name": "COLSEGUROS"
      },
      {
        "code": "004105",
        "name": "EDUARDO SANTOS"
      },
      {
        "code": "006106",
        "name": "EL LISTON"
      },
      {
        "code": "004111",
        "name": "EL PROGRESO"
      },
      {
        "code": "004106",
        "name": "EL VERGEL"
      },
      {
        "code": "004104",
        "name": "LA ESTANZUELA"
      },
      {
        "code": "006104",
        "name": "LA FAVORITA"
      },
      {
        "code": "004110",
        "name": "LA PEPITA"
      },
      {
        "code": "004102",
        "name": "LA SABANA"
      },
      {
        "code": "006107",
        "name": "PALOQUEMAO"
      },
      {
        "code": "004101",
        "name": "RICAURTE"
      },
      {
        "code": "006108",
        "name": "SAMPER MENDOZA"
      },
      {
        "code": "006105",
        "name": "SAN VICTORINO"
      },
      {
        "code": "006103",
        "name": "SANTA FE"
      },
      {
        "code": "004108",
        "name": "SANTA ISABEL"
      },
      {
        "code": "004107",
        "name": "SANTA ISABEL SUR"
      },
      {
        "code": "006110",
        "name": "USATAMA"
      },
      {
        "code": "004109",
        "name": "VERAGUAS"
      },
      {
        "code": "004103",
        "name": "VOTO NACIONAL"
      }
    ]
  },
  {
    "locality": "PUENTE ARANDA",
    "neighborhoods": [
      {
        "code": "004407",
        "name": "ALCALA"
      },
      {
        "code": "004409",
        "name": "ALQUERIA"
      },
      {
        "code": "004403",
        "name": "AUTOPISTA MUZU"
      },
      {
        "code": "004413",
        "name": "AUTOPISTA MUZU ORIENTAL"
      },
      {
        "code": "004404",
        "name": "AUTOPISTA SUR"
      },
      {
        "code": "004303",
        "name": "BARCELONA"
      },
      {
        "code": "006207",
        "name": "BATALLON CALDAS"
      },
      {
        "code": "004211",
        "name": "BOCHICA"
      },
      {
        "code": "006218",
        "name": "CENTRO INDUSTRIAL"
      },
      {
        "code": "004308",
        "name": "COLON"
      },
      {
        "code": "004202",
        "name": "COMUNEROS"
      },
      {
        "code": "006211",
        "name": "CUNDINAMARCA"
      },
      {
        "code": "006206",
        "name": "EL EJIDO"
      },
      {
        "code": "006204",
        "name": "ESTACION CENTRAL"
      },
      {
        "code": "004304",
        "name": "GALAN"
      },
      {
        "code": "004207",
        "name": "GORGONZOLA"
      },
      {
        "code": "006205",
        "name": "INDUSTRIAL CENTENARIO"
      },
      {
        "code": "004210",
        "name": "JORGE GAITAN CORTES"
      },
      {
        "code": "004203",
        "name": "LA ASUNCION"
      },
      {
        "code": "004309",
        "name": "LA CAMELIA"
      },
      {
        "code": "004317",
        "name": "LA CAMELIA II"
      },
      {
        "code": "006203",
        "name": "LA FLORIDA OCCIDENTAL"
      },
      {
        "code": "004305",
        "name": "LA PRADERA"
      },
      {
        "code": "004306",
        "name": "LA TRINIDAD"
      },
      {
        "code": "004208",
        "name": "LOS EJIDOS"
      },
      {
        "code": "004204",
        "name": "MONTES"
      },
      {
        "code": "004406",
        "name": "OSPINA PEREZ"
      },
      {
        "code": "004405",
        "name": "OSPINA PEREZ SUR"
      },
      {
        "code": "004201",
        "name": "PENSILVANIA"
      },
      {
        "code": "004205",
        "name": "PRIMAVERA OCCIDENTAL"
      },
      {
        "code": "004310",
        "name": "PROVIVIENDA NORTE"
      },
      {
        "code": "006215",
        "name": "PUENTE ARANDA"
      },
      {
        "code": "004402",
        "name": "REMANSO"
      },
      {
        "code": "004412",
        "name": "REMANSO SUR"
      },
      {
        "code": "006212",
        "name": "SALAZAR GOMEZ"
      },
      {
        "code": "004401",
        "name": "SAN EUSEBIO"
      },
      {
        "code": "004206",
        "name": "SAN FRANCISCO"
      },
      {
        "code": "004307",
        "name": "SAN GABRIEL"
      },
      {
        "code": "004302",
        "name": "SAN RAFAEL"
      },
      {
        "code": "004301",
        "name": "SAN RAFAEL INDUSTRIAL"
      },
      {
        "code": "004209",
        "name": "SANTA MATILDE"
      },
      {
        "code": "004408",
        "name": "TEJAR"
      },
      {
        "code": "004212",
        "name": "TIBANA"
      }
    ]
  },
  {
    "locality": "RAFAEL URIBE URIBE",
    "neighborhoods": [
      {
        "code": "001423",
        "name": "ARBOLEDA SUR"
      },
      {
        "code": "002637",
        "name": "ARRAYANES VI"
      },
      {
        "code": "002306",
        "name": "BRAVO PAEZ"
      },
      {
        "code": "001419",
        "name": "CALLEJON SANTA BARBARA"
      },
      {
        "code": "001434",
        "name": "CARMEN DEL SOL"
      },
      {
        "code": "002303",
        "name": "CENTENARIO"
      },
      {
        "code": "001428",
        "name": "CERROS DE ORIENTE"
      },
      {
        "code": "002308",
        "name": "CLARET"
      },
      {
        "code": "001421",
        "name": "DIANA TURBAY"
      },
      {
        "code": "001422",
        "name": "DIANA TURBAY ARRAYANES"
      },
      {
        "code": "001432",
        "name": "DIANA TURBAY CULTIVOS"
      },
      {
        "code": "001420",
        "name": "EL PLAYON"
      },
      {
        "code": "001425",
        "name": "GRANJAS DE SANTA SOFIA"
      },
      {
        "code": "001412",
        "name": "GRANJAS SAN PABLO"
      },
      {
        "code": "001429",
        "name": "GUIPARMA"
      },
      {
        "code": "001402",
        "name": "GUSTAVO RESTREPO"
      },
      {
        "code": "001403",
        "name": "HOSPITAL SAN CARLOS"
      },
      {
        "code": "002307",
        "name": "INGLES"
      },
      {
        "code": "002566",
        "name": "LA PAZ"
      },
      {
        "code": "002511",
        "name": "LA PICOTA"
      },
      {
        "code": "002510",
        "name": "LA PICOTA ORIENTAL"
      },
      {
        "code": "001413",
        "name": "LA RESURRECCION"
      },
      {
        "code": "001431",
        "name": "LA RESURRECCION I"
      },
      {
        "code": "002305",
        "name": "LIBERTADOR"
      },
      {
        "code": "001435",
        "name": "LOS ARRAYANES II"
      },
      {
        "code": "001417",
        "name": "LOS MOLINOS"
      },
      {
        "code": "001410",
        "name": "MARCO FIDEL SUAREZ"
      },
      {
        "code": "001415",
        "name": "MARCO FIDEL SUAREZ I"
      },
      {
        "code": "001418",
        "name": "MARRUECOS"
      },
      {
        "code": "001414",
        "name": "MOLINOS DEL SUR"
      },
      {
        "code": "002310",
        "name": "MURILLO TORO"
      },
      {
        "code": "002201",
        "name": "OLAYA"
      },
      {
        "code": "002535",
        "name": "PALERMO SUR"
      },
      {
        "code": "001427",
        "name": "PUERTO RICO"
      },
      {
        "code": "002202",
        "name": "QUIROGA"
      },
      {
        "code": "002203",
        "name": "QUIROGA CENTRAL"
      },
      {
        "code": "002209",
        "name": "QUIROGA I"
      },
      {
        "code": "002204",
        "name": "QUIROGA SUR"
      },
      {
        "code": "001416",
        "name": "SAN AGUSTIN"
      },
      {
        "code": "001411",
        "name": "SAN JORGE SUR"
      },
      {
        "code": "001401",
        "name": "SAN JOSE SUR"
      },
      {
        "code": "001426",
        "name": "SAN LUIS"
      },
      {
        "code": "002304",
        "name": "SANTIAGO PEREZ"
      },
      {
        "code": "001404",
        "name": "SOSIEGO SUR"
      },
      {
        "code": "002311",
        "name": "VILLA MAYOR"
      }
    ]
  },
  {
    "locality": "SAN CRISTOBAL",
    "neighborhoods": [
      {
        "code": "201304",
        "name": "AGUAS CLARAS"
      },
      {
        "code": "001119",
        "name": "AGUAS CLARAS I"
      },
      {
        "code": "001315",
        "name": "ALTAMIRA"
      },
      {
        "code": "001333",
        "name": "ALTOS DEL POBLADO"
      },
      {
        "code": "001342",
        "name": "ALTOS DEL ZIPA"
      },
      {
        "code": "001331",
        "name": "ALTOS DEL ZUQUE"
      },
      {
        "code": "001362",
        "name": "ARBOLEDA SANTA TERESITA"
      },
      {
        "code": "001305",
        "name": "ATENAS"
      },
      {
        "code": "001424",
        "name": "BARCELONA SUR"
      },
      {
        "code": "001313",
        "name": "BELLAVISTA SUR"
      },
      {
        "code": "001304",
        "name": "BELLO HORIZONTE"
      },
      {
        "code": "001339",
        "name": "BOSQUE DE LOS ALPES"
      },
      {
        "code": "001102",
        "name": "BUENOS AIRES"
      },
      {
        "code": "001210",
        "name": "CALVO SUR"
      },
      {
        "code": "001330",
        "name": "CANADA O GUIRA"
      },
      {
        "code": "101308",
        "name": "CHIGUAZA RURAL"
      },
      {
        "code": "001358",
        "name": "CHIGUAZA URBANO"
      },
      {
        "code": "001346",
        "name": "CIUDAD LONDRES I"
      },
      {
        "code": "101407",
        "name": "CIUDAD LONDRES I RURAL"
      },
      {
        "code": "001363",
        "name": "COLMENA I LOS PINARES"
      },
      {
        "code": "001303",
        "name": "CORDOBA"
      },
      {
        "code": "001329",
        "name": "EL PARAISO"
      },
      {
        "code": "001324",
        "name": "EL PINAR"
      },
      {
        "code": "201302",
        "name": "EL TRIANGULO"
      },
      {
        "code": "001121",
        "name": "EL TRIANGULO I"
      },
      {
        "code": "201318",
        "name": "EL TRIANGULO II"
      },
      {
        "code": "001301",
        "name": "GRANADA SUR"
      },
      {
        "code": "101301",
        "name": "HOYA SAN CRISTOBAL"
      },
      {
        "code": "001325",
        "name": "JUAN REY (LA PAZ)"
      },
      {
        "code": "101309",
        "name": "LA ARBOLEDA RURAL"
      },
      {
        "code": "001338",
        "name": "LA BELLEZA"
      },
      {
        "code": "001311",
        "name": "LA GLORIA OCCIDENTAL"
      },
      {
        "code": "001319",
        "name": "LA GLORIA ORIENTAL"
      },
      {
        "code": "001109",
        "name": "LA MARIA"
      },
      {
        "code": "001310",
        "name": "LA VICTORIA"
      },
      {
        "code": "001101",
        "name": "LAS BRISAS"
      },
      {
        "code": "001334",
        "name": "LAS GAVIOTAS"
      },
      {
        "code": "001355",
        "name": "LAS GUACAMAYAS I"
      },
      {
        "code": "001352",
        "name": "LAS GUACAMAYAS II"
      },
      {
        "code": "001354",
        "name": "LAS GUACAMAYAS III"
      },
      {
        "code": "001353",
        "name": "LAS GUACAMAYAS IV"
      },
      {
        "code": "001409",
        "name": "LAS LOMAS"
      },
      {
        "code": "001107",
        "name": "LAS MERCEDES"
      },
      {
        "code": "001312",
        "name": "LOS ALPES"
      },
      {
        "code": "001118",
        "name": "LOS LAURELES SUR ORIENTAL I"
      },
      {
        "code": "001327",
        "name": "LOS LIBERTADORES"
      },
      {
        "code": "001209",
        "name": "MODELO SUR"
      },
      {
        "code": "101302",
        "name": "MOLINO RURAL"
      },
      {
        "code": "001104",
        "name": "MOLINOS DE ORIENTE"
      },
      {
        "code": "001115",
        "name": "MONTE CARLO"
      },
      {
        "code": "001302",
        "name": "MONTEBELLO"
      },
      {
        "code": "001316",
        "name": "MORALBA"
      },
      {
        "code": "001207",
        "name": "NARINO SUR"
      },
      {
        "code": "001323",
        "name": "NUEVA DELHI"
      },
      {
        "code": "001320",
        "name": "NUEVA GLORIA"
      },
      {
        "code": "001112",
        "name": "PRIMERO DE MAYO"
      },
      {
        "code": "001317",
        "name": "PUENTE COLORADO"
      },
      {
        "code": "001318",
        "name": "QUINDIO"
      },
      {
        "code": "001206",
        "name": "QUINTA RAMOS"
      },
      {
        "code": "001307",
        "name": "RAMAJAL"
      },
      {
        "code": "001106",
        "name": "SAN BLAS"
      },
      {
        "code": "001113",
        "name": "SAN BLAS II"
      },
      {
        "code": "001108",
        "name": "SAN CRISTOBAL SUR"
      },
      {
        "code": "001406",
        "name": "SAN ISIDRO"
      },
      {
        "code": "001110",
        "name": "SAN JAVIER"
      },
      {
        "code": "001314",
        "name": "SAN JOSE SUR ORIENTAL"
      },
      {
        "code": "001321",
        "name": "SAN MARTIN SUR"
      },
      {
        "code": "001306",
        "name": "SAN PEDRO"
      },
      {
        "code": "001322",
        "name": "SAN RAFAEL USME"
      },
      {
        "code": "101408",
        "name": "SAN RAFAEL USME RURAL I"
      },
      {
        "code": "001309",
        "name": "SAN VICENTE"
      },
      {
        "code": "001111",
        "name": "SANTA ANA SUR"
      },
      {
        "code": "001308",
        "name": "SANTA INES SUR"
      },
      {
        "code": "001357",
        "name": "SANTA INES SUR II"
      },
      {
        "code": "001328",
        "name": "SANTA RITA SUR ORIENTAL"
      },
      {
        "code": "001205",
        "name": "SOCIEGO"
      },
      {
        "code": "001407",
        "name": "SURAMERICA"
      },
      {
        "code": "101306",
        "name": "TIBAQUE"
      },
      {
        "code": "201306",
        "name": "TIBAQUE I"
      },
      {
        "code": "201317",
        "name": "TIBAQUE III"
      },
      {
        "code": "001116",
        "name": "TIBAQUE URBANO"
      },
      {
        "code": "001405",
        "name": "VEINTE DE JULIO"
      },
      {
        "code": "001114",
        "name": "VELODROMO"
      },
      {
        "code": "001408",
        "name": "VILLA DE LOS ALPES"
      },
      {
        "code": "001430",
        "name": "VILLA DE LOS ALPES I"
      },
      {
        "code": "001356",
        "name": "VILLA DEL CERRO"
      },
      {
        "code": "001332",
        "name": "VILLABEL"
      },
      {
        "code": "001103",
        "name": "VITELMA"
      },
      {
        "code": "001350",
        "name": "YOMASA"
      }
    ]
  },
  {
    "locality": "SANTA FE",
    "neighborhoods": [
      {
        "code": "008106",
        "name": "BOSQUE IZQUIERDO"
      },
      {
        "code": "003209",
        "name": "EL DORADO"
      },
      {
        "code": "003205",
        "name": "EL GUAVIO"
      },
      {
        "code": "003208",
        "name": "EL ROCIO"
      },
      {
        "code": "003211",
        "name": "GIRARDOT"
      },
      {
        "code": "003101",
        "name": "LA ALAMEDA"
      },
      {
        "code": "003108",
        "name": "LA CAPUCHINA"
      },
      {
        "code": "008105",
        "name": "LA MACARENA"
      },
      {
        "code": "008103",
        "name": "LA MERCED"
      },
      {
        "code": "003206",
        "name": "LA PENA"
      },
      {
        "code": "003221",
        "name": "LA PEÑA I"
      },
      {
        "code": "201404",
        "name": "LA PEÑA RURAL"
      },
      {
        "code": "008104",
        "name": "LA PERSEVERANCIA"
      },
      {
        "code": "201408",
        "name": "LA PERSEVERANCIA I"
      },
      {
        "code": "003202",
        "name": "LAS CRUCES"
      },
      {
        "code": "003102",
        "name": "LAS NIEVES"
      },
      {
        "code": "003207",
        "name": "LOS LACHES"
      },
      {
        "code": "003212",
        "name": "LOURDES"
      },
      {
        "code": "008102",
        "name": "PARQUE NACIONAL"
      },
      {
        "code": "101405",
        "name": "PARQUE NACIONAL ORIENTAL"
      },
      {
        "code": "003210",
        "name": "RAMIREZ"
      },
      {
        "code": "008101",
        "name": "SAGRADO CORAZON"
      },
      {
        "code": "008108",
        "name": "SAMPER"
      },
      {
        "code": "003201",
        "name": "SAN BERNARDO"
      },
      {
        "code": "008107",
        "name": "SAN DIEGO"
      },
      {
        "code": "008109",
        "name": "SAN MARTIN"
      },
      {
        "code": "003107",
        "name": "SANTA INES"
      },
      {
        "code": "003109",
        "name": "VERACRUZ"
      }
    ]
  },
  {
    "locality": "SUBA",
    "neighborhoods": [
      {
        "code": "009255",
        "name": "SANTA RITA DE SUBA"
      },
      {
        "code": "009218",
        "name": "ALMIRANTE COLON"
      },
      {
        "code": "009222",
        "name": "ALTOS DE CHOZICA"
      },
      {
        "code": "009260",
        "name": "ALTOS DE SUBA"
      },
      {
        "code": "009127",
        "name": "ANDES NORTE"
      },
      {
        "code": "009119",
        "name": "ATENAS"
      },
      {
        "code": "009205",
        "name": "AURES"
      },
      {
        "code": "009206",
        "name": "AURES II"
      },
      {
        "code": "107109",
        "name": "BARAJAS NORTE"
      },
      {
        "code": "009118",
        "name": "BATAN"
      },
      {
        "code": "009259",
        "name": "BERLIN"
      },
      {
        "code": "009252",
        "name": "BILBAO"
      },
      {
        "code": "107904",
        "name": "BILBAO RURAL"
      },
      {
        "code": "009241",
        "name": "BOSQUES DE SAN JORGE"
      },
      {
        "code": "009102",
        "name": "BRITALIA"
      },
      {
        "code": "009219",
        "name": "CAMPANELLA"
      },
      {
        "code": "009130",
        "name": "CANODROMO"
      },
      {
        "code": "009103",
        "name": "CANTAGALLO"
      },
      {
        "code": "009258",
        "name": "CASA BLANCA SUBA I"
      },
      {
        "code": "207112",
        "name": "CASA BLANCA SUBA III"
      },
      {
        "code": "009215",
        "name": "CASABLANCA SUBA"
      },
      {
        "code": "107102",
        "name": "CASABLANCA SUBA"
      },
      {
        "code": "107110",
        "name": "CASABLANCA SUBA I"
      },
      {
        "code": "107111",
        "name": "CASABLANCA SUBA II"
      },
      {
        "code": "207110",
        "name": "CASABLANCA SUBA OTOÑO"
      },
      {
        "code": "009136",
        "name": "CASABLANCA SUBA URBANO"
      },
      {
        "code": "009138",
        "name": "CASABLANCA SUBA URBANO I"
      },
      {
        "code": "009139",
        "name": "CASABLANCA SUBA URBANO II"
      },
      {
        "code": "237106",
        "name": "CHORILLOS"
      },
      {
        "code": "009235",
        "name": "CIUDAD HUNZA"
      },
      {
        "code": "009108",
        "name": "CIUDAD JARDIN NORTE"
      },
      {
        "code": "009121",
        "name": "CLUB DE LOS LAGARTOS"
      },
      {
        "code": "009142",
        "name": "CONEJERA"
      },
      {
        "code": "009208",
        "name": "COSTA AZUL"
      },
      {
        "code": "009246",
        "name": "DELMONTE"
      },
      {
        "code": "207111",
        "name": "EL OTOÑO"
      },
      {
        "code": "009144",
        "name": "EL OTOÑO I"
      },
      {
        "code": "009213",
        "name": "EL PINO"
      },
      {
        "code": "009128",
        "name": "EL PLAN"
      },
      {
        "code": "009211",
        "name": "EL POA"
      },
      {
        "code": "009202",
        "name": "EL RINCON"
      },
      {
        "code": "009204",
        "name": "EL RINCON NORTE"
      },
      {
        "code": "009132",
        "name": "ESCUELA DE CARABINEROS"
      },
      {
        "code": "009126",
        "name": "ESTORIL"
      },
      {
        "code": "009114",
        "name": "GILMAR"
      },
      {
        "code": "009101",
        "name": "GRANADA NORTE"
      },
      {
        "code": "107101",
        "name": "GUAYMARAL"
      },
      {
        "code": "009115",
        "name": "IBERIA"
      },
      {
        "code": "009247",
        "name": "IRAGUA"
      },
      {
        "code": "005403",
        "name": "JULIO FLOREZ"
      },
      {
        "code": "009141",
        "name": "LA CANDELARIA"
      },
      {
        "code": "009236",
        "name": "LA CAROLINA DE SUBA"
      },
      {
        "code": "009221",
        "name": "LA CHUCUA"
      },
      {
        "code": "009216",
        "name": "LA GAITANA"
      },
      {
        "code": "009262",
        "name": "LA GAITANA ORIENTAL"
      },
      {
        "code": "107112",
        "name": "LA LOMITA"
      },
      {
        "code": "009220",
        "name": "LAGO DE SUBA"
      },
      {
        "code": "009210",
        "name": "LAS FLORES"
      },
      {
        "code": "009243",
        "name": "LAS MERCEDES I"
      },
      {
        "code": "009239",
        "name": "LAS MERCEDES SUBA"
      },
      {
        "code": "107107",
        "name": "LAS MERCEDES SUBA RURAL"
      },
      {
        "code": "009122",
        "name": "LAS VILLAS"
      },
      {
        "code": "009227",
        "name": "LECH WALESA"
      },
      {
        "code": "009254",
        "name": "LISBOA"
      },
      {
        "code": "009228",
        "name": "LOMBARDIA"
      },
      {
        "code": "009201",
        "name": "LOS NARANJOS"
      },
      {
        "code": "009110",
        "name": "MAZUREN"
      },
      {
        "code": "009133",
        "name": "MIRANDELA"
      },
      {
        "code": "009111",
        "name": "MONACO"
      },
      {
        "code": "009123",
        "name": "NIZA NORTE"
      },
      {
        "code": "009112",
        "name": "NIZA SUBA"
      },
      {
        "code": "009109",
        "name": "NIZA SUR"
      },
      {
        "code": "009140",
        "name": "NUESTRA SENORA DEL ROSARIO"
      },
      {
        "code": "009224",
        "name": "NUEVA TIBABUYES"
      },
      {
        "code": "009120",
        "name": "NUEVA ZELANDIA"
      },
      {
        "code": "009125",
        "name": "PASADENA"
      },
      {
        "code": "009245",
        "name": "PINOS DE LOMBARDIA"
      },
      {
        "code": "009135",
        "name": "PORTALES DEL NORTE"
      },
      {
        "code": "005401",
        "name": "POTOSI"
      },
      {
        "code": "009240",
        "name": "POTRERILLO"
      },
      {
        "code": "009105",
        "name": "PRADO PINZON"
      },
      {
        "code": "009107",
        "name": "PRADO VERANIEGO"
      },
      {
        "code": "009116",
        "name": "PRADO VERANIEGO NORTE"
      },
      {
        "code": "009117",
        "name": "PRADO VERANIEGO SUR"
      },
      {
        "code": "009124",
        "name": "PUENTE LARGO"
      },
      {
        "code": "009203",
        "name": "PUERTA DEL SOL"
      },
      {
        "code": "009266",
        "name": "RINCON ALTAMAR"
      },
      {
        "code": "009217",
        "name": "RINCON DE SANTA INES"
      },
      {
        "code": "009237",
        "name": "RINCON DE SUBA"
      },
      {
        "code": "009232",
        "name": "SABANA DE TIBABUYES"
      },
      {
        "code": "009234",
        "name": "SABANA DE TIBABUYES NORTE"
      },
      {
        "code": "009226",
        "name": "SALITRE SUBA"
      },
      {
        "code": "009251",
        "name": "SAN CARLOS DE SUBA"
      },
      {
        "code": "009230",
        "name": "SAN CAYETANO"
      },
      {
        "code": "009113",
        "name": "SAN JOSE DE BAVARIA"
      },
      {
        "code": "009106",
        "name": "SAN JOSE DEL PRADO"
      },
      {
        "code": "009134",
        "name": "SAN JOSE V SECTOR"
      },
      {
        "code": "009253",
        "name": "SAN PEDRO"
      },
      {
        "code": "107114",
        "name": "SAN PEDRO RURAL"
      },
      {
        "code": "009256",
        "name": "SANTA CECILIA"
      },
      {
        "code": "009268",
        "name": "SANTA CECILIA DE SUBA I"
      },
      {
        "code": "107113",
        "name": "SANTA CECILIA DE SUBA I RURAL"
      },
      {
        "code": "207801",
        "name": "SANTA CECILIA DE SUBA II"
      },
      {
        "code": "009131",
        "name": "SANTA HELENA"
      },
      {
        "code": "005402",
        "name": "SANTA ROSA"
      },
      {
        "code": "009238",
        "name": "SANTA TERESA DE SUBA"
      },
      {
        "code": "009231",
        "name": "SUBA CERROS"
      },
      {
        "code": "009212",
        "name": "SUBA URBANO"
      },
      {
        "code": "009257",
        "name": "TIBABUYES"
      },
      {
        "code": "009233",
        "name": "TIBABUYES"
      },
      {
        "code": "009248",
        "name": "TIBABUYES II"
      },
      {
        "code": "107906",
        "name": "TIBABUYES II RURAL"
      },
      {
        "code": "009250",
        "name": "TIBABUYES OCCIDENTAL"
      },
      {
        "code": "009225",
        "name": "TIBABUYES UNIVERSAL"
      },
      {
        "code": "009229",
        "name": "TOSCANA"
      },
      {
        "code": "009223",
        "name": "TTES DE COLOMBIA"
      },
      {
        "code": "009261",
        "name": "TUNA"
      },
      {
        "code": "009214",
        "name": "TUNA ALTA"
      },
      {
        "code": "009242",
        "name": "TUNA BAJA"
      },
      {
        "code": "107106",
        "name": "TUNA RURAL"
      },
      {
        "code": "009265",
        "name": "VEREDA SUBA CERROS II"
      },
      {
        "code": "009249",
        "name": "VEREDA SUBA NARANJOS"
      },
      {
        "code": "009104",
        "name": "VICTORIA NORTE"
      },
      {
        "code": "009263",
        "name": "VILLA ALCAZAR"
      },
      {
        "code": "009129",
        "name": "VILLA DEL PRADO"
      },
      {
        "code": "009207",
        "name": "VILLA ELISA"
      },
      {
        "code": "009244",
        "name": "VILLA HERMOSA"
      },
      {
        "code": "009209",
        "name": "VILLA MARIA"
      },
      {
        "code": "009267",
        "name": "VILLA MARIA I"
      }
    ]
  },
  {
    "locality": "SUMAPAZ",
    "neighborhoods": [
      {
        "code": "233201",
        "name": "BETANIA"
      },
      {
        "code": "103201",
        "name": "BETANIA"
      },
      {
        "code": "109112",
        "name": "CAPITOLIO"
      },
      {
        "code": "109107",
        "name": "CHORRERAS"
      },
      {
        "code": "109110",
        "name": "CONCEPCION"
      },
      {
        "code": "103202",
        "name": "EL ITSMO"
      },
      {
        "code": "103203",
        "name": "EL TABACO"
      },
      {
        "code": "109101",
        "name": "EL TOLDO"
      },
      {
        "code": "109106",
        "name": "LA UNION"
      },
      {
        "code": "239106",
        "name": "LA UNION URBANO"
      },
      {
        "code": "103204",
        "name": "LAGUNA VERDE"
      },
      {
        "code": "109113",
        "name": "LAGUNITAS"
      },
      {
        "code": "103104",
        "name": "LAS ANIMAS"
      },
      {
        "code": "103105",
        "name": "LAS AURAS"
      },
      {
        "code": "103107",
        "name": "LAS PALMAS"
      },
      {
        "code": "103109",
        "name": "LAS SOPAS"
      },
      {
        "code": "109103",
        "name": "LAS VEGAS"
      },
      {
        "code": "103108",
        "name": "LOS RIOS"
      },
      {
        "code": "103106",
        "name": "NAZARETH"
      },
      {
        "code": "233106",
        "name": "NAZARETH URBANO"
      },
      {
        "code": "239116",
        "name": "NUEVA GRANADA"
      },
      {
        "code": "109116",
        "name": "NUEVA GRANADA"
      },
      {
        "code": "103206",
        "name": "PENALISA"
      },
      {
        "code": "103205",
        "name": "RAIZAL"
      },
      {
        "code": "109102",
        "name": "SAN ANTONIO"
      },
      {
        "code": "109111",
        "name": "SAN JOSE"
      },
      {
        "code": "109104",
        "name": "SAN JUAN"
      },
      {
        "code": "239104",
        "name": "SAN JUAN URBANO"
      },
      {
        "code": "103101",
        "name": "SANTA ROSA ALTA"
      },
      {
        "code": "103103",
        "name": "SANTA ROSA BAJA"
      },
      {
        "code": "109105",
        "name": "SANTO DOMINGO"
      },
      {
        "code": "103102",
        "name": "TAQUECITOS"
      },
      {
        "code": "109109",
        "name": "TUNAL ALTO"
      },
      {
        "code": "109114",
        "name": "TUNAL BAJO"
      }
    ]
  },
  {
    "locality": "TEUSAQUILLO",
    "neighborhoods": [
      {
        "code": "005107",
        "name": "ACEVEDO TEJADA"
      },
      {
        "code": "007209",
        "name": "ALFONSO LOPEZ"
      },
      {
        "code": "007105",
        "name": "ARMENIA"
      },
      {
        "code": "007208",
        "name": "BANCO CENTRAL"
      },
      {
        "code": "007206",
        "name": "BELALCAZAR"
      },
      {
        "code": "007201",
        "name": "CAMPIN"
      },
      {
        "code": "005105",
        "name": "CAMPIN OCCIDENTAL"
      },
      {
        "code": "005114",
        "name": "CAMPO EUCARISTICO"
      },
      {
        "code": "005109",
        "name": "CENTRO ADMINISTRATIVO OCC."
      },
      {
        "code": "006210",
        "name": "CENTRO NARINO"
      },
      {
        "code": "007203",
        "name": "CHAPINERO OCCIDENTAL"
      },
      {
        "code": "006216",
        "name": "CIUDAD SALITRE NOR-ORIENTAL"
      },
      {
        "code": "006217",
        "name": "CIUDAD SALITRE SUR-ORIENTAL"
      },
      {
        "code": "005108",
        "name": "CIUDAD UNIVERSITARIA"
      },
      {
        "code": "006201",
        "name": "EL RECUERDO"
      },
      {
        "code": "005110",
        "name": "EL SALITRE"
      },
      {
        "code": "007106",
        "name": "ESTRELLA"
      },
      {
        "code": "006101",
        "name": "FLORIDA"
      },
      {
        "code": "007207",
        "name": "GALERIAS"
      },
      {
        "code": "006202",
        "name": "GRAN AMERICA"
      },
      {
        "code": "005111",
        "name": "LA ESMERALDA"
      },
      {
        "code": "007103",
        "name": "LA MAGDALENA"
      },
      {
        "code": "007101",
        "name": "LA SOLEDAD"
      },
      {
        "code": "007107",
        "name": "LAS AMERICAS"
      },
      {
        "code": "005106",
        "name": "NICOLAS DE FEDERMAN"
      },
      {
        "code": "006208",
        "name": "ORTEZAL"
      },
      {
        "code": "005116",
        "name": "PABLO VI NORTE"
      },
      {
        "code": "007205",
        "name": "PALERMO"
      },
      {
        "code": "005113",
        "name": "PAULO VI"
      },
      {
        "code": "007204",
        "name": "QUESADA"
      },
      {
        "code": "006209",
        "name": "QUINTA PAREDES"
      },
      {
        "code": "005117",
        "name": "RAFAEL NUNEZ"
      },
      {
        "code": "007202",
        "name": "SAN LUIS"
      },
      {
        "code": "007102",
        "name": "SANTA TERESITA"
      },
      {
        "code": "007104",
        "name": "TEUSAQUILLO"
      }
    ]
  },
  {
    "locality": "TUNJUELITO",
    "neighborhoods": [
      {
        "code": "002507",
        "name": "ABRAHAM LINCOLN"
      },
      {
        "code": "002432",
        "name": "ARBORIZADORA BAJA"
      },
      {
        "code": "002512",
        "name": "AREA ARTILLERIA"
      },
      {
        "code": "002407",
        "name": "EL CARMEN"
      },
      {
        "code": "002405",
        "name": "ESCUELA GENERAL SANTANDER"
      },
      {
        "code": "002408",
        "name": "FATIMA"
      },
      {
        "code": "002411",
        "name": "ISLA DEL SOL"
      },
      {
        "code": "002413",
        "name": "MUZU"
      },
      {
        "code": "002409",
        "name": "NUEVO MUZU"
      },
      {
        "code": "002410",
        "name": "PARQUE EL TUNAL"
      },
      {
        "code": "002406",
        "name": "SAMORE"
      },
      {
        "code": "002509",
        "name": "SAN BENITO"
      },
      {
        "code": "002501",
        "name": "SAN CARLOS"
      },
      {
        "code": "002402",
        "name": "SAN VICENTE FERRER"
      },
      {
        "code": "002205",
        "name": "SANTA LUCIA"
      },
      {
        "code": "002401",
        "name": "TUNAL ORIENTAL"
      },
      {
        "code": "002508",
        "name": "TUNJUELITO"
      },
      {
        "code": "002404",
        "name": "VENECIA"
      },
      {
        "code": "002403",
        "name": "VENECIA OCCIDENTAL"
      }
    ]
  },
  {
    "locality": "USAQUEN",
    "neighborhoods": [
      {
        "code": "008510",
        "name": "ACACIAS USAQUEN"
      },
      {
        "code": "238111",
        "name": "ALTOS DE SERREZUELA"
      },
      {
        "code": "008507",
        "name": "BARRANCAS"
      },
      {
        "code": "008506",
        "name": "BARRANCAS NORTE"
      },
      {
        "code": "008551",
        "name": "BARRANCAS ORIENTAL I"
      },
      {
        "code": "108103",
        "name": "BARRANCAS ORIENTAL RURAL"
      },
      {
        "code": "008404",
        "name": "BELLA SUIZA"
      },
      {
        "code": "008520",
        "name": "BOSQUE DE PINOS"
      },
      {
        "code": "008536",
        "name": "BOSQUE DE PINOS I"
      },
      {
        "code": "008538",
        "name": "BOSQUE DE PINOS III"
      },
      {
        "code": "108113",
        "name": "BOSQUE DE PINOS III RURAL"
      },
      {
        "code": "008535",
        "name": "BUENAVISTA"
      },
      {
        "code": "008544",
        "name": "CANAIMA"
      },
      {
        "code": "008518",
        "name": "CAOBOS SALAZAR"
      },
      {
        "code": "008512",
        "name": "CEDRITOS"
      },
      {
        "code": "008511",
        "name": "CEDRO NARVAEZ"
      },
      {
        "code": "008508",
        "name": "CEDRO SALAZAR"
      },
      {
        "code": "008402",
        "name": "COUNTRY CLUB"
      },
      {
        "code": "008527",
        "name": "EL CEREZO"
      },
      {
        "code": "008514",
        "name": "EL CONTADOR"
      },
      {
        "code": "008532",
        "name": "EL REDIL"
      },
      {
        "code": "008522",
        "name": "EL ROCIO NORTE"
      },
      {
        "code": "008501",
        "name": "EL TOBERIN"
      },
      {
        "code": "008526",
        "name": "EL VERVENAL"
      },
      {
        "code": "008409",
        "name": "ESCUELA DE CABALLERIA I"
      },
      {
        "code": "008419",
        "name": "ESCUELA DE CABALLERIA II"
      },
      {
        "code": "008410",
        "name": "ESCUELA DE INFANTERIA"
      },
      {
        "code": "008519",
        "name": "ESTRELLA DEL NORTE"
      },
      {
        "code": "008405",
        "name": "GINEBRA"
      },
      {
        "code": "008425",
        "name": "GINEBRA II"
      },
      {
        "code": "008533",
        "name": "HORIZONTES NORTE"
      },
      {
        "code": "008401",
        "name": "LA CALLEJA"
      },
      {
        "code": "008403",
        "name": "LA CAROLINA"
      },
      {
        "code": "008504",
        "name": "LA CITA"
      },
      {
        "code": "208203",
        "name": "LA ESTRELLITA"
      },
      {
        "code": "008540",
        "name": "LA ESTRELLITA I"
      },
      {
        "code": "008549",
        "name": "LA ESTRELLITA I"
      },
      {
        "code": "008547",
        "name": "LA ESTRELLITA III"
      },
      {
        "code": "008524",
        "name": "LA GRANJA NORTE"
      },
      {
        "code": "008517",
        "name": "LA LIBERIA"
      },
      {
        "code": "008502",
        "name": "LA PRADERA NORTE"
      },
      {
        "code": "008525",
        "name": "LA URIBE"
      },
      {
        "code": "208129",
        "name": "LAS DELICIAS DEL CARMEN II SECTOR"
      },
      {
        "code": "008530",
        "name": "LAS MARGARITAS"
      },
      {
        "code": "008516",
        "name": "LAS ORQUIDEAS"
      },
      {
        "code": "008513",
        "name": "LISBOA"
      },
      {
        "code": "008515",
        "name": "LOS CEDROS"
      },
      {
        "code": "008509",
        "name": "LOS CEDROS ORIENTAL"
      },
      {
        "code": "008545",
        "name": "MIRADOR DEL NORTE"
      },
      {
        "code": "008416",
        "name": "MOLINOS NORTE"
      },
      {
        "code": "108104",
        "name": "PARAMO"
      },
      {
        "code": "108112",
        "name": "PARAMO II RURAL"
      },
      {
        "code": "108114",
        "name": "PARAMO III RURAL"
      },
      {
        "code": "208127",
        "name": "PARAMO RURAL V"
      },
      {
        "code": "008420",
        "name": "PARAMO URBANO I"
      },
      {
        "code": "008411",
        "name": "RINCON DEL CHICO"
      },
      {
        "code": "008528",
        "name": "SAN ANTONIO NOROCCIDENTAL"
      },
      {
        "code": "008523",
        "name": "SAN ANTONIO NORTE"
      },
      {
        "code": "008505",
        "name": "SAN CRISTOBAL NORTE"
      },
      {
        "code": "008406",
        "name": "SAN GABRIEL NORTE"
      },
      {
        "code": "008426",
        "name": "SAN GABRIEL NORTE II"
      },
      {
        "code": "008529",
        "name": "SAN JOSE DE USAQUEN"
      },
      {
        "code": "008418",
        "name": "SAN PATRICIO"
      },
      {
        "code": "008408",
        "name": "SANTA ANA"
      },
      {
        "code": "008414",
        "name": "SANTA ANA OCCIDENTAL"
      },
      {
        "code": "008415",
        "name": "SANTA BARBARA CENTRAL"
      },
      {
        "code": "008417",
        "name": "SANTA BARBARA OCCIDENTAL"
      },
      {
        "code": "008413",
        "name": "SANTA BARBARA ORIENTAL"
      },
      {
        "code": "008412",
        "name": "SANTA BIBIANA"
      },
      {
        "code": "008543",
        "name": "SANTA CECILIA PUENTE NORTE"
      },
      {
        "code": "008503",
        "name": "SANTA TERESA"
      },
      {
        "code": "008424",
        "name": "SEGUNDO CONTADOR"
      },
      {
        "code": "008521",
        "name": "TIBABITA"
      },
      {
        "code": "208132",
        "name": "TIBABITA EL ROSARIO"
      },
      {
        "code": "008542",
        "name": "TIBABITA I"
      },
      {
        "code": "108115",
        "name": "TIBABITA II"
      },
      {
        "code": "108102",
        "name": "TIBABITA RURAL"
      },
      {
        "code": "108111",
        "name": "TIBABITA RURAL I"
      },
      {
        "code": "208130",
        "name": "TORCA"
      },
      {
        "code": "008539",
        "name": "TORCA I"
      },
      {
        "code": "208128",
        "name": "TORCA II"
      },
      {
        "code": "208131",
        "name": "TORCA III"
      },
      {
        "code": "108101",
        "name": "TORCA RURAL I"
      },
      {
        "code": "108110",
        "name": "TORCA RURAL II"
      },
      {
        "code": "008407",
        "name": "USAQUEN"
      },
      {
        "code": "008537",
        "name": "VERBENAL SAN ANTONIO"
      }
    ]
  },
  {
    "locality": "USME",
    "neighborhoods": [
      {
        "code": "002551",
        "name": "ALASKA"
      },
      {
        "code": "002571",
        "name": "ANTONIO JOSE DE SUCRE"
      },
      {
        "code": "102910",
        "name": "ARRAYAN"
      },
      {
        "code": "002601",
        "name": "ARRAYANES I"
      },
      {
        "code": "002625",
        "name": "ARRAYANES V"
      },
      {
        "code": "002525",
        "name": "BARRANQUILLITA"
      },
      {
        "code": "002605",
        "name": "BOLONIA"
      },
      {
        "code": "002626",
        "name": "BOLONIA I"
      },
      {
        "code": "202203",
        "name": "BOLONIA I"
      },
      {
        "code": "002635",
        "name": "BRISAS DEL LLANO"
      },
      {
        "code": "202602",
        "name": "CENTRO USME"
      },
      {
        "code": "202601",
        "name": "CENTRO USME"
      },
      {
        "code": "102601",
        "name": "CENTRO USME RURAL"
      },
      {
        "code": "102603",
        "name": "CENTRO USME RURAL II"
      },
      {
        "code": "002599",
        "name": "CENTRO USME URBANO"
      },
      {
        "code": "002644",
        "name": "CENTRO USME URBANO I"
      },
      {
        "code": "202603",
        "name": "CENTRO USME URBANO I"
      },
      {
        "code": "002610",
        "name": "CHAPINERITO"
      },
      {
        "code": "002611",
        "name": "CHARALA"
      },
      {
        "code": "102116",
        "name": "CHISACA"
      },
      {
        "code": "002537",
        "name": "CHUNIZA"
      },
      {
        "code": "102312",
        "name": "CIUDAD LONDRES RURAL"
      },
      {
        "code": "002543",
        "name": "COMUNEROS"
      },
      {
        "code": "102911",
        "name": "CURUBITAL"
      },
      {
        "code": "002519",
        "name": "DANUBIO"
      },
      {
        "code": "002577",
        "name": "DANUBIO II"
      },
      {
        "code": "002592",
        "name": "DESARROLLO BRAZUELOS"
      },
      {
        "code": "002556",
        "name": "DESARROLLO BRAZUELOS I"
      },
      {
        "code": "001345",
        "name": "DONA LILIANA"
      },
      {
        "code": "002550",
        "name": "DUITAMA"
      },
      {
        "code": "002609",
        "name": "EL BOSQUE"
      },
      {
        "code": "102406",
        "name": "EL BOSQUE CENTRAL"
      },
      {
        "code": "002608",
        "name": "EL BOSQUE CENTRAL I"
      },
      {
        "code": "102309",
        "name": "EL BOSQUE SUR ORIENTAL"
      },
      {
        "code": "102310",
        "name": "EL BOSQUE SUR ORIENTAL RURAL I"
      },
      {
        "code": "202309",
        "name": "EL BOSQUE SUR ORIENTAL RURAL III"
      },
      {
        "code": "002606",
        "name": "EL CURUBO"
      },
      {
        "code": "232808",
        "name": "EL DESTINO"
      },
      {
        "code": "102112",
        "name": "EL HATO"
      },
      {
        "code": "104132",
        "name": "EL MOCHUELO ORIENTAL RURAL"
      },
      {
        "code": "002631",
        "name": "EL NEVADO"
      },
      {
        "code": "002629",
        "name": "EL NEVADO II"
      },
      {
        "code": "002616",
        "name": "EL NUEVO PORTAL"
      },
      {
        "code": "002620",
        "name": "EL NUEVO PORTAL II"
      },
      {
        "code": "202506",
        "name": "EL NUEVO PORTAL II RURAL"
      },
      {
        "code": "002563",
        "name": "EL PEDREGAL"
      },
      {
        "code": "002640",
        "name": "EL PEDREGAL II"
      },
      {
        "code": "002630",
        "name": "EL PORTAL DEL DIVINO"
      },
      {
        "code": "002642",
        "name": "EL PORTAL URBANO"
      },
      {
        "code": "102110",
        "name": "EL PORVENIR DE LOS SOCHES"
      },
      {
        "code": "002613",
        "name": "EL PROGRESO USME"
      },
      {
        "code": "002617",
        "name": "EL REFUGIO I"
      },
      {
        "code": "002643",
        "name": "EL SALTEADOR"
      },
      {
        "code": "002634",
        "name": "EL TUNO"
      },
      {
        "code": "202502",
        "name": "EL UVAL"
      },
      {
        "code": "202514",
        "name": "El UVAL I"
      },
      {
        "code": "202513",
        "name": "EL UVAL II"
      },
      {
        "code": "202515",
        "name": "EL UVAL III"
      },
      {
        "code": "102502",
        "name": "EL UVAL RURAL"
      },
      {
        "code": "002548",
        "name": "EL VIRREY"
      },
      {
        "code": "002602",
        "name": "FISCALA ALTA"
      },
      {
        "code": "002506",
        "name": "GRAN YOMASA"
      },
      {
        "code": "002541",
        "name": "GRANADA SUR"
      },
      {
        "code": "001336",
        "name": "JUAN JOSE RONDON I"
      },
      {
        "code": "001347",
        "name": "JUAN REY SUR"
      },
      {
        "code": "002524",
        "name": "LA ANDREA"
      },
      {
        "code": "002503",
        "name": "LA AURORA"
      },
      {
        "code": "002527",
        "name": "LA CABANA"
      },
      {
        "code": "001348",
        "name": "LA CABANA"
      },
      {
        "code": "002612",
        "name": "LA COMUNA"
      },
      {
        "code": "002615",
        "name": "LA ESPERANZA DE USME"
      },
      {
        "code": "002607",
        "name": "LA ESPERANZA SUR"
      },
      {
        "code": "202204",
        "name": "LA ESPERANZA SUR I"
      },
      {
        "code": "002590",
        "name": "LA FISCALA"
      },
      {
        "code": "002597",
        "name": "LA FISCALA NORTE"
      },
      {
        "code": "002636",
        "name": "LA HUERTA"
      },
      {
        "code": "002529",
        "name": "LA MARICHUELA"
      },
      {
        "code": "002614",
        "name": "LA ORQUIDEA DE USME"
      },
      {
        "code": "002627",
        "name": "LA REFORMA"
      },
      {
        "code": "102808",
        "name": "LA REGADERA"
      },
      {
        "code": "002632",
        "name": "LA REQUILINA"
      },
      {
        "code": "102122",
        "name": "LA REQUILINA RURAL"
      },
      {
        "code": "102604",
        "name": "LA REQUILINA RURAL II"
      },
      {
        "code": "102913",
        "name": "LA REQUILINA RURAL III"
      },
      {
        "code": "102115",
        "name": "LA UNION"
      },
      {
        "code": "102113",
        "name": "LAS MARGARITAS"
      },
      {
        "code": "002633",
        "name": "LAS VIOLETAS"
      },
      {
        "code": "102118",
        "name": "LAS VIOLETAS RURAL"
      },
      {
        "code": "102211",
        "name": "LILIANA"
      },
      {
        "code": "102114",
        "name": "LOS ANDES"
      },
      {
        "code": "102111",
        "name": "LOS ARRAYANES"
      },
      {
        "code": "102401",
        "name": "LOS ARRAYANES"
      },
      {
        "code": "002604",
        "name": "LOS OLIVARES"
      },
      {
        "code": "001344",
        "name": "LOS SOCHES"
      },
      {
        "code": "002536",
        "name": "MONTEBLANCO"
      },
      {
        "code": "002505",
        "name": "NUEVO SAN ANDRES"
      },
      {
        "code": "102707",
        "name": "OLARTE"
      },
      {
        "code": "102405",
        "name": "PEPINITOS"
      },
      {
        "code": "202604",
        "name": "PORTAL"
      },
      {
        "code": "102506",
        "name": "PORTAL RURAL II"
      },
      {
        "code": "002589",
        "name": "PORVENIR"
      },
      {
        "code": "002618",
        "name": "PUERTA AL LLANO DE USME"
      },
      {
        "code": "002645",
        "name": "PUERTA AL LLANO I"
      },
      {
        "code": "202511",
        "name": "PUERTA AL LLANO RURAL"
      },
      {
        "code": "002572",
        "name": "SALAZAR USME"
      },
      {
        "code": "102909",
        "name": "SAN BENITO"
      },
      {
        "code": "002621",
        "name": "SAN FELIPE DE USME"
      },
      {
        "code": "202404",
        "name": "SAN FELIPE DE USME RURAL"
      },
      {
        "code": "002555",
        "name": "SAN JUAN BAUTISTA"
      },
      {
        "code": "001337",
        "name": "SAN PEDRO SUR"
      },
      {
        "code": "002526",
        "name": "SANTA LIBRADA"
      },
      {
        "code": "002528",
        "name": "SANTA LIBRADA NORTE"
      },
      {
        "code": "002542",
        "name": "SERRANIAS"
      },
      {
        "code": "002576",
        "name": "SERRANIAS I"
      },
      {
        "code": "201309",
        "name": "TIBAQUE II"
      },
      {
        "code": "102407",
        "name": "TIBAQUE SUR"
      },
      {
        "code": "001340",
        "name": "TIHUAQUE"
      },
      {
        "code": "101307",
        "name": "TIHUAQUE RURAL"
      },
      {
        "code": "202410",
        "name": "TOCAIMITA ORIENTAL"
      },
      {
        "code": "002622",
        "name": "TOCAIMITA ORIENTAL I"
      },
      {
        "code": "102412",
        "name": "TOCAIMITA SUR"
      },
      {
        "code": "002593",
        "name": "TUNJUELITO"
      },
      {
        "code": "104405",
        "name": "TUNJUELITO RURAL"
      },
      {
        "code": "002538",
        "name": "USMINIA"
      },
      {
        "code": "002619",
        "name": "VILLA ANITA"
      },
      {
        "code": "001335",
        "name": "VILLA DIANA"
      },
      {
        "code": "002594",
        "name": "VILLA ISRAEL"
      },
      {
        "code": "002586",
        "name": "YOMASA NORTE"
      },
      {
        "code": "102914",
        "name": "YOMASA NORTE RURAL"
      }
    ]
  }
];

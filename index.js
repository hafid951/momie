const express = require('express');
const { parse } = require('csv-parse');
const fs = require('fs');

const app = express();
app.use(express.json());

function readCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream('data.csv')
      .pipe(parse({ delimiter: ',', columns: true }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

app.post('/webhook', async (req, res) => {
  try {
    const { pays, produit } = req.body.queryResult.parameters;
    const data = await readCSV();
    
    const fournisseurs = data.filter(
      row => row.pays.toLowerCase() === pays.toLowerCase() && 
             row.produit.toLowerCase() === produit.toLowerCase()
    ).map(row => row.fournisseur);

    let response;
    if (fournisseurs.length > 0) {
      response = `Voici les fournisseurs de ${produit} en ${pays}: ${fournisseurs.join(', ')}.`;
    } else {
      response = `Désolé, je n'ai pas trouvé de fournisseurs de ${produit} en ${pays}.`;
    }

    res.json({
      fulfillmentText: response
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).send('Erreur interne du serveur');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Serveur momie en écoute sur le port ${port}`));
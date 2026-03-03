const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const Dados = require('./models/dados');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error(err));

app.post('/dados', async (req, res) => {
  try {
    const { luminosidade } = req.body;
    const novo = new Dados({ luminosidade });
    await novo.save();
    res.status(201).json({ message: "dados salvos" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.get('/dados', async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const { data, horaInicio, horaFim } = req.query;
    const itensPorPagina = 20;

    let filtro = {};

    if (data) {
      const [ano, mes, dia] = data.split('-').map(Number);

      let horaIni = 0;
      let minIni = 0;
      let horaF = 23;
      let minF = 59;

      if (horaInicio) {
        [horaIni, minIni] = horaInicio.split(':').map(Number);
      }

      if (horaFim) {
        [horaF, minF] = horaFim.split(':').map(Number);
      }

      // Brasil UTC-3 → converter para UTC
      const inicio = new Date(Date.UTC(ano, mes - 1, dia, horaIni + 3, minIni, 0));
      const fim = new Date(Date.UTC(ano, mes - 1, dia, horaF + 3, minF, 59));

      filtro = {
        createdAt: { $gte: inicio, $lte: fim }
      };
    }

    const dados = await Dados.find(filtro)
      .sort({ _id: -1 })
      .skip((pagina - 1) * itensPorPagina)
      .limit(itensPorPagina);

    if (dados.length === 0 && data) {
      return res.json({ mensagem: "Não há registros para este período" });
    }

    res.json(dados);

  } catch (err) {
    res.sendStatus(500);
  }
});

app.get('/dados/ultimo', async (req, res) => {
  try {
    const ultimo = await Dados.findOne().sort({ _id: -1 });
    res.json(ultimo);
  } catch {
    res.sendStatus(500);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});
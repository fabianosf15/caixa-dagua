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
      const inicio = new Date(`${data}T00:00:00.000Z`);
      const fim = new Date(`${data}T23:59:59.999Z`);

      if (horaInicio || horaFim) {
        const horaIni = horaInicio || "00:00";
        const horaF = horaFim || "23:59";

        const inicioHora = new Date(`${data}T${horaIni}:00.000Z`);
        const fimHora = new Date(`${data}T${horaF}:59.999Z`);

        filtro = {
          createdAt: { $gte: inicioHora, $lte: fimHora }
        };
      } else {
        filtro = {
          createdAt: { $gte: inicio, $lte: fim }
        };
      }
    }

    const dados = await Dados.find(filtro)
      .sort({ createdAt: -1 })
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
    const ultimo = await Dados.findOne().sort({ createdAt: -1 });
    res.json(ultimo);
  } catch {
    res.sendStatus(500);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});
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
      let inicio = horaInicio
        ? new Date(`${data}T${horaInicio}:00`)
        : new Date(`${data}T00:00:00`);

      let fim = horaFim
        ? new Date(`${data}T${horaFim}:59`)
        : new Date(`${data}T23:59:59`);

      filtro = {
        createdAt: { $gte: inicio, $lte: fim }
      };
    }

    const totalRegistros = await Dados.countDocuments(filtro);
    const totalPaginas = Math.ceil(totalRegistros / itensPorPagina);

    const dados = await Dados.find(filtro)
      .sort({ createdAt: -1 })
      .skip((pagina - 1) * itensPorPagina)
      .limit(itensPorPagina);

    res.json({
      dados,
      paginaAtual: pagina,
      totalPaginas
    });

  } catch (err) {
    console.error(err);
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
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

const bdURL = process.env.MONGO_URL;

mongoose.connect(bdURL)
  .then(() => console.log('Conectado ao banco MongoDB'))
  .catch((error) => console.error(error));

// SALVAR DADOS
app.post('/dados', async (req, res) => {
  try {
    const { luminosidade } = req.body;
    const novoDado = new Dados({ luminosidade });
    await novoDado.save();
    return res.status(201).json({ message: "dados salvos", luminosidade });
  } catch (error) {
    return res.status(500).json({ message: "erro ao salvar", erro: error.message });
  }
});

// LISTAR DADOS (20 POR PÁGINA)
app.get('/dados', async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const data = req.query.data;
    const horaInicio = req.query.horaInicio;
    const horaFim = req.query.horaFim;

    const itensPorPagina = 20; // ALTERADO PARA 20

    let filtro = {};

    if (data) {
      const inicio = new Date(data);
      const fim = new Date(data);

      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);

      if (horaInicio) {
        const [h, m] = horaInicio.split(":");
        inicio.setHours(parseInt(h), parseInt(m), 0, 0);
      }

      if (horaFim) {
        const [h, m] = horaFim.split(":");
        fim.setHours(parseInt(h), parseInt(m), 59, 999);
      }

      filtro = {
        $or: [
          { createdAt: { $gte: inicio, $lte: fim } },
          { timestamp: { $gte: inicio, $lte: fim } }
        ]
      };
    }

    const dados = await Dados.find(filtro)
      .sort({ _id: -1 })
      .skip((pagina - 1) * itensPorPagina)
      .limit(itensPorPagina);

    if (dados.length === 0 && data) {
      const primeiroRegistro = await Dados.findOne().sort({ _id: 1 });
      if (primeiroRegistro) {
        const primeiraData = new Date(primeiroRegistro.createdAt || primeiroRegistro.timestamp);
        return res.status(200).json({
          mensagem: `Registros a partir do dia ${primeiraData.toLocaleDateString('pt-BR')}`
        });
      }
    }

    return res.status(200).json(dados);

  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

// ÚLTIMO VALOR
app.get('/dados/ultimo', async (req, res) => {
  try {
    const ultimo = await Dados.findOne().sort({ _id: -1 });
    return res.status(200).json(ultimo);
  } catch {
    return res.sendStatus(500);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
});
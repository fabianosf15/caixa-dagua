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
    const itensPorPagina = 20;

    let filtro = {};

    if (data) {
      const [ano, mes, dia] = data.split('-').map(Number);

      // cria horário LOCAL correto
      const inicioLocal = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
      const fimLocal = new Date(ano, mes - 1, dia, 23, 59, 59, 999);

      // converte corretamente para UTC (Mongo salva em UTC)
      const inicioUTC = new Date(inicioLocal.getTime() - inicioLocal.getTimezoneOffset() * 60000);
      const fimUTC = new Date(fimLocal.getTime() - fimLocal.getTimezoneOffset() * 60000);

      filtro = {
        $or: [
          { createdAt: { $gte: inicioUTC, $lte: fimUTC } },
          { timestamp: { $gte: inicioUTC, $lte: fimUTC } }
        ]
      };
    }

    const dados = await Dados.find(filtro)
      .sort({ _id: -1 })
      .skip((pagina - 1) * itensPorPagina)
      .limit(itensPorPagina);

    if (dados.length === 0 && data) {
      return res.status(200).json({
        mensagem: "Não há registros para este dia"
      });
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
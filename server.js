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
    .then(() => {
        console.log('Conectado ao banco MongoDB');
    })
    .catch((error) => {
        console.error(error);
    });


// SALVAR DADOS
app.post('/dados', async (req, res) => {
    try {
        const { luminosidade } = req.body;

        const novoDado = new Dados({ luminosidade });
        await novoDado.save();

        return res.status(201).send({
            message: "dados salvos",
            luminosidade: luminosidade
        });

    } catch (error) {
        return res.status(500).send({
            message: "erro ao salvar",
            erro: error.message
        });
    }
});


// LISTAR DADOS (filtro por dia + paginação 10)
// ACEITA createdAt (novo) E timestamp (antigo)
app.get('/dados', async (req, res) => {
    try {

        const pagina = parseInt(req.query.pagina) || 1;
        const data = req.query.data;
        const itensPorPagina = 10;

        let filtro = {};

        if (data) {

            const inicio = new Date(data + "T00:00:00");
            const fim = new Date(data + "T23:59:59");

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

        return res.status(200).json(dados);

    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});


// ÚLTIMO VALOR GLOBAL (compatível com ambos)
app.get('/dados/ultimo', async (req, res) => {
    try {

        const ultimo = await Dados.findOne().sort({ _id: -1 });

        return res.status(200).json(ultimo);

    } catch (error) {
        return res.sendStatus(500);
    }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
});
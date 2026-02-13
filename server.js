const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const cors = require('cors');

const Dados = require('./models/dados');
const app = express();
const port = process.env.PORT || 3000;



app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const bdURL = process.env.MONGO_URL;

mongoose.connect(bdURL).then(
    () => {
        console.log('Conectado ao banco MongoDB')
    }).catch((error) => {
        console.error(error)
    })






app.post('/dados', async (req, res) => {
    try {
        const {luminosidade} = req.body

        const novoDado = new Dados({luminosidade});

        await novoDado.save();


     return res.status(201).send({ message: "dados salvos", luminosidade:luminosidade})

    } catch (error) {
     return res.status(500).send({message: "erro ao salvar", erro:error.message})
    }
})

app.get('/dados', async (req, res) => {

    try {
        const dados = await Dados.find();
        return res.status(200).json(dados)


    } catch (error) {
        return res.sendStatus(500);

    }

})

app.listen(port, '0.0.0.0', () => {
    console.log(`servidor rodando na porta ${port}`)

})
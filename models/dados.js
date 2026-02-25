const mongoose = require('mongoose');

const dadosSchema = new mongoose.Schema({
    luminosidade: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

const Dados = mongoose.model('Dados', dadosSchema);

module.exports = Dados;
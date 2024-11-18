const Joi = require('joi');

// Definindo as regras de validação para criação e atualização de usuário
const userSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required()
});

// Middleware para validar o corpo da requisição
const validateUser = (req, res, next) => {
    const {error} = userSchema.validate(req.body);

    if(error) {
        return res.status(400).json({error: error.details[0].message});
    }
    next();
}

module.exports = {validateUser};
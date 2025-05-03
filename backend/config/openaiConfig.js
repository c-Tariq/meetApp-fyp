// OpenAI API connection
const { OpenAI } = require("openai/index.mjs");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = openai;
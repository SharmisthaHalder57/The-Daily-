import dotenv from 'dotenv';
dotenv.config();
async function list() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await res.json();
  data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'))
    .forEach(m => console.log(m.name, m.version));
}
list();

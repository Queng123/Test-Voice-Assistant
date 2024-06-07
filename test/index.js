import { ChatOllama } from '@langchain/community/chat_models/ollama';
import {
  PromptTemplate,
} from '@langchain/core/prompts';


const commandList = [
  "1. play music",
  "2. stop music",
  "3. pause music",
  "4. resume music",
  "5. actions with  connected devices",
  "6. change volume",
  "7. to set up alarm",
  "8. give météo",
  "9. pour demander la date et l'heure",
  "10. need internet to answer",
];

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3';
const llm = new ChatOllama({
  baseUrl: OLLAMA_URL,
  model: MODEL,
  temperature: 0.1,
});

// create pre filtre using LLAMA and after analyse with GPT

const firstTemplate = PromptTemplate.fromTemplate(`
  voici la demande utilisateur: "{command}"
  résume sa demande de façon explicite.
  Réponse:
`);

const template = PromptTemplate.fromTemplate(`
voici l'analyse de la demande utilisateur: "{command}"
Identifie dans la liste suivante de quelle type de demande il s'agit: {commandList}
réponds seulement par le numéro de la commande, ou "0" si la commande n'est pas dans la liste.
si tu n'es pas sur a 100%, réponds 10, besoin d'internet.
exemple: commande "joue Bohemian Rhapsody" -> réponse "1"
Réponse:
`);
const prefilter = firstTemplate.pipe(llm);
const chain = template.pipe(llm);


async function classifyCommand(command) {
  const result = await chain.invoke({
    commandList: commandList.join(", "),
    command: command,
  });
  return result.content;
}

const command = "ou je peux acheter des dattes ?";
const data = await prefilter.invoke({ command: command });
console.log(data);
classifyCommand(data.content).then(result => {
  switch (result) {
    case "1":
      console.log("play music");
      break;
    case "2":
      console.log("stop music");
      break;
    case "3":
      console.log("pause music");
      break;
    case "4":
      console.log("resume music");
      break;
    case "5":
      console.log("connected devices");
      break;
    case "6":
      console.log("volume");
      break;
    case "7":
      console.log("alarm");
      break;
    case "8":
      console.log("météo");
      break;
    case "9":
      console.log("date and time");
      break;
    case "10":
      console.log("need internet");
      break;
    default:
      console.log("command not found");
  }
});

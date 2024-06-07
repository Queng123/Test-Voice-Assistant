import { ChatOllama } from '@langchain/community/chat_models/ollama';
import {
  PromptTemplate,
} from '@langchain/core/prompts';


const commandList = [
  "1. play music",
  "2. stop music",
  "3. pause music",
  "4. resume music",
  "5. connected devices",
  "6. volume",
  "7. alarm",
  "8. date and time",
  "9. need internet",
];

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3';
const llm = new ChatOllama({
  baseUrl: OLLAMA_URL,
  model: MODEL,
  temperature: 0.1,
});

// create pre filtre using LLAMA and after analyse with GPT

const template = PromptTemplate.fromTemplate(`
voici ma demande utilisateur: "{command}"
Identifie dans la liste suivante de quelle type de demande il s'agit: {commandList}
réponds seulement par le numéro de la commande, ou "0" si la commande n'est pas dans la liste.
exemple: commande "joue Bohemian Rhapsody" -> réponse "1"
Réponse:
`);

const chain = template.pipe(llm);


async function classifyCommand(command) {
  const result = await chain.invoke({
    commandList: commandList.join(", "),
    command: command,
  });
  return result.content;
}

const commandToClassify = "peux tu me donner le vainqueur de la coupe du monde 2022 ?";
classifyCommand(commandToClassify).then(result => {
  console.log(`The command type is: ${result}`);
});

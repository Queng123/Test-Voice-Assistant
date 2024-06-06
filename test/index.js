import { ChatOllama } from '@langchain/community/chat_models/ollama';
import {
  PromptTemplate,
} from '@langchain/core/prompts';


const commandList = [
  "play music: $musicTitle",
  "stop music",
  "other command",
];

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3';
const llm = new ChatOllama({
  baseUrl: OLLAMA_URL,
  model: MODEL,
  temperature: 5,
});

// create pre filtre using LLAMA and after analyse with GPT

const template = PromptTemplate.fromTemplate(`
voici ma demande utilisateur: "{command}"
Identifie dans la liste suite de quelle type de demande il s'agit: {commandList}
si tu selectionnes un element de la liste avec un paramètre, remplie ce paramètre avec la demande utilisateur. Si tu ne sait pas quel argument mettre, réponds "je ne sais pas"
Tu n'as l'autorisation de répondre seulement un seul élément de la liste en complétant ses arguments (ou dire je ne sais pas), ne rajoute aucun autre élement a ta réponse
Reponse:
`);

const chain = template.pipe(llm);


async function classifyCommand(command) {
  const result = await chain.invoke({
    commandList: commandList.join(", "),
    command: command,
  });
  return result.content;
}

const commandToClassify = "peux tu lancer Too Sweat de Hozier ?";
classifyCommand(commandToClassify).then(result => {
  console.log(`The command type is: ${result}`);
});

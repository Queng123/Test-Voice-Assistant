import webSocket from "ws"
import dotenv from "dotenv"
import mic from "mic"
import { exit } from "node:process"
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import {
  MessagesPlaceholder,
  PromptTemplate,
  ChatPromptTemplate,
  FewShotChatMessagePromptTemplate,
} from '@langchain/core/prompts';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { loadSummarizationChain } from 'langchain/chains';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { readFile } from 'node:fs/promises';

dotenv.config()

const gladiaKey = process.env.GLADIA_API_KEY
const gladiaUrl = "wss://api.gladia.io/audio/text/audio-transcription"
const ws = new webSocket(gladiaUrl)
const SAMPLE_RATE = 16000


const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3';
const llm = new ChatOllama({
  baseUrl: OLLAMA_URL,
  model: MODEL,
  temperature: 0.1,
});

// const result = await llm.invoke(prompt);

if (!gladiaKey) {
  console.error("You must provide a gladia key. Go to app.gladia.io")
  exit(1)
} else {
  console.log("using the gladia key : " + gladiaKey)
}

ws.on("open", () => {
  const configuration = {
    x_gladia_key: gladiaKey,
    language_behaviour: "automatic single language",
    sample_rate: SAMPLE_RATE,
    encoding: "WAV",
  }
  ws.send(JSON.stringify(configuration))
  const microphone = mic({
    rate: SAMPLE_RATE,
    device: 'plughw:0,6',
    channels: "1",
  })
  const microphoneInputStream = microphone.getAudioStream()
  microphoneInputStream.on("data", function (data) {
    const base64 = data.toString("base64")
    if (ws.readyState === webSocket.OPEN) {
      ws.send(JSON.stringify({ frames: base64 }))
    } else {
      console.log("WebSocket ready state is not [OPEN]")
    }
  })
  microphoneInputStream.on("error", function (err) {
    console.log("Error in Input Stream: " + err)
  })
  microphone.start()
})

var lastTranscript = "";
var totalTranscript = "";
var transcriptCount = 0;
var startListening = false;
ws.on("message", async (event) => {
  const utterance = JSON.parse(event.toString())
  if (utterance.event === "connected") {
    console.log(`\n* Connection id: ${utterance.request_id} *\n`)
  } else if (utterance.event === "transcript") {

    if (utterance.transcription) {
      if (utterance.transcription.toLowerCase().includes("nova")) {
        startListening = true;
      }
    }

    if (startListening) {
      if (transcriptCount === 5) { // si fin de la conversation, appeler le LLM
        const result = await llm.invoke(totalTranscript);
        console.log("réponse du LLM: ", result.content);
        transcriptCount = 0;
        totalTranscript = "";
        lastTranscript = "";
        startListening = false;
      }

      if (utterance.transcription) {
        transcriptCount = 0;
        lastTranscript = utterance.transcription;
      } else {
        if (transcriptCount == 0) {
          totalTranscript = totalTranscript + " " + lastTranscript;
          console.log(totalTranscript);
        }
        transcriptCount++;
      }
    }

  } else if (utterance.event === "error") {
    console.error(`[${utterance.code}] ${utterance.message}`)
    socket.close()
  }
})

ws.on("error", (error) => {
  console.log("An error occurred:", error.message)
})

ws.on("close", () => {
  console.log("Connection closed")
})
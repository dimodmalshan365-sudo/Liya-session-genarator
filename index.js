// Simple Pair Code Session Generator for Baileys
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");

const app = express();
app.use(express.json());

app.get('/', (req,res) => {
  res.send(`
  <h2>LIYA-MD Session Generator</h2>
  <input id="num" placeholder="9477xxxxxxx">
  <button onclick="getCode()">Get Pair Code</button>
  <pre id="out"></pre>
  <script>
  async function getCode(){
    let n=document.getElementById('num').value;
    let r=await fetch('/pair?number='+n);
    let d=await r.json();
    document.getElementById('out').innerText=JSON.stringify(d,null,2);
  }
  </script>`)
});

app.get('/pair', async (req,res) => {
  let num = req.query.number.replace(/[^0-9]/g,'');
  const { state, saveCreds } = await useMultiFileAuthState('./session/'+num);
  const sock = makeWASocket({
    logger: pino({level:"silent"}),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:"silent"})) },
    printQRInTerminal: false,
    browser: ["LIYA-MD", "Chrome", "1.0.0"]
  });

  if(!sock.authState.creds.registered){
    await delay(1500);
    let code = await sock.requestPairingCode(num);
    res.json({ pairCode: code, message: "WhatsApp -> Linked Devices -> Link with phone number -> Enter this code" });
  }
  
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (u) => {
    if(u.connection === "open"){
      let credsFile = fs.readFileSync('./session/'+num+'/creds.json');
      let sessionID = Buffer.from(credsFile).toString('base64'); // මේක තමයි SESSION_ID
      console.log("SESSION_ID:", "LIYA~" + sessionID);
      // මෙතන ඔයාට session එක display කරන්න පුලුවන්
    }
  });
});

app.listen(3000, ()=> console.log("Running"));

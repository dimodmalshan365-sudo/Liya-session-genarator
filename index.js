const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const pino = require("pino")
const readline = require("readline")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(res => rl.question(q, res))

async function start() {
  console.log("Starting...");
  const { state, saveCreds } = await useMultiFileAuthState("auth")
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Chrome", "Ubuntu", "22.04"]
  })

  sock.ev.on("creds.update", saveCreds)

  if(!sock.authState.creds.registered) {
    const num = await ask("Enter number (947xxxxxxxx): ")
    const code = await sock.requestPairingCode(num.replace(/[^0-9]/g,""))
    console.log("\n====================\nPAIR CODE: " + code + "\n====================\n")
  }

  sock.ev.on("connection.update", (u) => {
    if(u.connection === "open") {
      console.log("✅ LOGIN SUCCESS - Session created in auth folder!")
    }
  })
}

start()

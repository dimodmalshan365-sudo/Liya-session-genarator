const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys")
const pino = require("pino")
const readline = require("readline")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function start() {
  console.log("Running Liya Session Generator...")
  const { state, saveCreds } = await useMultiFileAuthState("./auth")
  
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
    },
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  })

  sock.ev.on("creds.update", saveCreds)

  if (!sock.authState.creds.registered) {
    let phoneNumber = await question("Enter your WhatsApp number with country code (ex: 9471xxxxxxx): ")
    phoneNumber = phoneNumber.replace(/[^0-9]/g, "")
    
    console.log("Requesting Pair Code...")
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber)
        console.log("\n==============================")
        console.log("YOUR PAIR CODE: " + code)
        console.log("==============================")
        console.log("\nGo to WhatsApp > Linked Devices > Link with phone number and enter this code!")
      } catch (e) {
        console.log("Error: ", e.message)
      }
    }, 3000)
  }

  sock.ev.on("connection.update", async (s) => {
    if (s.connection === "open") {
      console.log("\n✅ Connected! Check your WhatsApp, session will be sent there.")
      // Here you can add code to send creds file
      setTimeout(() => process.exit(0), 5000)
    }
  })
}

start()

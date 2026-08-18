import { parseListingTemplate } from './src/lib/groq';

async function run() {
  const message = "DIJUAL APARTEMEN VITTORIA - JAKARTA BARAT - 》Luas : 47,77 sqm》Lantai : 9》Type : 2BR-Corner》View : City》Surat : Ppjb》Full furnish Hrg brp : 1.375m More info : Cici Gita GpBSD Wa.me/628111334710";
  console.log("Parsing message:", message);
  try {
    const result = await parseListingTemplate(message, null);
    console.log("Result:", result);
  } catch(e) {
    console.error("Error:", e);
  }
}
run();

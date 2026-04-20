let json = $input.all()
let dataString = JSON.stringify(json)
let dataJson = JSON.parse(dataString)
let dataText = dataJson[0]?.json?.data
let dataArray = dataText?.split('\n')

const out = []
let conversationID = "";

for (const item of dataArray){
  const t = item.replace('data:', '').trim();
  try{
    const tJson = JSON.parse(t);
    if(tJson["answer"]){
      out.push(tJson["answer"]);
      conversationID = tJson.conversation_id;
    }
  } catch {
    
  }
}

const msg = out.map(
  (item) => item).join('').replaceAll('\n', '');

return { response: msg, conversationID, dataArray };
const messages = document.getElementById("messages")
const input = document.getElementById("input")
const historyList = document.getElementById("historyList")

let conversations = JSON.parse(localStorage.getItem("conversations")) || []
let currentChat = null

/* Create new chat */

function createNewChat(){

const chat = {
id: Date.now(),
title: "New Chat",
messages: []
}

conversations.unshift(chat)

currentChat = chat

saveConversations()

renderHistory()

messages.innerHTML=""

}

/* Save conversations */

function saveConversations(){
localStorage.setItem("conversations",JSON.stringify(conversations))
}

/* Load chat */

function loadChat(chatId){

const chat = conversations.find(c=>c.id===chatId)

if(!chat) return

currentChat = chat

messages.innerHTML=""

chat.messages.forEach(m=>{
renderMessage(m.text,m.type,false)
})

}

/* Rename chat */

function renameChat(chatId){

const chat = conversations.find(c=>c.id===chatId)

if(!chat) return

const newName = prompt("Rename chat:",chat.title)

if(newName && newName.trim()!==""){

chat.title = newName

saveConversations()

renderHistory()

}

}

/* Delete chat */

function deleteChat(chatId){

if(!confirm("Delete this chat?")) return

conversations = conversations.filter(c=>c.id!==chatId)

saveConversations()

renderHistory()

messages.innerHTML=""

if(conversations.length>0){
loadChat(conversations[0].id)
}else{
createNewChat()
}

}

/* Sidebar history */

function renderHistory(){

historyList.innerHTML=""

conversations.forEach(chat=>{

const item=document.createElement("div")
item.className="history-item"

const title=document.createElement("span")
title.innerText=chat.title

title.onclick=()=>loadChat(chat.id)

const renameBtn=document.createElement("button")
renameBtn.innerText="✏️"

renameBtn.onclick=(e)=>{
e.stopPropagation()
renameChat(chat.id)
}

const deleteBtn=document.createElement("button")
deleteBtn.innerText="🗑"

deleteBtn.onclick=(e)=>{
e.stopPropagation()
deleteChat(chat.id)
}

const actions=document.createElement("div")
actions.className="history-actions"

actions.appendChild(renameBtn)
actions.appendChild(deleteBtn)

item.appendChild(title)
item.appendChild(actions)

historyList.appendChild(item)

})

}
/* Render message */

function renderMessage(text,type,save=true){

const div=document.createElement("div")

div.className="message "+type

if(type==="user"){

div.innerHTML="👤 "+text

}else{

div.innerHTML="🤖 "+marked.parse(text)

const copyBtn=document.createElement("button")
copyBtn.innerText="📋"
copyBtn.className="copy-btn"

copyBtn.onclick=()=>{
navigator.clipboard.writeText(text)
}

div.appendChild(copyBtn)

}

messages.appendChild(div)

messages.scrollTop=messages.scrollHeight

/* Save message */

if(save && currentChat){

currentChat.messages.push({text,type})

/* auto chat title */

if(type==="user" && currentChat.title==="New Chat"){
currentChat.title=text.substring(0,30)
renderHistory()
}

saveConversations()

}

}


/* Send message */
async function sendMessage(){

const text = input.value.trim()

if(!text) return

if(!currentChat) createNewChat()

/* show user message */

renderMessage(text,"user")

input.value=""

/* typing indicator */

const typing = document.createElement("div")

typing.className="message bot typing"

typing.innerText="● ● ●"

messages.appendChild(typing)

messages.scrollTop = messages.scrollHeight

try{

/* build chat history */

const history = currentChat.messages.map(m => ({
text: m.text,
type: m.type
}))

const res = await fetch("/api/chat",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
messages: history
})
})

const data = await res.json()

typing.remove()

typeEffect(data.reply)

}catch(err){

console.error(err)

typing.remove()

renderMessage("⚠ Server error. Try again.","bot")

}

}

/* Typing effect */

function typeEffect(text){

let i=0

const div=document.createElement("div")
div.className="message bot"

messages.appendChild(div)

const interval=setInterval(()=>{

div.innerText="🤖 "+text.substring(0,i)

i++

messages.scrollTop=messages.scrollHeight

if(i>=text.length){

clearInterval(interval)

div.innerHTML="🤖 "+marked.parse(text)

const copyBtn=document.createElement("button")
copyBtn.innerText="📋"
copyBtn.className="copy-btn"

copyBtn.onclick=()=>{
navigator.clipboard.writeText(text)
}

div.appendChild(copyBtn)

currentChat.messages.push({text,type:"bot"})

saveConversations()

}

},15)

}

/* Enter key */

input.addEventListener("keypress",e=>{
if(e.key==="Enter") sendMessage()
})

/* Voice input */

function startVoice(){

if(!('webkitSpeechRecognition' in window)){
alert("Voice recognition not supported")
return
}

const recognition=new webkitSpeechRecognition()

recognition.lang="en-US"

recognition.onresult=function(event){

const text=event.results[0][0].transcript

input.value=text

}

recognition.start()

}

/* Search chats */

function searchChats(){

const query=document.getElementById("chatSearch").value.toLowerCase()

historyList.innerHTML=""

conversations.forEach(chat=>{

let matched=false

chat.messages.forEach(msg=>{
if(msg.text.toLowerCase().includes(query)){
matched=true
}
})

if(chat.title.toLowerCase().includes(query) || matched){

const item=document.createElement("div")
item.className="history-item"

item.innerText=chat.title

item.onclick=()=>loadChat(chat.id)

historyList.appendChild(item)

}

})

}

/* Initialize */

if(conversations.length===0){
createNewChat()
}else{
currentChat=conversations[0]
renderHistory()
loadChat(currentChat.id)
}
const { Client, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { token } = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const { Configuration, OpenAIApi } = require("openai"); // gpt 가져오기
const axios = require('axios');
const cheerio = require('cheerio');
client.commands = new Collection();
require("dotenv").config();

//구글 검색 api
// const googleKey = process.env.GOOGLE_API_KEY;
// const cx = process.env.GOOGLE_SEARCH_ENGINE_KEY;
// const numResults = 1; // 최대 10까지 설정 가능

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
  });
  
const openai = new OpenAIApi(configuration);
// gpt 설정란
async function gptapi(reqMessage){
	return new Promise(async (resolve, reject) => {
		try{
			const chatCompletion = await openai.createChatCompletion({
				model: "gpt-3.5-turbo",
				messages: [
					//system 역할을 사용해서 설정값을 넣어줄 수 있음 다만 토큰을 좀 더 소모하게 됨
					{role : "system", content : "'history'를 참고해서 'input'에 대한 응답을 한 줄로 간단하게 응답해라"},
					{role: "user", content: reqMessage}
				]
			});
			const resMessage = chatCompletion.data.choices[0].message;
			console.log(resMessage);
			resolve(resMessage.content);
		}
		catch{
			reject("요청 실패");
		}
	});
}


client.once(Events.ClientReady, () => {
	console.log('Ready!');
    client.user.setActivity('대화 엿', { type: ActivityType.Listening });	
});

const sessiondata = [];
var reply = "";
client.on('messageCreate', async (message) => {
	if (!message.author.bot) { // 봇이 보낸 메시지가 아닌 경우에만 반응
		if(sessiondata.length == 0){
			console.log("처음");
			reply = await gptapi(message.content);
			sessiondata.push(message.author.username + " : " + message.content + ", " + "answer : " + reply);
		}else{
			console.log("중간");
			reply = await gptapi("history : " + sessiondata.join() + ", input" + message.content);
			sessiondata.push(message.author.username + " : " + message.content + ", " + "answer : " + reply);
		}

		console.log(sessiondata.length);
		console.log(sessiondata[0]);
		console.log(sessiondata[1]);
		console.log(sessiondata);
		message.channel.send(reply);
	}
  });

client.login(token);
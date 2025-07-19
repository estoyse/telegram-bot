import "dotenv/config";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { messageHandler } from "./messageHandler.js";
import { replyInChannel } from "./replyInChannel.js";

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const stringSession = new StringSession(process.env.STRING_SESSION || "");
const channelId = Number(process.env.CHANNEL_ID);

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start();

  let channelEntity;
  try {
    channelEntity = await client.getEntity(channelId);
  } catch (err) {
    console.error(
      "Could not get the channel entity. Please check the channelId and make sure you are a member of the channel.",
      err,
    );
    return;
  }

  client.addEventHandler((event) => {
    messageHandler(client, event, channelEntity);
  }, new NewMessage({}));
  client.addEventHandler(
    (event) => {
      replyInChannel(client, event, channelEntity);
    },
    new NewMessage({ chats: [channelId] }),
  );
})();

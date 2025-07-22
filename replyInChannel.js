import { Api } from "telegram";

export const replyInChannel = async (client, event, channelEntity) => {
  const msg = event.message;
  if (!msg.replyTo) return;

  const repliedToId = msg.replyTo.replyToMsgId;

  try {
    const repliedMessage = await client.getMessages(channelEntity, {
      ids: [repliedToId],
    });

    if (!repliedMessage || !repliedMessage[0]) {
      console.log("Could not fetch replied message");
      return;
    }

    const match = repliedMessage[0].message.match(
      /#([ab])\s+https:\/\/t\.me\/c\/(-?\d+)\/(\d+)/,
    );

    if (!match) {
      console.log("No metadata found");
      return;
    }

    const [_, type, chatIdStr, messageIdStr] = match;
    const peerType = type === "a" ? "PeerChannel" : "PeerChat";
    const chatId = parseInt(chatIdStr);
    const originalMsgId = parseInt(messageIdStr);

    // Construct peer
    let targetPeer;
    if (peerType === "PeerChannel") {
      targetPeer = new Api.PeerChannel({ channelId: chatId });
    } else if (peerType === "PeerChat") {
      targetPeer = new Api.InputPeerChat({ chatId: chatId });
    } else {
      console.error("Unsupported peer type:", peerType);
      return;
    }

    const getValidMedia = (media) => {
      if (!media) return null;

      switch (media.className) {
        case "MessageMediaPhoto":
          return media.photo ? media : null;
        case "MessageMediaDocument":
          return media.document ? media : null;
        case "MessageMediaGeo":
        case "MessageMediaContact":
        case "MessageMediaVenue":
          return media;
        default:
          return null;
      }
    };

    const validMedia = getValidMedia(msg.media);

    const messageOptions = {
      message: msg.message,
      replyTo: originalMsgId,
    };

    if (validMedia) {
      messageOptions.file = validMedia;
      console.log(`Sending reply with media type: ${validMedia.className}`);
    }

    await client.sendMessage(targetPeer, messageOptions);
    await event.message.delete({ revoke: true });

    const editedMessage = repliedMessage[0].message.replace("💬", "✅");
    await client.editMessage(channelEntity, {
      message: repliedToId,
      text: editedMessage + "\n✅ Answered: " + msg.message,
    });
  } catch (error) {
    console.error("Error occurred while processing reply:", error);

    try {
      await client.sendMessage("me", {
        message: `Reply Handler Error: ${error.message}`,
        parseMode: "markdown",
      });
    } catch (notificationError) {
      console.error("Failed to send error notification:", notificationError);
    }
  }
};

export const messageHandler = async (client, event, channelEntity) => {
  console.log(event);

  const ignoredIds = [2089818172, 2520298281];
  if (!event.isGroup) {
    return;
  }

  const message = event.message;
  let peer = Number(message.peerId.chatId) || Number(message.peerId.channelId);
  if (ignoredIds.indexOf(peer) !== -1) {
    console.log("Ignored chat. Skipping...");
    return;
  }

  // Getting sender and which group
  let sender = "GroupAdmin";
  if (message.fromId) {
    try {
      const senderEntity = await client.getEntity(message.fromId);
      sender =
        senderEntity.firstName ||
        senderEntity.username ||
        senderEntity.title ||
        "Mentor";
    } catch (e) {
      console.error("Failed to get sender entity:", e);
    }
  } else if (message.postAuthor) {
    sender = message.postAuthor;
  }

  let chatEntity = await client.getEntity(message.peerId);
  let chat = chatEntity.title || chatEntity.username || chatEntity.firstName;
  let chatId = message.peerId.channelId || message.peerId.chatId;
  let peerType = message.peerId.className == "PeerChannel" ? "a" : "b";
  const meta = `#${peerType} https://t.me/c/${chatId}/${message.id}`;
  const repliedMessage = await event.message.getReplyMessage();

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

  try {
    const validMedia = getValidMedia(message.media);
    const baseMessageText = `💬${sender} in ${chat}:\n\n${message.text}\n\n${meta}`;
    let isImportant = true;
    const isWeirdChat = /(27|24|14)/i.test(chat);
    const isFromTopic = message.replyTo?.forumTopic;

    if ((isWeirdChat && isFromTopic) || (!isWeirdChat && !isFromTopic)) {
      isImportant = false;
    } else if (!isWeirdChat && isFromTopic) {
      const topicRegex = /(savol|javob|typing|question)/i;
      const [topicMessage] = await client.getMessages(chatEntity, {
        ids: [message.replyTo.replyToTopId || message.replyTo.replyToMsgId],
      });
      isImportant = topicRegex.test(topicMessage.action.title);
    }

    if (!isImportant) {
      console.log("Not important. Skipping...");
      return;
    }

    if (
      !repliedMessage ||
      !message.replyToMsgId ||
      repliedMessage.className === "MessageService"
    ) {
      // Send regular message
      const messageOptions = {
        message: baseMessageText,
      };

      // Add media if valid
      if (validMedia) {
        messageOptions.file = validMedia;
      }

      await client.sendMessage(channelEntity, messageOptions);
      return;
    }

    // Send replied message
    const repliedMessageText = `💬${sender} in ${chat} replied to <a href="https://t.me/c/${repliedMessage.peerId.channelId}/${repliedMessage.id}">${repliedMessage.message || "media"}</a>:\n\n${message.text}\n\n${meta}`;

    const repliedMessageOptions = {
      message: repliedMessageText,
      parseMode: "html",
    };

    // Add media if valid
    if (validMedia) {
      repliedMessageOptions.file = validMedia;
    }

    await client.sendMessage(channelEntity, repliedMessageOptions);
  } catch (error) {
    console.error("Error in messageHandler:", error);

    // Send error notification
    try {
      await client.sendMessage("me", {
        message: `Error ${error.code || "UNKNOWN"}: ${error.message}`,
        parseMode: "markdown",
      });
    } catch (notificationError) {
      console.error("Failed to send error notification:", notificationError);
    }
  }
};

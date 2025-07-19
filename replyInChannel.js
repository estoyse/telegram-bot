import { Api } from "telegram";

export const replyInChannel = async (client, event, channelEntity) => {
  const msg = event.message;
  if (!msg.replyTo) return;

  const repliedToId = msg.replyTo.replyToMsgId;

  try {
    // Fetch the message being replied to
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

    const [__, type, chatIdStr, messageIdStr] = match;
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

    // Helper function to check if media is valid and sendable
    const getValidMedia = (media) => {
      if (!media) return null;

      // Check media type and validity
      switch (media.className) {
        case "MessageMediaEmpty":
          return null;
        case "MessageMediaWebPage":
          // Skip web page previews as specified in original code
          return null;
        case "MessageMediaPhoto":
          return media.photo ? media : null;
        case "MessageMediaDocument":
          return media.document ? media : null;
        case "MessageMediaGeo":
        case "MessageMediaContact":
        case "MessageMediaVenue":
          return media;
        case "MessageMediaUnsupported":
          console.log("Unsupported media type encountered");
          return null;
        default:
          console.log(`Unknown media type: ${media.className}`);
          return null;
      }
    };

    // Get valid media if present
    const validMedia = getValidMedia(msg.media);

    // Debug logging
    if (msg.media) {
      console.log(`Processing media type: ${msg.media.className}`);
    }

    // Send your reply back to the original group
    const messageOptions = {
      message: msg.message,
      replyTo: originalMsgId,
    };

    // Add media if valid
    if (validMedia) {
      messageOptions.file = validMedia;
      console.log(`Sending reply with media type: ${validMedia.className}`);
    }

    await client.sendMessage(targetPeer, messageOptions);

    // Delete the reply message from channel
    await event.message.delete({ revoke: true });

    // Edit the original message to show it was answered
    const editedMessage = repliedMessage[0].message.replace("💬", "✅");
    await client.editMessage(channelEntity, {
      message: repliedToId,
      text: editedMessage + "\n✅ Answered: " + msg.message,
    });

    console.log("Successfully processed reply with media");
  } catch (error) {
    console.error("Error occurred while processing reply:", error);

    // Try to send error notification without breaking the flow
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

# Telegram Bot

This is a Telegram bot that can be used to automatically reply to messages in a channel.

## Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/estoyse/telegram-bot/
    cd telegram-bot
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create a `.env` file:**

    Create a `.env` file in the root of the project and add the following variables:

    ```
    API_ID=
    API_HASH=
    STRING_SESSION=
    CHANNEL_ID=
    ```

4.  **Get your API ID and API Hash:**

    - Go to [my.telegram.org](https://my.telegram.org) and log in.
    - Click on "API development tools".
    - You will find your `API_ID` and `API_HASH` there.

5.  **Get your Channel ID:**

    - Open Telegram and go to the channel you want to bot to work in.
    - Copy the channel link.
    - The channel ID is the number after the last `/`.

6.  **Get your String Session:**

    - Run the following command:

      ```bash
      npm run init
      ```

    - You will be prompted to enter your phone number, password, and the code you receive.
    - Once you are connected, you will see a session string in the console.
    - Copy the session string and add it to your `.env` file.

## Running the bot

To run the bot, use the following command:

```bash
npm start
```

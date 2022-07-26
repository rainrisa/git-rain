import { deunionize, Markup, Telegraf } from "telegraf";
import getAllRepositories from "./functions/getAllRepositories.js";
import getUserDetails from "./functions/getUserDetails.js";
import "dotenv/config";

if (!process.env.BOT_TOKEN) {
  console.log("Please provide BOT_TOKEN");
  process.exit();
}

const app = new Telegraf(process.env.BOT_TOKEN);

app.start(async (ctx) => {
  await ctx.reply("Provide github username");
});

app.on("message", async (ctx) => {
  const message = deunionize(ctx.message);
  const waitMessage = await ctx.reply("<code>Terminal Running</code>", {
    parse_mode: "HTML",
  });

  if (message.text) {
    try {
      const githubUser = await getUserDetails(message.text);
      const repositories = await getAllRepositories(message.text, 1);
      const nextPage = 2;
      const repositoriesButton = repositories.map((repository) => {
        return [
          Markup.button.callback(
            repository.name,
            `${repository.html_url}|${githubUser.login}|${nextPage}`
          ),
        ];
      });
      await app.telegram.deleteMessage(
        waitMessage.chat.id,
        waitMessage.message_id
      );
      if (githubUser.public_repos <= 5) {
        await ctx.reply(
          `Name: ${githubUser.name}\nType: ${githubUser.type}\nProfile Link: <a href="https://github.com/${githubUser.login}/">Click Here</a>\nFollowers: ${githubUser.followers}\nFollowing: ${githubUser.following}\nPublic Repositories: ${githubUser.public_repos}`,
          {
            ...Markup.inlineKeyboard([...repositoriesButton]),
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }
        );
      } else {
        await ctx.reply(
          `Name: ${githubUser.name}\nType: ${githubUser.type}\nProfile Link: <a href="https://github.com/${githubUser.login}/">Click Here</a>\nFollowers: ${githubUser.followers}\nFollowing: ${githubUser.following}\nPublic Repositories: ${githubUser.public_repos}`,
          {
            ...Markup.inlineKeyboard([
              ...repositoriesButton,
              [
                Markup.button.callback(
                  ">>",
                  `Next|${message.text}|${nextPage}`
                ),
              ],
            ]),
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }
        );
      }
    } catch (err) {
      await app.telegram.deleteMessage(
        waitMessage.chat.id,
        waitMessage.message_id
      );
      await ctx.reply("User tidak ditemukan");
    }
  }
});

app.action(/[a-zA-Z]/, async (ctx) => {
  const matchInput = ctx.match.input.split("|");
  console.log(ctx.match.input);
  console.log(matchInput);

  try {
    if (matchInput[0].match(/https:\/\/github.com\/.*/)) {
      const userName = new URL(matchInput[0]).pathname.split("/")[1];
      const repositoryName = new URL(matchInput[0]).pathname.split("/")[2];
      ctx.editMessageText(`${repositoryName} repository of ${userName}`, {
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback(
                "Back",
                `Next|${userName}|${matchInput[2]}`
              ),
            ],
          ],
        },
      });
    } else if (matchInput[0].match("Next")) {
      const githubUser = await getUserDetails(matchInput[1]);
      const currentPage = +matchInput[2];
      const repositories = await getAllRepositories(
        githubUser.login,
        currentPage
      );
      const repositoriesButton = repositories.map((repository) => {
        return [
          Markup.button.callback(
            repository.name,
            `${repository.html_url}|${githubUser}|${currentPage}`
          ),
        ];
      });
      if (githubUser.public_repos - currentPage * 5 <= 0) {
        await ctx.editMessageReplyMarkup({
          inline_keyboard: [
            ...repositoriesButton,
            [
              Markup.button.callback(
                "<<",
                `Back|${githubUser.login}|${currentPage - 1}`
              ),
            ],
          ],
        });
      } else {
        await ctx.editMessageReplyMarkup({
          inline_keyboard: [
            ...repositoriesButton,
            [
              Markup.button.callback(
                "<<",
                `Back|${githubUser.login}|${currentPage - 1}`
              ),
              Markup.button.callback(
                ">>",
                `Next|${githubUser.login}|${currentPage + 1}`
              ),
            ],
          ],
        });
      }
    } else if (matchInput[0].match("Back")) {
      await ctx.reply("back");
    }
  } catch (err) {
    console.log(err);
  }
});

app.launch().then(async (ctx) => {
  const me = await app.telegram.getMe();
  console.log(`Successfully logged in as ${me.username}`);
});

process.once("SIGINT", () => app.stop("SIGINT"));
process.once("SIGTERM", () => app.stop("SIGTERM"));

const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");
const qs = require("qs");
const cheerio = require("cheerio");

const repository = core.getInput("repository");
const cookie = core.getInput("cookie");
const url = `https://gitee.com/${repository}/pages`;

/**
 * Locd page and get csrf
 */
axios
  .get(url, {
    headers: {
      Cookie: cookie
    }
  })
  .then(({ data }) => cheerio.load(data))
  .then($ => {
    const meta = $("meta[name='csrf-token']")[0];
    const csrfToken = meta.attribs.content;
    return axios.post(
      url + "/rebuild",
      qs.stringify({
        branch: core.getInput("branch"),
        build_directory: core.getInput("directory"),
        force_https: core.getInput("https")
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: cookie,
          Referer: url,
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-Token": csrfToken
        }
      }
    );
  })
  .then(res => {
    core.setOutput("result", res.data);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  })
  .catch(error => {
    core.setFailed(error.message);
  });

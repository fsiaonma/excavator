const superagent = require('superagent');
require('superagent-proxy')(superagent);
const fakeUa = require('fake-useragent');
const logger = require('./logger');

global.agents = [];

module.exports = {
  async fetch(url) {
    const agent = await this._getAgents();
    logger.info(`agent`, `【请求地址】url: ${url}`);
    logger.info(`agent`, `【使用代理】agent-url: ${agent.url} | 使用次数: ${agent.times}`);

    try {
      const res = await superagent
        .get(url)
        .proxy(agent.url)
        .set('User-Agent', fakeUa())
        .set('Accept', 'text/html,application/xhtml+xml,application/xml,application/x-javascript;q=0.9,image/webp,image/apng,*/*;q=0.8')
        .set('Accept-Encoding', 'gzip, deflate, br')
        .buffer(true)
        .timeout({
          response: 10000,
          deadline: 30000
        });

      if (res && res.status === 200) {
        ++agent.times;
        global.agents.push(agent);
        logger.info(`agent`,`【代理有效】URL: ${agent.url} | 使用次数: ${agent.times} -----------------------------------`);
        return { agent, ...res };
      } else {
        logger.info(`agent`,`【代理访问失效】URL: ${agent.url} | 使用次数: ${agent.times} ---------------- 失效 -------------------`);
        return false;
      }
    } catch (err) {
      logger.info(`agent`,`【代理异常失效】URL: ${agent.url} | 使用次数: ${agent.times} ---------------- 失效 -------------------`);
      logger.info(`agent`, err);
      return false;
    }
  },

  disableAgent(agent) {
    logger.info(`agent`,`【代理解释失效】URL: ${agent.url} | 使用次数: ${agent.times} ---------------- 失效 -------------------`);
    global.agents = global.agents.filter(item => item.url !== agent.url);
  },

  async _getAgents() {
    return new Promise((reslove, reject) => {
      logger.info(`agent`, `【代理池剩余量】 ${global.agents.length} `);
      if (global.agents.length > 20) {
        reslove(global.agents.shift());
      } else {
        const url = 'http://119.28.55.212:5000/proxy?protocol=socks4&num=50&score=100';
        logger.info(`agent`,`【请求代理】 URL: ${url} `);

        superagent.get(url).end((err, res) => {
          try {
            if (err) {
              logger.info(`agent`,`【请求代理失败】 err: ${JSON.stringify(err)}`);
              return reslove([]);
            }

            if (!res || !res.text) {
              logger.info(`agent`,`【请求代理失败】no content`);
              return reslove([]);
            }

            const resAgents = res.text.split('\n');
            resAgents.forEach(item => {
              if (item && item !== '') {
                global.agents.push({
                  url: item,
                  times: 0
                });
              }
            });

            reslove(global.agents.shift());
          } catch(e) {
            logger.info(`agent`,`【请求代理异常】 err: ${JSON.stringify(err)}`);
            return reslove([]);
          }
        });
      }
    });
  }
}

const superagent = require('superagent');
require('superagent-proxy')(superagent);
const fakeUa = require('fake-useragent');
const logger = require('./logger');

global.agents = [];

module.exports = {
  async fetch(url) {
    const agent = await this._getAgents();
    logger.info(`./log/agent`,`【使用代理】URL: ${agent.url} | 使用次数: ${agent.times}`);
    return new Promise((reslove, reject) => {
      superagent
        .get(url)
        .proxy(agent.url)
        .set('User-Agent', fakeUa())
        .timeout({ response: 30000 })
        .buffer(true)
        .set('Accept', 'text/html,application/xhtml+xml,application/xml,application/x-javascript;q=0.9,image/webp,image/apng,*/*;q=0.8')
        .set('Accept-Encoding', 'gzip, deflate, br')
        .end(async (err, res) => {
          if (!err) {
            ++agent.times;
            global.agents.push(agent);
            logger.info(`./log/agent`,`【代理有效】URL: ${agent.url} | 使用次数: ${agent.times} -----------------------------------`);
            reslove(res);
          } else {
            console.log(err);
            logger.info(`./log/agent`,`【代理失效】URL: ${agent.url} | 使用次数: ${agent.times} ---------------- 失效 -------------------`);
            reslove(await this.fetch(url)); // 重试
          }
        });
    });
    
  },

  async _getAgents() {
    return new Promise((reslove, reject) => {
      console.log('----------------- 代理池 ---------------------');
      console.log(global.agents);
      console.log('----------------- 代理池 ---------------------');
      if (global.agents.length > 0) {
        reslove(global.agents.shift());
      } else {
        setTimeout(() => {
          global.agents.push({
            url: 'socks4://190.111.238.127:45843',
            times: 0
          });
          global.agents.push({
            url: 'socks4://71.43.24.76:64312',
            times: 0
          });
          global.agents.push({
            url: 'socks4://193.107.221.176:4145',
            times: 0
          });
          reslove(global.agents.shift());
        }, 1000);
      }
    });
  }
}

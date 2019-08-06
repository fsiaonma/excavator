const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const agent = require('../common/agent');
const logger = require('../common/logger');
const sms = require('../common/sms');

// 结构化
function pipeline($) {
  const result = {};

  const items = $('h3.name a[ka^="search_list_company"]').toArray();
  items.forEach(item => {
    const name = $(item).text();
    const href = `https://www.zhipin.com${$(item).attr('href')}`;
    result[name] = href;
  });

  return result;
}

// 判断结束
function isReachEnd($) {
  return $('a[ka="page-next"]').attr('class').indexOf('disabled') > -1;
}

// 初始化数据
async function init(config) {
  return new Promise((reslove, reject) => {
    // 获取配置
    const { id, url: confUrl } = config;

    // 初始化队列
    let result = {};

    // 处理单页数据
    const func = (page) => {
      logger.info(`boss/${id}`,`【初始化 id:${id}】----------- 开始第${page}页 -----------`);
      const url = confUrl.replace(new RegExp('{{eagle-page}}','g'), page);
      setTimeout(async () => {
        try {
          // 提取数据
          const { err, res } = await agent.fetch(url);

          // 序列化 dom 结构
          const $ = cheerio.load(res.text);

          // 处理数据
          const items = pipeline($);

          // 处理数据
          result = { ...result, ...items };

          // 潘墩是否结束，不结束则翻页地柜
          if (!isReachEnd($)) {
            logger.info(`boss/${id}`,`【初始化 id:${id}】----------- 完成第${page}页 -----------`);
            func(page + 1);
          } else {
            fs.writeFileSync(path.resolve(__dirname, `../persistent/boss/${id}`), JSON.stringify(result), { flag: 'a' });
            logger.info(`boss/${id}`,`【初始化 id:${id}】----------- 全部完成，共初始化 ${Object.keys(result).length} 条记录 ----------- `);
            reslove(true);
          }
        } catch(err) {
          // 出现异常：打印日志，重试。
          logger.info(`boss/${id}`,`【初始化异常 id:${id} | page:${page}】`);
          logger.info(`boss/${id}`, err);
          func(page); 
        }
      }, 5000);
    };

    // 启动初始化
    func(1);
  });
}

// 处理监控更新
function handleMonitor(items, config) {
  const { id, phones } = config;

  // 提取缓存信息
  const result = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../persistent/boss/${id}`)));
  
  Object.keys(items).forEach((name) => {
    const href = items[name];

    // 发现更新
    if (!result[name]) {
      // 打印日志
      logger.info(`boss/${id}`, `【监控更新 id:${id}】==== name: ${name} | href: ${href} ==== \n`);

      // 填充对象
      result[name] = href;

      // 通知用户
      phones.forEach(async phone => {
        await sms.send(`【EagleTake】发现新数据 | 平台: BOSS直聘 | 名称: ${name} | 链接: ${href}`, phone);
      });
    }
  });

  // 覆盖写入持久化文件
  fs.writeFileSync(path.resolve(__dirname, `../persistent/boss/${id}`), JSON.stringify(result));
}

module.exports = {
  /**
   * 运行 splider
   */
  async run(config) {
    // 提取数据
    const { id, url: confUrl, phones, duration } = config;

    // 新建文件夹
    if (!fs.existsSync(path.resolve(__dirname, `../persistent/boss`))) {
      fs.mkdirSync(path.resolve(__dirname, `../persistent/boss`));
    }
    if (!fs.existsSync(path.resolve(__dirname, `../log/boss`))) {
      fs.mkdirSync(path.resolve(__dirname, `../log/boss`));
    }
    
    // 初始化
    if (!fs.existsSync(path.resolve(__dirname, `../persistent/boss/${id}`))) {
      // 初始化
      await init(config);
    }

    // 运行 splider
    return new Promise((reslove, reject) => {
      // 处理单页数据
      const func = (page) => {
        logger.info(`boss/${id}`,`【监控更新 id:${id}】----------- 开始第${page}页 -----------`);
        const url = confUrl.replace(new RegExp('{{eagle-page}}','g'), page);
        setTimeout(async () => {
          // 提取数据
          const res = await agent.fetch(url);

          // 重跑当前页
          if (!res) {
            return func(page);
          }

          try {
            // 序列化 dom 结构
            const $ = cheerio.load(res.text);

            // 处理数据
            const items = pipeline($);

            // 处理数据
            handleMonitor(items, config);

            logger.info(`boss/${id}`,`【监控更新 id:${id}】----------- 完成第${page}页 -----------`);

            // 递归
            func(isReachEnd($) ? 1 : page + 1);
          } catch (err) {
            // 出现异常：打印日志，重试。
            logger.info(`boss/${id}`,`【监控更新异常 id:${id} | page:${page}】`);
            logger.info(`boss/${id}`, err);
            // 标记代理失效
            agent.disableAgent(res.agent);
            // 重跑当前页
            func(page);
          }
        }, duration());
      };

      // 启动
      func(1);
    });
  },
}

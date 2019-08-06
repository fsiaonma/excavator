const fs = require('fs');
const path = require('path');

const config = require('./config');
const logger = require('./common/logger');
const bossSplider = require('./spliders/boss');

// 项目前置初始化
if (!fs.existsSync(path.resolve(__dirname, `./persistent`))) {
   fs.mkdirSync(path.resolve(__dirname, `./persistent`));
}
if (!fs.existsSync(path.resolve(__dirname, `./log`))) {
   fs.mkdirSync(path.resolve(__dirname, `./log`));
}

(async function() {
  // 提取配置
  const { boss: bossConf } = config;

  // 任务集合
  const jobs = [];

  // 构建任务队列
  bossConf.forEach(conf => {
    jobs.push(bossSplider.run(conf))
  });

  // 并发执行
  await Promise.all(jobs);
})();

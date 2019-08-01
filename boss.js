const cheerio = require('cheerio');
const fs = require('fs');
const agent = require('./common/agent');
const config = require('./config');
const sms = require('./common/sms');
const logger = require('./common/logger');

// 在错误发生之前监听，但不能阻止错误发生
process.on('uncaughtException', error => {
  console.error(error);
});

async function init(conf) {
	return new Promise((reslove, reject) => {
		const { id, phones } = conf;
		const result = {};

		const func = (page) => {
			const url = conf.url.replace(new RegExp('{{eagle-page}}','g'), page);
			agent.fetch(url).then(res => {
				console.log(res.text);

				const $ = cheerio.load(res.text);

				const items = $('h3.name a[ka^="search_list_company"]').toArray();
				items.forEach(item => {
					const name = $(item).text();
					const href = `https://www.zhipin.com${$(item).attr('href')}`;
					result[name] = href;
					logger.info(`./log/boss/${id}`, `【初始化 id: ${id}】name: ${name} | href: ${href}`);
				});

				if ($('a[ka="page-next"]').attr('class').indexOf('disabled') < 0) {
					logger.info(`./log/boss/${id}`,`【初始化 id: ${id}】----------- 完成第${page}页 -----------`);
					setTimeout(() => {
						func(page + 1);
					}, 1000);
				} else {
					logger.info(`./log/boss/${id}`,`【初始化 id:${id}】----------- 全部完成，共初始化 ${Object.keys(result).length} 条记录 ----------- `);
					fs.writeFileSync(`./persistent/boss/${id}`, JSON.stringify(result), { flag: 'a' });
					reslove();
				}
			}).catch(err => {
				console.log(err);
				logger.info(`./log/boss/${id}`, err);
				logger.info(`./log/boss/${id}`,`【初始化 id:${id}异常】${JSON.stringify(err)}`);
				func(page); // 重试
			});
		}

		func(1);
	});
}

async function findNew(conf) {
	return new Promise((reslove, reject) => {
		const { id, url, phones, duration } = conf;
		const result = JSON.parse(fs.readFileSync(`./persistent/boss/${id}`));
		const func = (page) => {
			const url = conf.url.replace(new RegExp('{{eagle-page}}','g'), page);
			agent.fetch(url).then(res => {
				const $ = cheerio.load(res.text);
				
				const items = $('h3.name a[ka^="search_list_company"]').toArray();
				items.forEach(item => {
					const name = $(item).text();
					const href = `https://www.zhipin.com${$(item).attr('href')}`;
					if (!result[name]) {
						result[name] = href;
						logger.info(`./log/boss/${id}`, `【监控新数据 id: ${id}】==== name: ${name} | href: ${href} ====`);
						phones.forEach(async phone => {
							const { success } = await sms.send(`【EagleTake】发现新数据 | 平台: BOSS直聘 | 名称: ${name} | 链接: ${href}`, phone);
							if (success) { logger.info(`./log/boss/${id}`, `发送短信到 ${phone} 成功`); }
						});
					}
				});

				if ($('a[ka="page-next"]').attr('class').indexOf('disabled') < 0) {
					logger.info(`./log/boss/${id}`,`【监控新数据 id: ${id}】----------- 完成第${page}页 -----------`);
					setTimeout(() => {
						func(page + 1);
					}, duration);
				} else {
					logger.info(`./log/boss/${id}`,`【监控新数据 id:${id}】----------- 完成一轮，即将重新开始 -----------`);
					fs.writeFileSync(`./persistent/boss/${id}`, JSON.stringify(result));
					setTimeout(() => {
						func(1);
					}, 60000);
				}
			}).catch(err => {
				logger.info(`./log/boss/${id}`,`【监控新数据 id:${id}异常】${JSON.stringify(err)} `);
				func(page); // 重试
			});
		}

		func(1);
	});
}

async function fetch(conf) {
	const { id, url, phones, duration } = conf;

	if (!fs.existsSync(`./persistent/boss/${id}`)) {
		await init(conf);
	}

	await findNew(conf);
}

(async function() {
	const { boss } = config;
	const jobs = [
		fetch(boss[0])
	];
	await Promise.all(jobs);
})();

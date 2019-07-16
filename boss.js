const request = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');
const config = require('./config');

async function init(conf) {

}

async function findNew(conf) {
	return new Promise((reslove, reject) => {
		const { id, url, phones, duration } = conf;
		request.get(url).timeout({
	    response: 30000
	  }).then(res => {
	  	console.log(id, duration);
	  	fs.writeFileSync(`./persistent/boss/${id}`, 'id, duration', { flag: 'a' });
	  	setTimeout(async () => {
	  		await findNew(conf);
	  	}, duration);
	  });
	});
}

async function fetch(conf) {
	const { id, url, phones, duration } = conf;

	if (!fs.existsSync(`./persistent/boss/${id}`)) {
		fs.writeFileSync(`./persistent/boss/${id}`, 'a', { flag: 'a' });
		await init(conf);
	}

	await findNew(conf);
}

(async function() {
	const { boss } = config;
	const jobs = [
		fetch(boss[0]),
		fetch(boss[1])
	];
	await Promise(jobs);
})();

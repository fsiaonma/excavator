const fs = require('fs');
module.exports = {
	info(logFilePath, content) {
		console.log(`【${new Date()}】${content}`);
		fs.writeFileSync(logFilePath, `【${new Date()}】content \n`, { flag: 'a' });
	}
}
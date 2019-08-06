const fs = require('fs');
const path = require('path');

module.exports = {
	info(logFilePath, content) {
		console.log(`【${new Date()}】${content}`);
		fs.writeFileSync(path.resolve(__dirname, `../log/${logFilePath}`), `【${new Date()}】${content} \n`, { flag: 'a' });
	}
}
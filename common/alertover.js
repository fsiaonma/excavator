const AlertOver = require('alertover');

module.exports = {
  async send(title, message) {
    return new Promise((reslove, reject) => {
      const client = new AlertOver({
        source: 's-4e9ed59b-d6d9-4d48-bf0d-4f881333', // 默认发送源
        receiver: 'g-26b8a988-77bd-4182-9470-48ba4429', // 默认接收组
      });
      client.send(title, message).then((res) => {
        console.log(res);
      }).catch((err) => {
        console.log(err);
      })
    });
  }
}

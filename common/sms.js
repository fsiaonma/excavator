const querystring = require('querystring');
const md5 = require('md5');
const request = require('superagent');

const resultCode = {
  '0': '短信发送成功',
  '-1': '参数不全',
  '-2': '服务器空间不支持,请确认支持curl或者fsocket，联系您的空间商解决或者更换空间！',
  '30': '密码错误',
  '40': '账户不存在,',
  '41': '余额不足',
  '42': '账户已过期,',
  '43': 'IP地址限制',
  '50': '内容含有敏感字'
};

module.exports = {
  /**
   * send sms
   * @param content
   * @param phone
   */
  async send(content, phone) {
    const query = querystring.stringify({
      'u': 'fsiaonma',
      'p': md5('123456'),
      'm': phone,
      'c': content
    });

    const { text: resCode } = await request.get(`api.smsbao.com/sms?${query}`);
    if (resCode != '0') {
      console.error(`[sendSMSMessage] send sms message error. resCode=${resCode} message=${resultCode[resCode]}`);
      return { success: false, message: `resCode:${resCode}, message:${resultCode[resCode]}.` };
    }

    return { success: true, message: 'success' };
  }
}
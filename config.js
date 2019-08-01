module.exports = {
	boss: [{ // 小鸣 boss 直聘（番禺）
		id: 'boss-1',
		// url: 'https://www.zhipin.com/c101280100/b_%E7%95%AA%E7%A6%BA%E5%8C%BA/?query=%E5%A4%96%E8%B4%B8%E4%B8%9A%E5%8A%A1%E5%91%98&page={{eagle-page}}&ka=page-{{eagle-page}}',
		url: 'http://httpbin.org/get?show_env=1',
    phones: [ '13533828487' ],
		duration: Math.round(2000 + 3000 * Math.random())
	}]
}
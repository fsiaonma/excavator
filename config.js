module.exports = {
	boss: [{ // 小鸣 boss 直聘（番禺）
		id: 'boss-1',
		url: 'https://www.zhipin.com/c101280100/b_%E7%95%AA%E7%A6%BA%E5%8C%BA/?query=%E5%A4%96%E8%B4%B8%E4%B8%9A%E5%8A%A1%E5%91%98&page={{eagle-page}}&ka=page-{{eagle-page}}',
		phones: [ '13533828487', '13416416929' ],
		duration() { return Math.round(120000 + 2 * 180000 * Math.random()) } // 2 ~ 5 分钟
	}]
}
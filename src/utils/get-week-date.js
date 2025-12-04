    /**
    * 获取日期范围（周/月）
    * @param {string} type - 类型：'week' 或 'month'
    * @param {number} offset - 偏移量（默认为0）
    * @returns {string} 日期范围字符串
    */
   export default function getWeekDates(type = 'week', offset = 0) {
     console.log("getWeekDatesgetWeekDatesgetWeekDatesgetWeekDatesgetWeekDatesgetWeekDatesgetWeekDatesgetWeekDates");
    const today = new Date();
    const year = today.getFullYear();
    if (type === 'week') {
      const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      let monday = new Date(today);
      // 原来的周函数逻辑
      // 返回格式：20250609-20250615
      // 计算当前周的星期一
      if (dayOfWeek !== 0) {
        monday.setDate(today.getDate() - (dayOfWeek - 1)); // 非周日的情况
      } else {
        monday.setDate(today.getDate() - 6); // 如果是周日，则减6天得到上周的星期一
      }
      // 计算当前周的星期日
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      // 根据 offset 调整周一和周日
      const adjustedMonday = new Date(monday);
      adjustedMonday.setDate(monday.getDate() + 7 * offset);
      const adjustedSunday = new Date(sunday);
      adjustedSunday.setDate(sunday.getDate() + 7 * offset);
      // 格式化日期为 YYYYMMDD
      const format = (date) => {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      };
      return `${format(adjustedMonday)}-${format(adjustedSunday)}`;
    } else if (type === 'month') {
      // 月函数逻辑（如上）
      // 返回格式：202508
      // 计算目标月份（总月份数）
      let month = today.getMonth(); // 0-11
      // 计算目标月份（总月份数）
      const totalMonths = year * 12 + month;
      const targetTotal = totalMonths + offset;
      // 获取调整后的年份和月份
      const newYear = Math.floor(targetTotal / 12);
      const newMonth = targetTotal % 12;
      // 格式化为 YYYYMM
      const formattedMonth = String(newMonth + 1).padStart(2, '0'); // 月份从1开始
      return `${newYear}${formattedMonth}`;
    }
  }
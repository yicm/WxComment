const timeAgoWithTimeStr = (dateString) => {
  // ios: 2018/06/02 11:11:11
  // android: 2018-06-02 11:11:11 & 2018/06/02 11:11:11
  var date_time_arr = dateString.split(' ');
  var ios_date_arr = date_time_arr[0].split('-');
  var ios_date_str = ios_date_arr[0] + '/' + ios_date_arr[1] + '/' + ios_date_arr[2];
  var ios_datetime_str = ios_date_str + ' ' + date_time_arr[1];

  var newDateString = dateString;
  newDateString = ios_datetime_str;

  var date = new Date(newDateString)

  try {
    var oldTime = date.getTime();
    var currTime = new Date().getTime();
    var diffValue = currTime - oldTime;

    var days = Math.floor(diffValue / (24 * 3600 * 1000));

    if (days === 0) {
      //计算相差小时数
      var leave1 = diffValue % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
      var hours = Math.floor(leave1 / (3600 * 1000));
      if (hours === 0) {
        //计算相差分钟数
        var leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
        var minutes = Math.floor(leave2 / (60 * 1000));
        if (minutes === 0) {
          //计算相差秒数
          var leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
          var seconds = Math.round(leave3 / 1000);
          return seconds + ' 秒前';
        }
        return minutes + ' 分钟前';
      }
      return hours + ' 小时前';
    }
    if (days < 0) return '刚刚';

    if (days < 3) {
      return days + ' 天前';
    } else {
      return dateString
    }
  } catch (error) {
    console.log(error)
  }
}

function getTime() {
  //获取当前时间戳  
  var timestamp = Date.parse(new Date());
  var n = timestamp;
  var date = new Date(n);
  //年  
  var Y = date.getFullYear();
  //月  
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
  //日  
  var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  //时  
  var h = date.getHours();
  //分  
  var m = date.getMinutes();
  //秒  
  var s = date.getSeconds();
  return Y + '-' + M + '-' + D + ' ' + h + ":" + m + ":" + s;
}

module.exports = {
  timeAgoWithTimeStr: timeAgoWithTimeStr,
  getTime: getTime
}
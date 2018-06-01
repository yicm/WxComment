const padWithZeros = (vNumber, width) => {
  var numAsString = vNumber.toString();
  while (numAsString.length < width) {
    numAsString = '0' + numAsString;
  }
  return numAsString;
}

const dateFormat = (date) => {
  var vDay = padWithZeros(date.getDate(), 2);
  var vMonth = padWithZeros(date.getMonth() + 1, 2);
  var vYear = padWithZeros(date.getFullYear(), 2);
  // var vHour = padWithZeros(date.getHours(), 2);
  // var vMinute = padWithZeros(date.getMinutes(), 2);
  // var vSecond = padWithZeros(date.getSeconds(), 2);
  return `${vYear}-${vMonth}-${vDay}`;
}

const timeAgoWithTimeStr = (dateString) => {
  var date = new Date(dateString)

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

const timeAgo = (date) => {
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
          return seconds + '秒前';
        }
        return minutes + '分钟前';
      }
      return hours + '小时前';
    }
    if (days < 0) return '刚刚';

    if (days < 5) {
      return days + '天前';
    } else {
      return dateFormat(date)
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
  timeAgo: timeAgo,
  timeAgoWithTimeStr: timeAgoWithTimeStr,
  getTime: getTime
}
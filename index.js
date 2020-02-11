export default async function connect(options) {

  if (typeof options !== 'object' || options === null) {
    throw new Error(`初始化参数格式错误=>options: ${options}`)
  }

  let {
    url, // websocket服务地址
    onMessage, // socket消息回调函数
    connectCount = Infinity, // 连接失败重试次数
    connectInterval = 5000,  // 重连时间间隔
    heartBeat: { // 心跳配置
      enable: heartBeatEnable = false, // 心跳开关
      ping = "ping", // 心跳信号内容
      interval: heartBeatInterval = 1 * 60 * 1000 // 心跳时间间隔
    } = {}
  } = options;

  if (typeof url !== 'string') {
    throw new Error(`url参数格式错误=>url: ${url}`)
  } else if (typeof onMessage !== 'function') {
    throw new Error(`onMessage参数错误=>onMessage: ${onMessage}`)
  }

  connect.client = new WebSocket(url);

  await new Promise((resolve, reject) => {
    connect.client.addEventListener("open", function (event) {
      console.info(`onopen: websocket连接成功`);
      resolve("onopen: websocket连接成功");
    });

    connect.client.addEventListener("error", function (event) {
      if (connectCount <= 0) {
        reject(new Error("onerror: websocket连接失败"));
      } else {
        console.info(`onerror: websocket连接失败:${connectInterval / 1000}s后将继续进行${connectCount}次重连`)
        setTimeout(connect.bind(this, { ...options, connectCount: --connectCount }), connectInterval)
      }
    });
  });

  connect.client.addEventListener("message", message => {
    let data = JSON.parse(message.data);
    if (heartBeatEnable && data.messageType === "heart")
      return console.log(`<<< pong`);
    onMessage && onMessage(data);
  });

  // ping
  if (heartBeatEnable) {
    connect.client.timer = setInterval(function () {
      connect.send(ping);
      console.log(`>>> ping`);
    }, heartBeatInterval);
  }

  connect.client.addEventListener("close", function (event) {
    clearInterval(connect.client.timer);
    console.info(`onclose: websocket已关闭, code:${event.code}, reason: ${event.reason})`);
    if (event.code === 1000) return event.reason;
    console.info(`${connectInterval / 1000}s后将重新连接websocket...`);
    setTimeout(connect.bind(this, options), connectInterval);
  });

  connect.send = function (message) {
    connect.client.send(message);
  };

  connect.close = function (reason = "客户端关闭了连接") {
    const code = 1000
    connect.client.close(code, reason);
  };

  return connect;
}

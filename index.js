export default async function connect(options) {
  let {
    url,
    onMessage,
    connectCount = Infinity,
    connectInterval = 5000,
    heartBeat: {
      enable: heartBeatEnable = false,
      ping = "ping",
      interval: heartBeatInterval = 1 * 60 * 1000
    } = {
      enable: false,
      ping: "ping",
      interval: 1 * 60 * 1000
    }
  } = options;

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
    console.info(`onclose: websocket已关闭    (关闭原因: ${event.reason})`);
    if (event.code === 1000) return event.reason;
    console.info(`${connectInterval / 1000}s后将重新连接websocket...`);
    setTimeout(connect.bind(this, options), connectInterval);
  });

  connect.send = function (message) {
    connect.client.send(message);
  };

  connect.close = function () {
    connect.client.close(1000, "主动关闭");
  };

  return connect;
}

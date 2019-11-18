async function connect(options) {
  let {
    url,
    onMessage,
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
      console.info(`onopen: webconnect.client连接成功`);
      resolve("onopen: webconnect.client连接成功");
    });

    connect.client.addEventListener("error", function (event) {
      console.error("onerror: webconnect.client连接失败");
      reject(new Error("onerror: webconnect.client连接失败"));
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
      connect.client.send(ping);
      console.log(`>>> ping`);
    }, heartBeatInterval);
  }

  connect.client.addEventListener("close", function (event) {
    clearInterval(connect.client.timer);
    console.info(`onclose: webconnect.client已关闭    (关闭原因: ${event.reason})`);
    if (event.code === 1000) return event.reason;
    console.info("5s后将重新连接webconnect.client...");
    setTimeout(connect.bind(this, options), 5000);
  });

  connect.send = function (message) {
    connect.client.send(message);
  };

  connect.close = function () {
    connect.client.close(1000, "主动关闭");
  };

  return connect;
}

export default connect;

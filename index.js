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

  let socket = new WebSocket(url);

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", function(event) {
      console.info(`onopen: websocket连接成功`);
      resolve("onopen: websocket连接成功");
    });

    socket.addEventListener("error", function(event) {
      console.error("onerror: websocket连接失败");
      reject(new Error("onerror: websocket连接失败"));
    });
  });

  socket.addEventListener("message", message => {
    let data = JSON.parse(message.data);
    if (heartBeatEnable && data.messageType === "heart")
      return console.log(`<<< pong`);
    onMessage && onMessage(data);
  });

  // ping
  if (heartBeatEnable) {
    socket.timer = setInterval(function() {
      socket.send(ping);
      console.log(`>>> ping`);
    }, heartBeatInterval);
  }

  socket.addEventListener("close", function(event) {
    clearInterval(socket.timer);
    console.info(`onclose: websocket已关闭    (关闭原因: ${event.reason})`);
    if (event.code === 1000) return event.reason;
    console.info("5s后将重新连接websocket...");
    setTimeout(connect.bind(this, options), 5000);
  });

  connect.client = socket;

  connect.send = function(message) {
    connect.client.send(message);
  };

  connect.close = function() {
    connect.client.close(1000, "主动关闭");
  };

  return connect;
}

export default connect;
